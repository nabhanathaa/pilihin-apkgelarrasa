// Menangkap tawaran pasang PWA sejak aplikasi dibuka, agar tombol "Pasang" di Pengaturan bisa memakainya.
let acara = null;
const pendengar = new Set();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); acara = e; pendengar.forEach((f) => f(acara)); });
  window.addEventListener('appinstalled', () => { acara = null; pendengar.forEach((f) => f(null)); });
}
export const tawaranPasang = () => acara;
export const pantauPasang = (f) => { pendengar.add(f); return () => pendengar.delete(f); };
export const sudahDipasang = () => window.matchMedia('(display-mode: standalone)').matches;
export async function pasang() { if (!acara) return false; acara.prompt(); try { await acara.userChoice; } catch { /* abaikan */ } acara = null; pendengar.forEach((f) => f(null)); return true; }
