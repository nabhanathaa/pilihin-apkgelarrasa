// Alur setoran: pilih nasabah, pindai dan timbang beberapa item, simpan, lalu struk.
// Saat disimpan, aplikasi otomatis memperbarui saldo, poin, stok gudang, notifikasi, dan status jemput.
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Trash2, UserPlus, Search, Users, Check, Sparkles, Hand, Pencil, ScanLine, House, RotateCcw } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { KATEGORI, JENIS } from '../data/kategori';
import { saldo } from '../lib/hitung';
import { rupiah, kg, angka, persen, desimal } from '../lib/format';
import { Kepala, Avatar, IkonKategori, LangkahStatus, Sheet, Kosong, useToast } from '../components/ui.jsx';
import Pemindai from '../components/Pemindai.jsx';
import { Struk } from '../components/Struk.jsx';

const LANGKAH = ['Nasabah', 'Pindai & timbang', 'Struk'];

export default function Setor() {
  const { state, keranjangMulai, keranjangTambah, keranjangUbah, keranjangHapus, keranjangBatal, simpanSetoran, tambahNasabah } = useStore();
  const nav = useNavigate();
  const tampil = useToast();
  const k = state.keranjang;
  const [ganti, setGanti] = useState(false);
  const [cari, setCari] = useState('');
  const [baru, setBaru] = useState(null); // form nasabah baru
  const [pindai, setPindai] = useState(null); // 'kamera' | 'manual'
  const [sunting, setSunting] = useState(null); // item yang diedit
  const [beratEdit, setBeratEdit] = useState('');
  const [catatan, setCatatan] = useState('');
  const [selesai, setSelesai] = useState(null);

  const langkah = selesai ? 2 : !k || ganti ? 0 : 1;
  const nasabah = k ? state.nasabah.find((n) => n.id === k.nasabahId) : null;
  const daftar = useMemo(() => state.nasabah.filter((n) => (n.nama + ' ' + n.noAnggota).toLowerCase().includes(cari.trim().toLowerCase())), [state.nasabah, cari]);
  const items = k?.items || [];
  const berat = items.reduce((a, it) => a + it.berat, 0);
  const total = items.reduce((a, it) => a + it.nilai, 0);
  const poinDapat = nasabah ? Math.round(Math.round(berat * 10) / 10 * state.unit.poinPerKg) : 0;

  const pilih = (id) => { keranjangMulai(id, k?.jemputId || null); setGanti(false); setCari(''); };
  const simpanNasabah = () => {
    if (baru.nama.trim().length < 2) return tampil('Isi nama nasabah');
    const n = tambahNasabah(baru);
    setBaru(null); pilih(n.id); tampil(`${n.nama} terdaftar sebagai ${n.noAnggota}`);
  };
  const simpan = () => {
    const rec = simpanSetoran(catatan.trim());
    if (rec) { setSelesai(rec); setCatatan(''); }
  };
  const batal = () => { keranjangBatal(); setGanti(false); nav('/'); };

  return (
    <div className="halaman tanpa-nav penuh">
      <Kepala judul={selesai ? 'Setoran tersimpan' : 'Setoran baru'} kanan={langkah === 1 && <button className="btn hantu kecil" style={{ color: 'var(--merah)' }} onClick={batal}>Batalkan</button>} />
      <LangkahStatus langkah={LANGKAH} kini={langkah} />

      {langkah === 0 && (
        <>
          <div className="masukan"><Search size={18} /><input type="search" placeholder="Cari nama atau nomor anggota" value={cari} onChange={(e) => setCari(e.target.value)} /></div>
          <div className="grid2">
            <button className="btn sekunder" onClick={() => setBaru({ nama: cari, hp: '', alamat: '' })}><UserPlus size={18} /> Nasabah baru</button>
            <button className="btn sekunder" onClick={() => pilih(null)}><Users size={18} /> Tanpa nasabah</button>
          </div>
          {daftar.length ? (
            <div className="daftar">
              {daftar.map((n) => (
                <button key={n.id} className="item" onClick={() => pilih(n.id)}>
                  <Avatar nama={n.nama} ukuran={40} />
                  <div className="isi"><b className="potong">{n.nama}</b><span className="muted kecil">{n.noAnggota} · saldo {rupiah(saldo(state, n.id).saldo)}</span></div>
                  {k?.nasabahId === n.id && <Check size={18} color="var(--hijau)" />}
                </button>
              ))}
            </div>
          ) : <div className="kartu"><Kosong ikon={<Users size={28} />} judul={state.nasabah.length ? 'Tidak ditemukan' : 'Belum ada nasabah'}>Daftarkan nasabah baru atau lanjut tanpa nasabah untuk setoran umum.</Kosong></div>}
        </>
      )}

      {langkah === 1 && (
        <>
          <div className="kartu rapat baris">
            <Avatar nama={nasabah ? nasabah.nama : 'Umum'} ukuran={44} />
            <div className="isi"><b className="potong">{nasabah ? nasabah.nama : 'Setoran umum'}</b><div className="muted kecil">{nasabah ? `${nasabah.noAnggota} · saldo ${rupiah(saldo(state, nasabah.id).saldo)}` : 'Tidak masuk tabungan siapa pun'}</div></div>
            <button className="btn kecil sekunder" onClick={() => setGanti(true)}>Ganti</button>
          </div>
          {k.jemputId && <div className="spanduk biru kecil"><Check size={16} />Setoran ini berasal dari penjemputan. Status jemput akan otomatis menjadi selesai saat disimpan.</div>}

          <div className="grid2">
            <button className="btn lime" style={{ minHeight: 64 }} onClick={() => setPindai('kamera')}><ScanLine size={22} /> Pindai foto</button>
            <button className="btn sekunder" style={{ minHeight: 64 }} onClick={() => setPindai('manual')}><Hand size={20} /> Tambah manual</button>
          </div>

          {items.length ? (
            <div className="daftar">
              {items.map((it) => (
                <div key={it.id} className="item">
                  {it.foto ? <img className="foto-mini" src={it.foto} alt="" /> : <IkonKategori k={it.kategori} ukuran={46} />}
                  <button className="isi" style={{ background: 'none', border: 0, textAlign: 'left', padding: 0 }} onClick={() => { setSunting(it); setBeratEdit(String(it.berat).replace('.', ',')); }}>
                    <b className="potong">{JENIS[it.jenis]?.nama || KATEGORI[it.kategori].nama}</b>
                    <span className="muted kecil">{angka(it.berat, 2)} kg x {rupiah(it.harga)} <Pencil size={11} style={{ verticalAlign: -1 }} /></span>
                    <div style={{ marginTop: 3 }}>{it.sumber === 'model' ? <span className={`chip ${it.dikoreksi ? 'biru' : ''}`}><Sparkles size={11} /> {it.dikoreksi ? 'AI dikoreksi' : `AI ${persen(it.conf)}`}</span> : <span className="chip abu"><Hand size={11} /> Manual</span>}</div>
                  </button>
                  <div className="kolom" style={{ alignItems: 'flex-end', gap: 6 }}>
                    <b className="angka">{rupiah(it.nilai)}</b>
                    <button className="ikon-btn" style={{ width: 34, height: 34, borderRadius: 11, color: 'var(--merah)' }} onClick={() => keranjangHapus(it.id)} aria-label="Hapus item"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="kartu"><Kosong ikon={<Camera size={28} />} judul="Belum ada item">Pindai tiap jenis sampah lalu isi beratnya. Anda bisa menambah banyak item dalam satu setoran.</Kosong></div>}

          {items.length > 0 && <label className="f">Catatan (opsional)<input type="text" placeholder="Misalnya: botol sudah bersih" value={catatan} onChange={(e) => setCatatan(e.target.value)} /></label>}

          <div className="kaki">
            <div className="baris antara">
              <div><span className="mini">Total {items.length} item</span><div className="angka" style={{ fontSize: '1.05rem' }}>{kg(berat)}{nasabah && <span className="chip lime" style={{ marginLeft: 8 }}>+{poinDapat} poin</span>}</div></div>
              <div style={{ textAlign: 'right' }}><span className="mini">Nilai</span><div className="angka" style={{ fontSize: '1.4rem', color: 'var(--hijau)' }}>{rupiah(total)}</div></div>
            </div>
            <button className="btn blok" disabled={!items.length} onClick={simpan}><Check size={19} /> Simpan setoran</button>
          </div>
        </>
      )}

      {langkah === 2 && (
        <>
          <div className="sukses"><Check size={40} strokeWidth={3} /></div>
          <div className="rata"><h2>Setoran berhasil dicatat</h2><p className="muted kecil">{selesai.nasabahId ? 'Saldo, poin, dan stok gudang sudah diperbarui. Nasabah menerima notifikasi.' : 'Stok gudang sudah diperbarui.'}</p></div>
          <Struk s={selesai} />
          <div className="grid2">
            <button className="btn sekunder" onClick={() => nav('/')}><House size={18} /> Beranda</button>
            <button className="btn" onClick={() => setSelesai(null)}><RotateCcw size={18} /> Setoran baru</button>
          </div>
        </>
      )}

      {baru && (
        <Sheet judul="Nasabah baru" onTutup={() => setBaru(null)}>
          <label className="f">Nama lengkap<input type="text" value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} placeholder="Nama nasabah" /></label>
          <label className="f">Nomor HP (opsional)<input type="tel" value={baru.hp} onChange={(e) => setBaru({ ...baru, hp: e.target.value })} placeholder="08xx" /></label>
          <label className="f">Alamat (opsional)<input type="text" value={baru.alamat} onChange={(e) => setBaru({ ...baru, alamat: e.target.value })} placeholder="Jalan, nomor, RT/RW" /></label>
          <button className="btn blok" onClick={simpanNasabah}><UserPlus size={18} /> Daftarkan dan pilih</button>
        </Sheet>
      )}

      {sunting && (
        <Sheet judul="Ubah berat" onTutup={() => setSunting(null)}>
          <div className="baris"><IkonKategori k={sunting.kategori} /><div className="isi"><b>{JENIS[sunting.jenis]?.nama}</b><div className="muted kecil">{rupiah(sunting.harga)} per kg</div></div></div>
          <label className="f">Berat (kg)<input type="text" inputMode="decimal" value={beratEdit} onChange={(e) => setBeratEdit(e.target.value.replace(/[^0-9.,]/g, ''))} /></label>
          <button className="btn blok" onClick={() => { const b = desimal(beratEdit); if (b <= 0) return tampil('Berat harus lebih dari 0'); keranjangUbah(sunting.id, { berat: b, nilai: Math.round(b * sunting.harga) }); setSunting(null); }}>Simpan</button>
        </Sheet>
      )}

      {pindai && <Pemindai mode="setor" tanpaFoto={pindai === 'manual'} onTambah={keranjangTambah} onTutup={() => setPindai(null)} />}
    </div>
  );
}
