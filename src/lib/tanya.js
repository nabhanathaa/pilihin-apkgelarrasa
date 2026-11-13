// "Tanya Pilah": asisten berbasis ATURAN dan basis data panduan di aplikasi ini.
// Bukan AI generatif dan tidak mengirim pertanyaan ke server mana pun.
import { BARANG } from '../data/barang';
import { KATEGORI, URUTAN } from '../data/kategori';
import { hargaJenis } from './hitung';
import { rupiah } from './format';

const SINONIM = { glass: ['kaca', 'beling'], paper: ['kertas'], electronic: ['elektronik', 'e-waste', 'ewaste'], metal: ['logam', 'besi', 'aluminium'], plastic: ['plastik'], cardboard: ['kardus', 'karton'], textile: ['tekstil', 'kain', 'pakaian', 'baju'], foodwaste: ['sisa makanan', 'organik', 'makanan'] };
const kata = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length >= 3);

function cariKategori(q) {
  for (const k of URUTAN) if (SINONIM[k].some((s) => q.includes(s))) return k;
  return null;
}
function cariBarangTerdekat(q) {
  const w = new Set(kata(q));
  let terbaik = null, skor = 0;
  for (const [nama, kategori, catatan] of BARANG) {
    const s = kata(nama).filter((x) => w.has(x)).length;
    if (s > skor) { skor = s; terbaik = { nama, kategori, catatan }; }
  }
  return terbaik;
}
const daftarHarga = (state, k) => KATEGORI[k].jenis.map((j) => `${j.nama}: ${hargaJenis(state, j.id) ? rupiah(hargaJenis(state, j.id)) + ' per kg' : 'tanpa harga'}`).join('\n');

export function jawab(teks, state) {
  const q = teks.toLowerCase().trim();
  if (!q) return { teks: 'Tulis nama barang atau pertanyaan Anda.' };
  if (/^(halo|hai|hi|pagi|siang|sore|malam|assalam)/.test(q)) return { teks: 'Halo! Sebutkan nama barang, misalnya "botol sampo" atau "baterai bekas", dan saya tunjukkan kategori serta cara menanganinya.' };
  const k = cariKategori(q);
  const b = cariBarangTerdekat(q);

  if (/harga|berapa|laku/.test(q)) {
    const kat = b?.kategori || k;
    if (kat) return { teks: `Harga beli ${KATEGORI[kat].nama} saat ini:\n${daftarHarga(state, kat)}`, tautan: { label: 'Lihat semua harga', to: '/harga' } };
    return { teks: 'Harga berbeda untuk tiap jenis. Buka daftar harga untuk melihat semuanya.', tautan: { label: 'Daftar harga', to: '/harga' } };
  }
  if (/jemput|ambil ke rumah|diambil/.test(q)) return { teks: 'Anda bisa meminta sampah terpilah dijemput. Isi alamat, pilih hari dan waktu, lalu petugas menjadwalkan dan Anda menerima notifikasi tiap tahapnya.', tautan: { label: 'Buka penjemputan', to: '/jemput' } };
  if (/tarik|cair|ambil uang|saldo|tabungan/.test(q)) return { teks: 'Saldo bertambah setiap setoran dicatat. Untuk mengambilnya, ajukan tarik saldo dari Beranda. Pengelola menyetujui, lalu uang diambil di bank sampah.', tautan: { label: 'Ke Beranda', to: '/' } };
  if (/poin|hadiah|tukar|level|tingkat/.test(q)) return { teks: `Setiap 1 kg setoran memberi ${state.unit.poinPerKg} poin, termasuk sampah yang tidak berharga jual seperti organik. Poin ditukar dengan hadiah di katalog.`, tautan: { label: 'Poin & hadiah', to: '/hadiah' } };
  if (/cara setor|menabung|nabung|daftar|setor/.test(q)) return { teks: 'Caranya: pilah sampah di rumah menurut kategori, bawa ke bank sampah atau minta jemput, petugas memotret dan menimbang tiap jenis, lalu nilai setoran masuk ke tabungan Anda beserta poinnya.' };

  if (b) {
    const kat = KATEGORI[b.kategori];
    return { teks: `${b.nama} termasuk kategori ${kat.nama} (${kat.jalur}).\n${b.catatan}\nPerhatian: ${kat.jangan}`, tautan: { label: `Panduan ${kat.nama}`, to: '/panduan?k=' + b.kategori } };
  }
  if (k) {
    const kat = KATEGORI[k];
    return { teks: `${kat.nama}: ${kat.jalurDetail}\n${kat.langkah.map((l, i) => `${i + 1}. ${l}`).join('\n')}\nPerhatian: ${kat.jangan}`, tautan: { label: 'Daftar harga', to: '/harga' } };
  }
  return { teks: 'Saya belum punya jawabannya. Saya hanya mengenali barang dan topik yang ada di panduan aplikasi ini. Coba sebut nama barangnya, atau tanyakan soal harga, jemput, tarik saldo, dan poin.' };
}
export const CONTOH_TANYA = ['Botol sampo masuk mana?', 'Harga kardus berapa?', 'Baterai bekas dibuang ke mana?', 'Cara minta jemput', 'Poin dapat dari mana?'];
