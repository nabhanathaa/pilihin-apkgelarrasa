// DATA CONTOH untuk akun demo. Semua catatan diberi tanda demo: true dan bisa dihapus dari Pengaturan.
// Nama dan angka di sini rekaan, hanya untuk memperlihatkan alur aplikasi. Item bertanda sumber 'contoh',
// sehingga tidak ikut dihitung sebagai tebakan model pada akurasi lapangan.
import { KATEGORI, JENIS } from '../data/kategori';

function acak(seed) { // mulberry32
  let a = seed;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const H = 86400000;

export function dataDemo(poinPerKg = 10) {
  const r = acak(2026);
  const kini = Date.now();
  const tgl = (geser) => new Date(kini + geser * H).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  const w1 = `${tgl(1)}, pagi (08.00 sampai 10.00)`, w2 = `${tgl(0)}, sore (15.00 sampai 17.00)`;
  const nasabah = [
    ['n-demo-1', 'Sari Lestari', '0812-0000-0001', 'Gang Melati No. 4, RT 02'],
    ['n-demo-2', 'Budi Santoso', '0812-0000-0002', 'Jalan Kenanga No. 11, RT 03'],
    ['n-demo-3', 'Wati Handayani', '0812-0000-0003', 'Gang Anggrek No. 7, RT 01'],
    ['n-demo-4', 'Agus Setiawan', '0812-0000-0004', 'Jalan Mawar No. 21, RT 04'],
    ['n-demo-5', 'Lina Marlina', '0812-0000-0005', 'Gang Dahlia No. 2, RT 02'],
    ['n-demo-6', 'Joko Susilo', '0812-0000-0006', 'Jalan Cempaka No. 15, RT 05'],
  ].map(([id, nama, hp, alamat], i) => ({ id, nama, hp, alamat, noAnggota: 'PLH-' + String(i + 1).padStart(4, '0'), sejak: kini - (70 - i * 6) * H, demo: true }));

  const bobot = [['pl-pet', 5], ['pl-gelas', 3], ['pl-keras', 2], ['pl-kresek', 2], ['kd-kardus', 6], ['kd-karton', 2], ['kt-hvs', 2], ['kt-koran', 3], ['kt-campur', 3], ['kc-botol', 3], ['kc-beling', 1], ['lg-alu', 1], ['lg-besi', 2], ['lg-kaleng', 2], ['sm-organik', 3], ['tk-layak', 1], ['tk-perca', 1], ['el-kabel', 1]];
  const total = bobot.reduce((a, b) => a + b[1], 0);
  const pilih = () => { let x = r() * total; for (const [id, w] of bobot) { x -= w; if (x <= 0) return id; } return 'pl-pet'; };

  const setoran = [];
  for (let i = 0; i < 30; i++) {
    const hariLalu = i < 4 ? 0 : Math.floor(r() * 32) + (i < 9 ? 1 : 3);
    const ts = kini - hariLalu * H - Math.floor(r() * 5 * 3600e3) - (hariLalu === 0 ? i * 9 * 60e3 : 0);
    const n = nasabah[Math.floor(r() * (i < 4 ? 3 : 6))];
    const items = Array.from({ length: 1 + Math.floor(r() * 3) }, (_, j) => {
      const jenis = pilih();
      const berat = Math.round((0.4 + r() * 5.2) * 10) / 10;
      const harga = JENIS[jenis].harga;
      return { id: `it-demo-${i}-${j}`, kategori: JENIS[jenis].kategori, jenis, berat, harga, nilai: Math.round(berat * harga), prediksi: null, conf: null, sumber: 'contoh', dikoreksi: false, foto: null };
    });
    const berat = Math.round(items.reduce((a, b) => a + b.berat, 0) * 10) / 10;
    setoran.push({ id: 'st-demo-' + i, ts, nasabahId: n.id, petugasId: 'demo-petugas', petugasNama: 'Dimas Pratama', items, berat, total: items.reduce((a, b) => a + b.nilai, 0), poin: Math.round(berat * poinPerKg), catatan: '', demo: true });
  }
  setoran.sort((a, b) => b.ts - a.ts);

  const penarikan = [
    { id: 'tr-demo-1', ts: kini - 9 * H, nasabahId: 'n-demo-2', jumlah: 15000, status: 'disetujui', catatan: 'Tunai', tsProses: kini - 9 * H + 3600e3, demo: true },
    { id: 'tr-demo-2', ts: kini - 2 * 3600e3, nasabahId: 'n-demo-3', jumlah: 10000, status: 'diajukan', catatan: 'Untuk beli beras', tsProses: null, demo: true },
  ];
  const jemput = [
    { id: 'jp-demo-1', ts: kini - 3 * 3600e3, nasabahId: 'n-demo-4', alamat: nasabah[3].alamat, waktu: w1, perkiraan: ['cardboard', 'plastic'], catatan: 'Kardus bekas pindahan, kira-kira 3 ikat.', lokasi: null, status: 'diajukan', petugasNama: '', riwayat: [{ ts: kini - 3 * 3600e3, status: 'diajukan' }], demo: true },
    { id: 'jp-demo-2', ts: kini - 26 * 3600e3, nasabahId: 'n-demo-1', alamat: nasabah[0].alamat, waktu: w2, perkiraan: ['plastic', 'glass'], catatan: 'Botol plastik dan beberapa botol kaca.', lokasi: null, status: 'dijadwalkan', petugasNama: 'Dimas Pratama', riwayat: [{ ts: kini - 26 * 3600e3, status: 'diajukan' }, { ts: kini - 20 * 3600e3, status: 'dijadwalkan' }], demo: true },
  ];
  const penjualan = [
    { id: 'jl-demo-1', ts: kini - 12 * H, jenis: 'kd-kardus', berat: 18, hargaJual: 2300, total: 41400, pembeli: 'Pengepul langganan', demo: true },
    { id: 'jl-demo-2', ts: kini - 12 * H, jenis: 'pl-pet', berat: 9, hargaJual: 3800, total: 34200, pembeli: 'Pengepul langganan', demo: true },
  ];
  const notif = [
    { id: 'nt-demo-1', ts: kini - 3 * 3600e3, untuk: 'staf', jenis: 'jemput', judul: 'Permintaan jemput baru', isi: `Agus Setiawan meminta penjemputan: ${w1}.`, tautan: '/jemput', dibaca: [], demo: true },
    { id: 'nt-demo-2', ts: kini - 2 * 3600e3, untuk: 'pengelola', jenis: 'tarik', judul: 'Pengajuan tarik saldo', isi: 'Wati Handayani mengajukan penarikan Rp10.000.', tautan: '/nasabah', dibaca: [], demo: true },
    { id: 'nt-demo-3', ts: kini - 20 * 3600e3, untuk: 'n:n-demo-1', jenis: 'jemput', judul: 'Penjemputan dijadwalkan', isi: `Petugas Dimas Pratama akan datang: ${w2}.`, tautan: '/jemput', dibaca: [], demo: true },
  ];
  return { nasabah, setoran, penarikan, jemput, penjualan, notif };
}

export const NAMA_KATEGORI = (k) => KATEGORI[k]?.nama || k;
