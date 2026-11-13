// Semua angka turunan dihitung dari catatan transaksi (tidak ada angka yang disimpan ganda).
import { URUTAN, JENIS } from '../data/kategori';
import { LEVEL } from '../data/hadiah';

/** Selang kepercayaan Wilson 95% untuk proporsi k dari n. */
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, z2 = z * z;
  const pusat = (p + z2 / (2 * n)) / (1 + z2 / n);
  const lebar = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return [Math.max(0, pusat - lebar), Math.min(1, pusat + lebar)];
}

export const HARI = 86400000;
export const mulaiHari = (ts = Date.now()) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const mulaiBulan = (ts = Date.now()) => { const d = new Date(ts); d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const akhirBulan = (ts = Date.now()) => { const d = new Date(mulaiBulan(ts)); d.setMonth(d.getMonth() + 1); return d.getTime(); };
export const dalam = (list, dari, sampai = Infinity) => list.filter((x) => x.ts >= dari && x.ts < sampai);

export const hargaJenis = (state, jenisId) => state.harga[jenisId] ?? JENIS[jenisId]?.harga ?? 0;

/** Ratakan item dari daftar setoran. */
export const semuaItem = (setoran) => setoran.flatMap((s) => s.items.map((it) => ({ ...it, ts: s.ts, nasabahId: s.nasabahId, setoranId: s.id })));

export function ringkas(items) {
  const per = Object.fromEntries(URUTAN.map((k) => [k, { k, n: 0, berat: 0, nilai: 0 }]));
  let n = 0, berat = 0, nilai = 0;
  for (const s of items) {
    const r = per[s.kategori];
    if (!r) continue;
    r.n += 1; r.berat += s.berat || 0; r.nilai += s.nilai || 0;
    n += 1; berat += s.berat || 0; nilai += s.nilai || 0;
  }
  const daftar = URUTAN.map((k) => ({ ...per[k], porsi: n ? per[k].n / n : 0, porsiBerat: berat ? per[k].berat / berat : 0, ci: wilson(per[k].n, n) }));
  return { n, berat, nilai, daftar };
}

export function harian(setoran, hari = 14) {
  const sekarang = mulaiHari();
  const hasil = [];
  for (let i = hari - 1; i >= 0; i--) hasil.push({ t: sekarang - i * HARI, n: 0, berat: 0, nilai: 0 });
  const idx = new Map(hasil.map((h, i) => [h.t, i]));
  for (const s of setoran) {
    const i = idx.get(mulaiHari(s.ts));
    if (i === undefined) continue;
    hasil[i].n += 1; hasil[i].berat += s.berat || 0; hasil[i].nilai += s.total || 0;
  }
  return hasil;
}

/** Ketepatan menurut petugas: di antara item yang ditebak model, berapa yang tidak dikoreksi. */
export function akurasiLapangan(items) {
  const dari = items.filter((s) => s.sumber === 'model');
  const n = dari.length;
  const benar = dari.filter((s) => !s.dikoreksi).length;
  return { n, benar, p: n ? benar / n : null, ci: wilson(benar, n) };
}
export function seringTertukar(items) {
  const m = new Map();
  for (const s of items) {
    if (s.sumber === 'model' && s.dikoreksi && s.prediksi && s.prediksi !== s.kategori) {
      const key = `${s.prediksi}>${s.kategori}`;
      m.set(key, (m.get(key) || 0) + 1);
    }
  }
  return [...m.entries()].map(([k, n]) => { const [dari, ke] = k.split('>'); return { dari, ke, n }; }).sort((a, b) => b.n - a.n).slice(0, 5);
}

export function saldo(state, nasabahId) {
  const masuk = state.setoran.filter((s) => s.nasabahId === nasabahId).reduce((a, s) => a + (s.total || 0), 0);
  const tarik = state.penarikan.filter((p) => p.nasabahId === nasabahId);
  const keluar = tarik.filter((p) => p.status === 'disetujui').reduce((a, p) => a + p.jumlah, 0);
  const tertahan = tarik.filter((p) => p.status === 'diajukan').reduce((a, p) => a + p.jumlah, 0);
  return { masuk, keluar, tertahan, saldo: masuk - keluar, tersedia: masuk - keluar - tertahan };
}
export const totalKg = (state, nasabahId) => state.setoran.filter((s) => s.nasabahId === nasabahId).reduce((a, s) => a + (s.berat || 0), 0);

export function poin(state, nasabahId) {
  const setor = state.setoran.filter((s) => s.nasabahId === nasabahId).reduce((a, s) => a + (s.poin || 0), 0);
  const bonus = state.bonusPoin.filter((b) => b.nasabahId === nasabahId).reduce((a, b) => a + b.poin, 0);
  const pakai = state.penukaran.filter((p) => p.nasabahId === nasabahId).reduce((a, p) => a + p.poin, 0);
  return { setor, bonus, pakai, saldo: setor + bonus - pakai };
}

export function level(kgTotal) {
  let i = 0;
  LEVEL.forEach((l, j) => { if (kgTotal >= l.min) i = j; });
  const kini = LEVEL[i], berikut = LEVEL[i + 1] || null;
  const progres = berikut ? Math.min(1, (kgTotal - kini.min) / (berikut.min - kini.min)) : 1;
  return { indeks: i, nama: kini.nama, berikut, progres, kurang: berikut ? Math.max(0, berikut.min - kgTotal) : 0 };
}

/** Stok gudang (kg) = total disetor dikurangi total terjual. */
export function stok(state) {
  const perJenis = {};
  for (const s of state.setoran) for (const it of s.items) perJenis[it.jenis] = (perJenis[it.jenis] || 0) + (it.berat || 0);
  for (const j of state.penjualan) perJenis[j.jenis] = (perJenis[j.jenis] || 0) - j.berat;
  const perKategori = Object.fromEntries(URUTAN.map((k) => [k, 0]));
  for (const [id, v] of Object.entries(perJenis)) {
    perJenis[id] = Math.max(0, Math.round(v * 100) / 100);
    const k = JENIS[id]?.kategori;
    if (k) perKategori[k] += perJenis[id];
  }
  const total = Object.values(perKategori).reduce((a, b) => a + b, 0);
  return { perJenis, perKategori, total };
}

export function peringkat(state, dari = 0, sampai = Infinity) {
  const m = new Map();
  for (const s of dalam(state.setoran, dari, sampai)) {
    if (!s.nasabahId) continue;
    const r = m.get(s.nasabahId) || { nasabahId: s.nasabahId, berat: 0, nilai: 0, n: 0 };
    r.berat += s.berat || 0; r.nilai += s.total || 0; r.n += 1;
    m.set(s.nasabahId, r);
  }
  const peta = new Map(state.nasabah.map((n) => [n.id, n]));
  return [...m.values()].filter((r) => peta.has(r.nasabahId)).map((r) => ({ ...r, nama: peta.get(r.nasabahId).nama })).sort((a, b) => b.berat - a.berat);
}

/** Notifikasi yang boleh dilihat akun ini. */
export function notifAkun(state, akun) {
  if (!akun) return [];
  return state.notif.filter((n) => (akun.peran === 'nasabah' ? n.untuk === 'n:' + akun.nasabahId : n.untuk === 'staf' || (n.untuk === 'pengelola' && akun.peran === 'pengelola')));
}
export const belumDibaca = (state, akun) => notifAkun(state, akun).filter((n) => !n.dibaca.includes(akun.id)).length;

/** Hal yang menunggu tindakan staf. */
export function antrean(state) {
  const st = stok(state);
  const ambang = state.unit.ambangJual || 50;
  return {
    jemput: state.jemput.filter((j) => j.status === 'diajukan').length,
    jemputAktif: state.jemput.filter((j) => ['diajukan', 'dijadwalkan', 'dijemput'].includes(j.status)).length,
    tarik: state.penarikan.filter((p) => p.status === 'diajukan').length,
    tukar: state.penukaran.filter((p) => p.status === 'menunggu').length,
    siapJual: URUTAN.filter((k) => st.perKategori[k] >= ambang),
  };
}
