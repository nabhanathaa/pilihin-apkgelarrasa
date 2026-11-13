import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Scale, ScanLine, Users, Truck, Warehouse, Tag, Gift, BookOpen, FileText, ChevronRight, Wallet, Eye, EyeOff, Target, Cpu, Hand, HandCoins, Trophy, MessageCircle, Leaf, Sprout, ArrowRight, FlaskConical, ReceiptText, PackageCheck } from 'lucide-react';
import { useStore, PERAN } from '../lib/store.jsx';
import { KATEGORI } from '../data/kategori';
import { STATUS_JEMPUT, LABEL_JEMPUT } from '../data/status';
import { semuaItem, ringkas, dalam, mulaiHari, mulaiBulan, HARI, saldo, poin, totalKg, level, belumDibaca, antrean } from '../lib/hitung';
import { useModel } from '../lib/useModel';
import { rupiah, rupiahRingkas, angka, kg, salam, namaDepan, relatif, desimal } from '../lib/format';
import { Avatar, Cincin, Donat, Legenda, Kosong, LangkahStatus, Sheet, useToast } from '../components/ui.jsx';


function Atas() {
  const { state, akun } = useStore();
  const n = belumDibaca(state, akun);
  return (
    <>
      <div className="kepala">
        <Avatar nama={akun.nama} ukuran={46} />
        <div className="isi">
          <div className="muted kecil">{salam()},</div>
          <h1 className="potong" style={{ fontSize: '1.3rem' }}>{namaDepan(akun.nama)}</h1>
        </div>
        <span className="chip abu">{PERAN[akun.peran]}</span>
        <Link to="/notifikasi" className="ikon-btn" aria-label={`Notifikasi, ${n} belum dibaca`}><Bell size={20} />{n > 0 && <span className="tanda">{n}</span>}</Link>
      </div>
      {state.demo && <div className="pita-demo"><FlaskConical size={15} /> DATA CONTOH. Angka di bawah rekaan untuk demo, bisa dihapus di Pengaturan.</div>}
    </>
  );
}

function Pintas({ to, Ikon, label, warna, tanda }) {
  return <Link to={to}><div className="kotak" style={{ color: warna }}><Ikon size={24} />{tanda > 0 && <span className="tanda">{tanda}</span>}</div>{label}</Link>;
}

function BerandaStaf() {
  const { state, akun } = useStore();
  const nav = useNavigate();
  const hariIni = useMemo(() => dalam(state.setoran, mulaiHari()), [state.setoran]);
  const berat = hariIni.reduce((a, s) => a + s.berat, 0);
  const nilai = hariIni.reduce((a, s) => a + s.total, 0);
  const dilayani = new Set(hariIni.map((s) => s.nasabahId).filter(Boolean)).size;
  const bulan = dalam(state.setoran, mulaiBulan()).reduce((a, s) => a + s.berat, 0);
  const target = state.unit.targetKg || 0;
  const minggu = useMemo(() => ringkas(semuaItem(dalam(state.setoran, mulaiHari() - 6 * HARI))), [state.setoran]);
  const q = antrean(state);
  const k = state.keranjang;
  const model = useModel();
  const pengelola = akun.peran === 'pengelola';

  return (
    <div className="halaman">
      <Atas />
      <div className={`hero ${pengelola ? 'malam' : ''}`}>
        <div className="baris antara"><span className="mini">Setoran hari ini · {state.unit.nama}</span></div>
        <div className="besar" style={{ marginTop: 6 }}>{angka(berat, 1)}<small>kg</small></div>
        <div className="grid3" style={{ marginTop: 14 }}>
          <div className="ubin"><span className="mini">Transaksi</span><b>{hariIni.length}</b></div>
          <div className="ubin"><span className="mini">Nilai</span><b>{rupiahRingkas(nilai)}</b></div>
          <div className="ubin"><span className="mini">Nasabah</span><b>{dilayani}</b></div>
        </div>
        <button className="btn lime blok" style={{ marginTop: 14 }} onClick={() => nav('/setor')}>
          <Scale size={19} /> {k?.items?.length ? `Lanjutkan setoran (${k.items.length} item)` : 'Mulai setoran baru'} <ArrowRight size={18} />
        </button>
      </div>

      {(q.jemput > 0 || (pengelola && q.tarik > 0) || q.tukar > 0 || q.siapJual.length > 0) && (
        <>
          <div className="judul-seksi"><h2>Perlu tindakan</h2></div>
          <div className="kolom" style={{ gap: 8 }}>
            {q.jemput > 0 && <Link to="/jemput" className="tindakan biru"><div className="ikon-lembut" style={{ background: 'var(--biru-muda)', color: 'var(--biru)' }}><Truck size={21} /></div><div className="isi"><b>{q.jemput} permintaan jemput baru</b><div className="muted kecil">Jadwalkan agar nasabah mendapat kabar</div></div><ChevronRight size={18} className="muted" /></Link>}
            {pengelola && q.tarik > 0 && <Link to="/nasabah" className="tindakan"><div className="ikon-lembut" style={{ background: 'var(--kuning-muda)', color: 'var(--kuning)' }}><HandCoins size={21} /></div><div className="isi"><b>{q.tarik} pengajuan tarik saldo</b><div className="muted kecil">Setujui atau tolak</div></div><ChevronRight size={18} className="muted" /></Link>}
            {q.tukar > 0 && <Link to="/hadiah" className="tindakan ungu"><div className="ikon-lembut" style={{ background: 'var(--ungu-muda)', color: 'var(--ungu)' }}><Gift size={21} /></div><div className="isi"><b>{q.tukar} hadiah menunggu diserahkan</b><div className="muted kecil">Cocokkan kode penukaran</div></div><ChevronRight size={18} className="muted" /></Link>}
            {q.siapJual.length > 0 && <Link to="/gudang" className="tindakan hijau"><div className="ikon-lembut"><PackageCheck size={21} /></div><div className="isi"><b>Stok siap dijual</b><div className="muted kecil potong">{q.siapJual.map((x) => KATEGORI[x].nama).join(', ')} melewati {state.unit.ambangJual} kg</div></div><ChevronRight size={18} className="muted" /></Link>}
          </div>
        </>
      )}

      <div className="pintasan">
        <Pintas to="/pindai" Ikon={ScanLine} label="Pindai cepat" warna="var(--hijau)" />
        <Pintas to="/nasabah" Ikon={Users} label="Nasabah" warna="var(--biru)" tanda={pengelola ? q.tarik : 0} />
        <Pintas to="/jemput" Ikon={Truck} label="Jemput" warna="var(--kuning)" tanda={q.jemput} />
        <Pintas to="/gudang" Ikon={Warehouse} label="Gudang" warna="var(--ungu)" tanda={q.siapJual.length} />
        <Pintas to="/harga" Ikon={Tag} label="Daftar harga" warna="#ec4899" />
        <Pintas to="/hadiah" Ikon={Gift} label="Poin & hadiah" warna="#f97316" tanda={q.tukar} />
        <Pintas to="/panduan" Ikon={BookOpen} label="Panduan" warna="#06b6d4" />
        <Pintas to="/laporan" Ikon={FileText} label="Laporan" warna="#64748b" />
      </div>

      <div className="kartu baris" style={{ gap: 14 }}>
        <Cincin nilai={target ? bulan / target : 0}><span>{target ? Math.min(999, Math.round((bulan / target) * 100)) : 0}%</span></Cincin>
        <div className="isi">
          <span className="mini"><Target size={11} style={{ verticalAlign: -1 }} /> Target bulan ini</span>
          <div className="angka" style={{ fontSize: '1.25rem' }}>{angka(bulan, 1)} <span className="muted" style={{ fontSize: '.86rem', fontWeight: 600 }}>dari {angka(target, 0)} kg</span></div>
          <div className="muted kecil">{target && bulan >= target ? 'Target tercapai. Kerja bagus!' : `Kurang ${angka(Math.max(0, target - bulan), 1)} kg lagi`}</div>
        </div>
      </div>

      <div className="judul-seksi"><h2>Komposisi 7 hari</h2><Link to="/analitik">Analitik</Link></div>
      <div className="kartu">
        {minggu.berat > 0 ? <div className="baris" style={{ gap: 16 }}><Donat daftar={minggu.daftar} /><Legenda daftar={minggu.daftar} /></div>
          : <Kosong ikon={<Scale size={28} />} judul="Belum ada setoran minggu ini">Mulai setoran pertama dari tombol hijau di atas.</Kosong>}
      </div>

      <div className="judul-seksi"><h2>Aktivitas terbaru</h2><Link to="/riwayat">Semua</Link></div>
      {state.setoran.length ? (
        <div className="daftar">
          {state.setoran.slice(0, 4).map((s) => {
            const n = state.nasabah.find((x) => x.id === s.nasabahId);
            return (
              <Link key={s.id} to="/riwayat" className="item">
                <Avatar nama={n ? n.nama : 'Umum'} ukuran={40} />
                <div className="isi"><b className="potong">{n ? n.nama : 'Setoran umum'}</b><span className="muted kecil">{s.items.length} item · {kg(s.berat)} · {relatif(s.ts)}</span></div>
                <b className="angka" style={{ color: 'var(--hijau)' }}>+{rupiahRingkas(s.total)}</b>
              </Link>
            );
          })}
        </div>
      ) : <div className="kartu"><Kosong ikon={<ReceiptText size={28} />} judul="Belum ada transaksi">Setoran yang disimpan akan muncul di sini.</Kosong></div>}

      <Link to="/tentang" className="kartu rapat tekan baris">
        <div className="ikon-lembut" style={model.tahap === 'siap' ? undefined : { background: 'var(--kuning-muda)', color: 'var(--kuning)' }}>{model.tahap === 'siap' ? <Cpu size={21} /> : <Hand size={21} />}</div>
        <div className="isi"><b>{model.tahap === 'siap' ? 'AI di HP aktif' : model.tahap === 'memuat' ? 'Memuat model...' : 'Mode manual'}</b><div className="muted kecil">{model.tahap === 'siap' ? 'Foto diklasifikasi di perangkat, tanpa unggah.' : 'Model belum terpasang. Kategori dipilih petugas.'}</div></div>
        <ChevronRight size={18} className="muted" />
      </Link>
    </div>
  );
}

function BerandaNasabah() {
  const { state, akun, ajukanTarik } = useStore();
  const tampil = useToast();
  const [lihat, setLihat] = useState(true);
  const [tarik, setTarik] = useState(false);
  const [jumlah, setJumlah] = useState('');
  const [catatan, setCatatan] = useState('');
  const n = state.nasabah.find((x) => x.id === akun.nasabahId);
  if (!n) {
    return <div className="halaman"><Atas /><div className="kartu"><Kosong ikon={<Wallet size={28} />} judul="Data nasabah tidak ditemukan">Akun ini belum terhubung dengan data nasabah. Jika Anda memakai akun demo, keluar lalu masuk lagi lewat tombol akun demo.</Kosong></div></div>;
  }
  const sal = saldo(state, n.id), pn = poin(state, n.id), total = totalKg(state, n.id), lv = level(total);
  const milik = state.setoran.filter((s) => s.nasabahId === n.id);
  const komposisi = ringkas(semuaItem(milik));
  const jemput = state.jemput.find((j) => j.nasabahId === n.id && ['diajukan', 'dijadwalkan', 'dijemput'].includes(j.status));
  const IkonLevel = [Sprout, Leaf, Leaf, Trophy][lv.indeks] || Leaf;

  const kirimTarik = () => {
    const j = Math.round(desimal(jumlah));
    if (j <= 0) return tampil('Isi jumlah penarikan');
    if (j > sal.tersedia) return tampil('Jumlah melebihi saldo yang tersedia');
    ajukanTarik(n.id, j, catatan.trim());
    setTarik(false); setJumlah(''); setCatatan('');
    tampil('Pengajuan dikirim ke pengelola');
  };

  return (
    <div className="halaman">
      <Atas />
      <div className="hero langit">
        <div className="baris antara">
          <span className="mini">Saldo tabungan sampah</span>
          <button className="chip kaca" onClick={() => setLihat(!lihat)} aria-label={lihat ? 'Sembunyikan saldo' : 'Tampilkan saldo'}>{lihat ? <EyeOff size={13} /> : <Eye size={13} />} {n.noAnggota}</button>
        </div>
        <div className="besar" style={{ marginTop: 6 }}>{lihat ? rupiah(sal.saldo) : 'Rp ••••••'}</div>
        {sal.tertahan > 0 && <div style={{ fontSize: '.8rem', opacity: .85, marginTop: 2 }}>{rupiah(sal.tertahan)} sedang diajukan untuk ditarik</div>}
        <div className="grid3" style={{ marginTop: 14 }}>
          <div className="ubin"><span className="mini">Poin</span><b>{angka(pn.saldo, 0)}</b></div>
          <div className="ubin"><span className="mini">Disetor</span><b>{angka(total, 1)} kg</b></div>
          <div className="ubin"><span className="mini">Tingkat</span><b>{lv.nama}</b></div>
        </div>
        <div className="grid2" style={{ marginTop: 14 }}>
          <button className="btn lime" onClick={() => setTarik(true)} disabled={sal.tersedia <= 0}><HandCoins size={18} /> Tarik saldo</button>
          <Link to="/jemput" className="btn" style={{ background: 'rgba(255,255,255,.16)', boxShadow: 'none' }}><Truck size={18} /> Minta jemput</Link>
        </div>
      </div>

      {jemput && (
        <Link to="/jemput" className="kartu tekan kolom">
          <div className="baris antara"><b>Penjemputan Anda</b><span className="chip biru">{LABEL_JEMPUT[STATUS_JEMPUT.indexOf(jemput.status)]}</span></div>
          <LangkahStatus langkah={LABEL_JEMPUT} kini={STATUS_JEMPUT.indexOf(jemput.status)} />
          <span className="muted kecil">{jemput.waktu}{jemput.petugasNama ? ` · Petugas ${jemput.petugasNama}` : ''}</span>
        </Link>
      )}

      <div className="kartu kolom" style={{ gap: 10 }}>
        <div className="baris">
          <div className="ikon-lembut"><IkonLevel size={22} /></div>
          <div className="isi"><b>Tingkat {lv.nama}</b><div className="muted kecil">{lv.berikut ? `${angka(lv.kurang, 1)} kg lagi menuju ${lv.berikut.nama}` : 'Tingkat tertinggi. Luar biasa!'}</div></div>
          <Link to="/hadiah" className="btn kecil sekunder">Hadiah</Link>
        </div>
        <div className="bar"><i style={{ width: `${lv.progres * 100}%` }} /></div>
      </div>

      <div className="pintasan">
        <Pintas to="/pindai" Ikon={ScanLine} label="Cek sampahku" warna="var(--hijau)" />
        <Pintas to="/harga" Ikon={Tag} label="Daftar harga" warna="#ec4899" />
        <Pintas to="/hadiah" Ikon={Gift} label="Tukar poin" warna="#f97316" />
        <Pintas to="/panduan?tab=tanya" Ikon={MessageCircle} label="Tanya Pilah" warna="var(--biru)" />
        <Pintas to="/panduan" Ikon={BookOpen} label="Panduan" warna="#06b6d4" />
        <Pintas to="/kuis" Ikon={Trophy} label="Kuis" warna="var(--kuning)" />
        <Pintas to="/jemput" Ikon={Truck} label="Jemput" warna="var(--ungu)" />
        <Pintas to="/riwayat" Ikon={ReceiptText} label="Riwayat" warna="#64748b" />
      </div>

      <div className="judul-seksi"><h2>Dampak pilahanku</h2></div>
      <div className="kartu">
        {komposisi.berat > 0 ? (
          <div className="kolom">
            <div className="baris" style={{ gap: 16 }}><Donat daftar={komposisi.daftar} /><Legenda daftar={komposisi.daftar} /></div>
            <div className="spanduk info kecil"><Leaf size={16} /><span><b>{kg(total)}</b> sampah Anda sudah dipilah dan tercatat di bank sampah ini.</span></div>
          </div>
        ) : <Kosong ikon={<Leaf size={28} />} judul="Belum ada setoran">Bawa sampah terpilah ke bank sampah atau minta dijemput.</Kosong>}
      </div>

      <div className="judul-seksi"><h2>Setoran terakhir</h2><Link to="/riwayat">Semua</Link></div>
      {milik.length ? (
        <div className="daftar">
          {milik.slice(0, 3).map((s) => (
            <Link key={s.id} to="/riwayat" className="item">
              <div className="ikon-lembut"><Scale size={20} /></div>
              <div className="isi"><b>{kg(s.berat)} · {s.items.length} item</b><span className="muted kecil">{relatif(s.ts)} · +{s.poin} poin</span></div>
              <b className="angka" style={{ color: 'var(--hijau)' }}>+{rupiahRingkas(s.total)}</b>
            </Link>
          ))}
        </div>
      ) : <div className="kartu"><Kosong ikon={<ReceiptText size={28} />} judul="Belum ada riwayat">Setoran Anda akan tercatat di sini.</Kosong></div>}

      {tarik && (
        <Sheet judul="Tarik saldo" onTutup={() => setTarik(false)}>
          <div className="kartu rapat baris antara"><span className="muted">Saldo tersedia</span><b className="angka">{rupiah(sal.tersedia)}</b></div>
          <label className="f">Jumlah (Rp)<input type="text" inputMode="numeric" placeholder="Misalnya 20000" value={jumlah} onChange={(e) => setJumlah(e.target.value.replace(/\D/g, ''))} /></label>
          <div className="gulir-x">{[10000, 20000, 50000].filter((v) => v <= sal.tersedia).map((v) => <button key={v} className="pil" onClick={() => setJumlah(String(v))}>{rupiah(v)}</button>)}{sal.tersedia > 0 && <button className="pil" onClick={() => setJumlah(String(Math.floor(sal.tersedia)))}>Semua</button>}</div>
          <label className="f">Catatan (opsional)<input type="text" placeholder="Misalnya: diambil hari Sabtu" value={catatan} onChange={(e) => setCatatan(e.target.value)} /></label>
          <p className="muted kecil">Pengajuan dikirim ke pengelola. Anda mendapat notifikasi saat disetujui, lalu uang diambil di bank sampah.</p>
          <button className="btn blok" onClick={kirimTarik}>Ajukan penarikan</button>
        </Sheet>
      )}
    </div>
  );
}

export default function Beranda() {
  const { akun } = useStore();
  return akun.peran === 'nasabah' ? <BerandaNasabah /> : <BerandaStaf />;
}
