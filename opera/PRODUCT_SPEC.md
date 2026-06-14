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
| `/session/[id]/verdict` | Verdict + Commit + New Session | Required |
| `/chat` | Solo persona chat | Required |
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

---

### Epic 2: The Mind Dump

**Goal**: Frictionless, judgment-free input capture.

| ID | Requirement |
|---|---|
| FR-1.1 | Accept unformatted text input up to 4,000 characters |
| FR-1.2 | Minimalist UI — no visual noise during input |
| FR-1.3 | Debounced draft autosave (500ms) to localStorage key `opera_draft` |

---

### Epic 3: The Profiler & Conflict Detection

**Goal**: Extract structure, emotional state, logical contradictions from raw input.

| ID | Requirement |
|---|---|
| FR-2.1 | Groq LLM parses input → core decision node, constraints, dependencies |
| FR-2.2 | Flag explicit + implicit contradictions |
| FR-2.3 | Generate persona vector JSON |

---

### Epic 4: The Council Room (Debate Room Enhancements)

**Goal**: Materialize user's conflict as structured debate between distinct AI archetypes with enhanced interactivity.

| ID | Requirement |
|---|---|
| FR-3.1 | Dynamically instantiate 2–3 archetypes from Profiler |
| FR-3.2 | Multi-turn debate; persona challenges others |
| FR-3.3 | Live preview chat panel for ongoing debate |
| FR-3.4 | Categories + labels per debate context |
| FR-3.5 | Overthinking bar (visual indicator of reasoning depth) |
| FR-3.6 | Multiple rounds support |
| FR-3.7 | Show participating personas list |
| FR-3.8 | User rate + pick favorite persona |

**Acceptance criteria**:
- Debate timeline is interactive and displays live updates via SSE
- Categories/labels clearly visible for debate context
- Reasoning depth bar visually updates per debate turn
- Persona list clearly indicates active participants
- Rating UI allows quick feedback on persona performance

---

### Epic 5: The Verdict Screen

**Goal**: Resolve debate into objective, actionable synthesis.

| ID | Requirement |
|---|---|
| FR-4.1 | Synthesize transcript into weighted Pro/Con matrix |
| FR-4.2 | Output single recommendation + exactly 2 ordered next steps |
| FR-4.3 | "Commit" CTA marks decision as taken |
| FR-4.4 | Start new session input/button |

**Acceptance criteria**:
- Verdict synthesis streams via SSE
- "Commit" button functionality persists
- "Start new session" input facilitates immediate transition to `/dump`

---

### Epic 6: Solo Chat

**Goal**: One-on-one conversation with a single persona.

---

### Epic 7: History

**Goal**: Let users review past cognitive patterns and decisions.

---

### Epic 8: Profile

**Goal**: User identity, stats, account management.

---

### Epic 9: Bug Fixes

| ID | Issue | Fix |
|---|---|---|
| B-1.1 | Raw JSON data showing in one-on-one chat | Sanitize UI render logic |
| B-1.2 | User flow: entry → session → verdict | Enforce strict navigation guardrails |

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
- Multi-language support (Done)
- User-defined custom personas
- Password change flow
- Chat history persistence
- Redis/BullMQ async queue (deferred to production)

---

## References

- `AGENTS.md` — agent schemas, LLM conventions, Groq prompt structure
- `DESIGN.md` — visual tokens, component specs, OPERA semantic aliases
