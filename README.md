# Sistem Antrian SPMB - SMA Negeri 7 Makassar

Aplikasi web untuk sistem pengambilan nomor antrian secara online, dirancang khusus untuk mempermudah proses pendaftaran calon peserta didik baru di SMA Negeri 7 Makassar.

## 🚀 Fitur Utama

- **Antarmuka Modern & Responsif**: Dibangun dengan Tailwind CSS untuk tampilan antarmuka yang bersih (glassmorphism), responsif, dan mudah digunakan pada perangkat mobile maupun desktop.
- **Real-time Database**: Integrasi dengan **Firebase Realtime Database** untuk sinkronisasi data seketika (mengambil nomor antrian tanpa tumpang tindih).
- **Kuota Antrian Dinamis**: Terdapat indikator visual berupa *badge* berkedip yang secara langsung menampilkan sisa kuota antrian harian. Otomatis menutup jika kuota habis.
- **Jadwal Operasional Otomatis**: Sistem secara cerdas akan membuka dan menutup pendaftaran secara otomatis sesuai dengan jam dan hari operasional yang telah ditentukan (misal: Senin - Jumat, 08:00 - 12:00 WITA).
- **Dashboard Admin & Monitor**: Dilengkapi dengan halaman khusus (admin & monitor) untuk mengatur jadwal, kuota maksimal, serta memantau nomor antrian yang sedang berjalan.
- **Bukti Antrian Virtual**: Peserta dapat langsung melakukan screenshot tiket antrian digital lengkap dengan rincian waktu pendaftarannya untuk ditunjukkan kepada petugas di sekolah.

## 🛠️ Teknologi yang Digunakan

- **Frontend**: HTML5, Vanilla JavaScript, Tailwind CSS (CDN)
- **Backend/Database**: Firebase Realtime Database & Firebase Hosting
- **Hosting**: URL Publik melalui [Firebase Hosting](https://antrian-smanet-a5395.web.app)

## 📂 Struktur Proyek

```text
📁 antrian/
├── 📄 index.html        # Halaman utama pendaftaran nomor antrian
├── 📄 monitor.html      # Halaman layar monitor petugas antrian
├── 📂 js/
│   ├── 📄 app.js               # Logika utama aplikasi client
│   ├── 📄 admin.js             # Logika halaman administrator
│   ├── 📄 monitor.js           # Logika pembaruan layar monitor realtime
│   └── 📄 firebase-config.js   # Konfigurasi koneksi ke Firebase
└── 📄 README.md         # Dokumentasi proyek
```

## ⚙️ Persyaratan Sistem

Untuk menjalankan atau memodifikasi proyek ini secara lokal:
1. Pastikan Anda memiliki koneksi internet yang stabil untuk mengakses Tailwind CSS dari CDN.
2. Anda bisa menggunakan `Live Server` pada VS Code atau *development server* sederhana lainnya untuk menjalankan aplikasi.
3. Konfigurasi `firebase-config.js` harus sudah disesuaikan dengan *credentials* dari Firebase Console Anda.

## 📦 Deployment (Firebase)

Proyek ini telah dikonfigurasi untuk digunakan dengan **Firebase Hosting**. 
Cara melakukan deployment pembaruan:

1. Pastikan Anda telah menginstal `firebase-tools` secara global:
   ```bash
   npm install -g firebase-tools
   ```
2. Lakukan login ke akun Google/Firebase Anda:
   ```bash
   firebase login
   ```
3. Lakukan proses deploy pada direktori proyek:
   ```bash
   firebase deploy
   ```
---
**© Sistem Antrian By Pandu Digital SMANET**
