import { Link } from 'react-router-dom';
import { Wallet, BookOpen, Trophy, Settings, Info, ChevronRight } from 'lucide-react';

const MENU = [
  { to: '/bank', Ikon: Wallet, judul: 'Bank Sampah', ket: 'Harga per kg, nasabah, setoran, dan saldo' },
  { to: '/panduan', Ikon: BookOpen, judul: 'Panduan Pilah', ket: 'Cara memilah 8 kategori dan pencarian barang' },
  { to: '/kuis', Ikon: Trophy, judul: 'Kuis Pilah', ket: 'Uji pemahaman memilah dalam 8 soal' },
  { to: '/pengaturan', Ikon: Settings, judul: 'Pengaturan', ket: 'Ambang keyakinan, tema, data, dan pemasangan' },
  { to: '/tentang', Ikon: Info, judul: 'Tentang Model', ket: 'Data, metode, batasan, dan privasi' },
];

export default function Lainnya() {
  return (
    <div className="halaman">
      <div className="kartu rata0 daftar">
        {MENU.map(({ to, Ikon, judul, ket }) => (
          <Link key={to} to={to} className="item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="ikon-bulat" style={{ background: 'var(--hijau)' }}><Ikon size={21} /></div>
            <div style={{ flex: 1 }}><b>{judul}</b><div className="muted kecil">{ket}</div></div>
            <ChevronRight size={18} color="var(--teks2)" />
          </Link>
        ))}
      </div>
      <p className="muted kecil rata">Pilahin berjalan di perangkat Anda. Foto tidak diunggah.</p>
    </div>
  );
}
