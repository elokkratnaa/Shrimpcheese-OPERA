# Halaman Aplikasi

OPERA terdiri dari 12 rute utama, dikategorikan berdasarkan persyaratan otentikasi.

| Rute | Deskripsi | Otentikasi Diperlukan |
| --- | --- | --- |
| `/` | Halaman landing | Tidak |
| `/login` | Masuk Email/Google | Tidak |
| `/register` | Pendaftaran Email/Google | Tidak |
| `/home` | Dasbor (sesi, tag) | Ya |
| `/dump` | Antarmuka input Mind Dump | Ya |
| `/session/[id]/profiling` | Halaman status pemuatan | Ya |
| `/session/[id]/council` | Antarmuka debat | Ya |
| `/session/[id]/verdict` | Verdict akhir + commit | Ya |
| `/chat` | Obrolan persona solo | Ya |
| `/history` | Daftar sesi sebelumnya | Ya |
| `/profile` | Pengaturan pengguna + manajemen akun | Ya |
| `/error` | Halaman batas kesalahan | Tidak |
