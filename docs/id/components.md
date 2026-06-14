# Komponen Bersama

Komponen bersama berada di `app/components/shared/` dan harus digunakan kembali di seluruh aplikasi.

| Komponen | Deskripsi | Props |
| --- | --- | --- |
| `<OperaNav />` | Navigasi atas | `variant: "guest" \| "authed"` |
| `<OperaFooter />` | Footer gelap | Tidak ada |
| `<OperaLoader />` | Animasi pemuatan | Tidak ada |
| `<PersonaBubble />` | Gelembung pesan debat | `persona_name`, `message_content`, `variant: "a"\|"b"\|"c"`, `isStreaming?` |
| `<SessionCard />` | Item daftar riwayat | `session` |
| `<OperaInput />` | Textarea bergaya | `value`, `onChange`, `placeholder`, `maxLength` |
| `<ConflictFlag />` | Kartu peringatan | `message` |
| `<CommitButton />` | Tombol aksi coral | `onCommit`, `isCommitted` |
| `<LanguageSwitcher />` | Pengalih bahasa | Tidak ada |

## Panduan Penggunaan

- Perluas primitif shadcn menggunakan `className` + token desain.
- Jangan pernah menulis gaya secara hardcode; gunakan variabel CSS dari `DESIGN.md`.
- Pastikan responsivitas seluler untuk semua komponen bersama.
