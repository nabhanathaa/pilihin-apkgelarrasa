import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, RotateCcw, Trophy, Coins } from 'lucide-react';
import { buatKuis } from '../data/barang';
import { KATEGORI } from '../data/kategori';
import { useStore } from '../lib/store.jsx';
import { mulaiHari } from '../lib/hitung';
import { Kepala, IkonKategori } from '../components/ui.jsx';

const BONUS = 5, LULUS = 6;

export default function Kuis() {
  const { state, akun, bonus } = useStore();
  const [soal, setSoal] = useState(() => buatKuis(8));
  const [i, setI] = useState(0);
  const [pilih, setPilih] = useState(null);
  const [skor, setSkor] = useState(0);
  const [dapat, setDapat] = useState(false);
  const selesai = i >= soal.length;
  const nasabahId = akun.peran === 'nasabah' ? akun.nasabahId : null;
  const sudahHariIni = nasabahId ? state.bonusPoin.some((b) => b.nasabahId === nasabahId && b.alasan === 'kuis' && b.ts >= mulaiHari()) : false;

  const jawab = (k) => { if (pilih) return; setPilih(k); if (k === soal[i].jawab) setSkor((s) => s + 1); };
  const lanjut = () => {
    setPilih(null);
    if (i + 1 === soal.length && nasabahId && skor >= LULUS && !sudahHariIni && state.nasabah.some((n) => n.id === nasabahId)) { bonus(nasabahId, BONUS, 'kuis'); setDapat(true); }
    setI((x) => x + 1);
  };
  const ulang = () => { setSoal(buatKuis(8)); setI(0); setPilih(null); setSkor(0); setDapat(false); };

  if (selesai) {
    const p = skor / soal.length;
    return (
      <div className="halaman">
        <Kepala judul="Kuis pilah" />
        <div className="kartu kolom rata" style={{ alignItems: 'center', padding: 28 }}>
          <div className="sukses" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}><Trophy size={38} /></div>
          <h1>{skor} dari {soal.length} benar</h1>
          <p className="muted">{p >= 0.875 ? 'Luar biasa! Anda siap memilah dengan percaya diri.' : p >= 0.5 ? 'Bagus. Buka panduan untuk menguatkan bagian yang masih keliru.' : 'Ayo pelajari panduan pilah lalu coba lagi.'}</p>
          {dapat && <span className="chip lime"><Coins size={13} /> Bonus +{BONUS} poin masuk ke akun Anda</span>}
          {nasabahId && !dapat && <span className="muted kecil">{sudahHariIni ? 'Bonus poin kuis hari ini sudah Anda terima.' : `Jawab benar minimal ${LULUS} soal untuk bonus ${BONUS} poin (sekali sehari).`}</span>}
          <div className="grid2" style={{ width: '100%' }}>
            <button className="btn sekunder" onClick={ulang}><RotateCcw size={18} /> Ulangi</button>
            <Link to="/panduan" className="btn">Buka panduan</Link>
          </div>
        </div>
      </div>
    );
  }

  const s = soal[i];
  return (
    <div className="halaman">
      <Kepala judul="Kuis pilah" sub={`Soal ${i + 1} dari ${soal.length}`} kanan={<span className="chip">Skor {skor}</span>} />
      <div className="bar"><i style={{ width: `${(i / soal.length) * 100}%` }} /></div>
      <div className="hero rata" style={{ padding: 26 }}>
        <span className="mini">Masuk kategori apakah</span>
        <h1 style={{ fontSize: '1.7rem', marginTop: 6 }}>{s.nama}?</h1>
      </div>
      <div className="kuis-opsi">
        {s.pilihan.map((k) => (
          <button key={k} className={pilih ? (k === s.jawab ? 'benar' : k === pilih ? 'salah' : '') : ''} onClick={() => jawab(k)} disabled={!!pilih && k !== pilih && k !== s.jawab}>
            <IkonKategori k={k} ukuran={36} /><span className="isi">{KATEGORI[k].nama}</span>
            {pilih && k === s.jawab && <Check size={20} color="var(--hijau)" />}{pilih && k === pilih && k !== s.jawab && <X size={20} color="var(--merah)" />}
          </button>
        ))}
      </div>
      {pilih && (
        <>
          <div className={`spanduk ${pilih === s.jawab ? 'info' : 'merah'}`}><span><b>{pilih === s.jawab ? 'Benar.' : `Kurang tepat. Jawaban: ${KATEGORI[s.jawab].nama}.`}</b> {s.catatan}</span></div>
          <button className="btn" onClick={lanjut}>{i + 1 === soal.length ? 'Lihat hasil' : 'Soal berikutnya'}</button>
        </>
      )}
    </div>
  );
}
