# API Routes

OPERA uses Next.js Route Handlers in `app/api/`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/sessions` | Create a new session (w/ category, emotion, persona selection) |
| GET | `/api/sessions/[id]` | Fetch session status/data |
| GET | `/api/sessions/[id]/council` | Fetch debate utterances |
| POST | `/api/sessions/[id]/rebuttal` | Submit user rebuttal during multi-round debate |
| GET | `/api/sessions/[id]/stream` | SSE debate/verdict stream |
| PATCH | `/api/verdicts/[id]` | Commit a verdict/update favourite persona |
| POST | `/api/chat` | Persona-based chat |
| PATCH | `/api/profile` | Update user profile |
| DELETE | `/api/profile` | Delete user account (requires SUPABASE_SERVICE_ROLE_KEY) |

## Implementation Notes

- All logic resides in `services/`.
- Validation uses Zod schemas.
- Proper error handling with descriptive messages is required.
