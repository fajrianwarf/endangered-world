# Endangered World

Proyek website edukasi hewan terancam punah.

## Cara menjalankan

Karena data dibaca menggunakan `fetch("data/animals.json")`, jangan membuka `index.html`
langsung dengan `file://`.

Gunakan salah satu:

### VS Code Live Server
1. Buka folder proyek di VS Code.
2. Jalankan `index.html` dengan **Open with Live Server**.

### Python
```bash
python -m http.server 8000
```

Kemudian buka `http://localhost:8000`.

## Catatan email

Website tanpa backend tidak bisa mengirim email diam-diam secara langsung.
Saat form disubmit, JavaScript membuat URL `mailto:` dan membuka aplikasi email pengguna.
Subject dan body sudah diisi otomatis, tetapi pengguna tetap perlu menekan tombol **Send/Kirim**.

## Catatan media

Media online membutuhkan koneksi internet. Beberapa video berasal dari Wikimedia Commons.
Lisensi dan kredit ditampilkan pada detail hewan melalui data JSON.


## Production deployment note

Tampilan dan copy pada halaman publik sudah dibuat sebagai website final, bukan dokumentasi template.
Untuk deployment statis, jalankan melalui web server/hosting agar `fetch()` dapat membaca `data/animals.json`.

Form saat ini menggunakan `mailto:` sesuai kebutuhan proyek. Untuk pengiriman tanpa membuka aplikasi email
pengguna, sambungkan form ke backend atau layanan form/email sebelum deployment publik.


## Media-ready directory

Versi ini memfilter direktori agar hanya menampilkan hewan yang memiliki **video dan audio**.
Saat ini: Harimau Sumatra, Bekantan, Gorila Gunung, dan Panda Merah.
Logika JavaScript juga melakukan filter defensif berdasarkan `video.available`, `video.url`,
`audio.available`, dan `audio.url`.
