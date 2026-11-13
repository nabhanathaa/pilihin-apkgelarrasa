import { useMemo, useState } from 'react';
import { Search, Download, ReceiptText, Trash2, ArrowDownLeft, ArrowUpRight, Store, Scale } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { JENIS, KATEGORI } from '../data/kategori';
import { mulaiHari, HARI } from '../lib/hitung';
import { rupiah, rupiahRingkas, kg, tglJam, tglPanjang, jam, keCSV, unduh, angka } from '../lib/format';
import { Kepala, Avatar, Kosong, Sheet, useToast } from '../components/ui.jsx';
import { Struk, noStruk } from '../components/Struk.jsx';

const RENTANG = [['hari', 'Hari ini', 0], ['7', '7 hari', 6], ['30', '30 hari', 29], ['semua', 'Semua', null]];
const STATUS_TARIK = { diajukan: ['Menunggu', 'kuning'], disetujui: ['Disetujui', ''], ditolak: ['Ditolak', 'merah'] };

export default function Riwayat() {
  const { state, akun, hapusSetoran } = useStore();
  const tampil = useToast();
  const staf = akun.peran !== 'nasabah';
  const [tab, setTab] = useState('setor');
  const [rentang, setRentang] = useState('30');
  const [cari, setCari] = useState('');
  const [buka, setBuka] = useState(null);
  const [yakin, setYakin] = useState(false);

  const dari = useMemo(() => { const r = RENTANG.find((x) => x[0] === rentang); return r[2] === null ? 0 : mulaiHari() - r[2] * HARI; }, [rentang]);
  const nama = (id) => state.nasabah.find((n) => n.id === id)?.nama || (id ? 'Nasabah dihapus' : 'Umum');
  const milik = (l) => (staf ? l : l.filter((x) => x.nasabahId === akun.nasabahId));
  const q = cari.trim().toLowerCase();

  const setoran = milik(state.setoran).filter((s) => s.ts >= dari && (!q || nama(s.nasabahId).toLowerCase().includes(q) || s.items.some((it) => (JENIS[it.jenis]?.nama || '').toLowerCase().includes(q))));
  const penarikan = milik(state.penarikan).filter((p) => p.ts >= dari && (!q || nama(p.nasabahId).toLowerCase().includes(q)));
  const penjualan = state.penjualan.filter((p) => p.ts >= dari && (!q || (JENIS[p.jenis]?.nama || '').toLowerCase().includes(q) || p.pembeli.toLowerCase().includes(q)));
  const terbuka = buka ? state.setoran.find((s) => s.id === buka) : null;

  const grup = (list) => {
    const m = new Map();
    for (const x of list) { const h = mulaiHari(x.ts); if (!m.has(h)) m.set(h, []); m.get(h).push(x); }
    return [...m.entries()];
  };
  const ekspor = () => {
    const baris = [['no_struk', 'waktu', 'nasabah', 'petugas', 'kategori', 'jenis', 'berat_kg', 'harga_per_kg', 'nilai', 'sumber', 'prediksi_model', 'keyakinan', 'dikoreksi']];
    for (const s of setoran) for (const it of s.items) baris.push([noStruk(s), new Date(s.ts).toISOString(), nama(s.nasabahId), s.petugasNama, KATEGORI[it.kategori]?.nama, JENIS[it.jenis]?.nama, it.berat, it.harga, it.nilai, it.sumber, it.prediksi || '', it.conf != null ? it.conf.toFixed(3) : '', it.dikoreksi ? 'ya' : 'tidak']);
    unduh(`pilahin_setoran_${new Date().toISOString().slice(0, 10)}.csv`, keCSV(baris));
    tampil('CSV diunduh');
  };

  return (
    <div className="halaman">
      <Kepala judul={staf ? 'Transaksi' : 'Riwayat saya'} kembali={false} kanan={staf && tab === 'setor' && setoran.length > 0 && <button className="ikon-btn" onClick={ekspor} aria-label="Ekspor CSV"><Download size={19} /></button>} />
      <div className="tab">
        <button className={tab === 'setor' ? 'aktif' : ''} onClick={() => setTab('setor')}><ArrowDownLeft size={15} /> Setoran</button>
        <button className={tab === 'tarik' ? 'aktif' : ''} onClick={() => setTab('tarik')}><ArrowUpRight size={15} /> Penarikan</button>
        {staf && <button className={tab === 'jual' ? 'aktif' : ''} onClick={() => setTab('jual')}><Store size={15} /> Penjualan</button>}
      </div>
      {staf && <div className="masukan"><Search size={18} /><input type="search" placeholder="Cari nasabah atau jenis" value={cari} onChange={(e) => setCari(e.target.value)} /></div>}
      <div className="gulir-x">{RENTANG.map(([id, label]) => <button key={id} className={`pil ${rentang === id ? 'aktif' : ''}`} onClick={() => setRentang(id)}>{label}</button>)}</div>

      {tab === 'setor' && (setoran.length ? (
        <>
          <div className="grid3">
            <div className="ubin"><span className="mini">Transaksi</span><b>{setoran.length}</b></div>
            <div className="ubin"><span className="mini">Berat</span><b>{angka(setoran.reduce((a, s) => a + s.berat, 0), 1)} kg</b></div>
            <div className="ubin"><span className="mini">Nilai</span><b>{rupiahRingkas(setoran.reduce((a, s) => a + s.total, 0))}</b></div>
          </div>
          {grup(setoran).map(([hari, list]) => (
            <div key={hari} className="kolom" style={{ gap: 6 }}>
              <span className="mini">{tglPanjang(hari)}</span>
              <div className="daftar">
                {list.map((s) => (
                  <button key={s.id} className="item" onClick={() => { setBuka(s.id); setYakin(false); }}>
                    {staf ? <Avatar nama={nama(s.nasabahId)} ukuran={40} /> : <div className="ikon-lembut"><Scale size={20} /></div>}
                    <div className="isi"><b className="potong">{staf ? nama(s.nasabahId) : `${s.items.length} item · ${kg(s.berat)}`}</b><span className="muted kecil potong" style={{ display: 'block' }}>{staf ? `${s.items.length} item · ${kg(s.berat)} · ` : ''}{jam(s.ts)}{s.demo ? ' · contoh' : ''}</span></div>
                    <b className="angka" style={{ color: 'var(--hijau)' }}>+{rupiah(s.total)}</b>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : <div className="kartu"><Kosong ikon={<ReceiptText size={28} />} judul="Tidak ada setoran">Coba rentang waktu lain{staf ? ' atau mulai setoran baru dari tombol tengah.' : '.'}</Kosong></div>)}

      {tab === 'tarik' && (penarikan.length ? (
        <div className="daftar">
          {penarikan.map((p) => {
            const [label, warna] = STATUS_TARIK[p.status];
            return (
              <div key={p.id} className="item">
                <div className="ikon-lembut" style={{ background: 'var(--kuning-muda)', color: 'var(--kuning)' }}><ArrowUpRight size={20} /></div>
                <div className="isi"><b className="potong">{staf ? nama(p.nasabahId) : 'Tarik saldo'}</b><span className="muted kecil">{tglJam(p.ts)}{p.catatan ? ` · ${p.catatan}` : ''}</span></div>
                <div className="kolom" style={{ alignItems: 'flex-end', gap: 4 }}><b className="angka">-{rupiah(p.jumlah)}</b><span className={`chip ${warna}`}>{label}</span></div>
              </div>
            );
          })}
        </div>
      ) : <div className="kartu"><Kosong ikon={<ArrowUpRight size={28} />} judul="Belum ada penarikan">Penarikan saldo akan tercatat di sini.</Kosong></div>)}

      {tab === 'jual' && staf && (penjualan.length ? (
        <div className="daftar">
          {penjualan.map((p) => (
            <div key={p.id} className="item">
              <div className="ikon-lembut" style={{ background: 'var(--ungu-muda)', color: 'var(--ungu)' }}><Store size={20} /></div>
              <div className="isi"><b className="potong">{JENIS[p.jenis]?.nama}</b><span className="muted kecil">{angka(p.berat, 1)} kg x {rupiah(p.hargaJual)} · {p.pembeli || 'Pembeli'} · {tglJam(p.ts)}</span></div>
              <b className="angka">{rupiah(p.total)}</b>
            </div>
          ))}
        </div>
      ) : <div className="kartu"><Kosong ikon={<Store size={28} />} judul="Belum ada penjualan">Catat penjualan ke pengepul dari menu Gudang.</Kosong></div>)}

      {terbuka && (
        <Sheet judul="Detail setoran" onTutup={() => setBuka(null)}>
          <Struk s={terbuka} />
          {terbuka.catatan && <p className="muted kecil">Catatan: {terbuka.catatan}</p>}
          {akun.peran === 'pengelola' && (yakin
            ? <div className="grid2"><button className="btn sekunder" onClick={() => setYakin(false)}>Batal</button><button className="btn bahaya" onClick={() => { hapusSetoran(terbuka.id); setBuka(null); tampil('Setoran dihapus'); }}>Ya, hapus</button></div>
            : <button className="btn bahaya blok" onClick={() => setYakin(true)}><Trash2 size={17} /> Hapus setoran</button>)}
        </Sheet>
      )}
    </div>
  );
}
