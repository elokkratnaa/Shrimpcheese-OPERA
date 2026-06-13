# PRD — OPERA (V1.0 MVP)

## Executive Summary

OPERA is a cognitive offloading and decision-structuring platform. It accepts raw, unstructured mental dumps from users experiencing analysis paralysis, runs them through a multi-agent AI debate pipeline, and produces a concrete action blueprint.

Target user: **Gen Z "Paralyzed Optimizer"** — high optimization desire, high FOMO anxiety, digitally fluent, chronically overthinking.

---

## Problem Validation

| Problem | Signal |
|---|---|
| Chronic overthinking | High thought volume, low decision output; cognitive fatigue |
| Decision fatigue | Exponential energy cost as information sources multiply |
| Fragmented opinion-seeking | Reddit + TikTok + WhatsApp loops → new biases, more noise |

Broken workflow: Raw thought → Fragmented web search → Information overload → Paralysis

OPERA replaces steps 2–4 with a single structured session.

---

## User Persona: The Paralyzed Optimizer

- **Age**: 18–28
- **Role**: University student, freelancer, or young digital-industry professional
- **Trait**: Wants the "perfect" decision; high opportunity-cost anxiety
- **Tech fluency**: High
- **Pain**: Knows what the options are. Can't commit. Goes in circles.

---

## Theatrical Metaphor (Product Frame)

| Stage | What It Is |
|---|---|
| The Mind Dump | Backstage — raw, unstructured thought input |
| The Profiler | Scriptwriter — reads between the lines, extracts structure |
| The Council Room | Main stage — AI personas debate live |
| The Verdict | Curtain call — final synthesis, action blueprint |

---

## Epics & Functional Requirements

### Epic 1: The Mind Dump

**Goal**: Frictionless, judgment-free input capture.

| ID | Requirement |
|---|---|
| FR-1.1 | Accept unformatted text input up to 4,000 characters |
| FR-1.2 | Minimalist UI — no visual noise during input |
| FR-1.3 | Debounced draft autosave (500ms window) to prevent data loss on network instability |

**Acceptance criteria**:
- User can paste or type a stream-of-consciousness dump with no required format
- Input persists if tab closes and reopens within session
- Character counter visible; soft warning at 3,800 chars

---

### Epic 2: The Profiler & Conflict Detection

**Goal**: Extract structure, emotional state, and logical contradictions from raw input.

| ID | Requirement |
|---|---|
| FR-2.1 | LLM parses input to identify: core decision node, constraints, dependencies |
| FR-2.2 | Flag explicit and implicit contradictions in user's logic (e.g. "want to save money" vs. "want the luxury option") |
| FR-2.3 | Generate temporary persona vector as JSON: `{ state, intensity, suggested_archetypes }` |

**Acceptance criteria**:
- Profiler output always validates against Zod/Pydantic schema before proceeding
- If validation fails, session status = `failed` and user sees actionable error (not a crash)
- Contradiction flags shown to user as a brief pre-debate summary ("We noticed a conflict...")

---

### Epic 3: The Council Room

**Goal**: Materialize user's internal conflict as a structured debate between distinct AI archetypes.

| ID | Requirement |
|---|---|
| FR-3.1 | Dynamically instantiate 2–3 AI archetypes based on Profiler output; archetypes are not hardcoded |
| FR-3.2 | Execute 3-turn async debate; each persona challenges others using user's constraints as ground truth |
| FR-3.3 | Render debate as interactive script timeline in UI — readable, scannable |

**Acceptance criteria**:
- All persona calls run concurrently, not sequentially
- Turn order is deterministic (enforced by `turn_sequence` column)
- User can read debate at their own pace — no auto-scroll forcing
- Each persona visually distinct (name, color, icon)

---

### Epic 4: The Verdict

**Goal**: Resolve Council Room debate into an objective, actionable synthesis.

| ID | Requirement |
|---|---|
| FR-4.1 | Synthesize debate transcript into a weighted Pro/Con matrix |
| FR-4.2 | Output single recommendation + 2 ordered next action steps |
| FR-4.3 | "Commit" CTA button allows user to mark decision as taken |

**Acceptance criteria**:
- Verdict renders via SSE stream — user sees it appear progressively, not after a full wait
- Pro/Con matrix is scannable at a glance (not a wall of text)
- "Commit" button triggers state change (`is_committed = true`) and confirmation: "Decision committed."
- Verdict is permanent — no editing after commit

---

### Epic 5: History

**Goal**: Let users review past cognitive patterns and decisions.

| ID | Requirement |
|---|---|
| FR-5.1 | Store all sessions: Mind Dump, Profiler output, Debate log, Verdict |
| FR-5.2 | Filter history by auto-generated tags (e.g. `#Career`, `#Finance`, `#Relationships`) |

**Acceptance criteria**:
- History list shows: date, truncated Mind Dump, top tag, committed status
- Filter is instant (client-side or indexed DB query — no full reload)
- Tags generated automatically by Verdict stage; user cannot manually create tags in V1

---

## Data Flow

```
[Client UI]
     │ (1) POST /sessions — raw_mind_dump
     ▼
[API Layer]
     │ (2) Enqueue ingestion job
     ▼
[Profiler Agent (LLM)]
     │ (3) Extract structure → persist to sessions table
     │ (4) Spawn 2–3 Persona agents concurrently (Promise.all)
     ▼
[Council Room — Async Debate Loop]
     │ (5) 3 turns × N personas → persist each to council_debates
     ▼
[Verdict Agent (LLM)]
     │ (6) Synthesize transcript → persist to verdicts
     ▼
[SSE Stream → Client]
     (7) Progressive render of Verdict in UI
```

---

## KPIs

| Category | Metric | Target | What It Measures |
|---|---|---|---|
| Engineering Performance | Time-To-Verdict (TtV) | < 8.0 seconds | End-to-end latency: Mind Dump submit → Verdict fully rendered |
| Data Quality | JSON Schema Fallback Rate | < 0.5% | How often LLM output fails schema validation and triggers retry/failure |
| Product Engagement | Action Commitment Rate | > 45% | Sessions where user presses "Commit" on Verdict screen |
| Product Retention | Churn Over Fatigue | Declining trend | Whether users return during high-stress periods (not just once) |

---

## Out of Scope (V1)

- Social/sharing features
- Therapist or coach integrations
- Voice input
- Mobile native app
- Multi-language support
- User-defined custom personas

---

## References

- See `AGENTS.md` for full technical implementation guide, agent schemas, and LLM conventions.
- See `DESIGN.md` for visual tokens — never hardcode colors, spacing, or typography outside it.
- See `docs/ARCHITECTURE.md` for infrastructure and deployment diagrams.
