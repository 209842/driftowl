# DriftOwl — Mechanism Design Intelligence

> *"Every incentive problem has a structural solution. DriftOwl finds it."*

DriftOwl is an AI platform that turns real-world incentive problems into deployable mechanism designs. You describe a system and its dysfunction — a company with misaligned salespeople, a DAO with voter apathy, a school with grade inflation — and DriftOwl runs it through a structured pipeline of competing AI experts to produce a concrete, stress-tested solution grounded in game theory and behavioral economics.

---

## What is mechanism design?

Mechanism design is the science of engineering rules and incentives so that rational, self-interested actors end up producing a desired collective outcome — even when their individual goals conflict. It's the theoretical backbone behind auction design, matching markets, contract structures, voting systems, and platform rules.

DriftOwl applies mechanism design thinking to any organizational or systemic problem: you describe the actors, their incentives, and the dysfunction. The platform does the rest.

---

## How it works

### Phase 1 — Expert Panel

A boardroom of specialized AI agents analyzes your problem in parallel, each from a distinct theoretical lens:

| Agent | Specialization |
|-------|---------------|
| Game Theorist | Nash equilibria, dominant strategies, strategic interaction |
| Behavioral Economist | Cognitive biases, bounded rationality, nudge design |
| Contract Theorist | Principal-agent problems, moral hazard, adverse selection |
| Information Economist | Asymmetric information, signaling, screening |
| Market Designer | Auction theory, matching markets, platform incentives |
| Institutional Economist | Norms, enforcement, path dependency |
| Political Economist | Power dynamics, collective action, governance |
| Complexity Theorist | Emergent behavior, feedback loops, non-linear dynamics |

Each agent delivers an independent analysis, which other agents can reference, creating a real dialogue of competing perspectives.

### Phase 2 — Synthesis

The expert analyses are distilled into a single proposed mechanism with:
- A named mechanism design (e.g. *"Calibrated Peer Review System"*)
- A core game-theoretic insight
- Concrete implementation rules
- Expected behavioral outcomes

### Phase 3 — Adversarial Review (Contrarian Team)

A dedicated team of contrarian agents attacks the proposed mechanism before it can be accepted:

| Agent | Attack Vector |
|-------|--------------|
| Prof. Popper | Hidden assumptions that invalidate the mechanism |
| Dr. Taleb | Fragility under tail risks and black swan events |
| Dr. Goodhart | How the metric being optimized will be gamed |
| Dr. Hirschman | Unintended second and third-order consequences |
| Dr. Arrow | Fundamental impossibility constraints |

An **Arbitration Agent** then weighs the original proposal against all attacks, issues a verdict — `STRENGTHENED`, `REVISED`, or `REBUILT` — and produces a reinforced final mechanism with a robustness score (1–10).

### Phase 4 — Virtual Society Simulation

The final mechanism is stress-tested against a population of 10 simulated individuals with adversarial, realistic profiles:

- **4 resistant personas** — people who directly benefit from the current broken system, with concrete self-interested reasons to resist
- **3 neutral personas** — fence-sitters who observe the majority and imitate
- **2 skeptical personas** — want change but doubt this specific mechanism
- **1 committed persona** — genuinely motivated to solve the problem

Over 7 rounds, each person decides whether to comply or resist based on their self-interest and what they observe others doing. You see compliance rates evolve round by round, live — both in the feed panel and as animated node colors in the D3 graph.

### Phase 5 — Research Paper

A full academic paper is generated and downloadable as PDF, structured with abstract, methodology, mechanism formalization, simulation results, theoretical references, and policy implications.

---

## Mathematical Foundations

DriftOwl is built on three interlocking bodies of theory: mechanism design, game theory, and social contagion dynamics. Here is the formal scaffolding underneath the platform.

### 1. Mechanism Design

A mechanism design problem is defined by a tuple $(N, \Theta, A, u, p)$:

| Symbol | Meaning |
|--------|---------|
| $N = \{1, \ldots, n\}$ | Set of self-interested agents |
| $\Theta = \Theta_1 \times \cdots \times \Theta_n$ | Type space — each $\theta_i$ is private information |
| $A$ | Set of feasible social outcomes |
| $u_i : A \times \Theta_i \to \mathbb{R}$ | Agent $i$'s utility function |
| $p \in \Delta(\Theta)$ | Common prior distribution over types |

A **direct mechanism** is a pair $(q, t)$ where $q : \Theta \to A$ is an allocation rule and $t : \Theta \to \mathbb{R}^n$ is a transfer rule. The planner's problem is to choose $(q, t)$ to maximize a social objective subject to two constraints:

**Bayesian Incentive Compatibility (BIC)** — truth-telling must be a Bayesian Nash Equilibrium:

$$\mathbb{E}_{\theta_{-i}}\!\left[u_i(q(\theta_i, \theta_{-i}), \theta_i) + t_i(\theta_i, \theta_{-i})\right] \;\geq\; \mathbb{E}_{\theta_{-i}}\!\left[u_i(q(\hat\theta_i, \theta_{-i}), \theta_i) + t_i(\hat\theta_i, \theta_{-i})\right]$$

for all $\theta_i, \hat\theta_i \in \Theta_i$ and all $i \in N$.

**Individual Rationality (IR)** — participation must be weakly preferred to opting out:

$$\mathbb{E}_{\theta_{-i}}\!\left[u_i(q(\theta_i, \theta_{-i}), \theta_i) + t_i(\theta_i, \theta_{-i})\right] \;\geq\; \bar u_i$$

where $\bar u_i$ is agent $i$'s outside option (reservation utility).

> **Revelation Principle** *(Myerson, 1979)*: Any social choice function implementable by *any* mechanism — no matter how complex — can also be implemented by a **truthful direct mechanism** in which agents simply report their type and it is optimal to do so honestly. This justifies restricting attention to IC mechanisms without loss of generality.

---

### 2. Nash Equilibrium and Dominant Strategies

A strategy profile $(s_1^*, \ldots, s_n^*)$ is a **Nash Equilibrium** if no agent can profitably deviate unilaterally:

$$u_i(s_i^*, s_{-i}^*) \;\geq\; u_i(s_i,\, s_{-i}^*) \quad \forall\, s_i \in S_i,\; \forall\, i \in N$$

A mechanism is said to implement outcome $a^*$ **in dominant strategies** if truth-telling is optimal regardless of what others do — a strictly stronger and more robust solution concept than Bayesian Nash Equilibrium.

**VCG Mechanisms** *(Vickrey-Clarke-Groves)*: The canonical efficient dominant-strategy mechanism sets transfers as:

$$t_i(\theta) = \sum_{j \neq i} u_j(q(\theta), \theta_j) + h_i(\theta_{-i})$$

making each agent the full residual claimant on social surplus — thereby aligning private and social incentives exactly.

---

### 3. The Principal-Agent Problem

When effort is unobservable (moral hazard), the principal maximizes:

$$\max_{w(\cdot)}\; \mathbb{E}\bigl[v(a, \theta) - w(a)\bigr]$$

subject to:

$$\text{(IC)}\quad a^* \in \arg\max_{a}\; \mathbb{E}[w(a)] - c(a)$$

$$\text{(IR)}\quad \mathbb{E}[w(a^*)] - c(a^*) \;\geq\; \bar u$$

where $w(\cdot)$ is the wage (or reward) scheme, $c(a)$ is the private cost of effort, and $\bar u$ is the agent's reservation utility. The IC constraint is the source of the **moral hazard wedge** — efficient risk-sharing and efficient incentives are generically incompatible when effort is hidden.

DriftOwl's agents model this tradeoff explicitly: every proposed mechanism is evaluated on whether its transfer rules satisfy approximate IC, and the contrarian agent **Dr. Goodhart** specifically attacks mechanisms where the induced $a^*$ diverges from the intended target once the metric is observable.

---

### 4. Impossibility Results the Platform Accounts For

**Arrow's Impossibility Theorem** *(1951)*: No social welfare function satisfying Pareto efficiency, independence of irrelevant alternatives, and non-dictatorship can aggregate more than two individuals' preference orderings consistently.

**Gibbard-Satterthwaite Theorem** *(1973/1977)*: Any deterministic social choice function over three or more alternatives that is strategy-proof is either dictatorial or has a restricted range. This places a hard ceiling on what any mechanism — including those DriftOwl proposes — can simultaneously achieve.

The contrarian agent **Dr. Arrow** applies both results to flag when a proposed mechanism implicitly assumes away these constraints.

---

### 5. Virtual Society Simulation — Compliance Dynamics

The simulation models a finite population $N = \{1, \ldots, n\}$ with $n = 10$, stratified by initial resistance type $\theta_i \in \{\text{resistant}, \text{neutral}, \text{skeptical}, \text{committed}\}$.

At each round $r \in \{1, \ldots, 7\}$, each agent chooses an action:

$$a_i^r = \begin{cases} \texttt{COMPLY} & \text{if}\quad \mathbb{E}\!\left[u_i(\texttt{COMPLY},\, \theta_i,\, \mathbf{a}_{-i}^{r-1})\right] \;\geq\; \mathbb{E}\!\left[u_i(\texttt{RESIST},\, \theta_i,\, \mathbf{a}_{-i}^{r-1})\right] \\[4pt] \texttt{RESIST} & \text{otherwise} \end{cases}$$

where $\mathbf{a}_{-i}^{r-1}$ captures the **social observation** effect: agents observe the aggregate compliance rate from the prior round and update accordingly.

The aggregate compliance rate at round $r$:

$$C^r = \frac{1}{n} \sum_{i=1}^{n} \mathbf{1}\!\left[a_i^r = \texttt{COMPLY}\right]$$

**Social contagion** for neutral agents follows a sigmoid threshold model:

$$P\!\left(\text{neutral}_i \xrightarrow{r} \texttt{COMPLY}\right) = \sigma\!\left(\beta \cdot C^{r-1} - \tau\right) = \frac{1}{1 + e^{-\beta(C^{r-1} - \tau)}}$$

where $\beta > 0$ is a contagion intensity parameter and $\tau \in (0,1)$ is the compliance threshold required to tip a fence-sitter.

A mechanism **passes** the simulation if $C^7 \geq 0.6$, meaning at least 6 of 10 adversarial agents have been induced to comply by round 7 — even accounting for the 4 structurally resistant actors who lose personally from the status-quo changing.

---

## Using DriftOwl

### 1. Create an account

Register with your email. A verification code will be sent to confirm your address.

### 2. Describe your system

On the home screen, fill in two fields:

**Context** — describe the system, the actors involved, their current incentive structure, and any relevant constraints. Be specific: mention team sizes, existing rules, and what "normal behavior" looks like today.

> *Example: "A high school with 800 students. Teachers grade their own students' exams. The school uses a ranking system where top students get university recommendations. Currently ~40% of teachers inflate grades to help their students compete."*

**Problem** — describe the dysfunction you want to fix: what behavior do you want to change, and what outcome are you targeting?

> *Example: "Grade inflation is making rankings meaningless and hurting students who receive honest grades. We want accurate grading without penalizing teachers who play fair."*

DriftOwl auto-detects the domain (education, company, platform, healthcare, etc.) and selects the appropriate specialist agents.

### 3. Watch the boardroom assemble

Each expert appears in real time as they complete their analysis. The D3 graph on the left shows agents as nodes — you can drag them, hover to highlight, and click to jump to their analysis in the feed.

### 4. Follow the full pipeline

The feed on the right shows the entire flow in sequence:
- Expert analyses (white cards)
- Synthesis mechanism (yellow card)
- Contrarian attacks (orange cards, dashed border)
- Arbitration verdict with robustness score (blue/green card)
- Virtual society simulation: population grid, round-by-round compliance bars, final stats

### 5. Generate the research paper

Once simulation completes, click **Research Paper →** in the header to generate a full academic writeup. Download it as PDF with one click.

### 6. Browse the Library

Past analyses automatically distill reusable mechanism patterns into the **Library** — abstract blueprints you can apply to new problems. Click *Use Pill* on any pattern to pre-load it into a new analysis session.

---

## Example use cases

| Domain | Problem | Mechanism type |
|--------|---------|----------------|
| Company | Sales team free-riding on shared commissions | Tournament + clawback design |
| Education | Grade inflation undermining rankings | Calibrated peer review |
| Platform | Fake reviews degrading marketplace trust | Reputation staking system |
| DAO | Voter apathy in governance proposals | Quadratic voting + delegation |
| Supply chain | Suppliers holding up buyers after contract | Procurement auction redesign |
| Healthcare | Physicians over-prescribing to hit volume targets | Value-based incentive structure |
| Sports league | Rich clubs dominating, competition collapsing | Salary cap + draft design |

---

## Features

- **Real-time streaming** — agents stream via Server-Sent Events; results appear as they complete
- **D3 force graph** — interactive, draggable node graph showing experts, contrarians, synthesis, arbitration, and simulation personas with live color updates
- **Adversarial simulation** — population designed to resist, not to agree; compliance rate is a real test, not a rubber stamp
- **Mechanism Library** — proven patterns distilled from past analyses, reusable as starting points
- **Auto domain detection** — paste any problem, the system classifies the domain automatically
- **Auth system** — email/password with verification, password reset, analysis history
- **PDF export** — full research paper rendered to A4 format
- **Analysis history** — all past sessions saved and reopenable from the home screen

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, Server-Sent Events |
| Database | SQLite |
| Frontend | React 18, TypeScript, Vite |
| Visualization | D3.js (force simulation) |
| AI | Groq — llama-3.3-70b-versatile |
| Email | Resend |

---

## Getting started

### Prerequisites
- Python 3.12+
- Node.js 18+
- [Groq API key](https://console.groq.com) (free tier available)
- Resend API key (for email verification — optional in dev)

### Backend

```bash
cd backend
pip install -r ../requirements.txt
cp ../.env.example ../.env   # add your keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Environment variables

```env
GROQ_API_KEY=your_groq_key
RESEND_API_KEY=your_resend_key
FROM_EMAIL=you@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

---

## Architecture

```
arche/
├── backend/
│   ├── main.py                 # FastAPI app, SSE streaming, all API endpoints
│   ├── pipeline.py             # Main orchestration: experts → synthesis → contrarians → arbitration → simulation
│   ├── agents.py               # Agent + contrarian definitions (12 domains, 8 agents each)
│   ├── simulation_pipeline.py  # Virtual society simulation (adversarial personas, 7 rounds)
│   ├── paper_generator.py      # Academic paper generation
│   ├── pill_distiller.py       # Background distillation of mechanism patterns into Library
│   ├── auth.py                 # User management, sessions, email verification, history
│   └── email_service.py        # Resend integration
└── frontend/
    └── src/
        ├── App.tsx              # Screen routing, global auth state
        └── components/
            ├── Boardroom.tsx        # Main analysis view — graph + feed, continuous single flow
            ├── AgentGraph.tsx       # D3 force simulation (experts, contrarians, personas)
            ├── AgentFeed.tsx        # Live scrolling feed with inline simulation section
            ├── ModeSelector.tsx     # Home page: greeting, input fields, recent analyses
            ├── LibraryPage.tsx      # Mechanism Library browser
            ├── PaperView.tsx        # Paper rendering + PDF export
            ├── SettingsPage.tsx     # Profile, password, preferences
            └── AnalysisDetailPage.tsx  # View past analysis from history
```

---

## License

MIT — built by [Enrico Saglimbeni](https://github.com/saglimbeni)
