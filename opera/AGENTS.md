# OPERA — Agent Instructions

## Project Overview

**OPERA** is a cognitive offloading and decision-structuring platform for Gen Z users suffering from analysis paralysis, chronic overthinking, and information overload. Raw mental dumps transform into structured multi-perspective AI debates, resolving into a concrete action blueprint.

Theatrical metaphor: user is **Director**, AI agents are **Performers**.

Core user value: externalize the noise, see the conflict clearly, commit to action.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js (or Python/FastAPI — TBD) |
| Database | PostgreSQL |
| LLM Orchestration | Anthropic Claude API (structured outputs) |
| Background Jobs | Redis + BullMQ (Node) or Celery (Python) |
| Realtime | Server-Sent Events (SSE) or WebSocket |
| State Validation | Zod (Node) or Pydantic (Python) |
| Testing | Jest (Node) or Pytest (Python) |

---

## Repository Structure

```
src/
  agents/
    orchestrator.ts       — master agent: parses dump, spawns personas
    profiler.ts           — extracts decision nodes, biases, emotional vector
    personas/             — individual AI archetype implementations
  services/
    SessionService.ts     — session lifecycle management
    DebateService.ts      — async debate loop orchestration
    VerdictService.ts     — synthesis + action blueprint generation
  models/
    User.ts
    Session.ts
    CouncilDebate.ts
    Verdict.ts
  queues/
    ingestion.queue.ts    — debounced input processing
    debate.queue.ts       — async persona invocation
  routes/
    sessions.ts
    verdicts.ts
  schemas/                — Zod/Pydantic schemas for all LLM outputs
  utils/
database/
  migrations/
  seeds/
tests/
  unit/
  integration/
```

---

## Development Environment

### Local Setup

```bash
npm install
cp .env.example .env
npm run migrate
npm run dev
```

### Environment Variables

| Key | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection for BullMQ |
| `PORT` | API server port |

### Database

| Key | Value |
|---|---|
| Host | `127.0.0.1` |
| Port | `5433` |
| DB | `opera` |
| User | `hkaar` |
| Password | `root` |

---

## Roles & Permissions

| Role | Description |
|---|---|
| `guest` | Landing page only |
| `user` | Full OPERA access — sessions, debates, history |
| `admin` | Platform management, session inspection |

---

## Database Conventions

- Snake_case table and column names.
- All tables have `id` (UUID, `gen_random_uuid()`), `created_at`, `updated_at`.
- Foreign keys always explicit with `ON DELETE CASCADE` or `ON DELETE SET NULL`.
- JSONB for flexible LLM output fields (`detected_biases`, `action_steps`).
- Index `session_id` on `council_debates` and `verdicts` — queried heavily.
- Migrations must have both `up` and `down` — always reversible.

---

## Key Models

```
User            — auth user
Session         — one decision cycle; holds raw_mind_dump + status
CouncilDebate   — individual persona utterance in a debate; ordered by turn_sequence
Verdict         — synthesis output; holds pro/con matrix + action_steps + is_committed
```

### Schema Reference

```sql
-- Use Supabase Auth's built-in users table. 
-- No custom public.users table needed for V1.

CREATE TABLE sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_mind_dump TEXT NOT NULL,
  detected_biases JSONB,
  current_status VARCHAR(50) DEFAULT 'ingested', -- ingested | processing | completed | failed
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```
CREATE TABLE council_debates (
  debate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  persona_name VARCHAR(100) NOT NULL,
  message_content TEXT NOT NULL,
  turn_sequence INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verdicts (
  verdict_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  verdict_summary TEXT NOT NULL,
  action_steps JSONB NOT NULL,
  is_committed BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

---

## Agent Pipeline

### Stage 1 — The Profiler

Input: `raw_mind_dump` (string, max 4000 chars)

Output (strict JSON schema, validate with Zod/Pydantic):

```typescript
{
  core_decision_node: string,       // the actual decision being faced
  constraints: string[],            // hard limits user stated
  dependencies: string[],           // things the decision depends on
  contradictions: string[],         // explicit/implicit logical conflicts
  emotional_vector: {
    state: "anxious" | "avoidant" | "risk-tolerant" | "fatigued" | "hopeful",
    intensity: 1 | 2 | 3           // 1=mild, 3=strong
  },
  suggested_persona_archetypes: string[]  // 2–3 archetype names for this problem
}
```

### Stage 2 — The Council Room

- Spawn **2–3 AI persona archetypes** dynamically based on Profiler output.
- Run **3-turn async debate**: each persona challenges the others' positions using user's constraints as ground truth.
- All persona calls run **concurrently** (`Promise.all()` or parallel workers) — never sequential.
- Each turn persisted to `council_debates` with `turn_sequence` for deterministic ordering.

Example archetypes (not hardcoded — generated per session):

| Archetype | Bias |
|---|---|
| The Pragmatic Stoic | Risk minimization, long-term stability |
| The Venture Capitalist | Upside maximization, opportunity cost |
| The Creative Hedonist | Fulfillment, joy, quality of life |

### Stage 3 — The Verdict

Input: full `council_debates` transcript for the session

Output (strict JSON schema):

```typescript
{
  verdict_summary: string,          // objective synthesis paragraph
  pro_con_matrix: {
    option: string,
    pros: string[],
    cons: string[],
    weight: number                  // 0–1, relative recommendation strength
  }[],
  recommendation: string,           // single clear recommendation
  next_steps: [string, string],     // exactly 2 ordered action steps
  tags: string[]                    // auto-tags: ["#Career", "#Finance", etc.]
}
```

---

## LLM Conventions

- **Structured output**: always enforce JSON schema. Never parse freeform text for data.
- **Fallback**: if JSON parse fails, retry once. If retry fails, mark session `failed`, surface error to user. Never silently swallow.
- **JSON Schema Fallback Rate target**: < 0.5% (see KPIs).
- **System prompts** live in `src/agents/prompts/` — not inline in service code.
- **No LLM calls in route handlers** — always via service layer, always queued.

---

## API Conventions

- REST JSON API. Thin route handlers. Validation at request boundary.
- All business logic in `src/services/`.
- SSE endpoint for streaming Verdict as it's synthesized: `GET /sessions/:id/stream`.
- Return meaningful data or proper HTTP status — no `{ success: true }`.
- No N+1: always join or batch-load debate rows when fetching sessions.

---

## Code Style

- Strict TypeScript: `"strict": true` in `tsconfig.json`.
- No `any`. No `as unknown as X` casts without comment explaining why.
- No `console.log` in committed code — use structured logger.
- All public functions JSDoc'd with `@param` and `@returns`.
- Run linter before every commit.

---

## Naming Rules

- No `data`, `result`, `response`, `payload` as variable names. Name the thing.
- No `handleX`, `processX` — say what the function does: `synthesizeVerdict()`, `spawnPersonas()`.
- No `isValid` — use `hasExceededInputLimit()`, `isDebateComplete()`.

---

## Comments Policy

**Default: no comments.** Code self-documents via naming.

Write comment only when:
- The *why* is non-obvious and would take reader >30 seconds to reconstruct.
- Regex or non-trivial arithmetic needs plain-English context.
- `TODO` / `FIXME` with owner + context.

---

## UI Copy Rules

- No placeholder text.
- No generic button labels: "Submit", "OK", "Next". Use: "Start my session", "Commit to this decision", "See the verdict".
- No generic notifications: "Saved!" → "Decision committed."
- No "Coming soon" — either ship it or hide it.

---

## Performance Targets

| Metric | Target |
|---|---|
| Time-To-Verdict (end-to-end) | < 8.0 seconds |
| JSON Schema Fallback Rate | < 0.5% |
| Action Commitment Rate | > 45% of sessions |

---

## Testing

- Integration tests for full pipeline: Mind Dump → Profiler → Council → Verdict.
- Unit tests for: schema validators, tag extractor, pro/con weight calculator.
- Mock LLM calls in unit tests — never hit real API in CI.
- Coverage target: 80%+ on `src/services/` and `src/agents/`.

```bash
npm run test
```

---

## References

- See `PRODUCT_SPEC.md` for feature requirements, epics, and acceptance criteria.
- See `DESIGN.md` for visual/UI tokens — never hardcode colors or spacing outside it.
