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

2. Configure Environment Variables:

   Create a `.env.local` file in the `opera/` directory based on the provided example:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and fill in the required keys:

   - **`NEXT_PUBLIC_SUPABASE_URL`**: Your Supabase project URL.
   - **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**: Your Supabase project API (anon) key.
   - **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Same as the publishable key.
   - **`SUPABASE_SERVICE_ROLE_KEY`**: Your Supabase project service role key (found in Project Settings -> API). **Keep this secret and DO NOT prefix with `NEXT_PUBLIC_`.**
   - **`GROQ_API_KEY`**: Your Groq API key.

3. Initialize Database:

   The database schema needs to be initialized. Follow these steps:
   - Log in to your Supabase project dashboard.
   - Go to the **SQL Editor** in the left sidebar.
   - Create a new query.
   - Copy the contents of `supabase/migrations/00_init_schema.sql` and run it.

4. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
