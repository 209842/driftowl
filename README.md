# DriftOwl — Mechanism Design Intelligence

DriftOwl is an AI platform that turns real-world incentive problems into deployable mechanism designs. You describe a system and its dysfunction — a company with misaligned salespeople, a DAO with voter apathy, a school with grade inflation — and DriftOwl runs it through a structured pipeline of competing AI experts to produce a concrete, stress-tested solution grounded in game theory and behavioral economics.

---

## How it works

### Phase 1 — Expert Panel
A boardroom of specialized AI agents analyzes your problem in parallel, each from a distinct theoretical lens:

- **Game Theorist** — Nash equilibria, dominant strategies, strategic interaction
- **Behavioral Economist** — cognitive biases, bounded rationality, nudge design
- **Contract Theorist** — principal-agent problems, moral hazard, adverse selection
- **Information Economist** — asymmetric information, signaling, screening
- **Market Designer** — auction theory, matching markets, platform incentives
- *(and more, depending on the selected context)*

### Phase 2 — Synthesis & Adversarial Review
The expert analyses are distilled into a single proposed mechanism. Then a **contrarian team** attacks it:

- **Prof. Popper** — assumption challenger
- **Dr. Taleb** — fragility and tail-risk analyst
- **Dr. Goodhart** — metric gaming specialist
- **Dr. Hirschman** — unintended consequences
- **Dr. Arrow** — impossibility theorist

An **Arbitration Agent** then weighs the original proposal against the attacks, issues a verdict (`STRENGTHENED / REVISED / REBUILT`), and produces a reinforced final mechanism.

### Phase 3 — Virtual Society Simulation
The final mechanism is tested against a population of 10 individuals with realistic, adversarial profiles — including people who directly benefit from the current broken system and have concrete reasons to resist. Over 7 rounds, each person decides whether to comply or resist based on their self-interest, while observing what others do. You see compliance rates evolve round by round, both in the feed and as live node colors in the D3 graph.

### Phase 4 — Research Paper
A structured academic paper is generated and downloadable as PDF, covering the problem, methodology, mechanism design, simulation results, and theoretical references.

---

## Features

- **Real-time streaming** — agents appear one by one as they complete, via Server-Sent Events
- **D3 force graph** — interactive node visualization of the full expert ecosystem (experts, contrarians, synthesis, arbitration, simulation personas)
- **Mechanism Library** — proven patterns distilled from past analyses, reusable as starting points for new sessions
- **Auth system** — email/password with verification, password reset, analysis history
- **PDF export** — full research paper rendered to A4 and printed via browser API
- **Auto mode detection** — paste any problem and the system classifies the domain automatically

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Backend | Python, FastAPI, Server-Sent Events (SSE), SQLite |
| Frontend | React, TypeScript, Vite, D3.js |
| AI | Groq (llama-3.3-70b-versatile) |
| Email | Resend |

---

## Getting started

### Prerequisites
- Python 3.12+
- Node.js 18+
- [Groq API key](https://console.groq.com)
- Resend API key (for email verification)

### Backend

```bash
cd backend
pip install -r ../requirements.txt
cp ../.env.example ../.env   # fill in your keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment variables

```env
GROQ_API_KEY=your_key
RESEND_API_KEY=your_key
FROM_EMAIL=you@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

---

## Architecture

```
arche/
├── backend/
│   ├── main.py                 # FastAPI app, SSE streaming, auth endpoints
│   ├── pipeline.py             # Main pipeline: experts → synthesis → contrarians → arbitration → simulation
│   ├── agents.py               # Agent + contrarian definitions (12 domains × 8 agents)
│   ├── simulation_pipeline.py  # Virtual society simulation (adversarial personas, 7 rounds)
│   ├── paper_generator.py      # Academic paper generation
│   ├── pill_distiller.py       # Background distillation of reusable mechanism patterns
│   ├── auth.py                 # User management, sessions, email verification
│   └── email_service.py        # Resend integration
└── frontend/
    └── src/
        ├── App.tsx              # Screen routing, auth state
        └── components/
            ├── Boardroom.tsx    # Main analysis view (graph + feed, single continuous flow)
            ├── AgentGraph.tsx   # D3 force simulation (experts, contrarians, personas)
            ├── AgentFeed.tsx    # Live feed with inline simulation section
            ├── ModeSelector.tsx # Home page (greeting + input + recent analyses)
            ├── LibraryPage.tsx  # Mechanism library
            ├── PaperView.tsx    # Paper rendering + PDF export
            └── SettingsPage.tsx
```

---

## License

MIT — built by [Enrico Saglimbeni](https://github.com/saglimbeni)
