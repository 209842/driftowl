import sqlite3
import bcrypt
import uuid
import json
import os
import random
import string
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "users.db"
TOKEN_TTL_DAYS = 7
RESET_TTL_MINUTES = 30
VERIFY_TTL_MINUTES = 60


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name    TEXT NOT NULL,
            last_name     TEXT NOT NULL,
            email_verified INTEGER NOT NULL DEFAULT 0,
            save_history  INTEGER NOT NULL DEFAULT 1,
            created_at    TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tokens (
            token      TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS email_verifications (
            code       TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used       INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS password_resets (
            token      TEXT PRIMARY KEY,
            user_id    TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used       INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL,
            mode        TEXT NOT NULL,
            context     TEXT NOT NULL,
            problem     TEXT NOT NULL,
            title       TEXT,
            status      TEXT NOT NULL DEFAULT 'in_progress',
            agents_data TEXT,
            synthesis   TEXT,
            simulation  TEXT,
            paper       TEXT,
            created_at  TEXT NOT NULL,
            updated_at  TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS mechanism_pills (
            id               TEXT PRIMARY KEY,
            problem_class    TEXT NOT NULL,
            abstract_pattern TEXT NOT NULL,
            mechanism_name   TEXT NOT NULL,
            core_rules       TEXT NOT NULL,
            key_conditions   TEXT NOT NULL,
            why_it_works     TEXT NOT NULL,
            tags             TEXT NOT NULL,
            mode             TEXT NOT NULL,
            usage_count      INTEGER NOT NULL DEFAULT 0,
            created_at       TEXT NOT NULL
        );
    """)
    # Migration: add save_history to existing databases that don't have it yet
    try:
        conn.execute("ALTER TABLE users ADD COLUMN save_history INTEGER NOT NULL DEFAULT 1")
        conn.commit()
    except Exception:
        pass  # Column already exists
    conn.commit()
    conn.close()


# ── HELPERS ──────────────────────────────────────────────────

def _now() -> str:
    return datetime.utcnow().isoformat()

def _expires(days=0, minutes=0) -> str:
    return (datetime.utcnow() + timedelta(days=days, minutes=minutes)).isoformat()

def _is_expired(ts: str) -> bool:
    return datetime.fromisoformat(ts) < datetime.utcnow()

def _random_code(length=6) -> str:
    return ''.join(random.choices(string.digits, k=length))


# ── REGISTER / LOGIN ─────────────────────────────────────────

def register_user(email: str, password: str, first_name: str, last_name: str) -> dict:
    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
        if existing:
            raise ValueError("An account with this email already exists.")

        user_id   = str(uuid.uuid4())
        pw_hash   = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        now       = _now()

        conn.execute(
            "INSERT INTO users (id, email, password_hash, first_name, last_name, created_at) VALUES (?,?,?,?,?,?)",
            (user_id, email.lower().strip(), pw_hash, first_name, last_name, now)
        )

        # Session token
        token      = str(uuid.uuid4())
        expires_at = _expires(days=TOKEN_TTL_DAYS)
        conn.execute(
            "INSERT INTO tokens (token, user_id, expires_at, created_at) VALUES (?,?,?,?)",
            (token, user_id, expires_at, now)
        )

        # Email verification code
        code = _random_code(6)
        conn.execute(
            "INSERT INTO email_verifications (code, user_id, expires_at) VALUES (?,?,?)",
            (code, user_id, _expires(minutes=VERIFY_TTL_MINUTES))
        )
        conn.commit()

        return {
            "token": token,
            "user": {"id": user_id, "email": email, "first_name": first_name,
                     "last_name": last_name, "email_verified": False},
            "_dev_verification_code": code,   # shown only in dev/console
        }
    finally:
        conn.close()


def login_user(email: str, password: str) -> dict:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email.lower().strip(),)
        ).fetchone()
        if not row:
            raise ValueError("Invalid email or password.")
        if not bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
            raise ValueError("Invalid email or password.")

        token      = str(uuid.uuid4())
        expires_at = _expires(days=TOKEN_TTL_DAYS)
        conn.execute(
            "INSERT INTO tokens (token, user_id, expires_at, created_at) VALUES (?,?,?,?)",
            (token, row["id"], expires_at, _now())
        )
        conn.commit()

        return {
            "token": token,
            "user": {
                "id":             row["id"],
                "email":          row["email"],
                "first_name":     row["first_name"],
                "last_name":      row["last_name"],
                "email_verified": bool(row["email_verified"]),
            },
        }
    finally:
        conn.close()


def logout_user(token: str) -> None:
    conn = get_db()
    try:
        conn.execute("DELETE FROM tokens WHERE token = ?", (token,))
        conn.commit()
    finally:
        conn.close()


def get_user_by_token(token: str) -> dict | None:
    conn = get_db()
    try:
        row = conn.execute("""
            SELECT u.*, t.expires_at AS token_expires
            FROM users u
            JOIN tokens t ON t.user_id = u.id
            WHERE t.token = ?
        """, (token,)).fetchone()
        if not row:
            return None
        if _is_expired(row["token_expires"]):
            conn.execute("DELETE FROM tokens WHERE token = ?", (token,))
            conn.commit()
            return None
        return {
            "id":             row["id"],
            "email":          row["email"],
            "first_name":     row["first_name"],
            "last_name":      row["last_name"],
            "email_verified": bool(row["email_verified"]),
        }
    finally:
        conn.close()


# ── EMAIL VERIFICATION ────────────────────────────────────────

def verify_email(user_id: str, code: str) -> bool:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM email_verifications WHERE code = ? AND user_id = ? AND used = 0",
            (code, user_id)
        ).fetchone()
        if not row or _is_expired(row["expires_at"]):
            return False
        conn.execute("UPDATE email_verifications SET used = 1 WHERE code = ?", (code,))
        conn.execute("UPDATE users SET email_verified = 1 WHERE id = ?", (user_id,))
        conn.commit()
        return True
    finally:
        conn.close()


def create_verification_code(user_id: str) -> str:
    conn = get_db()
    try:
        code = _random_code(6)
        conn.execute("DELETE FROM email_verifications WHERE user_id = ?", (user_id,))
        conn.execute(
            "INSERT INTO email_verifications (code, user_id, expires_at) VALUES (?,?,?)",
            (code, user_id, _expires(minutes=VERIFY_TTL_MINUTES))
        )
        conn.commit()
        return code
    finally:
        conn.close()


# ── PASSWORD RESET ────────────────────────────────────────────

def create_reset_token(email: str) -> dict | None:
    """Returns {token, user} or None if email not found."""
    conn = get_db()
    try:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
        if not row:
            return None
        token = str(uuid.uuid4())
        conn.execute("DELETE FROM password_resets WHERE user_id = ?", (row["id"],))
        conn.execute(
            "INSERT INTO password_resets (token, user_id, expires_at) VALUES (?,?,?)",
            (token, row["id"], _expires(minutes=RESET_TTL_MINUTES))
        )
        conn.commit()
        return {"token": token, "user": dict(row)}
    finally:
        conn.close()


def reset_password(token: str, new_password: str) -> bool:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM password_resets WHERE token = ? AND used = 0", (token,)
        ).fetchone()
        if not row or _is_expired(row["expires_at"]):
            return False
        pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pw_hash, row["user_id"]))
        conn.execute("UPDATE password_resets SET used = 1 WHERE token = ?", (token,))
        # Invalidate all existing sessions for security
        conn.execute("DELETE FROM tokens WHERE user_id = ?", (row["user_id"],))
        conn.commit()
        return True
    finally:
        conn.close()


# ── ANALYSES ─────────────────────────────────────────────────

def create_analysis(user_id: str, mode: str, context: str, problem: str) -> str:
    conn = get_db()
    try:
        analysis_id = str(uuid.uuid4())
        now = _now()
        conn.execute(
            """INSERT INTO analyses
               (id, user_id, mode, context, problem, status, created_at, updated_at)
               VALUES (?,?,?,?,?,'in_progress',?,?)""",
            (analysis_id, user_id, mode, context, problem, now, now)
        )
        conn.commit()
        return analysis_id
    finally:
        conn.close()


def update_analysis(analysis_id: str, **fields) -> None:
    allowed = {'title', 'status', 'agents_data', 'synthesis', 'simulation', 'paper'}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return
    conn = get_db()
    try:
        sets   = ', '.join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [_now(), analysis_id]
        conn.execute(f"UPDATE analyses SET {sets}, updated_at = ? WHERE id = ?", values)
        conn.commit()
    finally:
        conn.close()


def get_analyses_by_user(user_id: str) -> list[dict]:
    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT id, mode, context, problem, title, status, created_at, updated_at
               FROM analyses WHERE user_id = ?
               ORDER BY created_at DESC LIMIT 50""",
            (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_analysis(analysis_id: str, user_id: str) -> dict | None:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM analyses WHERE id = ? AND user_id = ?",
            (analysis_id, user_id)
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        for field in ('agents_data', 'synthesis', 'simulation', 'paper'):
            if d.get(field):
                try:
                    d[field] = json.loads(d[field])
                except Exception:
                    pass
        return d
    finally:
        conn.close()


# ── SETTINGS ──────────────────────────────────────────────────

def update_user_profile(user_id: str, first_name: str, last_name: str) -> dict:
    conn = get_db()
    try:
        conn.execute(
            "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?",
            (first_name.strip(), last_name.strip(), user_id)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return {
            "id": row["id"], "email": row["email"],
            "first_name": row["first_name"], "last_name": row["last_name"],
            "email_verified": bool(row["email_verified"]),
            "save_history": bool(row["save_history"]),
        }
    finally:
        conn.close()


def change_password(user_id: str, current_password: str, new_password: str) -> bool:
    conn = get_db()
    try:
        row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            return False
        if not bcrypt.checkpw(current_password.encode(), row["password_hash"].encode()):
            return False
        pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (pw_hash, user_id))
        # Invalidate all other sessions for security
        conn.execute("DELETE FROM tokens WHERE user_id = ?", (user_id,))
        conn.commit()
        return True
    finally:
        conn.close()


def update_preferences(user_id: str, save_history: bool) -> None:
    conn = get_db()
    try:
        conn.execute(
            "UPDATE users SET save_history = ? WHERE id = ?",
            (1 if save_history else 0, user_id)
        )
        if not save_history:
            # Delete all analyses when history is disabled
            conn.execute("DELETE FROM analyses WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()


def delete_user(user_id: str) -> None:
    conn = get_db()
    try:
        conn.execute("DELETE FROM analyses WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM password_resets WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM email_verifications WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM tokens WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()


# ── MECHANISM PILLS ───────────────────────────────────────────

def save_pill(pill: dict) -> str:
    conn = get_db()
    try:
        pill_id = str(uuid.uuid4())
        conn.execute("""
            INSERT INTO mechanism_pills
              (id, problem_class, abstract_pattern, mechanism_name,
               core_rules, key_conditions, why_it_works, tags, mode, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, (
            pill_id,
            pill["problem_class"],
            pill["abstract_pattern"],
            pill["mechanism_name"],
            json.dumps(pill["core_rules"]),
            json.dumps(pill["key_conditions"]),
            pill["why_it_works"],
            json.dumps(pill["tags"]),
            pill.get("mode", "general"),
            datetime.utcnow().isoformat(),
        ))
        conn.commit()
        return pill_id
    finally:
        conn.close()


def get_pills(mode: str = None, limit: int = 50) -> list:
    conn = get_db()
    try:
        if mode:
            rows = conn.execute(
                "SELECT * FROM mechanism_pills WHERE mode = ? ORDER BY usage_count DESC, created_at DESC LIMIT ?",
                (mode, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM mechanism_pills ORDER BY usage_count DESC, created_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            for f in ("core_rules", "key_conditions", "tags"):
                try:
                    d[f] = json.loads(d[f])
                except Exception:
                    d[f] = []
            result.append(d)
        return result
    finally:
        conn.close()


def get_pill(pill_id: str) -> dict | None:
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM mechanism_pills WHERE id = ?", (pill_id,)
        ).fetchone()
        if not row:
            return None
        d = dict(row)
        for f in ("core_rules", "key_conditions", "tags"):
            try:
                d[f] = json.loads(d[f])
            except Exception:
                d[f] = []
        return d
    finally:
        conn.close()


def increment_pill_usage(pill_id: str) -> None:
    conn = get_db()
    try:
        conn.execute(
            "UPDATE mechanism_pills SET usage_count = usage_count + 1 WHERE id = ?",
            (pill_id,)
        )
        conn.commit()
    finally:
        conn.close()


def search_pills(query_tags: list[str], mode: str = None, limit: int = 5) -> list:
    """Simple tag-overlap similarity search."""
    all_pills = get_pills(mode=mode, limit=200)
    scored = []
    query_set = set(t.lower() for t in query_tags)
    for pill in all_pills:
        pill_tags = set(t.lower() for t in pill.get("tags", []))
        if not pill_tags:
            continue
        overlap = len(query_set & pill_tags)
        score = overlap / len(query_set | pill_tags)  # Jaccard
        if score > 0:
            scored.append((score, pill))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:limit]]
