// Delapan kategori mengikuti kelas pada model. Model hanya menebak kategori; jenis (varian harga) dipilih petugas.
// Harga bawaan hanyalah perkiraan awal: sesuaikan dengan daftar harga bank sampah setempat di menu Daftar Harga.
import { GlassWater, Newspaper, Cpu, Wrench, CupSoda, Package, Shirt, Apple } from 'lucide-react';

export const KATEGORI = {
  glass: {
    id: 'glass', nama: 'Kaca', en: 'glass', warna: '#06b6d4', Ikon: GlassWater,
    jalur: 'Jual', jalurDetail: 'Dijual ke bank sampah atau pengepul sebagai beling dan botol kaca.',
    harga: 500,
    jenis: [{ id: 'kc-botol', nama: 'Botol dan toples utuh', harga: 500 }, { id: 'kc-beling', nama: 'Beling pecahan', harga: 200 }],
    langkah: ['Bilas dan lepaskan tutup logam atau plastik.', 'Pisahkan botol utuh dari pecahan.', 'Bungkus pecahan dengan kardus atau kertas tebal dan beri tanda agar petugas tidak terluka.'],
    jangan: 'Jangan campur dengan kaca tahan panas, cermin, atau lampu karena titik leburnya berbeda.',
    contoh: ['Botol sirup', 'Toples', 'Botol saus', 'Pecahan beling'],
  },
  paper: {
    id: 'paper', nama: 'Kertas', en: 'paper', warna: '#f59e0b', Ikon: Newspaper,
    jalur: 'Jual', jalurDetail: 'Dijual per kilogram sebagai kertas campur, HVS, atau koran.',
    harga: 1500,
    jenis: [{ id: 'kt-hvs', nama: 'HVS putih', harga: 2000 }, { id: 'kt-koran', nama: 'Koran', harga: 1500 }, { id: 'kt-campur', nama: 'Kertas campur dan buku', harga: 1000 }],
    langkah: ['Jaga tetap kering dan bersih.', 'Lepaskan klip, staples besar, dan plastik pembungkus.', 'Ikat atau tumpuk rapi agar mudah ditimbang.'],
    jangan: 'Kertas berminyak, tisu bekas, dan kertas termal (struk) biasanya tidak laku.',
    contoh: ['Koran', 'Kertas HVS', 'Majalah', 'Buku bekas'],
  },
  electronic: {
    id: 'electronic', nama: 'Elektronik', en: 'electronic', warna: '#8b5cf6', Ikon: Cpu,
    jalur: 'Limbah B3', jalurDetail: 'Limbah elektronik termasuk bahan berbahaya dan beracun. Serahkan ke titik kumpul atau pengelola e-waste.',
    harga: 0,
    jenis: [{ id: 'el-campur', nama: 'Elektronik campur (titip)', harga: 0 }, { id: 'el-kabel', nama: 'Kabel', harga: 4000 }],
    langkah: ['Jangan dibongkar sendiri.', 'Lepaskan baterai dan simpan terpisah dalam wadah kering.', 'Kumpulkan di tempat tertutup sampai diserahkan ke pengelola resmi.'],
    jangan: 'Jangan dibuang ke tempat sampah biasa atau dibakar.',
    contoh: ['Charger', 'Kabel', 'Ponsel rusak', 'Baterai', 'Lampu'],
  },
  metal: {
    id: 'metal', nama: 'Logam', en: 'metal', warna: '#64748b', Ikon: Wrench,
    jalur: 'Jual', jalurDetail: 'Dijual sebagai kaleng, besi, atau aluminium. Aluminium biasanya lebih mahal.',
    harga: 3000,
    jenis: [{ id: 'lg-alu', nama: 'Aluminium (kaleng minuman)', harga: 10000 }, { id: 'lg-besi', nama: 'Besi', harga: 3000 }, { id: 'lg-kaleng', nama: 'Kaleng campur', harga: 1500 }],
    langkah: ['Bilas kaleng makanan dan minuman.', 'Pipihkan kaleng untuk menghemat tempat.', 'Pisahkan aluminium dari besi bila memungkinkan (uji dengan magnet).'],
    jangan: 'Kaleng aerosol atau gas yang belum kosong berbahaya dan harus dipisahkan.',
    contoh: ['Kaleng minuman', 'Kaleng sarden', 'Kawat', 'Panci rusak'],
  },
  plastic: {
    id: 'plastic', nama: 'Plastik', en: 'plastic', warna: '#3b82f6', Ikon: CupSoda,
    jalur: 'Jual / TPS3R', jalurDetail: 'Botol dan gelas bersih dijual. Plastik tipis dan sachet dikumpulkan terpisah untuk TPS3R atau kerajinan.',
    harga: 2000,
    jenis: [{ id: 'pl-pet', nama: 'Botol PET bening', harga: 3000 }, { id: 'pl-gelas', nama: 'Gelas plastik', harga: 2500 }, { id: 'pl-keras', nama: 'Plastik keras (ember, galon)', harga: 2000 }, { id: 'pl-kresek', nama: 'Kresek dan kemasan lunak', harga: 500 }],
    langkah: ['Bilas sampai bersih dan keringkan.', 'Lepaskan tutup dan label bila bisa, lalu tekan agar pipih.', 'Pisahkan botol dan gelas keras dari kantong dan sachet.'],
    jangan: 'Plastik kotor berminyak menurunkan nilai seluruh tumpukan.',
    contoh: ['Botol minum', 'Gelas plastik', 'Kantong kresek', 'Sachet'],
  },
  cardboard: {
    id: 'cardboard', nama: 'Kardus', en: 'cardboard', warna: '#b45309', Ikon: Package,
    jalur: 'Jual', jalurDetail: 'Dijual per kilogram. Kemasan karton (misalnya susu UHT) dan kardus bergelombang termasuk kategori ini pada data pelatihan.',
    harga: 2000,
    jenis: [{ id: 'kd-kardus', nama: 'Kardus cokelat', harga: 1800 }, { id: 'kd-karton', nama: 'Karton dan duplex', harga: 800 }],
    langkah: ['Lepaskan lakban dan staples.', 'Ratakan atau lipat agar hemat ruang.', 'Simpan di tempat kering karena kardus basah turun nilainya.'],
    jangan: 'Kardus bekas makanan berminyak (misalnya pizza) sebaiknya dipisah.',
    contoh: ['Kardus mi instan', 'Kotak sepatu', 'Karton telur', 'Kemasan karton'],
  },
  textile: {
    id: 'textile', nama: 'Tekstil', en: 'textile', warna: '#ec4899', Ikon: Shirt,
    jalur: 'Pakai ulang', jalurDetail: 'Pakaian layak didonasikan. Kain perca dipakai ulang sebagai lap atau kerajinan.',
    harga: 500,
    jenis: [{ id: 'tk-layak', nama: 'Pakaian layak pakai', harga: 1000 }, { id: 'tk-perca', nama: 'Kain perca', harga: 300 }],
    langkah: ['Pisahkan yang masih layak pakai untuk donasi.', 'Pisahkan yang basah atau berjamur.', 'Kain perca dikumpulkan untuk lap, pengisi, atau kerajinan.'],
    jangan: 'Pakaian basah dan berjamur tidak boleh ditumpuk bersama kategori lain.',
    contoh: ['Baju bekas', 'Kain perca', 'Handuk', 'Seprai'],
  },
  foodwaste: {
    id: 'foodwaste', nama: 'Sisa makanan', en: 'foodwaste', warna: '#22c55e', Ikon: Apple,
    jalur: 'Kompos', jalurDetail: 'Diolah menjadi kompos, pakan maggot BSF, atau dimasukkan ke lubang biopori.',
    harga: 0,
    jenis: [{ id: 'sm-organik', nama: 'Organik untuk kompos', harga: 0 }],
    langkah: ['Pisahkan dari kemasan plastik dan kertas.', 'Tiriskan cairan berlebih.', 'Olah segera atau simpan tertutup agar tidak berbau.'],
    jangan: 'Minyak jelantah dalam jumlah banyak dan tulang besar sebaiknya tidak ikut dikomposkan.',
    contoh: ['Kulit buah', 'Nasi sisa', 'Sayur layu', 'Ampas kopi'],
  },
};

// urutan tampilan (bukan urutan keluaran model; urutan model ada di public/models/labels.json)
export const URUTAN = ['plastic', 'cardboard', 'paper', 'glass', 'metal', 'foodwaste', 'textile', 'electronic'];
export const daftarKategori = () => URUTAN.map((k) => KATEGORI[k]);
// peta jenis -> {id, nama, harga, kategori}
export const JENIS = Object.fromEntries(URUTAN.flatMap((k) => KATEGORI[k].jenis.map((j) => [j.id, { ...j, kategori: k }])));
export const jenisBawaan = (k) => KATEGORI[k].jenis[0].id;
export const hargaBawaan = () => Object.fromEntries(Object.values(JENIS).map((j) => [j.id, j.harga]));
