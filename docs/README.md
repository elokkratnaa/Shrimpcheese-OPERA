# OPERA Documentation

Welcome to the OPERA developer documentation. OPERA is a cognitive offloading and decision-structuring web application designed to help users resolve analysis paralysis.

## Table of Contents

- [Getting Started](/docs/getting-started.md)
- [Application Pages](/docs/pages.md)
- [Shared Components](/docs/components.md)
- [API Routes](/docs/api.md)
- [Authentication](/docs/auth.md)
- [Deployment](/docs/deployment.md)

---

## What is OPERA?

OPERA accepts raw mental dumps from users experiencing analysis paralysis, runs them through a multi-agent AI debate pipeline, and produces a concrete action blueprint.

Theatrical metaphor: user is **Director**, AI agents are **Performers**.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (CSS-first)
- **UI Components**: shadcn/ui
- **Auth**: Supabase Auth (Email + Google OAuth)
- **LLM**: Groq SDK (llama-3.3-70b-versatile)
- **Validation**: Zod
- **Type Checking**: TypeScript strict mode
