# KARTU BERBURU POIN: NUMBER JUMP ADVENTURE

**Created by: Widodo Guru SD**  
Ambil Kartunya, Pecahkan Soalnya, Lompat Menuju Kemenangan!

Game platformer edukasi kelas 2 SD. Lima dunia, masing-masing sepuluh misi, dengan Number Bot orisinal putih-emas. Aset ilustrasi, model prosedural 3D, font, audio sintesis, dan pustaka QR disajikan secara lokal.

## Menjalankan

1. Gunakan Node.js 22 atau lebih baru serta PostgreSQL. Atur `DATABASE_URL` di `.env` ke database lokal.
2. Pasang dependensi dengan `npm install`.
3. Terapkan skema dengan `npx drizzle-kit push`.
4. Jalankan `npm run dev` lalu buka `http://localhost:3000`. Untuk produksi: `npm run build` lalu `npm start`.
5. Di lingkungan preview terkelola, database dan server sudah disiapkan. Cukup buka Beranda.

## Petualangan pertama

- Pilih **Mulai Petualangan**, isi nama panggilan, pilih warna robot, lalu **Mulai Bermain**. Profil tamu juga dapat digunakan tanpa login.
- Ambil kartu fisik dari tumpukan. Tidak perlu memilih semua jenis kartu untuk satu soal.
- WASD/panah: bergerak. Shift: lari. Spasi: lompat; tekan kembali untuk lompatan ganda jika diaktifkan. E: berinteraksi. Esc: jeda. Pada layar sentuh gunakan joystick, tombol lompat, dan interaksi.
- Ikuti penanda angka. Kumpulkan bintang, jawab tantangan kartu di gerbang, lalu masuk ke portal. Target bintang tercantum di bawah arena.
- Checkpoint menyimpan posisi aman. Jatuh tidak menghapus poin. Tutup dan buka kembali misi untuk melanjutkan dari checkpoint.

## Scanner dan input manual

1. Tekan **Scan Kartu** di lobi atau arena. Izinkan kamera. Gunakan HTTPS atau localhost; kamera HP biasanya tidak aktif pada alamat IP jaringan biasa dengan HTTP.
2. Arahkan QR kartu ke bingkai. Setelah satu kartu terbaca, kamera berhenti. Singkirkan kartu lama, tekan **Scan berikutnya**, lalu tunjukkan kartu baru. QR yang terus berada dalam bingkai tidak ditambahkan berulang.
3. **Foto QR** membaca foto kartu jika kamera langsung tidak tersedia. Foto diproses di perangkat, tidak dikirim ke server.
4. Alternatif: **Input Manual** → jenis kartu → nilai yang tertera di kartu fisik → **Tambahkan Kartu**. Tombol × menghapus kartu dari kombinasi.
5. Gunakan dua kartu angka dengan operasi opsional, atau satu kartu angka dengan persetujuan penggunaan angka pendamping. Tekan **Konfirmasi & Buat Soal**. Kombinasi yang tidak sesuai diberi penjelasan, bukan diubah nilainya.
6. Pilih/ketik jawaban dan periksa. Salah memberi petunjuk; benar mengaktifkan jembatan dan menambah poin.

## Aturan hadiah

Bawaan: benar +10, Energy Star +5, koin +1, misi +20, dunia +50. Hadiah penyelesaian tidak dapat diulang. Bintang fisik memberi tiga pilihan: +10 poin, enam platform aman, atau satu kali mengacak tumpukan fisik. Tiga kesempatan berlaku **per pemain untuk kelima dunia**. Setelah habis, Bintang mengarahkan pengacakan satu kali. Maju aman tidak melompati gerbang matematika yang masih terkunci. Zonk tidak pernah mengurangi poin. Pengacakan tetap dilakukan pada tumpukan fisik oleh pemain, bukan mengganti nilai kartu di layar.

## Ruang Guru dan kartu cetak

Buka **Ruang Guru → Masuk Ruang Guru**. Area pendamping dipisahkan dari permainan tanpa akun atau kata sandi. Ini bukan sistem autentikasi untuk perangkat publik.

- **Siswa**: tambah, edit, hapus, lihat progres dunia, riwayat sesi misi dan pengulangan, riwayat kartu QR/manual, riwayat soal, dan ekspor CSV. Reset/hapus memerlukan konfirmasi.
- **Aturan Belajar**: rentang angka, tingkat kesulitan, mode jawaban, timer pendamping, operasi campuran, efek Zonk, dan poin.
- **Generator QR**: pilih jenis dan nilai kartu. QR dihasilkan otomatis. Unduh PNG kartu lengkap, tambahkan ke lembar cetak, atau pilih paket 59 kartu. Cetak A4 potret pada skala 100%. Ada 9 kartu berukuran 60 × 85 mm per halaman dengan margin 10 mm. QR memiliki quiet zone empat modul.
- **Cadangan**: unduh JSON dan pulihkan dengan konfirmasi sebelum mengganti data.

## Penyimpanan & penggunaan offline

Data per profil mencakup poin, Bintang tersisa, kartu masukan, soal, jawaban, checkpoint, koleksi tiap misi, misi selesai, dan pengaturan kelas. Data utama berada di LocalStorage (`number-jump.classroom.v1`). Snapshot disinkronkan ke tabel PostgreSQL `adventure_classrooms` melalui Drizzle menggunakan identitas acak perangkat; tidak ada daftar kelas publik. Salinan server melindungi simpanan jika data progres lokal rusak, selama identitas perangkat tetap tersedia. Untuk berpindah perangkat gunakan ekspor/pulihkan JSON.

Service worker mengunduh antarmuka, seluruh modul permainan, font, dan ilustrasi lokal pada kunjungan pertama. Tunggu pemuatan awal selesai sebelum memutus koneksi. Jika WebGL tidak didukung, renderer isometrik ringan menggunakan simulasi gerak, soal, dan hadiah yang sama. Musik dimatikan secara bawaan dan memerlukan interaksi pertama karena kebijakan browser.

## Pengujian

- `npx tsx --test tests/game.test.ts`: QR penuh untuk semua 59 payload, validasi soal, hadiah idempoten, bonus per pemain, pergerakan, checkpoint, dan pemulihan simpanan.
- `npx next typegen`, `npm exec tsc -- --noEmit --pretty false`, `npm run build`.
- Uji browser menggunakan `node tests/browser.mjs` saat server lokal berjalan. Hasil uji kamera memakai masukan QR terkontrol; izin dan fokus kamera fisik tetap perlu dicoba pada perangkat kelas.

## Struktur

`src/game`: simulasi, renderer Three.js, fallback isometrik.  
`src/lib/game.ts`: model data, katalog, generator soal, dan aturan hadiah.  
`src/lib/store.tsx`: profil, simpanan lokal, sinkronisasi.  
`src/components`: lobi, arena, stasiun kartu, pengaturan, ruang guru, dan generator QR.  
`src/app/api`: health check dan API progres perangkat.  
`public/art`: ilustrasi dan avatar lokal.
