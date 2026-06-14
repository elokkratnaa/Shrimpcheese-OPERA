# Getting Started

Follow these steps to set up the OPERA development environment locally.

## Prerequisites

- Node.js v20+
- npm (or yarn/pnpm/bun)
- Supabase project
- Groq API Key

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Shrimpcheese
   ```

2. **Install dependencies**

   ```bash
   cd opera
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the `opera/` directory:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.
