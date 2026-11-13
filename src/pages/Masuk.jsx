import { useState } from 'react';
import { Recycle, Mail, Lock, Eye, EyeOff, User, ShieldCheck, Scale, Wallet, ScanLine, Truck, Coins, ArrowRight, Info, Phone, MapPin, Sparkles, Bell } from 'lucide-react';
import { useStore, SANDI_DEMO } from '../lib/store.jsx';
import { Saklar, Sheet, useToast } from '../components/ui.jsx';

const DEMO = [
  { peran: 'pengelola', label: 'Pengelola', Ikon: ShieldCheck, warna: '#0a7a55' },
  { peran: 'petugas', label: 'Petugas', Ikon: Scale, warna: '#0ea5e9' },
  { peran: 'nasabah', label: 'Nasabah', Ikon: Wallet, warna: '#f59e0b' },
];
const SLIDE = [
  { Ikon: ScanLine, sat: [Sparkles, Recycle], judul: 'Foto, lalu AI menebak kategorinya', isi: 'Petugas memotret satu benda. Model di HP menebak satu dari delapan kategori dan menunjukkan seberapa yakin ia. Bila ragu, ia meminta petugas memilih.' },
  { Ikon: Scale, sat: [Wallet, Coins], judul: 'Timbang sekali, sisanya otomatis', isi: 'Isi berat hasil timbangan. Nilai setoran, saldo tabungan, poin nasabah, stok gudang, dan struk digital langsung terhitung.' },
  { Ikon: Truck, sat: [Bell, Wallet], judul: 'Nasabah dan petugas saling terhubung', isi: 'Nasabah meminta jemput, menarik saldo, dan menukar poin. Petugas menanggapi dan kedua pihak menerima notifikasi.' },
];
const sudahSambut = () => { try { return localStorage.getItem('pilahin-sambut') === '1'; } catch { return true; } };

export default function Masuk() {
  const { masuk, masukDemo, daftar } = useStore();
  const tampil = useToast();
  const [sambut, setSambut] = useState(() => (sudahSambut() ? -1 : 0));
  const [tab, setTab] = useState('masuk');
  const [f, setF] = useState({ nama: '', email: '', sandi: '', peran: 'petugas', hp: '', alamat: '' });
  const [ingat, setIngat] = useState(true);
  const [lihat, setLihat] = useState(false);
  const [galat, setGalat] = useState('');
  const [lupa, setLupa] = useState(false);
  const isi = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setGalat(''); };
  const tutupSambut = () => { try { localStorage.setItem('pilahin-sambut', '1'); } catch { /* abaikan */ } setSambut(-1); };

  const kirim = (e) => {
    e.preventDefault();
    if (tab === 'masuk') {
      const h = masuk(f.email, f.sandi, ingat);
      if (!h.ok) setGalat(h.pesan); else tampil(`Selamat datang, ${h.akun.nama}`);
      return;
    }
    if (f.nama.trim().length < 2) return setGalat('Isi nama lengkap.');
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setGalat('Format email belum benar.');
    if (f.sandi.length < 6) return setGalat('Kata sandi minimal 6 karakter.');
    const h = daftar(f);
    if (!h.ok) setGalat(h.pesan); else tampil('Akun dibuat. Selamat datang!');
  };

  if (sambut >= 0) {
    const s = SLIDE[sambut];
    return (
      <div className="sambut">
        <div className="baris antara">
          <div className="baris" style={{ fontWeight: 800, fontSize: '1.1rem' }}><div className="logo" style={{ background: 'rgba(255,255,255,.12)', boxShadow: 'none' }}><Recycle size={20} /></div>Pilahin</div>
          <button className="btn hantu kecil" style={{ color: '#fff' }} onClick={tutupSambut}>Lewati</button>
        </div>
        <div className="gambar" key={sambut}>
          <div className="orbit">
            <div className="inti"><s.Ikon size={58} strokeWidth={1.8} /></div>
            {s.sat.map((I, i) => <div key={i} className="sat" style={i === 0 ? { top: 4, right: 6 } : { bottom: 10, left: 0 }}><I size={22} /></div>)}
          </div>
        </div>
        <div className="kolom" style={{ gap: 10, animation: 'masuk .35s' }} key={'t' + sambut}>
          <h1 style={{ fontSize: '1.7rem' }}>{s.judul}</h1>
          <p style={{ opacity: .85 }}>{s.isi}</p>
        </div>
        <div className="baris antara" style={{ marginTop: 22 }}>
          <div className="titik2">{SLIDE.map((_, i) => <i key={i} className={i === sambut ? 'aktif' : ''} />)}</div>
          <button className="btn lime" onClick={() => (sambut === SLIDE.length - 1 ? tutupSambut() : setSambut(sambut + 1))}>{sambut === SLIDE.length - 1 ? 'Mulai' : 'Lanjut'} <ArrowRight size={18} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="masuk">
      <div className="atas">
        <div className="baris" style={{ gap: 12 }}>
          <div className="logo" style={{ width: 50, height: 50, borderRadius: 17, background: 'rgba(255,255,255,.13)', boxShadow: 'none' }}><Recycle size={26} /></div>
          <div><div style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-.03em', lineHeight: 1.1 }}>Pilahin</div><div style={{ opacity: .8, fontSize: '.84rem' }}>Bank sampah digital dengan AI di genggaman</div></div>
        </div>
        <h1 style={{ marginTop: 22, fontSize: '1.65rem' }}>{tab === 'masuk' ? <>Masuk dan mulai <span style={{ color: 'var(--lime)' }}>memilah</span></> : <>Buat akun <span style={{ color: 'var(--lime)' }}>baru</span></>}</h1>
      </div>

      <form className="bawah" onSubmit={kirim}>
        <div className="tab" role="tablist">
          <button type="button" className={tab === 'masuk' ? 'aktif' : ''} onClick={() => { setTab('masuk'); setGalat(''); }}>Masuk</button>
          <button type="button" className={tab === 'daftar' ? 'aktif' : ''} onClick={() => { setTab('daftar'); setGalat(''); }}>Daftar</button>
        </div>

        {tab === 'daftar' && (
          <>
            <div className="f" role="group" aria-label="Daftar sebagai">Daftar sebagai
              <div className="tab pilih-peran">
                {DEMO.map((d) => <button type="button" key={d.peran} className={f.peran === d.peran ? 'aktif' : ''} aria-pressed={f.peran === d.peran} onClick={() => setF((x) => ({ ...x, peran: d.peran }))}>{d.label}</button>)}
              </div>
            </div>
            <label className="f">Nama lengkap<div className="masukan"><User size={18} /><input type="text" autoComplete="name" placeholder="Nama Anda" value={f.nama} onChange={isi('nama')} /></div></label>
          </>
        )}
        <label className="f">Email<div className="masukan"><Mail size={18} /><input type="email" autoComplete="email" placeholder="nama@email.com" value={f.email} onChange={isi('email')} /></div></label>
        <label className="f">Kata sandi
          <div className="masukan"><Lock size={18} /><input type={lihat ? 'text' : 'password'} autoComplete={tab === 'masuk' ? 'current-password' : 'new-password'} placeholder={tab === 'masuk' ? 'Kata sandi' : 'Minimal 6 karakter'} value={f.sandi} onChange={isi('sandi')} />
            <button type="button" className="mata" onClick={() => setLihat(!lihat)} aria-label={lihat ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}>{lihat ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        </label>
        {tab === 'daftar' && f.peran === 'nasabah' && (
          <>
            <label className="f">Nomor HP (opsional)<div className="masukan"><Phone size={18} /><input type="tel" placeholder="08xx" value={f.hp} onChange={isi('hp')} /></div></label>
            <label className="f">Alamat (untuk penjemputan)<div className="masukan"><MapPin size={18} /><input type="text" placeholder="Jalan, nomor, RT/RW" value={f.alamat} onChange={isi('alamat')} /></div></label>
          </>
        )}
        {tab === 'masuk' && (
          <div className="baris antara kecil">
            <span className="baris" style={{ gap: 8 }}><Saklar nyala={ingat} onUbah={setIngat} label="Ingat saya" /> Ingat saya</span>
            <button type="button" className="btn hantu kecil" onClick={() => setLupa(true)}>Lupa kata sandi?</button>
          </div>
        )}
        {galat && <div className="spanduk merah" role="alert"><Info size={18} />{galat}</div>}
        <button className="btn blok" type="submit">{tab === 'masuk' ? 'Masuk' : 'Buat akun'} <ArrowRight size={18} /></button>

        <div className="baris" style={{ gap: 10 }}><div className="isi" style={{ height: 1, background: 'var(--garis)' }} /><span className="mini">atau coba akun demo</span><div className="isi" style={{ height: 1, background: 'var(--garis)' }} /></div>
        <div className="peran-cepat">
          {DEMO.map((d) => (
            <button type="button" key={d.peran} onClick={() => { masukDemo(d.peran); tampil(`Masuk sebagai ${d.label} (demo)`); }}>
              <div className="bulat" style={{ background: d.warna }}><d.Ikon size={22} /></div>{d.label}
            </button>
          ))}
        </div>
        <p className="muted kecil rata">Akun demo berisi data contoh yang diberi tanda. Sandi akun demo: <code>{SANDI_DEMO}</code></p>
        <div className="spanduk info kecil"><Info size={16} /><span>Mode luring: akun dan data tersimpan di perangkat ini saja. Belum ada server, jadi akun tidak berpindah antarperangkat.</span></div>
      </form>

      {lupa && (
        <Sheet judul="Lupa kata sandi" onTutup={() => setLupa(false)}>
          <p className="muted">Pilahin belum memakai server, sehingga kata sandi tidak bisa dikirim ulang lewat email. Akun tersimpan di perangkat ini.</p>
          <ul className="rapi muted">
            <li>Minta pengelola menghapus akun Anda di menu Pengaturan, lalu daftar ulang.</li>
            <li>Atau masuk dengan akun demo untuk melihat aplikasi.</li>
          </ul>
          <button className="btn blok" onClick={() => setLupa(false)}>Mengerti</button>
        </Sheet>
      )}
    </div>
  );
}
