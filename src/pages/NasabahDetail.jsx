import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Scale, HandCoins, Pencil, Trash2, Phone, MapPin, Recycle, ArrowUpRight } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { saldo, poin, totalKg, level } from '../lib/hitung';
import { rupiah, kg, angka, tglJam, tglPendek, desimal } from '../lib/format';
import { Kepala, Kosong, Sheet, useToast } from '../components/ui.jsx';

export default function NasabahDetail() {
  const { id } = useParams();
  const { state, akun, keranjangMulai, catatTarik, ubahNasabah, hapusNasabah } = useStore();
  const nav = useNavigate();
  const tampil = useToast();
  const [tarik, setTarik] = useState(false);
  const [jumlah, setJumlah] = useState('');
  const [edit, setEdit] = useState(null);
  const [yakin, setYakin] = useState(false);
  const n = state.nasabah.find((x) => x.id === id);
  if (!n) return <Navigate to="/nasabah" replace />;
  const sal = saldo(state, n.id), pn = poin(state, n.id), total = totalKg(state, n.id), lv = level(total);
  const setoran = state.setoran.filter((s) => s.nasabahId === n.id);
  const penarikan = state.penarikan.filter((p) => p.nasabahId === n.id);
  const gabung = [...setoran.map((s) => ({ ...s, jenisT: 'setor' })), ...penarikan.map((p) => ({ ...p, jenisT: 'tarik' }))].sort((a, b) => b.ts - a.ts).slice(0, 12);

  const simpanTarik = () => {
    const j = Math.round(desimal(jumlah));
    if (j <= 0) return tampil('Isi jumlah penarikan');
    if (j > sal.tersedia) return tampil('Jumlah melebihi saldo yang tersedia');
    catatTarik(n.id, j, 'Tunai di bank sampah'); setTarik(false); setJumlah(''); tampil('Penarikan dicatat, nasabah diberi tahu');
  };

  return (
    <div className="halaman">
      <Kepala judul="Detail nasabah" kanan={<button className="ikon-btn" onClick={() => setEdit({ nama: n.nama, hp: n.hp || '', alamat: n.alamat || '' })} aria-label="Ubah data"><Pencil size={18} /></button>} />
      <div className="kartu-anggota">
        <div className="baris antara"><span className="baris" style={{ gap: 8, fontWeight: 800 }}><Recycle size={18} color="var(--lime)" /> {state.unit.nama}</span><span className="chip kaca">{lv.nama}</span></div>
        <div style={{ marginTop: 22, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-.02em' }}>{n.nama}</div>
        <div style={{ opacity: .8, letterSpacing: '.12em', fontSize: '.86rem' }}>{n.noAnggota}</div>
        <div className="baris antara" style={{ marginTop: 16 }}>
          <div><div style={{ fontSize: '.68rem', opacity: .7, fontWeight: 700, letterSpacing: '.08em' }}>SALDO</div><div className="angka" style={{ fontSize: '1.5rem' }}>{rupiah(sal.saldo)}</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: '.68rem', opacity: .7, fontWeight: 700, letterSpacing: '.08em' }}>ANGGOTA SEJAK</div><div style={{ fontWeight: 700 }}>{tglPendek(n.sejak)}</div></div>
        </div>
      </div>
      <div className="grid3">
        <div className="ubin"><span className="mini">Poin</span><b>{angka(pn.saldo, 0)}</b></div>
        <div className="ubin"><span className="mini">Disetor</span><b>{angka(total, 1)} kg</b></div>
        <div className="ubin"><span className="mini">Transaksi</span><b>{setoran.length}</b></div>
      </div>
      <div className="grid2">
        <button className="btn" onClick={() => { keranjangMulai(n.id); nav('/setor'); }}><Scale size={18} /> Setor</button>
        <button className="btn sekunder" onClick={() => setTarik(true)} disabled={sal.tersedia <= 0}><HandCoins size={18} /> Tarik saldo</button>
      </div>
      {(n.hp || n.alamat) && (
        <div className="kartu rapat kolom" style={{ gap: 6 }}>
          {n.hp && <div className="baris kecil"><Phone size={15} className="muted" />{n.hp}</div>}
          {n.alamat && <div className="baris kecil"><MapPin size={15} className="muted" />{n.alamat}</div>}
        </div>
      )}
      {sal.tertahan > 0 && <div className="spanduk kecil"><HandCoins size={16} />{rupiah(sal.tertahan)} sedang diajukan nasabah untuk ditarik.</div>}

      <div className="judul-seksi"><h2>Riwayat</h2></div>
      {gabung.length ? (
        <div className="daftar">
          {gabung.map((x) => (x.jenisT === 'setor' ? (
            <div key={x.id} className="item"><div className="ikon-lembut"><Scale size={20} /></div><div className="isi"><b>{kg(x.berat)} · {x.items.length} item</b><span className="muted kecil">{tglJam(x.ts)} · +{x.poin} poin</span></div><b className="angka" style={{ color: 'var(--hijau)' }}>+{rupiah(x.total)}</b></div>
          ) : (
            <div key={x.id} className="item"><div className="ikon-lembut" style={{ background: 'var(--kuning-muda)', color: 'var(--kuning)' }}><ArrowUpRight size={20} /></div><div className="isi"><b>Tarik saldo</b><span className="muted kecil">{tglJam(x.ts)} · {x.status}</span></div><b className="angka">-{rupiah(x.jumlah)}</b></div>
          )))}
        </div>
      ) : <div className="kartu"><Kosong ikon={<Scale size={28} />} judul="Belum ada transaksi">Mulai setoran pertama untuk nasabah ini.</Kosong></div>}

      {akun.peran === 'pengelola' && (yakin
        ? <div className="grid2"><button className="btn sekunder" onClick={() => setYakin(false)}>Batal</button><button className="btn bahaya" onClick={() => { hapusNasabah(n.id); tampil('Nasabah dihapus'); nav('/nasabah', { replace: true }); }}>Ya, hapus</button></div>
        : <button className="btn bahaya blok" onClick={() => setYakin(true)}><Trash2 size={17} /> Hapus nasabah</button>)}

      {tarik && (
        <Sheet judul="Catat penarikan" onTutup={() => setTarik(false)}>
          <div className="kartu rapat baris antara"><span className="muted">Saldo tersedia</span><b className="angka">{rupiah(sal.tersedia)}</b></div>
          <label className="f">Jumlah (Rp)<input type="text" inputMode="numeric" value={jumlah} onChange={(e) => setJumlah(e.target.value.replace(/\D/g, ''))} placeholder="Misalnya 20000" /></label>
          <button className="btn blok" onClick={simpanTarik}>Catat dan serahkan uang</button>
        </Sheet>
      )}
      {edit && (
        <Sheet judul="Ubah data nasabah" onTutup={() => setEdit(null)}>
          <label className="f">Nama<input type="text" value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} /></label>
          <label className="f">Nomor HP<input type="tel" value={edit.hp} onChange={(e) => setEdit({ ...edit, hp: e.target.value })} /></label>
          <label className="f">Alamat<input type="text" value={edit.alamat} onChange={(e) => setEdit({ ...edit, alamat: e.target.value })} /></label>
          <button className="btn blok" onClick={() => { if (edit.nama.trim().length < 2) return tampil('Nama terlalu pendek'); ubahNasabah(n.id, { ...edit, nama: edit.nama.trim() }); setEdit(null); tampil('Data diperbarui'); }}>Simpan</button>
        </Sheet>
      )}
    </div>
  );
}
