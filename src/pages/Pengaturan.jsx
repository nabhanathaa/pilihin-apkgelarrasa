import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Trash2, Smartphone, Sun, Moon, SunMoon, FlaskConical, UserX, Check } from 'lucide-react';
import { useStore, PERAN } from '../lib/store.jsx';
import { unduh, desimal } from '../lib/format';
import { tawaranPasang, pantauPasang, sudahDipasang, pasang } from '../lib/pasang';
import { Kepala, Avatar, Sheet, useToast } from '../components/ui.jsx';

export default function Pengaturan() {
  const { state, akun, ubahPengaturan, ubahUnit, impor, reset, hapusDemo, hapusAkun, ubahProfil, ubahNasabah } = useStore();
  const tampil = useToast();
  const { ambang, tema } = state.pengaturan;
  const pengelola = akun.peran === 'pengelola';
  const staf = akun.peran !== 'nasabah';
  const [tawaran, setTawaran] = useState(tawaranPasang());
  const [tanya, setTanya] = useState(null); // {judul, isi, aksi}
  const [nama, setNama] = useState(akun.nama);
  const saya = state.nasabah.find((n) => n.id === akun.nasabahId);
  const [alamat, setAlamat] = useState(saya?.alamat || '');
  const berkas = useRef(null);
  const tunda = useRef(null);
  useEffect(() => pantauPasang(setTawaran), []);

  const angkaUnit = (k, min = 0) => (e) => ubahUnit({ [k]: Math.max(min, Math.round(desimal(e.target.value))) });
  const cadangkan = () => { unduh(`pilahin-cadangan-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(state), 'application/json'); tampil('Cadangan diunduh'); };
  const pulihkan = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || d.versi !== 2 || !Array.isArray(d.setoran)) throw new Error('format');
      tunda.current = d;
      setTanya({ judul: 'Pulihkan cadangan?', isi: 'Seluruh data di perangkat ini akan diganti dengan isi berkas cadangan.', label: 'Ya, pulihkan', aksi: () => { impor(tunda.current); tampil('Data dipulihkan'); } });
    } catch { tampil('Berkas cadangan tidak valid'); }
  };
  const simpanProfil = () => {
    if (nama.trim().length < 2) return tampil('Nama terlalu pendek');
    ubahProfil({ nama: nama.trim() });
    if (saya) ubahNasabah(saya.id, { nama: nama.trim(), alamat: alamat.trim() });
    tampil('Profil diperbarui');
  };

  return (
    <div className="halaman">
      <Kepala judul="Pengaturan" />
      <div className="kartu kolom">
        <h2>Tampilan</h2>
        <div className="tab">
          {[['auto', 'Otomatis', SunMoon], ['terang', 'Terang', Sun], ['gelap', 'Gelap', Moon]].map(([id, label, I]) => <button key={id} className={tema === id ? 'aktif' : ''} onClick={() => ubahPengaturan({ tema: id })}><I size={15} /> {label}</button>)}
        </div>
      </div>

      <div className="kartu kolom">
        <h2>Profil</h2>
        <label className="f">Nama<input type="text" value={nama} onChange={(e) => setNama(e.target.value)} /></label>
        {saya && <label className="f">Alamat penjemputan<input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Jalan, nomor, RT/RW" /></label>}
        <button className="btn sekunder" onClick={simpanProfil}><Check size={17} /> Simpan profil</button>
      </div>

      {staf && (
        <div className="kartu kolom">
          <h2>Pemindai</h2>
          <label className="f">Ambang keyakinan: {Math.round(ambang * 100)}%
            <input type="range" min="0.3" max="0.9" step="0.05" value={ambang} onChange={(e) => ubahPengaturan({ ambang: Number(e.target.value) })} />
          </label>
          <span className="muted kecil">Bila keyakinan model di bawah ambang ini, aplikasi menandai "perlu dicek" dan petugas memilih kategori sendiri. Ambang lebih tinggi berarti lebih hati-hati.</span>
        </div>
      )}

      {pengelola && (
        <div className="kartu kolom">
          <h2>Unit bank sampah</h2>
          <label className="f">Nama unit<input type="text" value={state.unit.nama} onChange={(e) => ubahUnit({ nama: e.target.value })} /></label>
          <div className="grid2">
            <label className="f">Target per bulan (kg)<input type="number" inputMode="numeric" min="0" value={state.unit.targetKg} onChange={angkaUnit('targetKg')} /></label>
            <label className="f">Poin per kg<input type="number" inputMode="numeric" min="0" value={state.unit.poinPerKg} onChange={angkaUnit('poinPerKg')} /></label>
          </div>
          <label className="f">Ambang siap jual per kategori (kg)<input type="number" inputMode="numeric" min="1" value={state.unit.ambangJual} onChange={angkaUnit('ambangJual', 1)} /></label>
          <span className="muted kecil">Saat stok suatu kategori melewati ambang ini, staf otomatis menerima notifikasi "siap dijual".</span>
        </div>
      )}

      {pengelola && (
        <div className="kartu kolom">
          <h2>Pengguna di perangkat ini</h2>
          {state.akun.map((a) => (
            <div key={a.id} className="baris">
              <Avatar nama={a.nama} ukuran={38} />
              <div className="isi"><b className="potong" style={{ display: 'block' }}>{a.nama}{a.id === akun.id ? ' (Anda)' : ''}</b><span className="muted kecil potong" style={{ display: 'block' }}>{PERAN[a.peran]} · {a.email}</span></div>
              {a.demo ? <span className="chip abu">demo</span> : a.id !== akun.id && <button className="ikon-btn" style={{ width: 36, height: 36, color: 'var(--merah)' }} aria-label={`Hapus akun ${a.nama}`} onClick={() => setTanya({ judul: `Hapus akun ${a.nama}?`, isi: 'Akun tidak bisa masuk lagi. Data transaksi tidak ikut terhapus.', label: 'Ya, hapus akun', aksi: () => { hapusAkun(a.id); tampil('Akun dihapus'); } })}><UserX size={16} /></button>}
            </div>
          ))}
        </div>
      )}

      <div className="kartu kolom">
        <h2>Pasang aplikasi</h2>
        {sudahDipasang() ? <span className="chip"><Check size={13} /> Sudah terpasang di perangkat ini</span>
          : tawaran ? <button className="btn" onClick={() => pasang()}><Smartphone size={18} /> Pasang ke layar utama</button>
          : <span className="muted kecil">Di Chrome Android: menu titik tiga lalu "Tambahkan ke layar utama". Di iPhone (Safari): tombol Bagikan lalu "Tambah ke Layar Utama". Setelah terpasang, aplikasi bisa dibuka tanpa internet.</span>}
      </div>

      {staf && (
        <div className="kartu kolom">
          <h2>Data</h2>
          <span className="muted kecil">Semua data tersimpan di browser perangkat ini. Cadangkan secara berkala.</span>
          <div className="grid2">
            <button className="btn sekunder" onClick={cadangkan}><Download size={17} /> Cadangkan</button>
            <button className="btn sekunder" onClick={() => berkas.current.click()} disabled={!pengelola}><Upload size={17} /> Pulihkan</button>
          </div>
          <input ref={berkas} type="file" accept="application/json,.json" hidden onChange={pulihkan} />
          {pengelola && state.demo && <button className="btn sekunder" onClick={() => setTanya({ judul: 'Hapus data contoh?', isi: 'Nasabah, setoran, penjemputan, dan penjualan contoh akan dihapus. Data yang Anda buat sendiri tetap ada.', label: 'Ya, hapus data contoh', aksi: () => { hapusDemo(); tampil('Data contoh dihapus'); } })}><FlaskConical size={17} /> Hapus data contoh</button>}
          {pengelola && <button className="btn bahaya" onClick={() => setTanya({ judul: 'Hapus semua data?', isi: 'Seluruh akun, nasabah, dan transaksi di perangkat ini dihapus dan tidak bisa dikembalikan. Anda akan keluar.', label: 'Ya, hapus semuanya', aksi: () => reset() })}><Trash2 size={17} /> Hapus semua data</button>}
        </div>
      )}

      {tanya && (
        <Sheet judul={tanya.judul} onTutup={() => setTanya(null)}>
          <p className="muted">{tanya.isi}</p>
          <div className="grid2">
            <button className="btn sekunder" onClick={() => setTanya(null)}>Batal</button>
            <button className="btn bahaya" onClick={() => { const a = tanya.aksi; setTanya(null); a(); }}>{tanya.label}</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
