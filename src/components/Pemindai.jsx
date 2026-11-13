// Pemindai layar penuh: kamera atau unggah foto, klasifikasi di perangkat, lalu petugas memastikan
// kategori, memilih jenis, dan mengisi berat. Tanpa model, alurnya sama tetapi kategori dipilih manual.
import { useEffect, useRef, useState, useCallback } from 'react';
import { ImagePlus, X, Check, TriangleAlert, Loader2, SwitchCamera, Camera, Minus, Plus, RefreshCw, Sparkles, Hand, Cpu } from 'lucide-react';
import { KATEGORI, URUTAN, jenisBawaan } from '../data/kategori';
import { useStore } from '../lib/store.jsx';
import { klasifikasi, muatModel, infoModel } from '../lib/classifier';
import { bitmapDariFile, keCanvas, mini } from '../lib/image';
import { hargaJenis } from '../lib/hitung';
import { Gauge, IkonKategori, Lapis, useToast } from './ui.jsx';
import { persen, rupiah, desimal, angka } from '../lib/format';

const LANGKAH = ['Memeriksa gambar', 'Mengekstrak ciri visual', 'Menghitung peluang tiap kategori'];
const tunggu = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Pemindai({ mode = 'setor', tanpaFoto = false, onTambah, onTutup, aksiCek }) {
  const { state } = useStore();
  const tampil = useToast();
  const { ambang } = state.pengaturan;
  const [tahap, setTahap] = useState(tanpaFoto ? 'hasil' : 'kamera'); // kamera | proses | hasil
  const [aliran, setAliran] = useState(null);
  const [galat, setGalat] = useState('');
  const [langkah, setLangkah] = useState(0);
  const [pratinjau, setPratinjau] = useState('');
  const [canvas, setCanvas] = useState(null);
  const [hasil, setHasil] = useState(null);
  const [kategori, setKategori] = useState(null);
  const [jenis, setJenis] = useState(null);
  const [berat, setBerat] = useState('');
  const [model, setModel] = useState(infoModel());
  const [hadap, setHadap] = useState('environment');
  const [jumlah, setJumlah] = useState(0);
  const video = useRef(null);
  const aliranRef = useRef(null);
  const urut = useRef(0);
  const fileA = useRef(null);
  const fileB = useRef(null);

  useEffect(() => { muatModel().then(setModel); }, []);

  const matikan = useCallback(() => {
    urut.current += 1;
    aliranRef.current?.getTracks().forEach((t) => t.stop());
    aliranRef.current = null; setAliran(null);
  }, []);

  const buka = useCallback(async (menghadap) => {
    setGalat('');
    aliranRef.current?.getTracks().forEach((t) => t.stop());
    const tiket = ++urut.current;
    if (!navigator.mediaDevices?.getUserMedia) { setGalat('Browser ini tidak mendukung kamera langsung.'); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: menghadap }, width: { ideal: 1280 } }, audio: false });
      if (tiket !== urut.current) { s.getTracks().forEach((t) => t.stop()); return; }
      aliranRef.current = s; setAliran(s);
    } catch {
      if (tiket === urut.current) setGalat('Kamera tidak bisa dibuka. Izin ditolak atau perangkat tidak punya kamera.');
    }
  }, []);

  useEffect(() => { if (!tanpaFoto) buka('environment'); return matikan; }, [tanpaFoto, buka, matikan]);
  useEffect(() => { if (video.current && aliran && tahap === 'kamera') { video.current.srcObject = aliran; video.current.play().catch(() => {}); } }, [aliran, tahap]);

  const pilihKategori = (k) => { setKategori(k); setJenis(k ? jenisBawaan(k) : null); };

  const proses = async (sumber) => {
    const c = keCanvas(sumber, 640);
    setCanvas(c); setPratinjau(c.toDataURL('image/jpeg', 0.85));
    setTahap('proses'); setLangkah(0);
    const info = await muatModel(); setModel(info);
    let h = null;
    if (info.tahap === 'siap') {
      await tunggu(320); setLangkah(1);
      const t0 = performance.now();
      try { h = await klasifikasi(c); } catch { h = null; }
      const sisa = Math.max(0, 1200 - (performance.now() - t0));
      await tunggu(sisa * 0.5); setLangkah(2); await tunggu(Math.max(sisa * 0.5, 240));
    } else { await tunggu(450); }
    setLangkah(3); await tunggu(220);
    setHasil(h);
    const top = h?.top3?.[0];
    pilihKategori(top && top.p >= ambang ? top.k : null);
    setBerat('');
    setTahap('hasil');
  };

  const ambilFrame = () => {
    const v = video.current; if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    matikan(); proses(c);
  };
  const dariFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    matikan();
    try { proses(await bitmapDariFile(f)); } catch { tampil('Foto tidak bisa dibaca'); }
  };
  const ulang = () => { setHasil(null); setCanvas(null); setPratinjau(''); pilihKategori(null); setBerat(''); setTahap('kamera'); buka(hadap); };

  const top1 = hasil?.top3?.[0];
  const manual = !hasil;
  const ragu = !manual && top1.p < ambang;
  const dikoreksi = !manual && !!kategori && kategori !== top1.k;
  const kat = kategori ? KATEGORI[kategori] : null;
  const b = desimal(berat);
  const harga = jenis ? hargaJenis(state, jenis) : 0;

  const tambah = () => {
    if (!kategori) { tampil('Pilih kategori dulu'); return; }
    if (b <= 0) { tampil('Isi berat hasil timbangan'); return; }
    onTambah({ kategori, jenis, berat: b, harga, nilai: Math.round(b * harga), prediksi: top1 ? top1.k : null, conf: top1 ? top1.p : null, sumber: manual ? 'manual' : 'model', dikoreksi, foto: canvas ? mini(canvas) : null });
    tampil(`${kat.nama} ${angka(b, 2)} kg ditambahkan`);
    if (tanpaFoto) { onTutup(); return; }
    setJumlah((n) => n + 1); ulang();
  };
  const geser = (d) => setBerat(String(Math.max(0, Math.round((b + d) * 10) / 10)).replace('.', ','));

  return (
    <Lapis>
      <div className="pemindai" style={tanpaFoto ? { background: 'rgba(3,14,10,.6)' } : undefined}>
        <div className="atas" style={tanpaFoto ? { display: 'none' } : undefined}>
          <button className="tb" onClick={onTutup} aria-label="Tutup pemindai"><X size={22} /></button>
          <span className={`chip ${model.tahap === 'siap' ? 'lime' : 'kaca'}`}>{model.tahap === 'siap' ? <><Cpu size={13} /> AI DI HP</> : model.tahap === 'memuat' ? <><Loader2 size={13} className="putar" /> MEMUAT MODEL</> : <><Hand size={13} /> MODE MANUAL</>}</span>
          {jumlah > 0 ? <button className="btn lime kecil" onClick={onTutup}>Selesai ({jumlah})</button> : <span style={{ width: 42 }} />}
        </div>

        <div className="tampil" style={tanpaFoto ? { display: 'none' } : undefined}>
          {tahap === 'kamera' && aliran && <video ref={video} playsInline muted />}
          {tahap === 'kamera' && !aliran && (
            <div className="tanpa">
              {galat ? <TriangleAlert size={40} color="var(--kuning)" /> : <Loader2 size={36} className="putar" color="var(--lime)" />}
              <b>{galat || 'Membuka kamera...'}</b>
              {galat && <span style={{ opacity: .75, fontSize: '.86rem' }}>Anda tetap bisa mengambil foto lewat kamera bawaan HP atau memilih dari galeri.</span>}
              {galat && <button className="btn lime" onClick={() => fileB.current.click()}><Camera size={18} /> Ambil foto</button>}
              {galat && <button className="btn sekunder" onClick={() => fileA.current.click()}><ImagePlus size={18} /> Pilih dari galeri</button>}
            </div>
          )}
          {tahap !== 'kamera' && pratinjau && <img src={pratinjau} alt="Foto yang dipindai" style={tahap === 'hasil' ? { filter: 'brightness(.55)' } : undefined} />}
          {tahap !== 'hasil' && (aliran || tahap === 'proses') && <div className="bidik"><i /><i /><i /><i /></div>}
          {tahap === 'proses' && <div className="laser" />}
        </div>

        {tahap === 'kamera' && aliran && (
          <>
            <div className="petunjuk">Satu benda per foto, penuhi bingkai, cahaya cukup</div>
            <div className="kendali">
              <button className="tb" onClick={() => fileA.current.click()} aria-label="Pilih dari galeri"><ImagePlus size={22} /></button>
              <button className="rana" onClick={ambilFrame} aria-label="Ambil foto" />
              <button className="tb" onClick={() => { const h = hadap === 'environment' ? 'user' : 'environment'; setHadap(h); buka(h); }} aria-label="Ganti kamera"><SwitchCamera size={22} /></button>
            </div>
          </>
        )}
        {tahap === 'proses' && (
          <div className="proses">
            {LANGKAH.map((t, i) => (
              <div key={t} className={`l ${langkah > i ? 'selesai' : langkah === i ? 'jalan' : ''}`}>
                {langkah > i ? <Check size={17} /> : langkah === i ? <Loader2 size={17} className="putar" /> : <span style={{ width: 17 }} />}{model.tahap === 'siap' ? t : i === 0 ? 'Menyiapkan foto' : i === 1 ? 'Model belum terpasang' : 'Lanjut pilih kategori manual'}
              </div>
            ))}
          </div>
        )}
        <input ref={fileA} type="file" accept="image/*" hidden onChange={dariFile} />
        <input ref={fileB} type="file" accept="image/*" capture="environment" hidden onChange={dariFile} />

        {tahap === 'hasil' && (
          <div className="sheet-latar" style={{ background: tanpaFoto ? 'transparent' : undefined }}>
            <div className="sheet" role="dialog" aria-label="Hasil pindai">
              <div className="pegangan" />
              <div className="baris">
                {pratinjau ? <img className="foto-mini" style={{ width: 64, height: 64, borderRadius: 18 }} src={pratinjau} alt="Foto" /> : <div className="ikon-lembut" style={{ width: 56, height: 56 }}><Hand size={26} /></div>}
                <div className="isi kolom" style={{ gap: 3 }}>
                  {manual ? (<><span><span className="chip kuning"><Hand size={13} /> Pilih manual</span></span><b>{tanpaFoto ? 'Tambah item tanpa foto' : 'Model belum terpasang'}</b></>)
                    : ragu ? (<><span><span className="chip kuning"><TriangleAlert size={13} /> Perlu dicek</span></span><b>Model ragu ({persen(top1.p)})</b><span className="muted kecil">Dugaan: {KATEGORI[top1.k].nama}. Pilih kategori yang benar.</span></>)
                    : (<><span><span className="chip"><Sparkles size={13} /> Dugaan model</span></span><b style={{ fontSize: '1.3rem', letterSpacing: '-.02em' }}>{KATEGORI[top1.k].nama}</b><span className="muted kecil">Dihitung di perangkat dalam {hasil.ms} ms</span></>)}
                </div>
              </div>

              {!manual && (
                <div className="kartu kolom" style={{ gap: 10 }}>
                  <Gauge nilai={top1.p} warna={ragu ? 'var(--kuning)' : KATEGORI[top1.k].warna} />
                  {hasil.top3.map((t) => (
                    <div className="baris kecil" key={t.k}>
                      <span style={{ width: 86 }} className="potong">{KATEGORI[t.k].nama}</span>
                      <div className="bar isi"><i style={{ width: `${t.p * 100}%`, background: KATEGORI[t.k].warna }} /></div>
                      <b className="angka" style={{ width: 40, textAlign: 'right' }}>{persen(t.p)}</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="kolom" style={{ gap: 8 }}>
                <span className="mini">{manual || ragu ? 'Pilih kategori' : 'Sudah benar? Ketuk untuk mengoreksi'}</span>
                <div className="pil-kat">
                  {URUTAN.map((k) => <button key={k} className={kategori === k ? 'aktif' : ''} onClick={() => pilihKategori(k)}><IkonKategori k={k} ukuran={36} />{KATEGORI[k].nama}</button>)}
                </div>
                {dikoreksi && <div className="spanduk biru kecil"><Check size={16} />Koreksi Anda dicatat untuk mengukur akurasi lapangan.</div>}
              </div>

              {kat && (
                <div className="kolom" style={{ gap: 8 }}>
                  <span className="mini">Jenis dan harga per kg</span>
                  <div className="pilihan">
                    {kat.jenis.map((j) => <button key={j.id} className={jenis === j.id ? 'aktif' : ''} onClick={() => setJenis(j.id)}>{j.nama}<small>{hargaJenis(state, j.id) ? rupiah(hargaJenis(state, j.id)) + '/kg' : 'tanpa harga'}</small></button>)}
                  </div>
                </div>
              )}

              {mode === 'setor' && kat && (
                <div className="kolom" style={{ gap: 8 }}>
                  <span className="mini">Berat hasil timbangan (kg)</span>
                  <div className="berat-besar">
                    <button onClick={() => geser(-0.1)} aria-label="Kurangi 0,1 kg"><Minus size={20} /></button>
                    <input type="text" inputMode="decimal" placeholder="0,0" value={berat} onChange={(e) => setBerat(e.target.value.replace(/[^0-9.,]/g, ''))} aria-label="Berat kg" />
                    <button onClick={() => geser(0.1)} aria-label="Naikkan 0,1 kg"><Plus size={20} /></button>
                  </div>
                  <div className="gulir-x">{[0.5, 1, 2, 5].map((v) => <button key={v} className="pil" onClick={() => geser(v)}>+{angka(v)} kg</button>)}</div>
                  <div className="kartu rapat baris antara"><span className="muted">Nilai setoran</span><b className="angka" style={{ fontSize: '1.2rem' }}>{rupiah(b * harga)}</b></div>
                </div>
              )}

              {mode === 'cek' && kat && (
                <div className="kartu garis-kiri kolom" style={{ gap: 8, borderLeftColor: kat.warna }}>
                  <div className="baris antara"><h3>Saran penanganan</h3><span className="chip">{kat.jalur}</span></div>
                  <p className="muted kecil">{kat.jalurDetail}</p>
                  <ol className="rapi">{kat.langkah.map((l) => <li key={l}>{l}</li>)}</ol>
                  <p className="kecil"><b>Perhatian:</b> {kat.jangan}</p>
                </div>
              )}

              <div className="grid2">
                {tanpaFoto ? <button className="btn sekunder" onClick={onTutup}>Batal</button> : <button className="btn sekunder" onClick={ulang}><RefreshCw size={18} /> Pindai lagi</button>}
                {mode === 'setor' ? <button className="btn" onClick={tambah} disabled={!kategori}><Plus size={18} /> Tambah</button>
                  : aksiCek ? <button className="btn" onClick={() => aksiCek.onKlik(kategori)} disabled={!kategori}>{aksiCek.label}</button> : <button className="btn" onClick={onTutup}>Selesai</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </Lapis>
  );
}
