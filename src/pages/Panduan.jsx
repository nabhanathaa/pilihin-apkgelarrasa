import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Trophy, Send, BookOpen, MessageCircle, Bot, TriangleAlert } from 'lucide-react';
import { daftarKategori, KATEGORI } from '../data/kategori';
import { cariBarang } from '../data/barang';
import { useStore } from '../lib/store.jsx';
import { hargaJenis } from '../lib/hitung';
import { jawab, CONTOH_TANYA } from '../lib/tanya';
import { rupiah } from '../lib/format';
import { Kepala, IkonKategori, Sheet, Kosong } from '../components/ui.jsx';

function Tanya() {
  const { state } = useStore();
  const [pesan, setPesan] = useState([{ dari: 'bot', teks: 'Halo, saya Tanya Pilah. Sebutkan nama barang atau tanyakan soal harga, jemput, tarik saldo, dan poin.' }]);
  const [teks, setTeks] = useState('');
  const [ketik, setKetik] = useState(false);
  const ujung = useRef(null);
  const t = useRef();
  useEffect(() => { ujung.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [pesan, ketik]);
  useEffect(() => () => clearTimeout(t.current), []);
  const kirim = (isi) => {
    const q = (isi ?? teks).trim();
    if (!q || ketik) return;
    setPesan((p) => [...p, { dari: 'saya', teks: q }]); setTeks(''); setKetik(true);
    t.current = setTimeout(() => { setPesan((p) => [...p, { dari: 'bot', ...jawab(q, state) }]); setKetik(false); }, 550);
  };
  return (
    <>
      <div className="spanduk info kecil"><Bot size={16} /><span>Asisten ini bekerja dengan aturan dan basis data panduan di aplikasi. Bukan AI generatif, dan pertanyaan Anda tidak dikirim ke mana pun.</span></div>
      <div className="obrolan" aria-live="polite">
        {pesan.map((m, i) => (
          <div key={i} className={`gelembung ${m.dari === 'saya' ? 'saya' : ''}`}>
            <span style={{ whiteSpace: 'pre-line' }}>{m.teks}</span>
            {m.tautan && <div style={{ marginTop: 8 }}><Link className="chip" to={m.tautan.to}>{m.tautan.label}</Link></div>}
          </div>
        ))}
        {ketik && <div className="gelembung"><span className="ketik"><i /><i /><i /></span></div>}
        <div ref={ujung} />
      </div>
      <div className="gulir-x">{CONTOH_TANYA.map((c) => <button key={c} className="pil" onClick={() => kirim(c)}>{c}</button>)}</div>
      <form className="kirim" onSubmit={(e) => { e.preventDefault(); kirim(); }}>
        <input type="text" placeholder="Ketik pertanyaan..." value={teks} onChange={(e) => setTeks(e.target.value)} aria-label="Pertanyaan" />
        <button type="submit" aria-label="Kirim"><Send size={19} /></button>
      </form>
    </>
  );
}

export default function Panduan() {
  const { state } = useStore();
  const [param, setParam] = useSearchParams();
  const tab = param.get('tab') === 'tanya' ? 'tanya' : 'panduan';
  const [q, setQ] = useState('');
  const [buka, setBuka] = useState(() => (KATEGORI[param.get('k')] ? param.get('k') : null));
  useEffect(() => { const k = param.get('k'); if (KATEGORI[k]) setBuka(k); }, [param]);
  const hasil = cariBarang(q);
  const kat = buka ? KATEGORI[buka] : null;
  const gantiTab = (t) => setParam(t === 'tanya' ? { tab: 'tanya' } : {}, { replace: true });

  return (
    <div className="halaman">
      <Kepala judul="Panduan pilah" sub="Delapan kategori, cari barang, dan tanya jawab" />
      <div className="tab">
        <button className={tab === 'panduan' ? 'aktif' : ''} onClick={() => gantiTab('panduan')}><BookOpen size={15} /> Panduan</button>
        <button className={tab === 'tanya' ? 'aktif' : ''} onClick={() => gantiTab('tanya')}><MessageCircle size={15} /> Tanya Pilah</button>
      </div>

      {tab === 'tanya' ? <Tanya /> : (
        <>
          <div className="masukan"><Search size={18} /><input type="search" placeholder="Cari barang, misalnya baterai atau kaleng" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          {q.trim() && (hasil.length ? (
            <div className="daftar">
              {hasil.map((h) => (
                <button key={h.nama} className="item" onClick={() => setBuka(h.kategori)}>
                  <IkonKategori k={h.kategori} ukuran={38} />
                  <div className="isi"><b>{h.nama}</b><span className="muted kecil">{h.catatan}</span></div>
                  <span className="chip">{KATEGORI[h.kategori].nama}</span>
                </button>
              ))}
            </div>
          ) : <div className="kartu"><Kosong ikon={<Search size={26} />} judul="Barang tidak ditemukan">Coba kata lain, pindai barangnya, atau tanyakan di Tanya Pilah.</Kosong></div>)}
          <div className="judul-seksi"><h2>Delapan kategori</h2></div>
          <div className="grid2">
            {daftarKategori().map((k) => (
              <button key={k.id} className="kartu tekan kolom" style={{ gap: 8 }} onClick={() => setBuka(k.id)}>
                <IkonKategori k={k.id} ukuran={46} />
                <b>{k.nama}</b>
                <span><span className="chip abu">{k.jalur}</span></span>
              </button>
            ))}
          </div>
          <Link to="/kuis" className="btn"><Trophy size={18} /> Uji pemahaman dengan kuis</Link>
        </>
      )}

      {kat && (
        <Sheet judul={kat.nama} onTutup={() => { setBuka(null); if (param.get('k')) setParam({}, { replace: true }); }} aksi={<span className="chip">{kat.jalur}</span>}>
          <p className="muted">{kat.jalurDetail}</p>
          <div className="kartu kolom" style={{ gap: 6 }}><b>Cara memilah</b><ol className="rapi">{kat.langkah.map((l) => <li key={l}>{l}</li>)}</ol></div>
          <div className="spanduk kecil"><TriangleAlert size={16} /><span><b>Perhatian:</b> {kat.jangan}</span></div>
          <div className="kartu kolom" style={{ gap: 6 }}>
            <b>Jenis dan harga beli</b>
            {kat.jenis.map((j) => <div key={j.id} className="baris antara kecil"><span>{j.nama}</span><b>{hargaJenis(state, j.id) ? rupiah(hargaJenis(state, j.id)) + '/kg' : 'tanpa harga'}</b></div>)}
          </div>
          <div className="baris" style={{ flexWrap: 'wrap', gap: 6 }}>{kat.contoh.map((c) => <span key={c} className="chip abu">{c}</span>)}</div>
        </Sheet>
      )}
    </div>
  );
}
