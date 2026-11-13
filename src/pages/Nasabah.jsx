import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus, Users, ChevronRight, Check, X, HandCoins } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { saldo, totalKg, level } from '../lib/hitung';
import { rupiah, angka, relatif } from '../lib/format';
import { Kepala, Avatar, Kosong, Sheet, useToast } from '../components/ui.jsx';

export default function Nasabah() {
  const { state, akun, tambahNasabah, prosesTarik } = useStore();
  const tampil = useToast();
  const [cari, setCari] = useState('');
  const [baru, setBaru] = useState(null);
  const pengelola = akun.peran === 'pengelola';
  const antre = state.penarikan.filter((p) => p.status === 'diajukan');
  const daftar = useMemo(() => state.nasabah
    .filter((n) => (n.nama + ' ' + n.noAnggota).toLowerCase().includes(cari.trim().toLowerCase()))
    .map((n) => ({ ...n, saldo: saldo(state, n.id).saldo, kg: totalKg(state, n.id) }))
    .sort((a, b) => b.kg - a.kg), [state, cari]);
  const totalSaldo = state.nasabah.reduce((a, n) => a + saldo(state, n.id).saldo, 0);

  const simpan = () => {
    if (baru.nama.trim().length < 2) return tampil('Isi nama nasabah');
    const n = tambahNasabah(baru); setBaru(null); tampil(`${n.nama} terdaftar sebagai ${n.noAnggota}`);
  };

  return (
    <div className="halaman">
      <Kepala judul="Nasabah" sub={`${state.nasabah.length} orang terdaftar`} kanan={<button className="btn kecil" onClick={() => setBaru({ nama: '', hp: '', alamat: '' })}><UserPlus size={16} /> Baru</button>} />
      <div className="grid2">
        <div className="ubin"><span className="mini">Total tabungan nasabah</span><b>{rupiah(totalSaldo)}</b></div>
        <div className="ubin"><span className="mini">Pengajuan tarik</span><b>{antre.length}</b></div>
      </div>

      {antre.length > 0 && (
        <>
          <div className="judul-seksi"><h2>Pengajuan tarik saldo</h2></div>
          {antre.map((p) => {
            const n = state.nasabah.find((x) => x.id === p.nasabahId);
            const sal = n ? saldo(state, n.id) : { saldo: 0 };
            return (
              <div key={p.id} className="kartu kolom" style={{ borderLeft: '5px solid var(--kuning)' }}>
                <div className="baris">
                  <div className="ikon-lembut" style={{ background: 'var(--kuning-muda)', color: 'var(--kuning)' }}><HandCoins size={21} /></div>
                  <div className="isi"><b className="potong" style={{ display: 'block' }}>{n?.nama || 'Nasabah'}</b><span className="muted kecil">{relatif(p.ts)} · saldo {rupiah(sal.saldo)}{p.catatan ? ` · ${p.catatan}` : ''}</span></div>
                  <b className="angka">{rupiah(p.jumlah)}</b>
                </div>
                {pengelola ? (
                  <div className="grid2">
                    <button className="btn bahaya kecil" onClick={() => { prosesTarik(p.id, false); tampil('Pengajuan ditolak, nasabah diberi tahu'); }}><X size={16} /> Tolak</button>
                    <button className="btn kecil" onClick={() => { prosesTarik(p.id, true); tampil('Disetujui, nasabah diberi tahu'); }}><Check size={16} /> Setujui</button>
                  </div>
                ) : <span className="muted kecil">Menunggu persetujuan pengelola.</span>}
              </div>
            );
          })}
        </>
      )}

      <div className="masukan"><Search size={18} /><input type="search" placeholder="Cari nama atau nomor anggota" value={cari} onChange={(e) => setCari(e.target.value)} /></div>
      {daftar.length ? (
        <div className="daftar">
          {daftar.map((n) => (
            <Link key={n.id} to={`/nasabah/${n.id}`} className="item">
              <Avatar nama={n.nama} />
              <div className="isi"><b className="potong">{n.nama}</b><span className="muted kecil">{n.noAnggota} · {angka(n.kg, 1)} kg · {level(n.kg).nama}</span></div>
              <b className="angka kecil">{rupiah(n.saldo)}</b><ChevronRight size={17} className="muted" />
            </Link>
          ))}
        </div>
      ) : <div className="kartu"><Kosong ikon={<Users size={28} />} judul={state.nasabah.length ? 'Tidak ditemukan' : 'Belum ada nasabah'}>Daftarkan nasabah pertama dari tombol Baru.</Kosong></div>}

      {baru && (
        <Sheet judul="Nasabah baru" onTutup={() => setBaru(null)}>
          <label className="f">Nama lengkap<input type="text" value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} placeholder="Nama nasabah" /></label>
          <label className="f">Nomor HP (opsional)<input type="tel" value={baru.hp} onChange={(e) => setBaru({ ...baru, hp: e.target.value })} placeholder="08xx" /></label>
          <label className="f">Alamat (opsional)<input type="text" value={baru.alamat} onChange={(e) => setBaru({ ...baru, alamat: e.target.value })} placeholder="Jalan, nomor, RT/RW" /></label>
          <button className="btn blok" onClick={simpan}><UserPlus size={18} /> Daftarkan</button>
        </Sheet>
      )}
    </div>
  );
}
