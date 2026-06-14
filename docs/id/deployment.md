# Penyebaran (Deployment)

OPERA disebarkan di Vercel.

## Daftar Periksa Lingkungan

Sebelum menyebarkan, pastikan variabel lingkungan berikut diatur di pengaturan proyek Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GROQ_API_KEY`

## Langkah Penyebaran

1. Hubungkan repositori ke Vercel.
2. Konfigurasikan pengaturan build untuk direktori `opera`.
3. Tambahkan variabel lingkungan yang tercantum di atas.
4. Sebarkan proyek.

## Pasca-Penyebaran

- Konfigurasikan URL pengalihan Supabase Auth untuk mengarah ke domain produksi Vercel Anda.
- Pastikan kredensial Google OAuth diperbarui di konsol Supabase/Google Cloud.
