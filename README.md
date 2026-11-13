# Pilahin

Bank sampah digital dengan pemilah berbasis AI yang berjalan di perangkat. Petugas memotret dan menimbang,
aplikasi menghitung sisanya: nilai setoran, saldo tabungan, poin, stok gudang, notifikasi, dan laporan bulanan.
Tampilan dirancang untuk HP; di layar lebar aplikasi tampil dalam bingkai HP.

Dibangun dengan Vite, React (JavaScript), React Router (HashRouter), onnxruntime-web, IndexedDB, dan PWA
(bisa dipasang ke layar utama dan dipakai luring).

## Tiga peran

| Peran | Yang dikerjakan |
|---|---|
| Pengelola | Semua menu petugas, ditambah menyetujui tarik saldo, mengatur harga, target, poin, hadiah, pengguna, dan data |
| Petugas | Setoran (pindai dan timbang), nasabah, penjemputan, gudang dan penjualan, menyerahkan hadiah |
| Nasabah | Saldo dan poin, cek sampah lewat kamera, minta jemput, tarik saldo, tukar poin, kuis, Tanya Pilah |

Di layar masuk ada tiga tombol akun demo (sandi `demo1234`). Akun demo memuat **data contoh** yang diberi tanda
dan bisa dihapus dari Pengaturan. Akun yang didaftarkan sendiri mulai dari data kosong.

## Fitur

- **Setoran otomatis**: pilih nasabah, pindai foto tiap jenis sampah, isi berat, simpan. Saldo, poin, stok gudang,
  struk digital (bagikan atau cetak/PDF), dan notifikasi ke nasabah dibuat otomatis.
- **Pemindai AI di perangkat**: kamera layar penuh, tahapan pemindaian, gauge keyakinan, tiga dugaan teratas.
  Bila keyakinan di bawah ambang, aplikasi menandai "perlu dicek" dan petugas memilih kategori. Tanpa model,
  pemindai masuk mode manual (tidak ada tebakan palsu).
- **Dua arah**: nasabah meminta jemput (alamat, jadwal, titik GPS opsional), petugas menjadwalkan, berangkat,
  lalu menimbang. Nasabah mengajukan tarik saldo, pengelola menyetujui. Kedua pihak menerima notifikasi.
  Tab lain pada browser yang sama ikut diperbarui langsung, jadi alur ini bisa dicoba dengan dua tab.
- **Gudang**: stok per kategori dan jenis dihitung dari setoran dikurangi penjualan; peringatan "siap jual"
  saat melewati ambang; pencatatan penjualan ke pengepul beserta selisih terhadap harga beli.
- **Poin, tingkat, hadiah, papan peringkat**: poin per kg, bonus kuis, katalog hadiah yang bisa diatur, kode penukaran.
- **Analitik dan laporan**: tren harian, komposisi, proporsi dengan selang kepercayaan Wilson, nasabah teraktif,
  akurasi lapangan model dari koreksi petugas, laporan bulanan siap cetak/PDF dan CSV.
- **Panduan, kuis, Tanya Pilah**: Tanya Pilah adalah asisten berbasis aturan dan basis data panduan di aplikasi
  (bukan AI generatif, tidak mengirim pertanyaan ke server).
- **Pengaturan**: tema terang/gelap, ambang keyakinan, target bulanan, poin per kg, ambang siap jual,
  cadangan dan pemulihan data, pasang ke layar utama.

## Menjalankan

Butuh Node 20 atau lebih baru.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # hasil di dist/
npm run preview
```

Tanpa model, pemindai bekerja dalam mode manual. Model dipasang lewat langkah di bawah.

## Memasang model

1. Selesaikan dan kumpulkan dulu submission kompetisi. Skrip ini terpisah dari notebook kompetisi.
2. Di Kaggle, buat notebook baru (GPU T4), tambahkan dataset kompetisi dan satu dataset berisi keluaran v4.1
   (`pseudo_label_train_r2.csv`, `oof_convnext_base_r2.npy`, `oof_tf_efficientnetv2_m_r2.npy`).
3. Unggah `ml/train_export.py`, lalu jalankan perintah pada komentar di bagian atas skrip (sekitar 10 sampai 15 menit).
4. Unduh `pilahin.onnx` dan `labels.json` dari folder `model`, simpan ke `public/models/`, lalu commit dan push.

Skrip melatih EfficientNet-B0 dari probabilitas guru (ensemble v4.1) dan label akhir, mengukur kesesuaian pada 15% gambar yang
ditahan, melatih ulang pada semua gambar, mengekspor ONNX, dan memverifikasi keluarannya sama dengan PyTorch.
Angka kesesuaian itu ditampilkan di menu Tentang Model; angka itu bukan akurasi lapangan.

## Deploy ke GitHub Pages

1. Buat repo di GitHub dan push seluruh isi folder ini ke branch `main`.
2. Di repo: **Settings, Pages, Build and deployment, Source: GitHub Actions**.
3. Setiap push ke `main` menjalankan `.github/workflows/deploy.yml`. Situs terbit di `https://<user>.github.io/<nama-repo>/`.

`VITE_BASE` diisi otomatis dengan `/<nama-repo>/`. Aplikasi memakai HashRouter sehingga tidak butuh pengaturan rute di server.

## Struktur

```
src/pages/        Masuk, Beranda, Setor, Pindai, Riwayat, Analitik, Nasabah, NasabahDetail, Jemput, Gudang,
                  Harga, Hadiah, Notifikasi, Panduan, Kuis, Laporan, Akun, Pengaturan, Tentang
src/components/   ui (sheet, toast, grafik), Pemindai (kamera + klasifikasi), Struk
src/lib/          store (state, akun, aksi, sinkron antartab), hitung (saldo, poin, stok, Wilson),
                  classifier (ONNX), demo (data contoh), tanya (asisten aturan), format, image, pasang
src/data/         kategori (8 kelas, jenis dan harga bawaan), barang (pencarian dan kuis), hadiah, status
ml/train_export.py  pelatihan dan ekspor model
public/models/    pilahin.onnx dan labels.json (ditambahkan sendiri)
```

## Catatan jujur

- Belum ada server. Akun, peran, sesi, dan notifikasi berjalan di perangkat (IndexedDB). Sinkron hanya antartab
  pada browser yang sama; sinkron antarperangkat butuh backend dan termasuk pengembangan lanjutan.
- Kata sandi disimpan sebagai hash sederhana di perangkat. Ini bukan pengamanan tingkat server.
- Model dilatih dari foto pada data kompetisi dengan label semu dan belum diuji pada foto lapangan.
  Model hanya menebak kategori; jenis (varian harga) dan berat ditentukan petugas.
- Satu benda per foto. Foto tumpukan campur belum didukung.
- Harga bawaan, katalog hadiah, dan data akun demo hanyalah contoh; sesuaikan dengan kondisi setempat.
- Gunakan menu cadangan secara berkala karena data tersimpan di browser perangkat.
