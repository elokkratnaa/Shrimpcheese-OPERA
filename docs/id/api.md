# Rute API

OPERA menggunakan Route Handlers Next.js di `app/api/`.

| Metode | Rute | Deskripsi |
| --- | --- | --- |
| POST | `/api/sessions` | Membuat sesi baru |
| GET | `/api/sessions/[id]` | Ambil status/data sesi |
| GET | `/api/sessions/[id]/council` | Ambil ucapan debat |
| GET | `/api/sessions/[id]/stream` | Stream verdict SSE |
| PATCH | `/api/verdicts/[id]` | Commit verdict |
| POST | `/api/chat` | Obrolan berbasis persona |
| PATCH | `/api/profile` | Perbarui profil pengguna |
| DELETE | `/api/profile` | Hapus akun pengguna |

## Catatan Implementasi

- Semua logika berada di `services/`.
- Validasi menggunakan skema Zod.
- Penanganan kesalahan yang tepat dengan pesan deskriptif diperlukan.
