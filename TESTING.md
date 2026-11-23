# Pengujian Number Jump Adventure

## Uji aturan dan data

Jalankan `npx tsx --test tests/game.test.ts`. Pengujian memeriksa:

- 5 dunia, 50 misi unik, dan 59 ID kartu kanonis.
- Seluruh 59 kartu dirender sebagai matriks QR lalu benar-benar didekode kembali dengan jsQR.
- Kombinasi angka 0–15 pada kelima dunia, kunci jawaban, tiga pilihan unik, rentang hasil, tanda perbandingan, pembagian bulat, dan penolakan kombinasi yang tidak cocok.
- Jawaban salah tidak mengurangi poin. Jawaban benar, pengambilan bintang, dan penyelesaian misi tidak terhitung ganda.
- Ketiga bonus Bintang bersifat per pemain, tidak kembali saat berpindah dunia, dan Bintang berikutnya memicu pengacakan tumpukan fisik.
- Bonus dunia, pengulangan misi, serta ringkasan hasil per sesi.
- Simulasi jalan, lari, lompat, lompatan ganda, checkpoint, jatuh, gerbang, dan enam langkah aman.
- Validasi backup/restore dan isolasi profil.

## Uji interaksi browser

Saat server produksi berjalan, jalankan `node tests/browser.mjs`. Uji Chrome menggunakan Playwright dan SwiftShader untuk WebGL. Pada mesin baru, pasang browser dengan `npx playwright install --with-deps chromium`.

Alur yang telah dijalankan:

1. Beranda dan lima ilustrasi dunia pada layar desktop; tampilan ponsel 390 × 844 tanpa overflow horizontal.
2. Tambah dan pilih profil, lihat progres tiap dunia, ekspor CSV.
3. Pembuatan kartu PNG, 59 QR unik, dan 7 halaman cetak A4 (9 kartu per halaman terakhir tidak harus penuh).
4. Kamera terkontrol menampilkan QR angka dan operasi. Reader video mendeteksi kartu, menolak pembacaan berulang, lalu menghentikan track kamera.
5. Input manual melengkapi kombinasi kartu fisik. Jawaban salah memunculkan petunjuk, lalu jawaban benar menambah poin tepat sekali.
6. Kartu Bintang dan Zonk, penyimpanan setelah refresh, dan sinkronisasi snapshot PostgreSQL.
7. Robot bergerak dengan input keyboard asli di arena WebGL, berlari, melompat, dan melakukan double jump. Uji jeda dan kembali ke checkpoint.
8. Satu misi dimainkan dari awal sampai portal menggunakan kontrol gerak: mengambil bintang, mencapai checkpoint, memecahkan soal kartu, mengaktifkan gerbang, memperoleh hasil, dan membuka misi kedua.
9. Katalog menampilkan kartu yang benar-benar ditemukan oleh pemain.
10. Memutus jaringan dan membuka kembali aplikasi dari service worker dengan progres tetap tersedia.
11. Kontrol sentuh dan mode isometrik tetap dapat dimainkan saat WebGL dinonaktifkan.

## Batas pengujian

Uji kamera menggunakan aliran video QR terkontrol, bukan kamera fisik siswa. Kualitas cetakan, pantulan cahaya, fokus kamera, dan dialog izin Android bergantung pada perangkat. Sebelum penggunaan kelas, cetak satu kartu, buka aplikasi melalui HTTPS pada perangkat kelas, dan pindai kartu tersebut. Menutup scanner harus mematikan indikator kamera.

## Validasi produksi

Urutannya: `npx next typegen`, `npm exec tsc -- --noEmit --pretty false`, `npm run build`, lalu validasi startup dan `/api/health` melalui runtime terkelola.
