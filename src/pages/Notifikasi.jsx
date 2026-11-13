import { useNavigate } from 'react-router-dom';
import { Bell, Truck, HandCoins, Scale, Gift, Warehouse, Target, Trophy, CheckCheck } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { notifAkun } from '../lib/hitung';
import { relatif } from '../lib/format';
import { Kepala, Kosong } from '../components/ui.jsx';

const IKON = { jemput: [Truck, 'var(--biru)', 'var(--biru-muda)'], tarik: [HandCoins, 'var(--kuning)', 'var(--kuning-muda)'], setor: [Scale, 'var(--hijau)', 'var(--hijau-muda)'], tukar: [Gift, 'var(--ungu)', 'var(--ungu-muda)'], stok: [Warehouse, 'var(--ungu)', 'var(--ungu-muda)'], target: [Target, 'var(--hijau)', 'var(--hijau-muda)'], level: [Trophy, '#d97706', 'var(--kuning-muda)'] };

export default function Notifikasi() {
  const { state, akun, bacaNotif } = useStore();
  const nav = useNavigate();
  const list = notifAkun(state, akun);
  const belum = list.filter((n) => !n.dibaca.includes(akun.id));
  return (
    <div className="halaman">
      <Kepala judul="Notifikasi" sub={belum.length ? `${belum.length} belum dibaca` : 'Semua sudah dibaca'} kanan={belum.length > 0 && <button className="btn kecil sekunder" onClick={() => bacaNotif(belum.map((n) => n.id))}><CheckCheck size={15} /> Baca semua</button>} />
      {list.length ? (
        <div className="daftar">
          {list.map((n) => {
            const [Ikon, warna, latar] = IKON[n.jenis] || [Bell, 'var(--hijau)', 'var(--hijau-muda)'];
            const baru = !n.dibaca.includes(akun.id);
            return (
              <button key={n.id} className="item" style={{ alignItems: 'flex-start', background: baru ? 'var(--kartu2)' : undefined }} onClick={() => { bacaNotif([n.id]); if (n.tautan) nav(n.tautan); }}>
                <div className="ikon-lembut" style={{ background: latar, color: warna }}><Ikon size={20} /></div>
                <div className="isi"><b>{n.judul}</b><span className="muted kecil" style={{ display: 'block' }}>{n.isi}</span><span className="mini" style={{ marginTop: 4, display: 'block' }}>{relatif(n.ts)}{n.demo ? ' · contoh' : ''}</span></div>
                {baru && <span style={{ width: 10, height: 10, borderRadius: 5, background: 'var(--merah)', flex: 'none', marginTop: 6 }} />}
              </button>
            );
          })}
        </div>
      ) : <div className="kartu"><Kosong ikon={<Bell size={28} />} judul="Belum ada notifikasi">Kabar setoran, penjemputan, penarikan, dan stok akan muncul di sini secara otomatis.</Kosong></div>}
    </div>
  );
}
