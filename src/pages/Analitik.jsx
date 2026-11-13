import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartColumn, FileText, ArrowRight, Target, Sparkles, Medal } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { KATEGORI } from '../data/kategori';
import { semuaItem, ringkas, harian, akurasiLapangan, seringTertukar, peringkat, mulaiHari, HARI } from '../lib/hitung';
import { rupiah, rupiahRingkas, angka, persen, kg } from '../lib/format';
import { Kepala, Donat, Legenda, BatangProporsi, GrafikHarian, Kosong, Avatar, Cincin } from '../components/ui.jsx';

const RENTANG = [[7, '7 hari'], [14, '14 hari'], [30, '30 hari']];

export default function Analitik() {
  const { state } = useStore();
  const [hari, setHari] = useState(14);
  const [kunci, setKunci] = useState('berat');
  const dari = mulaiHari() - (hari - 1) * HARI;
  const setoran = useMemo(() => state.setoran.filter((s) => s.ts >= dari), [state.setoran, dari]);
  const items = useMemo(() => semuaItem(setoran), [setoran]);
  const r = useMemo(() => ringkas(items), [items]);
  const tren = useMemo(() => harian(setoran, hari), [setoran, hari]);
  const aku = useMemo(() => akurasiLapangan(semuaItem(state.setoran)), [state.setoran]);
  const tukar = useMemo(() => seringTertukar(semuaItem(state.setoran)), [state.setoran]);
  const top = useMemo(() => peringkat(state, dari).slice(0, 5), [state, dari]);
  const aktif = new Set(setoran.map((s) => s.nasabahId).filter(Boolean)).size;

  return (
    <div className="halaman">
      <Kepala judul="Analitik" kembali={false} kanan={<Link to="/laporan" className="btn kecil sekunder"><FileText size={15} /> Laporan</Link>} />
      <div className="gulir-x">{RENTANG.map(([v, l]) => <button key={v} className={`pil ${hari === v ? 'aktif' : ''}`} onClick={() => setHari(v)}>{l}</button>)}</div>

      <div className="hero malam">
        <span className="mini">Total terkumpul {hari} hari</span>
        <div className="besar" style={{ marginTop: 6 }}>{angka(r.berat, 1)}<small>kg</small></div>
        <div className="grid3" style={{ marginTop: 14 }}>
          <div className="ubin"><span className="mini">Nilai</span><b>{rupiahRingkas(r.nilai)}</b></div>
          <div className="ubin"><span className="mini">Transaksi</span><b>{setoran.length}</b></div>
          <div className="ubin"><span className="mini">Nasabah</span><b>{aktif}</b></div>
        </div>
      </div>

      {!setoran.length ? <div className="kartu"><Kosong ikon={<ChartColumn size={28} />} judul="Belum ada data pada rentang ini">Grafik muncul setelah ada setoran yang disimpan.</Kosong></div> : (
        <>
          <div className="kartu kolom">
            <div className="baris antara"><h2>Tren harian</h2>
              <div className="tab" style={{ padding: 3 }}>
                <button style={{ minHeight: 30, padding: '0 10px' }} className={kunci === 'berat' ? 'aktif' : ''} onClick={() => setKunci('berat')}>kg</button>
                <button style={{ minHeight: 30, padding: '0 10px' }} className={kunci === 'nilai' ? 'aktif' : ''} onClick={() => setKunci('nilai')}>Rp</button>
              </div>
            </div>
            <GrafikHarian data={tren} kunci={kunci} format={(v) => (kunci === 'berat' ? kg(v) : rupiah(v))} />
            <span className="muted kecil">Ketuk batang untuk melihat angka per hari.</span>
          </div>

          <div className="kartu kolom">
            <h2>Komposisi menurut berat</h2>
            <div className="baris" style={{ gap: 16 }}><Donat daftar={r.daftar} /><Legenda daftar={r.daftar} maks={6} /></div>
          </div>

          <div className="kartu kolom">
            <h2>Proporsi item per kategori</h2>
            <span className="muted kecil">Dihitung dari {r.n} item. Batang gelap adalah selang kepercayaan 95% (Wilson): makin sedikit data, makin lebar.</span>
            <BatangProporsi daftar={r.daftar.filter((d) => d.n > 0)} />
          </div>

          {top.length > 0 && (
            <div className="kartu kolom">
              <h2>Nasabah teraktif</h2>
              {top.map((t, i) => (
                <div key={t.nasabahId} className="baris">
                  <span className="angka muted" style={{ width: 18 }}>{i + 1}</span>
                  <Avatar nama={t.nama} ukuran={36} />
                  <div className="isi"><b className="potong" style={{ display: 'block' }}>{t.nama}</b><div className="bar" style={{ marginTop: 4 }}><i style={{ width: `${(t.berat / top[0].berat) * 100}%` }} /></div></div>
                  <b className="angka kecil">{angka(t.berat, 1)} kg</b>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="kartu kolom">
        <div className="baris antara"><h2>Akurasi lapangan model</h2><span className="chip abu"><Sparkles size={12} /> dari koreksi petugas</span></div>
        {aku.n ? (
          <>
            <div className="baris" style={{ gap: 14 }}>
              <Cincin nilai={aku.p}><span>{persen(aku.p)}</span></Cincin>
              <div className="isi">
                <div><b>{aku.benar} dari {aku.n}</b> tebakan model tidak dikoreksi petugas.</div>
                <div className="muted kecil">Selang kepercayaan 95%: {persen(aku.ci[0])} sampai {persen(aku.ci[1])}.</div>
              </div>
            </div>
            {tukar.length > 0 && (
              <div className="kolom" style={{ gap: 6 }}>
                <span className="mini">Paling sering tertukar</span>
                {tukar.map((t) => <div key={t.dari + t.ke} className="baris kecil"><span className="chip merah">{KATEGORI[t.dari].nama}</span><ArrowRight size={14} className="muted" /><span className="chip">{KATEGORI[t.ke].nama}</span><span className="isi" /><b>{t.n} kali</b></div>)}
              </div>
            )}
            {aku.n < 30 && <span className="muted kecil">Data masih sedikit. Angka ini baru bisa dipegang setelah puluhan item.</span>}
          </>
        ) : <p className="muted kecil">Belum ada item yang ditebak model. Angka ini terisi sendiri saat petugas memakai Pindai foto: setiap koreksi kategori dihitung sebagai tebakan yang salah. Data contoh tidak ikut dihitung.</p>}
      </div>

      <Link to="/laporan" className="kartu rapat tekan baris"><div className="ikon-lembut"><Medal size={21} /></div><div className="isi"><b>Laporan bulanan otomatis</b><div className="muted kecil">Ringkasan siap cetak atau simpan sebagai PDF</div></div><ArrowRight size={18} className="muted" /></Link>
      <div className="muted kecil rata"><Target size={12} style={{ verticalAlign: -1 }} /> Semua angka dihitung dari transaksi yang tersimpan di perangkat ini.</div>
    </div>
  );
}
