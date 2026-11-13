export const rupiah = (n) => 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
export const rupiahRingkas = (n) => {
  const v = Math.round(n || 0);
  if (Math.abs(v) >= 1e6) return 'Rp' + (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt';
  if (Math.abs(v) >= 1e4) return 'Rp' + (v / 1e3).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + 'rb';
  return rupiah(v);
};
export const angka = (n, d = 1) => (n || 0).toLocaleString('id-ID', { maximumFractionDigits: d });
export const kg = (n) => angka(n, 2) + ' kg';
export const persen = (p, d = 0) => (p * 100).toLocaleString('id-ID', { maximumFractionDigits: d, minimumFractionDigits: d }) + '%';
export const tglPendek = (ts) => new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
export const tglPanjang = (ts) => new Date(ts).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const tglJam = (ts) => new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const jam = (ts) => new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
export const hariNama = (ts) => new Date(ts).toLocaleDateString('id-ID', { weekday: 'short' });
export const bulanNama = (ts) => new Date(ts).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
export const inisial = (nama = '') => nama.trim().split(/\s+/).slice(0, 2).map((s) => s[0] || '').join('').toUpperCase() || '?';
export const namaDepan = (nama = '') => nama.trim().split(/\s+/)[0] || '';
export const desimal = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; };

export function relatif(ts) {
  const d = Date.now() - ts;
  if (d < 60e3) return 'baru saja';
  if (d < 3600e3) return Math.floor(d / 60e3) + ' mnt lalu';
  if (d < 86400e3) return Math.floor(d / 3600e3) + ' jam lalu';
  if (d < 7 * 86400e3) return Math.floor(d / 86400e3) + ' hari lalu';
  return tglPendek(ts);
}
export function salam() {
  const j = new Date().getHours();
  return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam';
}

export function unduh(nama, isi, tipe = 'text/csv;charset=utf-8') {
  const blob = new Blob([isi], { type: tipe });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export function keCSV(baris) {
  const esc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return '﻿' + baris.map((r) => r.map(esc).join(',')).join('\n');
}
/** Bagikan teks lewat menu bagikan HP; bila tidak ada, salin ke papan klip. Hasil: 'bagi' | 'salin' | 'gagal'. */
export async function bagikan(judul, teks) {
  try {
    if (navigator.share) { await navigator.share({ title: judul, text: teks }); return 'bagi'; }
    await navigator.clipboard.writeText(teks); return 'salin';
  } catch (e) {
    if (e && e.name === 'AbortError') return 'batal';
    try { await navigator.clipboard.writeText(teks); return 'salin'; } catch { return 'gagal'; }
  }
}
