# Memulai

Ikuti langkah-langkah ini untuk menyiapkan lingkungan pengembangan OPERA secara lokal.

## Prasyarat

- Node.js v20+
- npm (atau yarn/pnpm/bun)
- Proyek Supabase
- Kunci API Groq

## Pengaturan

1. **Klon repositori**

   ```bash
   git clone <repository-url>
   cd Shrimpcheese
   ```

2. **Instal dependensi**

   ```bash
   cd opera
   npm install
   ```

3. **Konfigurasi variabel lingkungan**

   Buat file `.env.local` di direktori `opera/`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Jalankan server pengembangan**

   ```bash
   npm run dev
   ```

Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasinya.
