# Yamzz Market — Vercel Edition

Tidak memakai Express/server terpisah. API berjalan sebagai Vercel Serverless Functions.

## Deploy
1. Upload project ke GitHub atau Vercel.
2. Import project ke Vercel.
3. Tambahkan Environment Variables:
   - JSONBIN_API_KEY
   - JSONBIN_BIN_ID
   - SESSION_SECRET
   - CASAKU_LICENSE_KEY
   - CASAKU_QR_ID
   - CASAKU_WEBHOOK_SECRET
   - CASAKU_PACKAGE_IDS (opsional)
   - CASAKU_EXPIRED_MINUTES (opsional)
4. Isi JSONBin dengan `data-initial.json`.
5. Deploy.

Webhook Casaku:
`https://DOMAIN-VERCEL-KAMU/api/webhook/casaku`

## Penting
JSONBin adalah document storage dan bukan database transaksional. Untuk project kecil/starter ini cukup, tetapi saldo dan order skala besar sebaiknya memakai DB transaksional.

## UI Theme
Professional Blue Dark Neon: navy background, cyan/blue glow, glass cards, responsive mobile layout, and Material Symbols font available for future icons.


## ADMIN PANEL

Panel admin tersedia di `/admin.html`.

Atur Environment Variables Vercel:
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` **atau** `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`

Fitur:
- Dashboard statistik pelanggan, produk, transaksi, pending, dan transaksi sukses
- CRUD produk
- Monitoring dan update status transaksi
- Pengaturan nama website, tagline, kontak, footer
- Maintenance mode ON/OFF
- Ganti logo dan favicon melalui URL gambar
- Tambah/hapus banner beranda melalui URL gambar
- Notifikasi berjalan/ticker beranda
- Admin session terpisah dari akun pelanggan

### Catatan keamanan
Jangan memasukkan password admin ke file frontend atau JSONBin. Simpan hanya di Environment Variables Vercel. Untuk produksi, lebih disarankan menggunakan `ADMIN_PASSWORD_HASH`.


## TENTANG WEBSITE

Navbar bawah sekarang memiliki menu **Tentang** yang menuju `/about.html`.

Halaman Tentang menampilkan:
- Penjelasan Yamzz Market
- Daftar layanan
- Sosial media resmi
- WhatsApp CS
- Email CS
- Informasi keamanan dan bantuan

Semua kontak dan sosial media dapat diubah dari **Admin Panel → Tampilan**.

## Manajemen Pelanggan & Lupa Password
Admin Panel kini memiliki menu **Pelanggan** untuk mencari username/email, melihat saldo, jumlah transaksi, status akun, serta mengubah saldo, status akun, dan password baru tanpa pernah menampilkan password lama.

Pada popup Login pelanggan tersedia **Lupa password?**. Pelanggan mengisi username + email. Jika cocok, sistem membuat token reset sekali pakai yang berlaku 30 menit. Link reset tidak dikirim otomatis ke pelanggan; admin mengambil link tersebut dari panel dan mengirimkannya secara manual.


### Notifikasi Telegram Reset Sandi
Isi environment variables berikut agar setiap permintaan lupa sandi yang cocok memberi notifikasi ke Telegram admin:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `APP_URL`

Tidak ada pengiriman email otomatis dari sistem. Link reset hanya dapat diambil oleh admin yang sudah login dan kemudian dikirim manual kepada pelanggan.

Halaman Tentang menampilkan:
- Penjelasan Yamzz Market
- Daftar layanan
- Sosial media resmi
- WhatsApp CS
- Email CS
- Informasi keamanan dan bantuan

Semua kontak dan sosial media dapat diubah dari **Admin Panel → Tampilan**.

## Manajemen Pelanggan & Lupa Password
Admin Panel kini memiliki menu **Pelanggan** untuk mencari username/email, melihat saldo, jumlah transaksi, status akun, serta mengubah saldo, status akun, dan password baru tanpa pernah menampilkan password lama.

Pada popup Login pelanggan tersedia **Lupa password?**. Pelanggan mengisi username + email. Jika cocok, sistem membuat token reset sekali pakai yang berlaku 30 menit dan mengirim link reset ke email pelanggan.

Agar email reset dapat terkirim, isi environment variables SMTP di Vercel:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `APP_URL`

Nilai SMTP hanya digunakan di sisi server dan tidak ditampilkan kepada pelanggan. Jangan pernah memasukkan password SMTP ke file frontend.


### Notifikasi Telegram Reset Sandi
Isi environment variables berikut agar setiap permintaan lupa sandi yang cocok memberi notifikasi ke Telegram admin:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `APP_URL`

Tidak ada pengiriman email otomatis dari sistem. Link reset hanya dapat diambil oleh admin yang sudah login dan kemudian dikirim manual kepada pelanggan.
