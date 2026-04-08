# DriftOwl — Mechanism Design Intelligence

DriftOwl is an AI-powered platform for **mechanism design analysis** — it takes a real-world problem and runs it through a multi-agent pipeline of expert economists, game theorists, and behavioral scientists to synthesize an optimal incentive mechanism.

## What it does

1. **Multi-agent boardroom** — specialized AI agents (game theorist, behavioral economist, information economist, contract theorist, market designer) analyze your problem in parallel
2. **Mechanism synthesis** — the agents' outputs are distilled into a concrete, deployable incentive mechanism
3. **Agent-based simulation** — the mechanism is tested with simulated agents to measure compliance, defection rates, and stability
4. **Paper generation** — a structured academic paper summarizing the full analysis
5. **Mechanism Library** — proven patterns extracted from past analyses, reusable as starting points

## Tech stack

- **Backend**: Python, FastAPI, Server-Sent Events (SSE), SQLite
- **Frontend**: React, TypeScript, Vite
- **AI**: OpenAI GPT-4o
- **Email**: Resend

## Getting started

### Prerequisites
- Python 3.12+
- Node.js 18+
- OpenAI API key
- Resend API key (for email)

### Backend

```bash
cd backend
pip install -r ../requirements.txt
# Create .env file (see .env.example)
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment variables

Create a `.env` file in the root with:

```
OPENAI_API_KEY=your_key_here
RESEND_API_KEY=your_key_here
FROM_EMAIL=your_verified_sender@yourdomain.com
```

## Architecture

```
arche/
├── backend/
│   ├── main.py              # FastAPI app, endpoints, SSE streaming
│   ├── pipeline.py          # Multi-agent orchestration
│   ├── agents.py            # Agent definitions and prompts
│   ├── simulation_pipeline.py
│   ├── paper_generator.py
│   ├── pill_distiller.py    # Mechanism Library distillation
│   ├── auth.py              # Auth, sessions, user management
│   └── email_service.py
└── frontend/
    └── src/
        ├── App.tsx
        └── components/
            ├── Boardroom.tsx
            ├── ModeSelector.tsx
            ├── LibraryPage.tsx
            ├── SettingsPage.tsx
            └── ...
```

## License

MIT — built by [Enrico Saglimbeni](https://github.com/saglimbeni)
