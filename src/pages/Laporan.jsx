// Laporan bulanan disusun otomatis dari transaksi. Bisa dicetak atau disimpan sebagai PDF lewat dialog cetak.
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Printer, Download, FileText } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { KATEGORI } from '../data/kategori';
import { semuaItem, ringkas, dalam, mulaiBulan, akhirBulan, peringkat } from '../lib/hitung';
import { rupiah, kg, angka, persen, bulanNama, keCSV, unduh, tglPanjang } from '../lib/format';
import { Kepala, Kosong, useCetak, useToast } from '../components/ui.jsx';

export default function Laporan() {
  const { state } = useStore();
  const cetak = useCetak();
  const tampil = useToast();
  const [geser, setGeser] = useState(0);
  const acuan = useMemo(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + geser); return d.getTime(); }, [geser]);
  const dari = mulaiBulan(acuan), sampai = akhirBulan(acuan);
  const setoran = dalam(state.setoran, dari, sampai);
  const r = ringkas(semuaItem(setoran));
  const tarik = dalam(state.penarikan, dari, sampai).filter((p) => p.status === 'disetujui');
  const jual = dalam(state.penjualan, dari, sampai);
  const top = peringkat(state, dari, sampai).slice(0, 5);
  const aktif = new Set(setoran.map((s) => s.nasabahId).filter(Boolean)).size;
  const totalTarik = tarik.reduce((a, p) => a + p.jumlah, 0), totalJual = jual.reduce((a, p) => a + p.total, 0);
  const kategori = r.daftar.filter((d) => d.berat > 0).sort((a, b) => b.berat - a.berat);
  const adaContoh = setoran.some((s) => s.demo);

  const Isi = ({ cetakan }) => (
    <div className={cetakan ? '' : 'kolom'}>
      {cetakan && <><h1>Laporan bulanan {state.unit.nama}</h1><div className="kecil">{bulanNama(acuan)} · dibuat {tglPanjang(Date.now())}{adaContoh ? ' · MEMUAT DATA CONTOH' : ''}</div></>}
      {cetakan && <h2>Ringkasan</h2>}
      <table style={cetakan ? undefined : { width: '100%', fontSize: '.88rem', borderCollapse: 'collapse' }}>
        <tbody>
          {[['Total berat terkumpul', kg(r.berat)], ['Nilai setoran nasabah', rupiah(r.nilai)], ['Jumlah transaksi', setoran.length], ['Nasabah aktif', aktif], ['Penarikan saldo', rupiah(totalTarik)], ['Penjualan ke pengepul', rupiah(totalJual)]].map(([a, b]) => (
            <tr key={a}><td style={cetakan ? undefined : { padding: '5px 0', color: 'var(--teks2)' }}>{a}</td><td className="kanan" style={cetakan ? undefined : { textAlign: 'right', fontWeight: 800 }}>{b}</td></tr>
          ))}
        </tbody>
      </table>
      {cetakan && (
        <>
          <h2>Komposisi per kategori</h2>
          <table><thead><tr><th>Kategori</th><th className="kanan">Berat</th><th className="kanan">Porsi</th><th className="kanan">Nilai</th></tr></thead>
            <tbody>{kategori.map((d) => <tr key={d.k}><td>{KATEGORI[d.k].nama}</td><td className="kanan">{kg(d.berat)}</td><td className="kanan">{persen(d.porsiBerat, 1)}</td><td className="kanan">{rupiah(d.nilai)}</td></tr>)}</tbody></table>
          <h2>Nasabah teraktif</h2>
          <table><thead><tr><th>Nama</th><th className="kanan">Setoran</th><th className="kanan">Berat</th><th className="kanan">Nilai</th></tr></thead>
            <tbody>{top.map((t) => <tr key={t.nasabahId}><td>{t.nama}</td><td className="kanan">{t.n}</td><td className="kanan">{kg(t.berat)}</td><td className="kanan">{rupiah(t.nilai)}</td></tr>)}</tbody></table>
          <p className="kecil">Disusun otomatis oleh aplikasi Pilahin dari transaksi yang tercatat di perangkat.</p>
        </>
      )}
    </div>
  );

  const ekspor = () => {
    const baris = [['bagian', 'nama', 'berat_kg', 'nilai_rp', 'jumlah'], ...kategori.map((d) => ['kategori', KATEGORI[d.k].nama, d.berat.toFixed(2), d.nilai, d.n]), ...top.map((t) => ['nasabah', t.nama, t.berat.toFixed(2), t.nilai, t.n]), ['ringkasan', 'penarikan', '', totalTarik, tarik.length], ['ringkasan', 'penjualan', jual.reduce((a, p) => a + p.berat, 0).toFixed(2), totalJual, jual.length]];
    unduh(`pilahin_laporan_${new Date(acuan).toISOString().slice(0, 7)}.csv`, keCSV(baris)); tampil('CSV diunduh');
  };

  return (
    <div className="halaman">
      <Kepala judul="Laporan bulanan" sub="Disusun otomatis dari transaksi" />
      <div className="kartu rapat baris antara">
        <button className="ikon-btn" onClick={() => setGeser(geser - 1)} aria-label="Bulan sebelumnya"><ChevronLeft size={19} /></button>
        <b>{bulanNama(acuan)}</b>
        <button className="ikon-btn" onClick={() => setGeser(geser + 1)} disabled={geser >= 0} style={geser >= 0 ? { opacity: .35 } : undefined} aria-label="Bulan berikutnya"><ChevronRight size={19} /></button>
      </div>
      {setoran.length || tarik.length || jual.length ? (
        <>
          {adaContoh && <div className="pita-demo">Bulan ini memuat data contoh.</div>}
          <div className="kartu"><Isi /></div>
          {kategori.length > 0 && (
            <div className="kartu kolom" style={{ gap: 9 }}>
              <h2>Komposisi per kategori</h2>
              {kategori.map((d) => (
                <div key={d.k}>
                  <div className="baris antara kecil" style={{ marginBottom: 4 }}><span className="baris" style={{ gap: 6 }}><span className="titik" style={{ background: KATEGORI[d.k].warna }} />{KATEGORI[d.k].nama}</span><span><b>{angka(d.berat, 1)} kg</b> <span className="muted">({persen(d.porsiBerat)})</span></span></div>
                  <div className="bar"><i style={{ width: `${d.porsiBerat * 100}%`, background: KATEGORI[d.k].warna }} /></div>
                </div>
              ))}
            </div>
          )}
          <div className="grid2">
            <button className="btn sekunder" onClick={ekspor}><Download size={18} /> CSV</button>
            <button className="btn" onClick={() => cetak(<Isi cetakan />)}><Printer size={18} /> Cetak / PDF</button>
          </div>
        </>
      ) : <div className="kartu"><Kosong ikon={<FileText size={28} />} judul="Tidak ada transaksi bulan ini">Pilih bulan lain atau catat setoran terlebih dulu.</Kosong></div>}
    </div>
  );
}
