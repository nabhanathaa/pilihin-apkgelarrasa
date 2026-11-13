import { URUTAN } from '../data/kategori';

/** Selang kepercayaan Wilson 95% untuk proporsi k dari n. */
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n, z2 = z * z;
  const pusat = (p + z2 / (2 * n)) / (1 + z2 / n);
  const lebar = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / (1 + z2 / n);
  return [Math.max(0, pusat - lebar), Math.min(1, pusat + lebar)];
}

export const mulaiHari = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };

export function ringkas(scans) {
  const per = Object.fromEntries(URUTAN.map((k) => [k, { k, n: 0, berat: 0, nilai: 0 }]));
  let n = 0, berat = 0, nilai = 0;
  for (const s of scans) {
    const r = per[s.kategori];
    if (!r) continue;
    r.n += 1; r.berat += s.berat || 0; r.nilai += s.nilai || 0;
    n += 1; berat += s.berat || 0; nilai += s.nilai || 0;
  }
  const daftar = URUTAN.map((k) => ({ ...per[k], porsi: n ? per[k].n / n : 0, ci: wilson(per[k].n, n) }));
  return { n, berat, nilai, daftar };
}

export function harian(scans, hari = 14) {
  const sekarang = mulaiHari(Date.now());
  const hasil = [];
  for (let i = hari - 1; i >= 0; i--) {
    const t = sekarang - i * 86400000;
    hasil.push({ t, n: 0, berat: 0, nilai: 0 });
  }
  const idx = new Map(hasil.map((h, i) => [h.t, i]));
  for (const s of scans) {
    const i = idx.get(mulaiHari(s.ts));
    if (i === undefined) continue;
    hasil[i].n += 1; hasil[i].berat += s.berat || 0; hasil[i].nilai += s.nilai || 0;
  }
  return hasil;
}

/** Ketepatan menurut petugas: di antara scan oleh model, berapa yang tidak dikoreksi. */
export function akurasiLapangan(scans) {
  const dari = scans.filter((s) => s.sumber === 'model');
  const n = dari.length;
  const benar = dari.filter((s) => !s.dikoreksi).length;
  const ragu = dari.filter((s) => s.conf < 0.5).length;
  return { n, benar, p: n ? benar / n : null, ci: wilson(benar, n), ragu };
}

/** Pasangan prediksi -> koreksi yang paling sering terjadi. */
export function sering_tertukar(scans) {
  const m = new Map();
  for (const s of scans) {
    if (s.sumber === 'model' && s.dikoreksi && s.prediksi && s.prediksi !== s.kategori) {
      const key = `${s.prediksi}>${s.kategori}`;
      m.set(key, (m.get(key) || 0) + 1);
    }
  }
  return [...m.entries()].map(([k, n]) => { const [dari, ke] = k.split('>'); return { dari, ke, n }; }).sort((a, b) => b.n - a.n).slice(0, 5);
}

export function saldoNasabah(nasabahId, scans, penarikan) {
  const masuk = scans.filter((s) => s.nasabahId === nasabahId).reduce((a, s) => a + (s.nilai || 0), 0);
  const keluar = penarikan.filter((p) => p.nasabahId === nasabahId).reduce((a, p) => a + p.jumlah, 0);
  return { masuk, keluar, saldo: masuk - keluar };
}
