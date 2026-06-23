# Laporan Audit Keamanan (Security Audit Report)

**Auditor:** Senior Web Developer & Security Auditor  
**Proyek:** Sistem Antrian Online SMAN 7 Makassar  
**Status:** 🚨 Terdapat Celah Keamanan KRITIKAL

Setelah meninjau keseluruhan struktur kode dan konfigurasi proyek Anda, saya menemukan beberapa keunggulan (seperti penanganan XSS yang sudah baik menggunakan `textContent` dan `escapeHTML`), namun terdapat **celah keamanan struktural tingkat tinggi** terkait arsitektur *serverless* Firebase yang Anda gunakan.

Berikut adalah temuan dan cara memperbaikinya:

---

## 1. 🚨 KRITIKAL: Firebase Security Rules Terbuka Lebar (Public Write/Delete)

**Lokasi:** `database.rules.json`
```json
"queues": {
  ".read": true,
  "$date": { ".write": true }
},
"settings": { ".read": true, ".write": true }
```

**Penjelasan Celah:**
Saat ini, *semua orang di internet* memiliki akses baca (`.read: true`) dan tulis (`.write: true`) secara mutlak ke seluruh database Anda. Seseorang yang usil dapat menggunakan terminal/konsol untuk:
1. **Menghapus seluruh data antrian hari ini** dengan satu baris perintah.
2. Mengubah `settings/max_queue` menjadi 1 atau 0 untuk melumpuhkan pendaftaran.
3. Mencuri seluruh data pribadi pendaftar (Nomor WhatsApp & Nama Anak).

**Cara Memperbaiki:**
Anda harus merestriksi *Rules* ini. Pengunjung biasa hanya boleh menambahkan data (push), tetapi tidak boleh menghapus atau mengedit data orang lain. Modifikasi sistem/jadwal hanya boleh dilakukan oleh Admin. (Lihat poin 2 terkait Admin).

---

## 2. 🚨 KRITIKAL: Autentikasi Admin Berbasis Klien (Bypass Mudah)

**Lokasi:** `js/admin.js`
```javascript
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
// ...
if (user === 'superadmin' && passHash === superHash) {
    sessionStorage.setItem('adminAuth', 'true');
}
```

**Penjelasan Celah:**
Anda melakukan validasi *password* dengan *hash* di sisi Javascript (klien), lalu menyimpannya di `sessionStorage`. Ini sama sekali tidak mengunci *database*.
Seseorang yang mengerti *web development* cukup menekan **F12**, membuka *Console*, dan mengetikkan:
```javascript
sessionStorage.setItem('adminAuth', 'true');
sessionStorage.setItem('adminUser', 'superadmin');
```
Lalu me-*refresh* halaman. Sistem akan tertipu dan memberikan akses ke dasbor Admin secara penuh. Karena masalah #1 belum diatasi, "Hacker" ini memiliki akses mutlak ke *database* dari antarmuka Admin.

**Cara Memperbaiki:**
Gunakan **Firebase Authentication** (Email & Password) resmi. 
1. Daftarkan akun Admin di Firebase Console.
2. Ubah fungsi login di `admin.js` menggunakan metode `firebase.auth().signInWithEmailAndPassword()`.
3. Validasi *token* auth ini di `database.rules.json` (Misal: `".write": "auth != null"`).

---

## 3. ⚠️ MENENGAH: Validasi Jam Operasional di Sisi Klien

**Lokasi:** `js/app.js` (Fungsi `checkOperatingHours`)

**Penjelasan Celah:**
Validasi yang menolak pengunjung saat "Kuota Penuh" atau "Jam Ditutup" hanya dijalankan oleh Javascript di *browser* (UI). Jika jam sudah ditutup, *hacker* bisa langsung mengirim data (`POST`) langsung ke API Firebase tanpa mempedulikan UI aplikasi Anda, dan data tersebut akan tetap masuk.

**Cara Memperbaiki:**
Ini harus dicegah di level `database.rules.json`. Firebase Rules menyediakan fungsi `.validate` yang bisa memastikan tipe data yang masuk sesuai. Untuk jadwal buka/tutup, kita bisa menggunakan validasi berbasis `now` (waktu server Firebase) atau cukup membiarkannya diamankan dengan *Security Rules* ketat (hanya Admin yang bisa mengubah status antrian menjadi "closed" di database, lalu Rules menolak tulisan (*write*) bila status "closed").

---

## 🛠️ Kesimpulan & Rekomendasi Tindakan

Jika aplikasi ini digunakan secara publik (dan menyangkut instansi sekolah), celah di atas berpotensi menimbulkan kekacauan saat pendaftaran membludak atau jika ada siswa/pihak iseng yang mengutak-atik sistem.

**Apakah Anda ingin saya membuat "Implementation Plan" (Rencana Implementasi) untuk: Menutup celah Firebase Rules dan mengimplementasikan sistem Login Admin (Firebase Auth) yang anti-bobol sekarang juga?**
