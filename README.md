# FinanceFlow AI

FinanceFlow menggunakan React/Vite sebagai frontend dan Express + MySQL sebagai
backend. Firebase sudah tidak digunakan.

## Menjalankan dengan XAMPP

1. Jalankan modul **MySQL** dari XAMPP. Apache tidak wajib untuk aplikasi ini.
2. Buka `http://localhost/phpmyadmin`, pilih tab **Import**, lalu impor
   `database/schema.sql`.
   Untuk database yang sudah ada, impor migrasi
   `database/migrations/004_add_monthly_financial_reports.sql`.
3. Salin `.env.example` menjadi `.env` dan sesuaikan kredensial MySQL serta
   `JWT_SECRET`. Isi `GROQ_API` dengan API key Groq untuk mengaktifkan analisis
   keuangan AI. Model default adalah `openai/gpt-oss-120b` dan dapat diubah
   melalui `GROQ_MODEL`.
4. Install dependency dan jalankan frontend + API:

   ```bash
   npm install
   npm run dev:full
   ```

Frontend tersedia di `http://localhost:5173`, sedangkan API di
`http://localhost:3001`.

Jika port MySQL XAMPP bukan `3306`, ubah `DB_PORT` di `.env`. Jika password
user `root` di XAMPP tidak kosong, isi `DB_PASSWORD`.

## Endpoint API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET|POST /api/transactions`
- `PUT|DELETE /api/transactions/:id`
- `GET /api/monthly-reports`
- `POST /api/ai/monthly-analysis`

Business Assistant menganalisis laporan bulanan milik user yang sedang login
beserta konteks hingga lima periode sebelumnya. API key Groq hanya digunakan
oleh backend dan tidak dikirim ke browser.

Laporan keuangan bulanan diarsipkan otomatis oleh API setiap jam dan saat API
mulai berjalan. Transaksi bulan yang sudah selesai tetap dapat dibaca, tetapi
tidak dapat ditambah, diubah, atau dihapus melalui API.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
