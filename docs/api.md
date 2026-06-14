# API Routes

OPERA uses Next.js Route Handlers in `app/api/`.

| Method | Route | Description |
| --- | --- | --- |
| POST | `/api/sessions` | Create a new session |
| GET | `/api/sessions/[id]` | Fetch session status/data |
| GET | `/api/sessions/[id]/council` | Fetch debate utterances |
| GET | `/api/sessions/[id]/stream` | SSE verdict stream |
| PATCH | `/api/verdicts/[id]` | Commit a verdict |
| POST | `/api/chat` | Persona-based chat |
| PATCH | `/api/profile` | Update user profile |
| DELETE | `/api/profile` | Delete user account |

## Implementation Notes

- All logic resides in `services/`.
- Validation uses Zod schemas.
- Proper error handling with descriptive messages is required.
