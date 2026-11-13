import { ShieldCheck, WifiOff, Brain, TriangleAlert, Cpu } from 'lucide-react';
import { useModel } from '../lib/useModel';
import { Kepala } from '../components/ui.jsx';

const STATUS = { siap: ['Model aktif', ''], 'tidak-ada': ['Model belum terpasang', 'kuning'], memuat: ['Memuat model', ''], belum: ['Belum dimuat', ''] };

export default function Tentang() {
  const m = useModel();
  const [label, kelas] = STATUS[m.tahap] || STATUS.belum;
  const meta = m.meta || {};

  return (
    <div className="halaman">
      <Kepala judul="Tentang model AI" sub="Cara kerja, privasi, dan batasan" />
      <div className="kartu kolom">
        <div className="baris antara"><h2>Status model</h2><span className={`chip ${kelas}`}>{label}</span></div>
        {m.tahap === 'siap' ? (
          <div className="kolom" style={{ gap: 6 }}>
            <div className="baris antara"><span className="muted">Versi</span><b>{meta.versi || '-'}</b></div>
            <div className="baris antara"><span className="muted">Arsitektur</span><b>{meta.arsitektur || '-'}</b></div>
            <div className="baris antara"><span className="muted">Ukuran masukan</span><b>{meta.input_size || 224} px</b></div>
            <div className="baris antara"><span className="muted">Kelas</span><b>{(meta.labels || []).length}</b></div>
            {meta.kesesuaian_oof != null && <div className="baris antara"><span className="muted">Kesesuaian OOF terhadap label guru</span><b>{(meta.kesesuaian_oof * 100).toFixed(1)}%</b></div>}
            {meta.catatan && <p className="muted kecil">{meta.catatan}</p>}
          </div>
        ) : (
          <div className="kolom" style={{ gap: 8 }}>
            <p className="muted">Berkas <code>public/models/pilahin.onnx</code> dan <code>labels.json</code> belum ada, sehingga pemindai bekerja dalam mode manual (petugas memilih kategori sendiri).</p>
            <p className="muted kecil">Cara memasang: jalankan skrip <code>ml/train_export.py</code> di Kaggle, unduh dua berkas hasilnya ke <code>public/models/</code>, commit, lalu push. Langkah lengkap ada di README.</p>
            {m.galat && <p className="kecil muted">Detail: {m.galat}</p>}
          </div>
        )}
      </div>

      <div className="kartu kolom">
        <h2>Cara kerja</h2>
        <div className="baris" style={{ alignItems: 'flex-start' }}><Brain size={20} color="var(--hijau)" style={{ flex: 'none', marginTop: 3 }} /><p>Foto diperkecil lalu dihitung oleh model ringan yang berjalan langsung di browser (ONNX Runtime). Model ini dilatih menirukan ensemble yang lebih besar (DINOv2, ConvNeXt, dan EfficientNetV2) pada delapan kategori: kaca, kertas, elektronik, logam, plastik, kardus, tekstil, dan sisa makanan.</p></div>
        <div className="baris" style={{ alignItems: 'flex-start' }}><ShieldCheck size={20} color="var(--hijau)" style={{ flex: 'none', marginTop: 3 }} /><p><b>Privasi.</b> Foto tidak dikirim ke server mana pun. Riwayat tersimpan hanya di perangkat ini.</p></div>
        <div className="baris" style={{ alignItems: 'flex-start' }}><WifiOff size={20} color="var(--hijau)" style={{ flex: 'none', marginTop: 3 }} /><p><b>Offline.</b> Setelah dibuka sekali dengan internet, model dan aplikasi tersimpan sehingga bisa dipakai tanpa jaringan.</p></div>
        <div className="baris" style={{ alignItems: 'flex-start' }}><Cpu size={20} color="var(--hijau)" style={{ flex: 'none', marginTop: 3 }} /><p><b>Opsi menolak.</b> Bila keyakinan di bawah ambang, aplikasi tidak memaksa jawaban dan meminta pemeriksaan petugas.</p></div>
      </div>

      <div className="kartu kolom">
        <h2>Batasan yang perlu diketahui</h2>
        <div className="spanduk"><TriangleAlert size={20} style={{ flex: 'none' }} /><div>Model dilatih dari foto pada data kompetisi dengan label semu, dan belum diuji pada foto lapangan. Akurasi di lapangan bisa lebih rendah, terutama untuk kamera, cahaya, dan latar yang berbeda.</div></div>
        <ul className="rapi muted">
          <li>Satu benda per foto. Foto tumpukan campur belum didukung.</li>
          <li>Kategori mengikuti data pelatihan: kemasan karton (misalnya susu UHT) termasuk kardus.</li>
          <li>Model hanya menebak kategori. Jenis (varian harga) dan berat tetap ditentukan petugas.</li>
          <li>Harga dan saran penanganan bersifat panduan umum; sesuaikan dengan aturan dan harga setempat.</li>
          <li>Akun, peran, dan notifikasi berjalan di perangkat ini. Sinkron antarperangkat butuh server dan termasuk pengembangan lanjutan.</li>
          <li>Menu Analitik menghitung akurasi lapangan dari koreksi petugas. Gunakan sebagai uji awal sebelum klaim manfaat.</li>
        </ul>
      </div>
    </div>
  );
}
