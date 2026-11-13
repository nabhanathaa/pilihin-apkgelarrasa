// Penyimpanan aplikasi: satu objek state di IndexedDB perangkat. Tidak ada server.
// Akun, peran, dan sesi bersifat lokal (per perangkat). Tab lain pada browser yang sama ikut diperbarui
// lewat BroadcastChannel, sehingga alur dua arah (nasabah dan petugas) bisa dicoba dengan dua tab.
import { createContext, useContext, useEffect, useReducer, useRef, useMemo, useState } from 'react';
import { get, set, del } from 'idb-keyval';
import { hargaBawaan, KATEGORI } from '../data/kategori';
import { HADIAH_BAWAAN } from '../data/hadiah';
import { dataDemo } from './demo';
import { stok, level, totalKg, mulaiBulan, dalam } from './hitung';
import { rupiah, kg } from './format';

const KUNCI = 'pilahin-v2';
const KUNCI_SESI = 'pilahin-sesi';
export const buatId = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Hash sederhana agar kata sandi tidak tersimpan polos di perangkat. Ini BUKAN pengamanan tingkat server.
function cyrb53(str, seed = 7) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
export const sandiHash = (s) => cyrb53('pilahin|' + s).toString(36);

export const SANDI_DEMO = 'demo1234';
export const PERAN = { pengelola: 'Pengelola', petugas: 'Petugas', nasabah: 'Nasabah' };
const akunDemo = () => [
  { id: 'demo-pengelola', nama: 'Rini Wulandari', email: 'pengelola@pilahin.demo', peran: 'pengelola', sandi: sandiHash(SANDI_DEMO), demo: true },
  { id: 'demo-petugas', nama: 'Dimas Pratama', email: 'petugas@pilahin.demo', peran: 'petugas', sandi: sandiHash(SANDI_DEMO), demo: true },
  { id: 'demo-nasabah', nama: 'Sari Lestari', email: 'nasabah@pilahin.demo', peran: 'nasabah', nasabahId: 'n-demo-1', sandi: sandiHash(SANDI_DEMO), demo: true },
];

export const awal = () => ({
  versi: 2,
  demo: false,
  unit: { nama: 'Bank Sampah Saya', alamat: '', targetKg: 300, poinPerKg: 10, ambangJual: 50 },
  pengaturan: { ambang: 0.5, tema: 'auto' },
  harga: hargaBawaan(),
  hadiah: HADIAH_BAWAAN,
  akun: akunDemo(),
  nasabah: [],   // {id, nama, hp, alamat, noAnggota, sejak}
  setoran: [],   // {id, ts, nasabahId, petugasId, petugasNama, items:[{id,kategori,jenis,berat,harga,nilai,prediksi,conf,sumber,dikoreksi,foto}], berat, total, poin, catatan}
  penarikan: [], // {id, ts, nasabahId, jumlah, status:'diajukan'|'disetujui'|'ditolak', catatan, tsProses}
  jemput: [],    // {id, ts, nasabahId, alamat, waktu, perkiraan:[kategori], catatan, lokasi, status, petugasNama, riwayat:[{ts,status}]}
  penjualan: [], // {id, ts, jenis, berat, hargaJual, total, pembeli}
  penukaran: [], // {id, ts, nasabahId, nama, poin, kode, status:'menunggu'|'diserahkan'}
  bonusPoin: [], // {id, ts, nasabahId, poin, alasan}
  notif: [],     // {id, ts, untuk:'staf'|'pengelola'|'n:<nasabahId>', jenis, judul, isi, tautan, dibaca:[akunId]}
  keranjang: null, // sesi setoran berjalan: {nasabahId, jemputId, items:[]}
});

function normal(data) {
  const a = awal();
  const akun = Array.isArray(data.akun) ? [...data.akun] : [];
  for (const d of a.akun) if (!akun.some((x) => x.id === d.id)) akun.push(d);
  const hasil = { ...a, ...data, akun, unit: { ...a.unit, ...(data.unit || {}) }, pengaturan: { ...a.pengaturan, ...(data.pengaturan || {}) }, harga: { ...a.harga, ...(data.harga || {}) } };
  for (const k of ['nasabah', 'setoran', 'penarikan', 'jemput', 'penjualan', 'penukaran', 'bonusPoin', 'notif', 'hadiah']) if (!Array.isArray(hasil[k])) hasil[k] = a[k];
  return hasil;
}

function reducer(s, a) {
  switch (a.type) {
    case 'muat': return normal(a.data);
    case 'ubah': return a.fn(s);
    case 'reset': return awal();
    default: return s;
  }
}

const nt = (untuk, jenis, judul, isi, tautan) => ({ id: buatId('nt-'), ts: Date.now(), untuk, jenis, judul, isi, tautan, dibaca: [] });
const denganNotif = (st, baru) => ({ ...st, notif: [...baru, ...st.notif].slice(0, 120) });
const bulat1 = (n) => Math.round(n * 10) / 10;

function gabungDemo(st) {
  const d = dataDemo(st.unit.poinPerKg);
  const bukan = (l) => l.filter((x) => !x.demo);
  return {
    ...st, demo: true,
    unit: st.unit.nama === 'Bank Sampah Saya' ? { ...st.unit, nama: 'Bank Sampah Pilahin' } : st.unit,
    nasabah: [...bukan(st.nasabah), ...d.nasabah],
    setoran: [...bukan(st.setoran), ...d.setoran].sort((a, b) => b.ts - a.ts),
    penarikan: [...bukan(st.penarikan), ...d.penarikan].sort((a, b) => b.ts - a.ts),
    jemput: [...bukan(st.jemput), ...d.jemput].sort((a, b) => b.ts - a.ts),
    penjualan: [...bukan(st.penjualan), ...d.penjualan].sort((a, b) => b.ts - a.ts),
    notif: [...bukan(st.notif), ...d.notif].sort((a, b) => b.ts - a.ts),
  };
}

const bacaSesi = () => { try { return sessionStorage.getItem(KUNCI_SESI) || localStorage.getItem(KUNCI_SESI) || null; } catch { return null; } };
const tulisSesi = (id, ingat) => {
  try {
    if (id) { sessionStorage.setItem(KUNCI_SESI, id); if (ingat) localStorage.setItem(KUNCI_SESI, id); else localStorage.removeItem(KUNCI_SESI); }
    else { sessionStorage.removeItem(KUNCI_SESI); localStorage.removeItem(KUNCI_SESI); }
  } catch { /* penyimpanan sesi tidak tersedia */ }
};

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, awal);
  const [siap, setSiap] = useState(false);
  const [sesiId, setSesiId] = useState(bacaSesi);
  const ref = useRef(state); ref.current = state;
  const dariLuar = useRef(false);
  const timer = useRef(null);
  const kanal = useRef(null);

  useEffect(() => {
    let batal = false;
    const muat = async () => {
      try {
        const data = await get(KUNCI);
        if (!batal && data) { dariLuar.current = true; dispatch({ type: 'muat', data }); }
      } catch { /* penyimpanan tidak tersedia: aplikasi tetap jalan tanpa persisten */ }
      if (!batal) setSiap(true);
    };
    muat();
    try {
      kanal.current = new BroadcastChannel('pilahin');
      kanal.current.onmessage = () => { get(KUNCI).then((data) => { if (data) { dariLuar.current = true; dispatch({ type: 'muat', data }); } }).catch(() => {}); };
    } catch { /* browser lama tanpa BroadcastChannel */ }
    return () => { batal = true; try { kanal.current?.close(); } catch { /* abaikan */ } };
  }, []);

  useEffect(() => {
    if (!siap) return;
    if (dariLuar.current) { dariLuar.current = false; return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { set(KUNCI, state).then(() => { try { kanal.current?.postMessage('ubah'); } catch { /* abaikan */ } }).catch(() => {}); }, 220);
  }, [state, siap]);

  useEffect(() => {
    const t = state.pengaturan.tema;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const terap = () => {
      const gelap = t === 'gelap' || (t === 'auto' && mq.matches);
      document.documentElement.dataset.tema = gelap ? 'gelap' : 'terang';
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', gelap ? '#07120e' : '#053b2c');
    };
    terap();
    mq.addEventListener?.('change', terap);
    return () => mq.removeEventListener?.('change', terap);
  }, [state.pengaturan.tema]);

  const akun = useMemo(() => state.akun.find((a) => a.id === sesiId) || null, [state.akun, sesiId]);
  const akunRef = useRef(akun); akunRef.current = akun;

  const aksi = useMemo(() => {
    const ubah = (fn) => dispatch({ type: 'ubah', fn });
    const S = () => ref.current;
    const A = () => akunRef.current;
    const namaNasabah = (id) => S().nasabah.find((n) => n.id === id)?.nama || 'Nasabah';
    const mulaiSesi = (id, ingat = true) => { tulisSesi(id, ingat); setSesiId(id); };

    return {
      ubah,
      /* ---------- akun ---------- */
      masuk(email, sandi, ingat) {
        const a = S().akun.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
        if (!a) return { ok: false, pesan: 'Email belum terdaftar di perangkat ini.' };
        if (a.sandi !== sandiHash(sandi)) return { ok: false, pesan: 'Kata sandi tidak cocok.' };
        mulaiSesi(a.id, ingat);
        return { ok: true, akun: a };
      },
      masukDemo(peran) {
        if (!S().demo) ubah(gabungDemo);
        mulaiSesi('demo-' + peran, true);
      },
      daftar({ nama, email, sandi, peran, hp, alamat }) {
        const e = String(email).trim().toLowerCase();
        if (S().akun.some((x) => x.email.toLowerCase() === e)) return { ok: false, pesan: 'Email ini sudah terdaftar. Silakan masuk.' };
        const id = buatId('ak-');
        const baru = { id, nama: nama.trim(), email: e, peran, sandi: sandiHash(sandi) };
        let nasabah = null;
        if (peran === 'nasabah') {
          nasabah = { id: buatId('n-'), nama: nama.trim(), hp: hp || '', alamat: alamat || '', noAnggota: 'PLH-' + String(S().nasabah.length + 1).padStart(4, '0'), sejak: Date.now() };
          baru.nasabahId = nasabah.id;
        }
        ubah((st) => ({ ...st, akun: [...st.akun, baru], nasabah: nasabah ? [...st.nasabah, nasabah] : st.nasabah }));
        mulaiSesi(id, true);
        return { ok: true };
      },
      gantiAkun(id) { mulaiSesi(id, true); },
      keluar() { mulaiSesi(null); },
      hapusAkun(id) { ubah((st) => ({ ...st, akun: st.akun.filter((a) => a.id !== id || a.demo) })); },
      ubahProfil(perubahan) { const a = A(); if (a) ubah((st) => ({ ...st, akun: st.akun.map((x) => (x.id === a.id ? { ...x, ...perubahan } : x)) })); },

      /* ---------- pengaturan ---------- */
      ubahPengaturan(p) { ubah((st) => ({ ...st, pengaturan: { ...st.pengaturan, ...p } })); },
      ubahUnit(p) { ubah((st) => ({ ...st, unit: { ...st.unit, ...p } })); },
      ubahHarga(jenis, nilai) { ubah((st) => ({ ...st, harga: { ...st.harga, [jenis]: nilai } })); },
      tambahHadiah(nama, poin) { ubah((st) => ({ ...st, hadiah: [...st.hadiah, { id: buatId('h-'), nama, poin }] })); },
      hapusHadiah(id) { ubah((st) => ({ ...st, hadiah: st.hadiah.filter((h) => h.id !== id) })); },

      /* ---------- nasabah ---------- */
      tambahNasabah({ nama, hp = '', alamat = '' }) {
        const rec = { id: buatId('n-'), nama: nama.trim(), hp, alamat, noAnggota: 'PLH-' + String(S().nasabah.length + 1).padStart(4, '0'), sejak: Date.now() };
        ubah((st) => ({ ...st, nasabah: [...st.nasabah, rec] }));
        return rec;
      },
      ubahNasabah(id, p) { ubah((st) => ({ ...st, nasabah: st.nasabah.map((n) => (n.id === id ? { ...n, ...p } : n)) })); },
      hapusNasabah(id) {
        ubah((st) => ({
          ...st, nasabah: st.nasabah.filter((n) => n.id !== id),
          setoran: st.setoran.map((s) => (s.nasabahId === id ? { ...s, nasabahId: null } : s)),
          penarikan: st.penarikan.filter((p) => p.nasabahId !== id), jemput: st.jemput.filter((j) => j.nasabahId !== id),
          penukaran: st.penukaran.filter((p) => p.nasabahId !== id), bonusPoin: st.bonusPoin.filter((b) => b.nasabahId !== id),
        }));
      },

      /* ---------- sesi setoran (keranjang) ---------- */
      keranjangMulai(nasabahId = null, jemputId = null) { ubah((st) => ({ ...st, keranjang: { nasabahId, jemputId, items: st.keranjang?.items || [] } })); },
      keranjangTambah(item) { ubah((st) => ({ ...st, keranjang: { nasabahId: null, jemputId: null, ...(st.keranjang || {}), items: [...(st.keranjang?.items || []), { id: buatId('it-'), ...item }] } })); },
      keranjangUbah(id, p) { ubah((st) => (st.keranjang ? { ...st, keranjang: { ...st.keranjang, items: st.keranjang.items.map((it) => (it.id === id ? { ...it, ...p } : it)) } } : st)); },
      keranjangHapus(id) { ubah((st) => (st.keranjang ? { ...st, keranjang: { ...st.keranjang, items: st.keranjang.items.filter((it) => it.id !== id) } } : st)); },
      keranjangBatal() { ubah((st) => ({ ...st, keranjang: null })); },
      /** Simpan setoran. Otomatis: saldo dan poin nasabah, stok gudang, notifikasi, dan status jemput. */
      simpanSetoran(catatan = '') {
        const st0 = S(), k = st0.keranjang, a = A();
        if (!k || !k.items.length) return null;
        const ts = Date.now();
        const berat = bulat1(k.items.reduce((x, it) => x + it.berat, 0));
        const total = k.items.reduce((x, it) => x + it.nilai, 0);
        const p = k.nasabahId ? Math.round(berat * st0.unit.poinPerKg) : 0;
        const rec = { id: buatId('st-'), ts, nasabahId: k.nasabahId || null, petugasId: a?.id || null, petugasNama: a?.nama || '', items: k.items, berat, total, poin: p, catatan };
        const baru = [];
        if (k.nasabahId) {
          baru.push(nt('n:' + k.nasabahId, 'setor', 'Setoran tercatat', `${kg(berat)} senilai ${rupiah(total)} masuk ke tabungan Anda. Poin bertambah ${p}.`, '/riwayat'));
          const kgLama = totalKg(st0, k.nasabahId);
          const l0 = level(kgLama), l1 = level(kgLama + berat);
          if (l1.indeks > l0.indeks) baru.push(nt('n:' + k.nasabahId, 'level', `Naik tingkat menjadi ${l1.nama}`, `Total setoran Anda sudah ${kg(kgLama + berat)}. Terus pilah dari rumah.`, '/hadiah'));
        }
        const sebelum = stok(st0).perKategori, ambang = st0.unit.ambangJual || 50;
        const tambah = {};
        for (const it of k.items) tambah[it.kategori] = (tambah[it.kategori] || 0) + it.berat;
        for (const [kat, v] of Object.entries(tambah)) {
          if (sebelum[kat] < ambang && sebelum[kat] + v >= ambang) baru.push(nt('staf', 'stok', `${KATEGORI[kat].nama} siap dijual`, `Stok ${KATEGORI[kat].nama} mencapai ${kg(sebelum[kat] + v)}, melewati ambang ${ambang} kg.`, '/gudang'));
        }
        const bulan = dalam(st0.setoran, mulaiBulan()).reduce((x, s) => x + s.berat, 0);
        if (st0.unit.targetKg > 0 && bulan < st0.unit.targetKg && bulan + berat >= st0.unit.targetKg) baru.push(nt('staf', 'target', 'Target bulan ini tercapai', `Total setoran bulan ini ${kg(bulan + berat)} dari target ${st0.unit.targetKg} kg.`, '/analitik'));
        ubah((st) => denganNotif({
          ...st, setoran: [rec, ...st.setoran], keranjang: null,
          jemput: k.jemputId ? st.jemput.map((j) => (j.id === k.jemputId ? { ...j, status: 'selesai', riwayat: [...j.riwayat, { ts, status: 'selesai' }] } : j)) : st.jemput,
        }, baru));
        return rec;
      },
      hapusSetoran(id) { ubah((st) => ({ ...st, setoran: st.setoran.filter((s) => s.id !== id) })); },

      /* ---------- penarikan ---------- */
      ajukanTarik(nasabahId, jumlah, catatan = '') {
        const rec = { id: buatId('tr-'), ts: Date.now(), nasabahId, jumlah, status: 'diajukan', catatan, tsProses: null };
        ubah((st) => denganNotif({ ...st, penarikan: [rec, ...st.penarikan] }, [nt('pengelola', 'tarik', 'Pengajuan tarik saldo', `${namaNasabah(nasabahId)} mengajukan penarikan ${rupiah(jumlah)}.`, '/nasabah')]));
      },
      catatTarik(nasabahId, jumlah, catatan = '') {
        const ts = Date.now();
        const rec = { id: buatId('tr-'), ts, nasabahId, jumlah, status: 'disetujui', catatan, tsProses: ts };
        ubah((st) => denganNotif({ ...st, penarikan: [rec, ...st.penarikan] }, [nt('n:' + nasabahId, 'tarik', 'Penarikan saldo dicatat', `${rupiah(jumlah)} sudah diserahkan kepada Anda.`, '/riwayat')]));
      },
      prosesTarik(id, setuju) {
        const p = S().penarikan.find((x) => x.id === id); if (!p) return;
        const pesan = setuju ? nt('n:' + p.nasabahId, 'tarik', 'Penarikan disetujui', `Penarikan ${rupiah(p.jumlah)} disetujui. Ambil uang di bank sampah.`, '/riwayat') : nt('n:' + p.nasabahId, 'tarik', 'Penarikan ditolak', `Pengajuan ${rupiah(p.jumlah)} belum bisa diproses. Hubungi pengelola.`, '/riwayat');
        ubah((st) => denganNotif({ ...st, penarikan: st.penarikan.map((x) => (x.id === id ? { ...x, status: setuju ? 'disetujui' : 'ditolak', tsProses: Date.now() } : x)) }, [pesan]));
      },

      /* ---------- jemput ---------- */
      ajukanJemput(nasabahId, data) {
        const ts = Date.now();
        const rec = { id: buatId('jp-'), ts, nasabahId, alamat: '', waktu: '', perkiraan: [], catatan: '', lokasi: null, ...data, status: 'diajukan', petugasNama: '', riwayat: [{ ts, status: 'diajukan' }] };
        ubah((st) => denganNotif({ ...st, jemput: [rec, ...st.jemput] }, [nt('staf', 'jemput', 'Permintaan jemput baru', `${namaNasabah(nasabahId)} meminta penjemputan: ${rec.waktu}.`, '/jemput')]));
        return rec;
      },
      ubahJemput(id, status) {
        const j = S().jemput.find((x) => x.id === id), a = A(); if (!j) return;
        const ts = Date.now();
        const baru = [];
        const kepada = 'n:' + j.nasabahId;
        if (status === 'dijadwalkan') baru.push(nt(kepada, 'jemput', 'Penjemputan dijadwalkan', `Petugas ${a?.nama || ''} akan datang: ${j.waktu}.`, '/jemput'));
        if (status === 'dijemput') baru.push(nt(kepada, 'jemput', 'Petugas dalam perjalanan', `Petugas ${a?.nama || ''} menuju alamat Anda. Siapkan sampah yang sudah dipilah.`, '/jemput'));
        if (status === 'dibatalkan') baru.push(a?.peran === 'nasabah' ? nt('staf', 'jemput', 'Permintaan jemput dibatalkan', `${namaNasabah(j.nasabahId)} membatalkan permintaan jemput.`, '/jemput') : nt(kepada, 'jemput', 'Penjemputan dibatalkan', 'Petugas membatalkan penjemputan. Silakan ajukan ulang atau hubungi bank sampah.', '/jemput'));
        ubah((st) => denganNotif({ ...st, jemput: st.jemput.map((x) => (x.id === id ? { ...x, status, petugasNama: a?.peran !== 'nasabah' ? a?.nama || x.petugasNama : x.petugasNama, riwayat: [...x.riwayat, { ts, status }] } : x)) }, baru));
      },

      /* ---------- gudang ---------- */
      jual({ jenis, berat, hargaJual, pembeli }) {
        const rec = { id: buatId('jl-'), ts: Date.now(), jenis, berat, hargaJual, total: Math.round(berat * hargaJual), pembeli: pembeli || '' };
        ubah((st) => ({ ...st, penjualan: [rec, ...st.penjualan] }));
        return rec;
      },

      /* ---------- poin ---------- */
      tukar(nasabahId, hadiah) {
        const rec = { id: buatId('tk-'), ts: Date.now(), nasabahId, nama: hadiah.nama, poin: hadiah.poin, kode: 'TKR-' + Math.random().toString(36).slice(2, 6).toUpperCase(), status: 'menunggu' };
        ubah((st) => denganNotif({ ...st, penukaran: [rec, ...st.penukaran] }, [nt('staf', 'tukar', 'Penukaran poin', `${namaNasabah(nasabahId)} menukar ${hadiah.poin} poin dengan ${hadiah.nama} (kode ${rec.kode}).`, '/hadiah')]));
        return rec;
      },
      serahkan(id) {
        const p = S().penukaran.find((x) => x.id === id); if (!p) return;
        ubah((st) => denganNotif({ ...st, penukaran: st.penukaran.map((x) => (x.id === id ? { ...x, status: 'diserahkan' } : x)) }, [nt('n:' + p.nasabahId, 'tukar', 'Hadiah sudah diserahkan', `${p.nama} (kode ${p.kode}) sudah Anda terima.`, '/hadiah')]));
      },
      bonus(nasabahId, poin, alasan) { ubah((st) => ({ ...st, bonusPoin: [{ id: buatId('bn-'), ts: Date.now(), nasabahId, poin, alasan }, ...st.bonusPoin] })); },

      /* ---------- notifikasi ---------- */
      bacaNotif(ids) { const a = A(); if (!a || !ids.length) return; const setId = new Set(ids); ubah((st) => ({ ...st, notif: st.notif.map((n) => (setId.has(n.id) && !n.dibaca.includes(a.id) ? { ...n, dibaca: [...n.dibaca, a.id] } : n)) })); },

      /* ---------- data ---------- */
      impor(data) { dispatch({ type: 'muat', data }); },
      hapusDemo() {
        const bukan = (l) => l.filter((x) => !x.demo);
        ubah((st) => ({ ...st, demo: false, nasabah: bukan(st.nasabah), setoran: bukan(st.setoran), penarikan: bukan(st.penarikan), jemput: bukan(st.jemput), penjualan: bukan(st.penjualan), notif: bukan(st.notif) }));
      },
      async reset() { dispatch({ type: 'reset' }); try { await del(KUNCI); } catch { /* abaikan */ } mulaiSesi(null); },
    };
  }, []);

  const nilai = useMemo(() => ({ state, akun, memuat: !siap, ...aksi }), [state, akun, siap, aksi]);
  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
