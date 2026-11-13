import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CircleCheck } from 'lucide-react';
import { KATEGORI } from '../data/kategori';
import { persen, hariNama, inisial, angka } from '../lib/format';

/* ---------- lapisan di dalam layar HP (sheet, toast, pemindai) ---------- */
const LapisCtx = createContext(null);
const ToastCtx = createContext(() => {});
const CetakCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export const useCetak = () => useContext(CetakCtx);

export function LapisProvider({ children }) {
  const [el, setEl] = useState(null);
  const [pesan, setPesan] = useState(null);
  const [cetakan, setCetakan] = useState(null);
  const t = useRef();
  const tampil = useCallback((m) => { setPesan(m); clearTimeout(t.current); t.current = setTimeout(() => setPesan(null), 2600); }, []);
  const cetak = useCallback((node) => { setCetakan(node); setTimeout(() => window.print(), 180); }, []);
  return (
    <LapisCtx.Provider value={el}>
      <ToastCtx.Provider value={tampil}>
        <CetakCtx.Provider value={cetak}>
          {children}
          <div id="lapis" ref={setEl}>
            {pesan && <div className="toast" role="status"><CircleCheck size={18} />{pesan}</div>}
          </div>
          {cetakan && createPortal(cetakan, document.getElementById('cetak'))}
        </CetakCtx.Provider>
      </ToastCtx.Provider>
    </LapisCtx.Provider>
  );
}
export function Lapis({ children }) {
  const el = useContext(LapisCtx);
  return el ? createPortal(children, el) : null;
}

/* ---------- bottom sheet ---------- */
export function Sheet({ judul, onTutup, children, aksi }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onTutup();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onTutup]);
  return (
    <Lapis>
      <div className="sheet-latar" onClick={onTutup}>
        <div className="sheet" role="dialog" aria-modal="true" aria-label={judul} onClick={(e) => e.stopPropagation()}>
          <div className="pegangan" />
          {judul && <div className="baris antara"><h2>{judul}</h2>{aksi}</div>}
          {children}
        </div>
      </div>
    </Lapis>
  );
}

/* ---------- kepala halaman dengan tombol kembali ---------- */
export function Kepala({ judul, sub, kembali = true, kanan }) {
  const nav = useNavigate();
  return (
    <div className="kepala">
      {kembali && <button className="ikon-btn" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="Kembali"><ArrowLeft size={20} /></button>}
      <div className="isi"><h1 className="potong">{judul}</h1>{sub && <div className="muted kecil potong">{sub}</div>}</div>
      {kanan}
    </div>
  );
}

export const Avatar = ({ nama, ukuran = 42, warna }) => (
  <div className="avatar" style={{ width: ukuran, height: ukuran, borderRadius: ukuran * 0.34, fontSize: ukuran * 0.34, ...(warna ? { background: warna, color: '#fff' } : {}) }}>{inisial(nama)}</div>
);

export function IkonKategori({ k, ukuran = 42 }) {
  const kat = KATEGORI[k];
  if (!kat) return null;
  const { Ikon } = kat;
  return <div className="ikon-kotak" style={{ background: kat.warna, width: ukuran, height: ukuran, borderRadius: ukuran * 0.34 }}><Ikon size={ukuran * 0.5} /></div>;
}

/* ---------- langkah status (stepper) ---------- */
export function LangkahStatus({ langkah, kini }) {
  return (
    <div className="langkah-status">
      {langkah.map((l, i) => (
        <div key={l} className={`l ${i < kini ? 'lewat' : i === kini ? 'kini' : ''}`}>
          <i>{i < kini ? <Check size={14} /> : i + 1}</i>{l}
        </div>
      ))}
    </div>
  );
}

/* ---------- gauge keyakinan ---------- */
export function Gauge({ nilai, warna }) {
  const r = 62, c = Math.PI * r;
  const arc = `M 13 76 A ${r} ${r} 0 0 1 137 76`;
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(nilai), 60); return () => clearTimeout(t); }, [nilai]);
  return (
    <div className="gauge" aria-label={`Keyakinan ${persen(nilai)}`}>
      <svg viewBox="0 0 150 86">
        <path d={arc} fill="none" stroke="var(--garis)" strokeWidth="13" strokeLinecap="round" />
        <path d={arc} fill="none" stroke={warna} strokeWidth="13" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="nilai"><b>{persen(nilai)}</b><span className="muted kecil">keyakinan</span></div>
    </div>
  );
}

/* ---------- cincin progres ---------- */
export function Cincin({ nilai, ukuran = 84, tebal = 9, warna = 'var(--hijau)', jalur = 'var(--garis)', children }) {
  const r = (ukuran - tebal) / 2, c = 2 * Math.PI * r;
  const [v, setV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setV(Math.max(0, Math.min(1, nilai))), 60); return () => clearTimeout(t); }, [nilai]);
  return (
    <div className="cincin" style={{ width: ukuran, height: ukuran }}>
      <svg width={ukuran} height={ukuran}>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={jalur} strokeWidth={tebal} />
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={warna} strokeWidth={tebal} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="tengah">{children}</div>
    </div>
  );
}

/* ---------- donat komposisi (kunci: 'berat' atau 'n') ---------- */
export function Donat({ daftar, kunci = 'berat', label = 'kg' }) {
  const r = 52, c = 2 * Math.PI * r;
  const total = daftar.reduce((a, d) => a + d[kunci], 0);
  let offset = 0;
  const ada = daftar.filter((d) => d[kunci] > 0);
  return (
    <div className="donat">
      <svg viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--garis)" strokeWidth="18" />
        {ada.map((d) => {
          const len = (d[kunci] / total) * c;
          const el = <circle key={d.k} cx="70" cy="70" r={r} fill="none" stroke={KATEGORI[d.k].warna} strokeWidth="18" strokeDasharray={`${Math.max(len - 2, 0.5)} ${c}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </svg>
      <div className="tengah"><b style={{ fontSize: '1.45rem', lineHeight: 1, letterSpacing: '-.03em' }}>{angka(total, kunci === 'berat' ? 1 : 0)}</b><span className="muted kecil">{label}</span></div>
    </div>
  );
}
export function Legenda({ daftar, kunci = 'berat', maks = 5 }) {
  const urut = [...daftar].filter((d) => d[kunci] > 0).sort((a, b) => b[kunci] - a[kunci]).slice(0, maks);
  const total = daftar.reduce((a, d) => a + d[kunci], 0) || 1;
  return (
    <div className="legenda">
      {urut.map((d) => (
        <div key={d.k} className="baris" style={{ gap: 8 }}>
          <span className="titik" style={{ background: KATEGORI[d.k].warna }} />
          <span className="isi potong">{KATEGORI[d.k].nama}</span>
          <b className="angka">{persen(d[kunci] / total)}</b>
        </div>
      ))}
    </div>
  );
}

/* ---------- batang proporsi dengan selang kepercayaan ---------- */
export function BatangProporsi({ daftar }) {
  const maks = Math.max(0.01, ...daftar.map((d) => d.ci[1]));
  return (
    <div className="kolom" style={{ gap: 10 }}>
      {daftar.map((d) => (
        <div key={d.k}>
          <div className="baris antara kecil" style={{ marginBottom: 4 }}>
            <span className="baris" style={{ gap: 6 }}><span className="titik" style={{ background: KATEGORI[d.k].warna }} />{KATEGORI[d.k].nama}</span>
            <span><b>{persen(d.porsi, 1)}</b> <span className="muted">({persen(d.ci[0])} sampai {persen(d.ci[1])})</span></span>
          </div>
          <div className="bar">
            <i style={{ width: `${(d.porsi / maks) * 100}%`, background: KATEGORI[d.k].warna }} />
            {d.n > 0 && <span className="ci" style={{ left: `${(d.ci[0] / maks) * 100}%`, width: `${((d.ci[1] - d.ci[0]) / maks) * 100}%` }} />}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- grafik batang harian; ketuk batang untuk melihat nilainya ---------- */
export function GrafikHarian({ data, kunci = 'berat', format = (v) => angka(v, 1) }) {
  const [pilih, setPilih] = useState(data.length - 1);
  const maks = Math.max(1e-9, ...data.map((d) => d[kunci]));
  const W = 320, H = 120, lebar = W / data.length;
  const p = data[Math.min(pilih, data.length - 1)];
  return (
    <div>
      <div className="baris antara" style={{ marginBottom: 6 }}>
        <span className="muted kecil">{new Date(p.t).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        <b className="angka">{format(p[kunci])}</b>
      </div>
      <svg className="grafik" viewBox={`0 0 ${W} ${H + 20}`} role="img" aria-label="Grafik harian">
        {[0.5, 1].map((g) => <line key={g} x1="0" x2={W} y1={H - (H - 10) * g} y2={H - (H - 10) * g} stroke="var(--garis)" strokeDasharray="3 5" />)}
        {data.map((d, i) => {
          const tinggi = (d[kunci] / maks) * (H - 10);
          return (
            <g key={d.t} onClick={() => setPilih(i)} style={{ cursor: 'pointer' }}>
              <rect x={i * lebar} y="0" width={lebar} height={H} fill="transparent" />
              <rect x={i * lebar + lebar * 0.18} y={H - Math.max(tinggi, 3)} width={lebar * 0.64} height={Math.max(tinggi, 3)} rx={Math.min(6, lebar * 0.3)} fill={i === pilih ? 'var(--hijau)' : 'var(--mint)'} opacity={d[kunci] ? (i === pilih ? 1 : 0.5) : 0.18} style={{ transition: 'opacity .2s' }} />
              {(data.length <= 8 || i % Math.ceil(data.length / 7) === 0) && <text x={i * lebar + lebar / 2} y={H + 14} fontSize="9" fontWeight="600" textAnchor="middle" fill="var(--teks3)">{data.length <= 8 ? hariNama(d.t) : new Date(d.t).getDate()}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const Kosong = ({ ikon, judul, children }) => (
  <div className="kosong"><div className="bulat">{ikon}</div><b style={{ color: 'var(--teks)' }}>{judul}</b><div>{children}</div></div>
);

export const Saklar = ({ nyala, onUbah, label }) => <button type="button" className={`saklar ${nyala ? 'nyala' : ''}`} role="switch" aria-checked={nyala} aria-label={label} onClick={() => onUbah(!nyala)} />;
