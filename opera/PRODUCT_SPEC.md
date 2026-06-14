# PRD — OPERA (V1.0 MVP)

## Executive Summary

OPERA is a cognitive offloading and decision-structuring platform. Accepts raw mental dumps from users experiencing analysis paralysis, runs them through a multi-agent AI debate pipeline, produces a concrete action blueprint.

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
| Solo Chat | Side stage — one-on-one with a single persona, outside main pipeline |

---

## Tech Stack (Implementation)

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 16 (App Router, route handlers) |
| Styling | Tailwind CSS v4 (CSS-first, @theme in globals.css) |
| Components | shadcn/ui (CSS variables mode) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Database | Supabase (PostgreSQL) |
| LLM Inference | Groq SDK (llama-3.3-70b-versatile) |
| Validation | Zod |
| Deploy | Vercel |

> Note: Spec originally called for Redis + BullMQ async queue. Replaced with inline async execution in Next.js route handlers for competition speed. Queue architecture recommended for production.

---

## Pages

| Route | Description | Auth |
|---|---|---|
| `/` | Landing — guest marketing, hero, CTA | Guest |
| `/login` | Email + Google sign in | Guest |
| `/register` | Email + Google register | Guest |
| `/home` | Dashboard — recent sessions, patterns | Required |
| `/dump` | Mind Dump input screen | Required |
| `/session/[id]/profiling` | Profiler loading state | Required |
| `/session/[id]/council` | Council Room debate timeline | Required |
| `/session/[id]/verdict` | Verdict + Commit | Required |
| `/chat` | Solo persona chat (separate mode) | Required |
| `/history` | Past sessions list + tag filter | Required |
| `/profile` | User profile + stats + danger zone | Required |
| `/error` | Dedicated error page | Guest |

---

## Epics & Functional Requirements

### Epic 1: Auth

**Goal**: Fast, low-friction onboarding via email or Google.

| ID | Requirement |
|---|---|
| FR-0.1 | Email/password registration + login via Supabase Auth |
| FR-0.2 | Google OAuth via Supabase Auth provider |
| FR-0.3 | Middleware protects all /home, /dump, /session, /chat, /history, /profile routes |
| FR-0.4 | Authenticated users hitting /login or /register redirect → /home |

**Acceptance criteria**:
- Auth state managed by Supabase SSR client — no custom JWT logic
- Session refreshed on every request via middleware
- Google OAuth works without additional backend config beyond Supabase dashboard setup

---

### Epic 2: The Mind Dump

**Goal**: Frictionless, judgment-free input capture.

| ID | Requirement |
|---|---|
| FR-1.1 | Accept unformatted text input up to 4,000 characters |
| FR-1.2 | Minimalist UI — no visual noise during input |
| FR-1.3 | Debounced draft autosave (500ms) to localStorage key `opera_draft` |

**Acceptance criteria**:
- User pastes or types stream-of-consciousness with no required format
- Draft restored from localStorage on mount if exists
- Character counter visible; warning color at 3,800 chars
- Submit button disabled until input > 50 chars
- Button label: "Start my session" — never "Submit"

---

### Epic 3: The Profiler & Conflict Detection

**Goal**: Extract structure, emotional state, logical contradictions from raw input.

| ID | Requirement |
|---|---|
| FR-2.1 | Groq LLM parses input → core decision node, constraints, dependencies |
| FR-2.2 | Flag explicit + implicit contradictions |
| FR-2.3 | Generate persona vector JSON: `{ state, intensity, suggested_archetypes }` |

**Acceptance criteria**:
- Profiler output validates against Zod schema before proceeding
- Validation fail → session `status = failed` → user sees actionable error via /error
- Contradiction flags shown as `<ConflictFlag />` components pre-debate
- Profiler runs inline in POST /api/sessions handler (no queue) — awaited before redirect

---

### Epic 4: The Council Room

**Goal**: Materialize user's conflict as structured debate between distinct AI archetypes.

| ID | Requirement |
|---|---|
| FR-3.1 | Dynamically instantiate 2–3 archetypes from Profiler suggested_archetypes |
| FR-3.2 | 3-turn debate; each persona challenges others using user constraints as ground truth |
| FR-3.3 | Render as interactive script timeline — readable, scannable |

**Acceptance criteria**:
- All persona calls per turn run concurrently (Promise.all)
- turn_sequence column enforces deterministic order
- No auto-scroll — user reads at own pace
- Each persona visually distinct via `<PersonaBubble variant />` (teal / amber / coral)
- Bubbles fade in with staggered CSS animation (150ms delay each)

---

### Epic 5: The Verdict

**Goal**: Resolve debate into objective, actionable synthesis.

| ID | Requirement |
|---|---|
| FR-4.1 | Synthesize transcript into weighted Pro/Con matrix |
| FR-4.2 | Output single recommendation + exactly 2 ordered next steps |
| FR-4.3 | "Commit" CTA marks decision as taken — permanent |

**Acceptance criteria**:
- verdict_summary streams via SSE from GET /api/sessions/[id]/stream
- Pro/Con matrix scannable — not a wall of text
- Commit button: "Commit to this decision", 48px, coral, full width
- Post-commit: button replaced by "Decision committed." badge — removed from DOM
- is_committed = true is permanent — no undo, no edit

---

### Epic 6: Solo Chat

**Goal**: One-on-one conversation with a single persona outside main pipeline.

| ID | Requirement |
|---|---|
| FR-5.1 | User selects one of 3 default personas |
| FR-5.2 | Freeform chat with selected persona powered by Groq |
| FR-5.3 | Persona switch mid-chat requires confirmation (clears history) |

**Acceptance criteria**:
- Chat history kept in React state only — not persisted to DB in V1
- "This conversation isn't saved" muted caption always visible
- Persona responses stream via Groq SSE
- Persona switch confirmation: "Starting a new advisor clears this chat."
- Send on Enter or icon button (no "Send" text label)

---

### Epic 7: History

**Goal**: Let users review past cognitive patterns and decisions.

| ID | Requirement |
|---|---|
| FR-6.1 | Store all sessions: Mind Dump, Profiler output, Debate log, Verdict |
| FR-6.2 | Filter by auto-generated tags (`#Career`, `#Finance`, `#Relationships`, etc.) |

**Acceptance criteria**:
- `<SessionCard />` shows: date, truncated dump (100 chars), top tag, committed dot
- Tag filter instant — no full reload
- Tags auto-generated by Verdict stage — no manual tag creation in V1
- "Load 10 more" pagination — never "See more"

---

### Epic 8: Profile

**Goal**: User identity, stats, account management.

| ID | Requirement |
|---|---|
| FR-7.1 | Display name, email, initials avatar |
| FR-7.2 | Inline edit for full name |
| FR-7.3 | Stats: total sessions, committed count, top tag |
| FR-7.4 | Sign out + account deletion with confirmation |

**Acceptance criteria**:
- No photo upload in V1 — initials avatar only
- Delete requires typing "DELETE" to confirm
- "Sign out" — never "Logout"
- No password change UI in V1

---

## Shared Components

Build once, reuse everywhere. Live in `app/components/shared/`.

| Component | Used On |
|---|---|
| `<OperaNav variant="guest|authed" />` | All pages |
| `<OperaFooter />` | Landing, Error |
| `<PersonaBubble />` | Council Room, Solo Chat |
| `<SessionCard />` | Home, History |
| `<OperaInput />` | Mind Dump, Solo Chat |
| `<ConflictFlag />` | Council Room |
| `<CommitButton />` | Verdict |

---

## Data Flow (Simplified — No Queue)

```
[Client — /dump]
     │ (1) POST /api/sessions { raw_mind_dump }
     ▼
[Route Handler]
     │ (2) Insert session row, status = 'ingested'
     │ (3) Await runProfiler(session_id) inline
     │     → Groq call → Zod validate → UPDATE session
     │ (4) Await spawnCouncil(session_id, archetypes)
     │     → Promise.all persona turns × 3 → INSERT council_debates
     │     → UPDATE session status = 'completed'
     │ (5) Return { session_id }
     ▼
[Client navigates → /session/[id]/council]
     │ (6) GET /api/sessions/[id]/council → debate rows
     ▼
[Client navigates → /session/[id]/verdict]
     │ (7) GET /api/sessions/[id]/stream (SSE)
     │     → synthesizeVerdict → Groq stream → INSERT verdict
     ▼
[Client renders verdict, user commits]
     │ (8) PATCH /api/verdicts/[id] { is_committed: true }
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/sessions` | Create session, run full pipeline inline |
| GET | `/api/sessions/[id]` | Get session + status |
| GET | `/api/sessions/[id]/council` | Get debate rows ordered by turn_sequence |
| GET | `/api/sessions/[id]/stream` | SSE — stream verdict synthesis |
| PATCH | `/api/verdicts/[id]` | Set is_committed = true |
| POST | `/api/chat` | Groq chat with single persona, SSE stream |
| GET | `/api/profile` | Get user + stats |
| PATCH | `/api/profile` | Update full_name |
| DELETE | `/api/profile` | Delete account + all data |

---

## KPIs

| Category | Metric | Target |
|---|---|---|
| Engineering Performance | Time-To-Verdict (TtV) | < 8.0 seconds |
| Data Quality | Zod Validation Fallback Rate | < 0.5% |
| Product Engagement | Action Commitment Rate | > 45% |
| Product Retention | Return During High-Stress Periods | Declining churn trend |

---

## Out of Scope (V1)

- Social/sharing features
- Therapist or coach integrations
- Voice input
- Mobile native app
- Multi-language support
- User-defined custom personas
- Password change flow
- Chat history persistence
- Redis/BullMQ async queue (deferred to production)

---

## References

- `AGENTS.md` — agent schemas, LLM conventions, Groq prompt structure
- `DESIGN.md` — visual tokens, component specs, OPERA semantic aliases