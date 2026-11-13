// Pindai cepat. Petugas: hasil masuk ke keranjang setoran. Nasabah: cek kategori, saran penanganan, lalu bisa minta jemput.
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store.jsx';
import Pemindai from '../components/Pemindai.jsx';

export default function Pindai() {
  const { akun, keranjangTambah } = useStore();
  const nav = useNavigate();
  const jumlah = useRef(0);
  const staf = akun.peran !== 'nasabah';
  if (staf) {
    return (
      <div className="halaman tanpa-nav">
        <Pemindai mode="setor" onTambah={(it) => { jumlah.current += 1; keranjangTambah(it); }} onTutup={() => nav(jumlah.current ? '/setor' : '/', { replace: true })} />
      </div>
    );
  }
  return (
    <div className="halaman tanpa-nav">
      <Pemindai mode="cek" onTutup={() => nav('/', { replace: true })} aksiCek={{ label: 'Minta jemput', onKlik: (k) => nav('/jemput?ajukan=' + k, { replace: true }) }} />
    </div>
  );
}
