import { Link, useNavigate } from 'react-router-dom';
import { Settings, Cpu, LogOut, ChevronRight, Users, Truck, Warehouse, Tag, Gift, BookOpen, FileText, Bell, Trophy, ShieldCheck, Scale, Wallet, ArrowLeftRight, MessageCircle } from 'lucide-react';
import { useStore, PERAN } from '../lib/store.jsx';
import { belumDibaca } from '../lib/hitung';
import { Kepala, Avatar, useToast } from '../components/ui.jsx';

const IKON_PERAN = { pengelola: ShieldCheck, petugas: Scale, nasabah: Wallet };

function Baris({ to, Ikon, label, sub, tanda, warna = 'var(--hijau)', latar = 'var(--hijau-muda)' }) {
  return (
    <Link to={to} className="item">
      <div className="ikon-lembut" style={{ background: latar, color: warna, width: 40, height: 40 }}><Ikon size={20} /></div>
      <div className="isi"><b>{label}</b>{sub && <span className="muted kecil">{sub}</span>}</div>
      {tanda > 0 && <span className="chip merah">{tanda}</span>}<ChevronRight size={17} className="muted" />
    </Link>
  );
}

export default function Akun() {
  const { state, akun, gantiAkun, keluar } = useStore();
  const nav = useNavigate();
  const tampil = useToast();
  const staf = akun.peran !== 'nasabah';
  const demo = state.akun.filter((a) => a.demo);

  return (
    <div className="halaman">
      <Kepala judul="Akun" kembali={false} />
      <div className="kartu-anggota">
        <div className="baris">
          <Avatar nama={akun.nama} ukuran={54} warna="rgba(255,255,255,.16)" />
          <div className="isi"><div style={{ fontWeight: 800, fontSize: '1.15rem' }} className="potong">{akun.nama}</div><div style={{ opacity: .8, fontSize: '.84rem' }} className="potong">{akun.email}</div></div>
        </div>
        <div className="baris" style={{ marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
          <span className="chip lime">{PERAN[akun.peran]}</span><span className="chip kaca">{state.unit.nama}</span>{akun.demo && <span className="chip kaca">Akun demo</span>}
        </div>
      </div>

      {akun.demo && (
        <div className="kartu kolom" style={{ gap: 10 }}>
          <div className="baris"><ArrowLeftRight size={18} color="var(--hijau)" /><div className="isi"><b>Ganti peran demo</b><div className="muted kecil">Lihat alur yang sama dari sisi peran lain. Buka di dua tab untuk melihat perubahan langsung.</div></div></div>
          <div className="peran-cepat">
            {demo.map((a) => {
              const I = IKON_PERAN[a.peran];
              return <button key={a.id} style={a.id === akun.id ? { borderColor: 'var(--hijau)', background: 'var(--hijau-muda)' } : undefined} onClick={() => { if (a.id !== akun.id) { gantiAkun(a.id); nav('/'); tampil(`Sekarang sebagai ${PERAN[a.peran]}`); } }}><div className="bulat" style={{ background: 'var(--zamrud)' }}><I size={21} /></div>{PERAN[a.peran]}</button>;
            })}
          </div>
        </div>
      )}

      <div className="daftar">
        <Baris to="/notifikasi" Ikon={Bell} label="Notifikasi" tanda={belumDibaca(state, akun)} warna="var(--merah)" latar="var(--merah-muda)" />
        {staf && <Baris to="/nasabah" Ikon={Users} label="Nasabah" sub={`${state.nasabah.length} terdaftar`} warna="var(--biru)" latar="var(--biru-muda)" />}
        <Baris to="/jemput" Ikon={Truck} label="Penjemputan" warna="#d97706" latar="var(--kuning-muda)" />
        {staf && <Baris to="/gudang" Ikon={Warehouse} label="Gudang dan penjualan" warna="var(--ungu)" latar="var(--ungu-muda)" />}
        <Baris to="/harga" Ikon={Tag} label="Daftar harga" />
        <Baris to="/hadiah" Ikon={Gift} label="Poin dan hadiah" warna="#d97706" latar="var(--kuning-muda)" />
        {staf && <Baris to="/laporan" Ikon={FileText} label="Laporan bulanan" />}
      </div>
      <div className="daftar">
        <Baris to="/panduan" Ikon={BookOpen} label="Panduan pilah" warna="var(--biru)" latar="var(--biru-muda)" />
        <Baris to="/panduan?tab=tanya" Ikon={MessageCircle} label="Tanya Pilah" warna="var(--biru)" latar="var(--biru-muda)" />
        <Baris to="/kuis" Ikon={Trophy} label="Kuis pilah" warna="#d97706" latar="var(--kuning-muda)" />
        <Baris to="/tentang" Ikon={Cpu} label="Tentang model AI" warna="var(--ungu)" latar="var(--ungu-muda)" />
        <Baris to="/pengaturan" Ikon={Settings} label="Pengaturan" sub="Tema, unit, data, pasang aplikasi" warna="var(--teks2)" latar="var(--kartu2)" />
      </div>
      <button className="btn bahaya blok" onClick={() => { keluar(); nav('/'); }}><LogOut size={18} /> Keluar</button>
      <p className="muted kecil rata">Pilahin v2 · data tersimpan di perangkat ini</p>
    </div>
  );
}
