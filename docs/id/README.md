# Dokumentasi OPERA

Selamat datang di dokumentasi pengembang OPERA. OPERA adalah aplikasi web untuk kognitif offloading dan penyusunan keputusan yang dirancang untuk membantu pengguna mengatasi kelumpuhan analisis.

## Daftar Isi

- [Memulai](/docs/id/getting-started.md)
- [Halaman Aplikasi](/docs/id/pages.md)
- [Komponen Bersama](/docs/id/components.md)
- [Rute API](/docs/id/api.md)
- [Otentikasi](/docs/id/auth.md)
- [Penyebaran](/docs/id/deployment.md)

---

## Apa itu OPERA?

OPERA menerima curahan pikiran (mind dump) mentah dari pengguna yang mengalami kelumpuhan analisis, menjalankannya melalui pipeline debat AI multi-agen, dan menghasilkan cetak biru tindakan yang konkret.

Metafora teatrikal: pengguna adalah **Sutradara**, agen AI adalah **Pemeran**.

---

## Tumpukan Teknologi (Tech Stack)

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 (CSS-first)
- **Komponen UI**: shadcn/ui
- **Auth**: Supabase Auth (Email + Google OAuth)
- **LLM**: Groq SDK (llama-3.3-70b-versatile)
- **Validasi**: Zod
- **Pemeriksaan Tipe**: TypeScript strict mode
