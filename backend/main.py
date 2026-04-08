from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import uuid
import os
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel

# SessionRequest now defined inline (with optional pill field)
from pipeline import run_pipeline
from simulation_pipeline import run_simulation_pipeline
from paper_generator import generate_paper
from auth import (
    init_db, register_user, login_user, logout_user, get_user_by_token,
    verify_email, create_verification_code,
    create_reset_token, reset_password,
    create_analysis, update_analysis, get_analyses_by_user, get_analysis,
    update_user_profile, change_password, update_preferences, delete_user,
    get_pills, get_pill, search_pills, increment_pill_usage,
)
from pill_distiller import distill_pill_background
from email_service import send_verification_email, send_reset_email

load_dotenv()
init_db()

app = FastAPI(title="DriftOwl API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (runtime only — persistent data is in SQLite)
sessions = {}


# ── AUTH HELPERS ──────────────────────────────────────────────

def require_user(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required.")
    token = authorization.split(" ", 1)[1]
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user


# ── REQUEST MODELS ────────────────────────────────────────────

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyEmailRequest(BaseModel):
    code: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    first_name: str
    last_name: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UpdatePreferencesRequest(BaseModel):
    save_history: bool

class SessionRequest(BaseModel):
    mode: str
    context: str
    problem: str
    pill: dict | None = None


# ── AUTH ENDPOINTS ────────────────────────────────────────────

@app.post("/auth/register")
def auth_register(req: RegisterRequest):
    try:
        result = register_user(req.email, req.password, req.first_name, req.last_name)
        code   = result.pop("_dev_verification_code", None)
        # Send verification email (logs to console in dev)
        send_verification_email(req.email, req.first_name, code or "000000")
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/auth/login")
def auth_login(req: LoginRequest):
    try:
        return login_user(req.email, req.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.post("/auth/logout")
def auth_logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        logout_user(token)
    return {"ok": True}


@app.get("/auth/me")
def auth_me(authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    return user


@app.post("/auth/verify-email")
def auth_verify_email(req: VerifyEmailRequest, authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    if verify_email(user["id"], req.code):
        return {"ok": True}
    raise HTTPException(status_code=400, detail="Invalid or expired code.")


@app.post("/auth/resend-verification")
def auth_resend_verification(authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    if user.get("email_verified"):
        return {"ok": True, "already_verified": True}
    code = create_verification_code(user["id"])
    send_verification_email(user["email"], user["first_name"], code)
    return {"ok": True}


@app.post("/auth/forgot-password")
def auth_forgot_password(req: ForgotPasswordRequest):
    result = create_reset_token(req.email)
    if result:
        reset_url = f"{FRONTEND_URL}/reset-password?token={result['token']}"
        send_reset_email(req.email, result["user"]["first_name"], reset_url)
    # Always return 200 to avoid email enumeration
    return {"ok": True}


@app.post("/auth/reset-password")
def auth_reset_password(req: ResetPasswordRequest):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if reset_password(req.token, req.new_password):
        return {"ok": True}
    raise HTTPException(status_code=400, detail="Invalid or expired reset link.")


# ── SETTINGS ENDPOINTS ───────────────────────────────────────

@app.patch("/auth/profile")
def auth_update_profile(req: UpdateProfileRequest, authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    if not req.first_name.strip() or not req.last_name.strip():
        raise HTTPException(status_code=400, detail="Name fields cannot be empty.")
    updated = update_user_profile(user["id"], req.first_name, req.last_name)
    return updated


@app.patch("/auth/password")
def auth_change_password(req: ChangePasswordRequest, authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if not change_password(user["id"], req.current_password, req.new_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    return {"ok": True}


@app.patch("/auth/preferences")
def auth_update_preferences(req: UpdatePreferencesRequest, authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    update_preferences(user["id"], req.save_history)
    return {"ok": True}


@app.delete("/auth/account")
def auth_delete_account(authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    delete_user(user["id"])
    return {"ok": True}


# ── ANALYSES ──────────────────────────────────────────────────

@app.get("/analyses")
def list_analyses(authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    return get_analyses_by_user(user["id"])


@app.get("/analyses/{analysis_id}")
def get_analysis_detail(analysis_id: str, authorization: Optional[str] = Header(None)):
    user = require_user(authorization)
    analysis = get_analysis(analysis_id, user["id"])
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return analysis


# ── HEALTH ────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}


# ── SESSION ───────────────────────────────────────────────────

@app.post("/session")
async def create_session(request: SessionRequest, authorization: Optional[str] = Header(None)):
    session_id = str(uuid.uuid4())

    # Link to user if authenticated
    analysis_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        user = get_user_by_token(token)
        if user:
            analysis_id = create_analysis(
                user["id"], request.mode, request.context, request.problem
            )

    sessions[session_id] = {
        "mode":        request.mode,
        "context":     request.context,
        "problem":     request.problem,
        "analysis_id": analysis_id,
        "pill":        request.pill,
    }
    return {"session_id": session_id, "analysis_id": analysis_id}


@app.get("/session/{session_id}/stream")
async def stream_session(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def generate():
        all_agents = []
        async for event in run_pipeline(
            session["mode"], session["context"], session["problem"],
            pill=session.get("pill"),
        ):
            yield event
            # Track agents for DB persistence
            if event.startswith("event: agent"):
                try:
                    data = json.loads(event.split("data: ", 1)[1])
                    all_agents.append(data)
                    # Save agents incrementally
                    if session.get("analysis_id"):
                        update_analysis(
                            session["analysis_id"],
                            agents_data=json.dumps(all_agents)
                        )
                except Exception:
                    pass

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@app.post("/session/{session_id}/synthesis")
async def save_synthesis(session_id: str, body: dict):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session = sessions[session_id]
    session["synthesis"] = body

    if session.get("analysis_id"):
        # Generate title from mechanism name
        title = body.get("mechanism_name", "Untitled Analysis")
        update_analysis(
            session["analysis_id"],
            synthesis=json.dumps(body),
            title=title,
            status="synthesis_complete",
        )
    return {"ok": True}


@app.post("/session/{session_id}/simulate")
async def start_simulation(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@app.get("/session/{session_id}/simulate/stream")
async def stream_simulation(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    async def generate():
        async for event in run_simulation_pipeline(
            session["context"], session["problem"], session.get("synthesis", {})
        ):
            yield event
            # Capture final simulation summary
            if event.startswith("event: simulation_complete"):
                try:
                    data = json.loads(event.split("data: ", 1)[1])
                    session["simulation_results"] = data.get("rounds_data", [])
                    if session.get("analysis_id"):
                        update_analysis(
                            session["analysis_id"],
                            simulation=json.dumps(data),
                            status="simulation_complete",
                        )
                except Exception:
                    pass

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"},
    )


@app.post("/session/{session_id}/paper")
async def generate_paper_endpoint(session_id: str):
    session = sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    paper = await generate_paper(
        session["context"],
        session["problem"],
        session.get("synthesis", {}),
        session.get("simulation_results", []),
    )

    if session.get("analysis_id"):
        update_analysis(
            session["analysis_id"],
            paper=json.dumps(paper),
            status="completed",
        )

    # Fire-and-forget pill distillation (runs in background, never blocks)
    synthesis = session.get("synthesis", {})
    if synthesis:
        asyncio.create_task(distill_pill_background(
            session["mode"],
            session["problem"],
            session["context"],
            synthesis,
        ))

    return paper


# ── MECHANISM PILLS ───────────────────────────────────────────

@app.get("/pills")
def list_pills(mode: str = None):
    return get_pills(mode=mode)


@app.get("/pills/{pill_id}")
def get_pill_detail(pill_id: str):
    pill = get_pill(pill_id)
    if not pill:
        raise HTTPException(status_code=404, detail="Pill not found.")
    return pill


@app.post("/pills/search")
def search_pills_endpoint(body: dict):
    tags = body.get("tags", [])
    mode = body.get("mode")
    if not tags:
        return []
    return search_pills(tags, mode=mode)


@app.post("/pills/{pill_id}/use")
def use_pill(pill_id: str):
    """Track when a pill is used as starting point."""
    increment_pill_usage(pill_id)
    pill = get_pill(pill_id)
    if not pill:
        raise HTTPException(status_code=404, detail="Pill not found.")
    return pill
