// Stok gudang dihitung otomatis: total disetor dikurangi total yang sudah dijual ke pengepul.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Warehouse, Store, PackageCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { KATEGORI, URUTAN, JENIS } from '../data/kategori';
import { stok, hargaJenis } from '../lib/hitung';
import { rupiah, rupiahRingkas, angka, desimal, tglPendek } from '../lib/format';
import { Kepala, IkonKategori, Kosong, Sheet, useToast } from '../components/ui.jsx';

export default function Gudang() {
  const { state, jual } = useStore();
  const tampil = useToast();
  const st = useMemo(() => stok(state), [state]);
  const ambang = state.unit.ambangJual || 50;
  const [buka, setBuka] = useState(null);
  const [form, setForm] = useState(null);
  const nilaiStok = Object.entries(st.perJenis).reduce((a, [id, v]) => a + v * hargaJenis(state, id), 0);
  const totalJual = state.penjualan.reduce((a, p) => a + p.total, 0);
  const siap = URUTAN.filter((k) => st.perKategori[k] >= ambang);
  const maks = Math.max(ambang * 1.25, ...URUTAN.map((k) => st.perKategori[k]));

  const mulaiJual = (jenis) => setForm({ jenis, berat: String(st.perJenis[jenis] || 0).replace('.', ','), hargaJual: '', pembeli: '' });
  const simpan = () => {
    const b = desimal(form.berat), h = Math.round(desimal(form.hargaJual));
    const ada = st.perJenis[form.jenis] || 0;
    if (b <= 0) return tampil('Isi berat yang dijual');
    if (b > ada + 1e-6) return tampil(`Stok hanya ${angka(ada, 2)} kg`);
    if (h <= 0) return tampil('Isi harga jual per kg');
    jual({ jenis: form.jenis, berat: b, hargaJual: h, pembeli: form.pembeli.trim() });
    setForm(null); tampil('Penjualan dicatat, stok berkurang');
  };
  const fb = form ? desimal(form.berat) : 0, fh = form ? desimal(form.hargaJual) : 0;
  const beli = form ? hargaJenis(state, form.jenis) : 0;

  return (
    <div className="halaman">
      <Kepala judul="Gudang" sub="Stok dan penjualan ke pengepul" />
      <div className="hero malam">
        <span className="mini">Stok saat ini</span>
        <div className="besar" style={{ marginTop: 6 }}>{angka(st.total, 1)}<small>kg</small></div>
        <div className="grid3" style={{ marginTop: 14 }}>
          <div className="ubin"><span className="mini">Siap jual</span><b>{siap.length} jenis</b></div>
          <div className="ubin"><span className="mini">Modal stok</span><b>{rupiahRingkas(nilaiStok)}</b></div>
          <div className="ubin"><span className="mini">Terjual</span><b>{rupiahRingkas(totalJual)}</b></div>
        </div>
      </div>
      <div className="muted kecil">Garis tegak pada batang adalah ambang siap jual ({ambang} kg per kategori, bisa diubah di Pengaturan). Modal stok dihitung dari harga beli saat ini.</div>

      {st.total > 0 ? URUTAN.filter((k) => st.perKategori[k] > 0).map((k) => {
        const v = st.perKategori[k], terbuka = buka === k;
        return (
          <div key={k} className="kartu kolom" style={{ gap: 10 }}>
            <button className="baris" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', width: '100%' }} onClick={() => setBuka(terbuka ? null : k)} aria-expanded={terbuka}>
              <IkonKategori k={k} />
              <div className="isi">
                <div className="baris antara"><b>{KATEGORI[k].nama}</b><span className="baris" style={{ gap: 6 }}>{v >= ambang && <span className="chip"><PackageCheck size={12} /> Siap jual</span>}<b className="angka">{angka(v, 1)} kg</b></span></div>
                <div className="bar" style={{ marginTop: 6, overflow: 'visible' }}><i style={{ width: `${Math.min(100, (v / maks) * 100)}%`, background: KATEGORI[k].warna }} /><span className="batas" style={{ left: `${(ambang / maks) * 100}%` }} /></div>
              </div>
              {terbuka ? <ChevronUp size={18} className="muted" /> : <ChevronDown size={18} className="muted" />}
            </button>
            {terbuka && KATEGORI[k].jenis.filter((j) => (st.perJenis[j.id] || 0) > 0).map((j) => (
              <div key={j.id} className="baris kecil" style={{ paddingLeft: 52 }}>
                <span className="isi">{j.nama}<div className="muted">harga beli {rupiah(hargaJenis(state, j.id))}/kg</div></span>
                <b className="angka">{angka(st.perJenis[j.id], 1)} kg</b>
                <button className="btn kecil" onClick={() => mulaiJual(j.id)}><Store size={14} /> Jual</button>
              </div>
            ))}
          </div>
        );
      }) : <div className="kartu"><Kosong ikon={<Warehouse size={28} />} judul="Gudang masih kosong">Stok bertambah otomatis setiap setoran disimpan.</Kosong></div>}

      <div className="judul-seksi"><h2>Penjualan terakhir</h2><Link to="/riwayat">Semua</Link></div>
      {state.penjualan.length ? (
        <div className="daftar">
          {state.penjualan.slice(0, 4).map((p) => (
            <div key={p.id} className="item"><div className="ikon-lembut" style={{ background: 'var(--ungu-muda)', color: 'var(--ungu)' }}><Store size={20} /></div><div className="isi"><b className="potong">{JENIS[p.jenis]?.nama}</b><span className="muted kecil">{angka(p.berat, 1)} kg · {p.pembeli || 'Pembeli'} · {tglPendek(p.ts)}{p.demo ? ' · contoh' : ''}</span></div><b className="angka">{rupiah(p.total)}</b></div>
          ))}
        </div>
      ) : <div className="kartu"><Kosong ikon={<Store size={28} />} judul="Belum ada penjualan">Buka salah satu kategori lalu tekan Jual.</Kosong></div>}

      {form && (
        <Sheet judul="Catat penjualan" onTutup={() => setForm(null)}>
          <div className="baris"><IkonKategori k={JENIS[form.jenis].kategori} /><div className="isi"><b>{JENIS[form.jenis].nama}</b><div className="muted kecil">Stok {angka(st.perJenis[form.jenis] || 0, 2)} kg · harga beli {rupiah(beli)}/kg</div></div></div>
          <div className="grid2">
            <label className="f">Berat dijual (kg)<input type="text" inputMode="decimal" value={form.berat} onChange={(e) => setForm({ ...form, berat: e.target.value.replace(/[^0-9.,]/g, '') })} /></label>
            <label className="f">Harga jual per kg<input type="text" inputMode="numeric" placeholder="Rp" value={form.hargaJual} onChange={(e) => setForm({ ...form, hargaJual: e.target.value.replace(/\D/g, '') })} /></label>
          </div>
          <label className="f">Pembeli (opsional)<input type="text" placeholder="Nama pengepul" value={form.pembeli} onChange={(e) => setForm({ ...form, pembeli: e.target.value })} /></label>
          <div className="kartu rapat kolom" style={{ gap: 4 }}>
            <div className="baris antara"><span className="muted">Total penjualan</span><b className="angka">{rupiah(fb * fh)}</b></div>
            <div className="baris antara kecil"><span className="muted">Selisih terhadap harga beli</span><b className="angka" style={{ color: fh >= beli ? 'var(--hijau)' : 'var(--merah)' }}>{rupiah(fb * (fh - beli))}</b></div>
          </div>
          <button className="btn blok" onClick={simpan}><Store size={18} /> Simpan penjualan</button>
        </Sheet>
      )}
    </div>
  );
}
