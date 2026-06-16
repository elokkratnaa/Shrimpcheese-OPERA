# OPERA

OPERA is a cognitive offloading and decision-structuring web application built with Next.js.

## Core Features

- **Mind Dump**: Structured mind dumping with character limits, emotional state tracking, and debate round selection.
- **Council Room**: Multi-round AI debate interface with real-time SSE streaming, interactive rebuttal panel, and persona interactions.
- **Verdict Screen**: Multi-dimensional decision synthesis, persona feedback, and results sharing.
- **Solo Chat**: Persona-based AI chat for deep dives.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (CSS-first)
- **UI Components**: shadcn/ui
- **Auth**: Supabase Auth
- **LLM**: Groq SDK (Multi-model fallback chain for resilience)
- **Internationalization**: `next-intl`
- **Security**: AI-driven input safety filtering

## Internationalization (i18n)

OPERA supports English and Indonesian.

- **Locales**: `en` (default), `id`.
- **Implementation**: Uses `next-intl`.
- **Translations**: Messages are located in `messages/en.json` and `messages/id.json`.
- **Routing**: Routes are localized using `app/[locale]/` directory structure. Middleware automatically detects the user's preferred locale.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
