import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { House, ScanLine, ReceiptText, ChartColumn, CircleUser, Recycle, Scale, Gift, Signal, Wifi, BatteryFull, Cpu, Users, ArrowLeftRight, WifiOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStore } from './lib/store.jsx';
import { muatModel } from './lib/classifier';
import { LapisProvider } from './components/ui.jsx';
import Masuk from './pages/Masuk.jsx';
import Beranda from './pages/Beranda.jsx';
import Setor from './pages/Setor.jsx';
import Pindai from './pages/Pindai.jsx';
import Riwayat from './pages/Riwayat.jsx';
import Analitik from './pages/Analitik.jsx';
import Nasabah from './pages/Nasabah.jsx';
import NasabahDetail from './pages/NasabahDetail.jsx';
import Jemput from './pages/Jemput.jsx';
import Gudang from './pages/Gudang.jsx';
import Harga from './pages/Harga.jsx';
import Hadiah from './pages/Hadiah.jsx';
import Notifikasi from './pages/Notifikasi.jsx';
import Panduan from './pages/Panduan.jsx';
import Kuis from './pages/Kuis.jsx';
import Laporan from './pages/Laporan.jsx';
import Akun from './pages/Akun.jsx';
import Pengaturan from './pages/Pengaturan.jsx';
import Tentang from './pages/Tentang.jsx';

const MENU_STAF = [
  { to: '/', label: 'Beranda', Ikon: House, end: true },
  { to: '/riwayat', label: 'Transaksi', Ikon: ReceiptText },
  { to: '/setor', label: 'Setor', Ikon: Scale, fab: true },
  { to: '/analitik', label: 'Analitik', Ikon: ChartColumn },
  { to: '/akun', label: 'Akun', Ikon: CircleUser },
];
const MENU_NASABAH = [
  { to: '/', label: 'Beranda', Ikon: House, end: true },
  { to: '/riwayat', label: 'Riwayat', Ikon: ReceiptText },
  { to: '/pindai', label: 'Pindai', Ikon: ScanLine, fab: true },
  { to: '/hadiah', label: 'Hadiah', Ikon: Gift },
  { to: '/akun', label: 'Akun', Ikon: CircleUser },
];
const TANPA_NAV = ['/setor', '/pindai'];

function BilahStatus() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 20000); return () => clearInterval(i); }, []);
  return (
    <div className="status" aria-hidden="true">
      <span>{t.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="pulau" />
      <span className="ikon"><Signal size={14} /><Wifi size={14} /><BatteryFull size={17} /></span>
    </div>
  );
}

function Cangkang() {
  const { akun } = useStore();
  const { pathname } = useLocation();
  const gulir = useRef(null);
  useEffect(() => { muatModel(); }, []);
  useEffect(() => { gulir.current?.scrollTo(0, 0); }, [pathname]);
  const staf = akun.peran !== 'nasabah';
  const menu = staf ? MENU_STAF : MENU_NASABAH;
  const S = (el) => (staf ? el : <Navigate to="/" replace />);
  const tanpaNav = TANPA_NAV.includes(pathname);
  return (
    <>
      <div className="gulir" ref={gulir}>
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/setor" element={S(<Setor />)} />
          <Route path="/pindai" element={<Pindai />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/analitik" element={S(<Analitik />)} />
          <Route path="/nasabah" element={S(<Nasabah />)} />
          <Route path="/nasabah/:id" element={S(<NasabahDetail />)} />
          <Route path="/jemput" element={<Jemput />} />
          <Route path="/gudang" element={S(<Gudang />)} />
          <Route path="/harga" element={<Harga />} />
          <Route path="/hadiah" element={<Hadiah />} />
          <Route path="/notifikasi" element={<Notifikasi />} />
          <Route path="/panduan" element={<Panduan />} />
          <Route path="/kuis" element={<Kuis />} />
          <Route path="/laporan" element={S(<Laporan />)} />
          <Route path="/akun" element={<Akun />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
          <Route path="/tentang" element={<Tentang />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!tanpaNav && (
        <nav className="nav" aria-label="Menu utama">
          {menu.map(({ to, label, Ikon, end, fab }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `${isActive ? 'aktif' : ''} ${fab ? 'fab' : ''}`}>
              {fab ? <div className="bulat"><Ikon size={27} strokeWidth={2.4} /></div> : <Ikon size={22} />}<span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}

export default function App() {
  const { akun, memuat } = useStore();
  return (
    <div className="panggung">
      <aside className="panel kiri">
        <div className="merek"><div className="logo"><Recycle size={22} /></div>Pilahin</div>
        <h1>Pilah, timbang, tabung. <em>Otomatis.</em></h1>
        <p>Bank sampah digital dengan pemilah berbasis AI yang berjalan langsung di HP. Petugas memotret dan menimbang, sisanya dihitung aplikasi: saldo, poin, stok gudang, sampai laporan bulanan.</p>
        <div className="kotak"><Cpu size={20} /><div><b>AI di perangkat</b><span>Foto diklasifikasi di browser, tidak diunggah ke server mana pun.</span></div></div>
        <div className="kotak"><WifiOff size={20} /><div><b>Tetap jalan tanpa sinyal</b><span>Bisa dipasang ke layar utama dan dipakai luring.</span></div></div>
      </aside>
      <div className="hp">
        <div className="layar">
          <LapisProvider>
            <BilahStatus />
            {memuat ? <div className="gulir" style={{ display: 'grid', placeItems: 'center' }}><Loader2 size={30} className="putar" color="var(--hijau)" /></div> : akun ? <Cangkang /> : <div className="gulir"><Masuk /></div>}
          </LapisProvider>
        </div>
      </div>
      <aside className="panel kanan">
        <div className="kotak"><Users size={20} /><div><b>Tiga peran, satu aplikasi</b><span>Pengelola, petugas, dan nasabah punya beranda dan menu masing-masing. Coba lewat akun demo di layar masuk.</span></div></div>
        <div className="kotak"><ArrowLeftRight size={20} /><div><b>Dua arah</b><span>Nasabah meminta jemput atau tarik saldo, petugas menanggapi, dan keduanya menerima notifikasi. Buka dua tab untuk melihatnya berjalan langsung.</span></div></div>
        <div className="kotak"><Scale size={20} /><div><b>Angka apa adanya</b><span>Data contoh diberi tanda. Akurasi lapangan dihitung dari koreksi petugas, bukan klaim.</span></div></div>
        <p className="kecil" style={{ opacity: .7 }}>Prototipe untuk DSC Gelar Rasa 2026. Tampilan ini mengikuti ukuran HP; buka di HP untuk layar penuh.</p>
      </aside>
    </div>
  );
}
