import { Share2, Info } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { KATEGORI, URUTAN } from '../data/kategori';
import { hargaJenis } from '../lib/hitung';
import { rupiah, bagikan } from '../lib/format';
import { Kepala, IkonKategori, useToast } from '../components/ui.jsx';

export default function Harga() {
  const { state, akun, ubahHarga } = useStore();
  const tampil = useToast();
  const edit = akun.peran === 'pengelola';
  const bagi = async () => {
    const teks = [`*Daftar harga ${state.unit.nama}*`, ...URUTAN.flatMap((k) => ['', `${KATEGORI[k].nama}:`, ...KATEGORI[k].jenis.map((j) => `- ${j.nama}: ${hargaJenis(state, j.id) ? rupiah(hargaJenis(state, j.id)) + '/kg' : 'tanpa harga'}`)])].join('\n');
    const h = await bagikan('Daftar harga', teks);
    if (h === 'salin') tampil('Daftar harga disalin');
    if (h === 'gagal') tampil('Tidak bisa membagikan di perangkat ini');
  };
  return (
    <div className="halaman">
      <Kepala judul="Daftar harga" sub="Harga beli per kilogram" kanan={<button className="ikon-btn" onClick={bagi} aria-label="Bagikan daftar harga"><Share2 size={18} /></button>} />
      <div className="spanduk info kecil"><Info size={16} /><span>Harga bawaan hanyalah perkiraan awal. {edit ? 'Ubah sesuai harga pengepul setempat; perubahan langsung dipakai pada setoran berikutnya.' : 'Pengelola memperbaruinya mengikuti harga pengepul.'}</span></div>
      {URUTAN.map((k) => (
        <div key={k} className="kartu kolom" style={{ gap: 10 }}>
          <div className="baris"><IkonKategori k={k} ukuran={38} /><div className="isi"><b>{KATEGORI[k].nama}</b><div className="muted kecil">{KATEGORI[k].jalur}</div></div></div>
          {KATEGORI[k].jenis.map((j) => (
            <div key={j.id} className="baris antara">
              <span className="isi kecil">{j.nama}</span>
              {edit ? <input type="number" inputMode="numeric" min="0" step="100" aria-label={`Harga ${j.nama}`} style={{ width: 118, minHeight: 40, textAlign: 'right' }} value={hargaJenis(state, j.id)} onChange={(e) => ubahHarga(j.id, Math.max(0, Math.round(Number(e.target.value) || 0)))} />
                : <b className="angka">{hargaJenis(state, j.id) ? rupiah(hargaJenis(state, j.id)) : <span className="muted kecil">tanpa harga</span>}</b>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
