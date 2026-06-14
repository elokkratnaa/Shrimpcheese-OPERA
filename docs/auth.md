# Authentication

OPERA utilizes Supabase Auth for user management.

## Setup

- **Email/Password**: Standard Supabase authentication.
- **Google OAuth**: Configured in the Supabase dashboard with redirect to `/auth/callback`.

## Middleware

`middleware.ts` handles:

- Session refreshing.
- Route protection (blocking unauthenticated access to dashboard/session routes).
- Redirection of authenticated users from auth routes to `/home`.
- Localization (next-intl).

## Session Verification

- Always verify session server-side using `supabase.auth.getUser()`.
- Never trust client-side user ID inputs for sensitive data operations.
