# Panduan Deployment Aplikasi Antrian Online

Aplikasi Antrian Online ini adalah aplikasi *front-end* murni (HTML, CSS, JavaScript) yang menggunakan **Firebase Realtime Database** sebagai *backend*-nya. Oleh karena itu, proses *deployment* (meng-online-kan aplikasi) dibagi menjadi dua tahap utama:
1. Konfigurasi Database Firebase (Wajib)
2. Upload File Web ke Hosting Gratis

---

## Tahap 1: Konfigurasi Database Firebase

Saat ini aplikasi Anda masih menggunakan *Mock Database* (lokal) karena konfigurasi Firebase belum diisi. Anda wajib mengaturnya terlebih dahulu agar data tersimpan secara online.

### Langkah 1: Buat Proyek Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/) dan login menggunakan akun Google Anda.
2. Klik **"Add project"** (Tambah proyek).
3. Beri nama proyek Anda (misal: `antrian-sman7-mks`), lalu klik **Continue**.
4. Matikan Google Analytics (tidak wajib untuk saat ini), lalu klik **Create project**.

### Langkah 2: Aktifkan Realtime Database
1. Di panel kiri Firebase Console, klik **Build** > **Realtime Database**.
2. Klik tombol **Create Database**.
3. Pilih lokasi database (bebas, disarankan yang paling dekat seperti *Singapore* jika ada, atau biarkan bawaan *United States*). Klik **Next**.
4. Pilih **"Start in test mode"** (agar bisa langsung digunakan tanpa pusing mengatur izin baca/tulis), lalu klik **Enable**.
   > [!WARNING]
   > *Test mode* berarti semua orang bisa membaca dan menulis data Anda. Ini baik untuk testing. Nanti untuk keamanan Anda bisa mengubah *rules* (aturan) di tab "Rules".

### Langkah 3: Ambil Konfigurasi SDK & Masukkan ke Kode Anda
1. Klik ikon **"Project Overview"** (ikon rumah) di panel kiri atas.
2. Di tengah layar, klik ikon **Web** `</>` untuk menambahkan aplikasi web.
3. Beri nama aplikasi (misal: `AntrianWeb`), lalu klik **Register app**.
4. Di bagian *Add Firebase SDK*, Anda akan melihat blok kode bernama `firebaseConfig`.
5. Salin bagian kode `const firebaseConfig = { ... };` tersebut.
6. Buka file `js/firebase-config.js` di folder proyek Anda.
7. Ganti konfigurasi *dummy* (yang berisi tulisan `GANTI_DENGAN_API_KEY_ANDA`) dengan konfigurasi asli yang baru saja Anda salin dari Firebase. Simpan file tersebut.

Kini aplikasi Anda sudah sepenuhnya terhubung ke *database* online!

---

## Tahap 2: Upload File Web ke Hosting

Pilih salah satu opsi di bawah ini. Opsi A sangat direkomendasikan karena paling cepat dan mudah bagi pemula.

### Opsi A: Netlify Drop (Sangat Mudah & Cepat)
Netlify menyediakan layanan hosting gratis di mana Anda hanya perlu *drag-and-drop* (tarik dan lepas) folder.

1. Buka halaman [Netlify Drop](https://app.netlify.com/drop).
2. Login menggunakan email atau akun GitHub Anda.
3. Cari folder proyek antrian Anda di komputer (folder yang berisi file `index.html`, `admin.html`, folder `js`, dll).
4. Klik dan tahan folder tersebut, lalu **geser (drag)** dan **lepas (drop)** ke dalam lingkaran putus-putus di halaman web Netlify.
5. Tunggu beberapa detik, Netlify akan langsung memberikan *link URL* web Anda yang sudah online!
   > [!TIP]
   > Di *dashboard* Netlify, Anda bisa mengklik **"Site settings"** lalu **"Change site name"** untuk mengubah URL menjadi lebih rapi, misalnya `antrian-sman7.netlify.app`.

### Opsi B: Firebase Hosting (Sedikit Lebih Teknis)
Karena Anda menggunakan Firebase untuk database, Anda juga bisa menyatukan *hosting* web-nya di Firebase. Opsi ini mengharuskan Anda menggunakan Terminal / Command Prompt (CMD).

1. Pastikan komputer Anda sudah terinstal [Node.js](https://nodejs.org/).
2. Buka **Terminal** atau CMD di dalam folder proyek Anda.
3. Ketik perintah ini untuk menginstal Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
4. Login ke akun Google Anda melalui terminal:
   ```bash
   firebase login
   ```
5. Inisialisasi proyek hosting:
   ```bash
   firebase init
   ```
   - Gunakan panah atas/bawah untuk memilih **Hosting: Configure files for Firebase Hosting**. Tekan Spasi untuk memilih, lalu Enter.
   - Pilih **Use an existing project**, lalu pilih nama proyek Firebase yang Anda buat di Langkah 1.
   - Ketik `.` (titik) atau ketik lokasi folder *public* jika Anda mengaturnya khusus. Jika ditanya, ketik `N` untuk *single-page app*, dan `N` untuk menimpa file.
6. Terakhir, *deploy* aplikasi Anda:
   ```bash
   firebase deploy
   ```
7. Terminal akan menampilkan URL Firebase Hosting Anda.

---

> [!IMPORTANT]
> **Apa yang harus dites setelah online?**
> Coba buka URL web Anda di HP atau perangkat lain (gunakan jaringan data seluler untuk memastikan bisa diakses dari luar). Lakukan pendaftaran antrian dan buka halaman `admin.html`. Jika antrian muncul di dasbor admin, berarti *deployment* Anda berhasil 100%!
