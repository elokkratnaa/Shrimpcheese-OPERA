# Otentikasi

OPERA memanfaatkan Supabase Auth untuk manajemen pengguna.

## Pengaturan

- **Email/Kata Sandi**: Otentikasi standar Supabase.
- **Google OAuth**: Dikonfigurasi di dasbor Supabase dengan pengalihan ke `/auth/callback`.

## Middleware

`middleware.ts` menangani:

- Penyegaran sesi.
- Perlindungan rute (memblokir akses tidak terotentikasi ke rute dasbor/sesi).
- Pengalihan pengguna yang terotentikasi dari rute auth ke `/home`.
- Lokalisasi (next-intl).

## Verifikasi Sesi

- Selalu verifikasi sesi di sisi server menggunakan `supabase.auth.getUser()`.
- Jangan pernah percaya input ID pengguna dari sisi klien untuk operasi data sensitif.
