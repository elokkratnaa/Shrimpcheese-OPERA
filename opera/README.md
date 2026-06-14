# OPERA

OPERA is a cognitive offloading and decision-structuring web application built with Next.js.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (CSS-first)
- **UI Components**: shadcn/ui
- **Auth**: Supabase Auth (Email + Google OAuth)
- **LLM**: Groq SDK (llama-3.3-70b-versatile)
- **Internationalization**: `next-intl`
- **Validation**: Zod
- **Type Checking**: TypeScript strict mode

## Internationalization (i18n)

OPERA supports English and Indonesian.

- **Locales**: `en` (default), `id`.
- **Implementation**: Uses `next-intl`.
- **Translations**: Messages are located in `messages/en.json` and `messages/id.json`.
- **Routing**: Routes are localized using `app/[locale]/` directory structure. Middleware automatically detects the user's preferred locale based on browser headers.

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
