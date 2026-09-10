YAMZZ MARKET - API FUNCTION LIMIT FIX

Tujuan: menurunkan jumlah Vercel Serverless Function dari 13 menjadi 12 pada Hobby.

1. Ganti file repository:
   api/deposit.js
   vercel.json

2. Hapus file:
   api/webhook/casaku.js
   api/webhook/&#

3. Jangan hapus api/_lib.js. File yang diawali underscore tidak dibuat sebagai Function oleh Vercel.

4. Endpoint customer tetap:
   /api/deposit
   /api/login
   /api/register
   /api/me
   /api/profile
   /api/products
   /api/settings
   /api/transactions
   /api/forgot-password
   /api/reset-password
   /api/logout
   /api/admin

5. Webhook pembayaran tetap memakai:
   /api/webhook/casaku
   tetapi sekarang diarahkan ke Function deposit.js melalui vercel.json.

6. Respons deposit tidak lagi mengirim detail internal provider ke browser customer.

Setelah perubahan, lakukan Redeploy di Vercel.
