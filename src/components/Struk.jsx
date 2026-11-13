import { Share2, Printer, Recycle } from 'lucide-react';
import { KATEGORI, JENIS } from '../data/kategori';
import { useStore } from '../lib/store.jsx';
import { saldo } from '../lib/hitung';
import { rupiah, kg, tglJam, angka, bagikan } from '../lib/format';
import { useToast, useCetak } from './ui.jsx';

export const noStruk = (s) => 'STR-' + s.id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase();
const namaJenis = (it) => JENIS[it.jenis]?.nama || KATEGORI[it.kategori]?.nama || it.kategori;

export function teksStruk(state, s) {
  const n = state.nasabah.find((x) => x.id === s.nasabahId);
  const baris = [
    `*${state.unit.nama}*`, `Struk setoran ${noStruk(s)}`, tglJam(s.ts), `Nasabah: ${n ? n.nama : 'Umum'}`, '',
    ...s.items.map((it) => `- ${namaJenis(it)}: ${angka(it.berat, 2)} kg x ${rupiah(it.harga)} = ${rupiah(it.nilai)}`),
    '', `Total berat: ${kg(s.berat)}`, `Total nilai: ${rupiah(s.total)}`,
  ];
  if (n) baris.push(`Poin: +${s.poin}`, `Saldo tabungan: ${rupiah(saldo(state, n.id).saldo)}`);
  baris.push('', 'Dicatat dengan Pilahin');
  return baris.join('\n');
}

export function Struk({ s }) {
  const { state } = useStore();
  const tampil = useToast();
  const cetak = useCetak();
  const n = state.nasabah.find((x) => x.id === s.nasabahId);
  const sal = n ? saldo(state, n.id) : null;

  const bagi = async () => {
    const h = await bagikan('Struk setoran', teksStruk(state, s));
    if (h === 'salin') tampil('Struk disalin, tempel di WhatsApp');
    if (h === 'gagal') tampil('Tidak bisa membagikan di perangkat ini');
  };
  const cetakStruk = () => cetak(
    <div>
      <h1>{state.unit.nama}</h1>
      <div className="kecil">Struk setoran {noStruk(s)} · {tglJam(s.ts)} · Petugas: {s.petugasNama || '-'}</div>
      <div>Nasabah: <b>{n ? `${n.nama} (${n.noAnggota})` : 'Umum'}</b></div>
      <table>
        <thead><tr><th>Jenis</th><th className="kanan">Berat</th><th className="kanan">Harga/kg</th><th className="kanan">Nilai</th></tr></thead>
        <tbody>
          {s.items.map((it) => <tr key={it.id}><td>{namaJenis(it)}</td><td className="kanan">{angka(it.berat, 2)} kg</td><td className="kanan">{rupiah(it.harga)}</td><td className="kanan">{rupiah(it.nilai)}</td></tr>)}
          <tr><td><b>Total</b></td><td className="kanan"><b>{kg(s.berat)}</b></td><td /><td className="kanan"><b>{rupiah(s.total)}</b></td></tr>
        </tbody>
      </table>
      {n && <p>Poin: +{s.poin}. Saldo tabungan saat dicetak: {rupiah(sal.saldo)}.</p>}
      <p className="kecil">Dicetak dari aplikasi Pilahin.</p>
    </div>,
  );

  return (
    <div className="kolom">
      <div className="struk">
        <div className="baris">
          <div className="logo" style={{ width: 36, height: 36, borderRadius: 12, boxShadow: 'none' }}><Recycle size={18} /></div>
          <div className="isi"><b className="potong" style={{ display: 'block' }}>{state.unit.nama}</b><span className="muted kecil">{noStruk(s)} · {tglJam(s.ts)}</span></div>
          {s.demo && <span className="chip kuning">CONTOH</span>}
        </div>
        <div className="baris antara kecil" style={{ marginTop: 12 }}><span className="muted">Nasabah</span><b>{n ? n.nama : 'Umum'}</b></div>
        <div className="baris antara kecil"><span className="muted">Petugas</span><b>{s.petugasNama || '-'}</b></div>
        <div className="putus" />
        <table><tbody>
          {s.items.map((it) => (
            <tr key={it.id}><td>{namaJenis(it)}<div className="muted" style={{ fontSize: '.74rem' }}>{angka(it.berat, 2)} kg x {rupiah(it.harga)}</div></td><td>{rupiah(it.nilai)}</td></tr>
          ))}
        </tbody></table>
        <div className="putus" />
        <div className="baris antara"><span className="muted">Total berat</span><b className="angka">{kg(s.berat)}</b></div>
        <div className="baris antara" style={{ marginTop: 4 }}><b>Total nilai</b><b className="angka" style={{ fontSize: '1.3rem', color: 'var(--hijau)' }}>{rupiah(s.total)}</b></div>
        {n && <div className="baris antara kecil" style={{ marginTop: 6 }}><span className="muted">Poin didapat</span><span className="chip lime">+{s.poin} poin</span></div>}
        {n && <div className="baris antara kecil" style={{ marginTop: 6 }}><span className="muted">Saldo tabungan kini</span><b>{rupiah(sal.saldo)}</b></div>}
      </div>
      <div className="grid2">
        <button className="btn sekunder" onClick={bagi}><Share2 size={18} /> Bagikan</button>
        <button className="btn sekunder" onClick={cetakStruk}><Printer size={18} /> Cetak / PDF</button>
      </div>
    </div>
  );
}
