// Penjemputan: nasabah mengajukan, petugas menjadwalkan, menjemput, lalu menimbang. Kedua pihak mendapat notifikasi.
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Truck, MapPin, Clock, Plus, Navigation, Check, Scale, X, CalendarClock, Loader2, StickyNote } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { KATEGORI, URUTAN } from '../data/kategori';
import { STATUS_JEMPUT, LABEL_JEMPUT, AKTIF_JEMPUT } from '../data/status';
import { relatif } from '../lib/format';
import { HARI } from '../lib/hitung';
import { Kepala, Avatar, Kosong, Sheet, LangkahStatus, IkonKategori, useToast } from '../components/ui.jsx';

const SLOT = [['pagi', 'Pagi', '08.00 sampai 10.00'], ['siang', 'Siang', '13.00 sampai 15.00'], ['sore', 'Sore', '15.00 sampai 17.00']];
const HARI_PILIH = [[0, 'Hari ini'], [1, 'Besok'], [2, 'Lusa']];
const tanggal = (geser) => new Date(Date.now() + geser * HARI).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

function Kartu({ j, staf, nama }) {
  const { ubahJemput, keranjangMulai } = useStore();
  const nav = useNavigate();
  const tampil = useToast();
  const i = STATUS_JEMPUT.indexOf(j.status);
  const batal = j.status === 'dibatalkan';
  return (
    <div className="kartu kolom">
      <div className="baris">
        {staf ? <Avatar nama={nama} /> : <div className="ikon-lembut" style={{ background: 'var(--biru-muda)', color: 'var(--biru)' }}><Truck size={21} /></div>}
        <div className="isi"><b className="potong" style={{ display: 'block' }}>{staf ? nama : 'Permintaan jemput'}</b><span className="muted kecil">Diajukan {relatif(j.ts)}{j.demo ? ' · contoh' : ''}</span></div>
        <span className={`chip ${batal ? 'merah' : j.status === 'selesai' ? '' : j.status === 'diajukan' ? 'kuning' : 'biru'}`}>{batal ? 'Dibatalkan' : LABEL_JEMPUT[i]}</span>
      </div>
      {!batal && <LangkahStatus langkah={LABEL_JEMPUT} kini={i} />}
      <div className="kolom kecil" style={{ gap: 5 }}>
        <div className="baris"><Clock size={15} className="muted" style={{ flex: 'none' }} />{j.waktu}</div>
        <div className="baris"><MapPin size={15} className="muted" style={{ flex: 'none' }} /><span className="isi">{j.alamat || 'Alamat belum diisi'}</span>
          {j.lokasi && <a className="chip biru" href={`https://www.google.com/maps?q=${j.lokasi.lat},${j.lokasi.lng}`} target="_blank" rel="noreferrer"><Navigation size={12} /> Peta</a>}</div>
        {j.catatan && <div className="baris"><StickyNote size={15} className="muted" style={{ flex: 'none' }} />{j.catatan}</div>}
        {j.petugasNama && <div className="baris"><Truck size={15} className="muted" style={{ flex: 'none' }} />Petugas {j.petugasNama}</div>}
      </div>
      {j.perkiraan?.length > 0 && <div className="baris" style={{ flexWrap: 'wrap', gap: 6 }}>{j.perkiraan.map((k) => <span key={k} className="chip abu"><span className="titik" style={{ background: KATEGORI[k].warna }} />{KATEGORI[k].nama}</span>)}</div>}

      {staf && j.status === 'diajukan' && <div className="grid2"><button className="btn bahaya kecil" onClick={() => { ubahJemput(j.id, 'dibatalkan'); tampil('Dibatalkan, nasabah diberi tahu'); }}><X size={16} /> Tolak</button><button className="btn kecil" onClick={() => { ubahJemput(j.id, 'dijadwalkan'); tampil('Dijadwalkan, nasabah diberi tahu'); }}><CalendarClock size={16} /> Jadwalkan</button></div>}
      {staf && j.status === 'dijadwalkan' && <button className="btn blok" onClick={() => { ubahJemput(j.id, 'dijemput'); tampil('Nasabah diberi tahu Anda berangkat'); }}><Truck size={18} /> Berangkat menjemput</button>}
      {staf && j.status === 'dijemput' && <button className="btn lime blok" onClick={() => { keranjangMulai(j.nasabahId, j.id); nav('/setor'); }}><Scale size={18} /> Timbang dan catat setoran</button>}
      {!staf && j.status === 'diajukan' && <button className="btn bahaya kecil" onClick={() => { ubahJemput(j.id, 'dibatalkan'); tampil('Permintaan dibatalkan'); }}><X size={16} /> Batalkan permintaan</button>}
    </div>
  );
}

export default function Jemput() {
  const { state, akun, ajukanJemput } = useStore();
  const tampil = useToast();
  const [param, setParam] = useSearchParams();
  const staf = akun.peran !== 'nasabah';
  const saya = state.nasabah.find((n) => n.id === akun.nasabahId);
  const awalForm = (k) => ({ alamat: saya?.alamat || '', hari: 1, slot: 'pagi', perkiraan: k && KATEGORI[k] ? [k] : [], catatan: '', lokasi: null });
  const [form, setForm] = useState(() => (!staf && param.get('ajukan') ? awalForm(param.get('ajukan')) : null));
  const [tab, setTab] = useState('aktif');
  const [gps, setGps] = useState('');

  const semua = staf ? state.jemput : state.jemput.filter((j) => j.nasabahId === akun.nasabahId);
  const aktif = semua.filter((j) => AKTIF_JEMPUT.includes(j.status));
  const lama = semua.filter((j) => !AKTIF_JEMPUT.includes(j.status));
  const tampilList = tab === 'aktif' ? aktif : lama;
  const nama = (id) => state.nasabah.find((n) => n.id === id)?.nama || 'Nasabah';

  const tutup = () => { setForm(null); setGps(''); if (param.get('ajukan')) setParam({}, { replace: true }); };
  const ambilLokasi = () => {
    if (!navigator.geolocation) return setGps('Perangkat tidak mendukung lokasi.');
    setGps('mencari');
    navigator.geolocation.getCurrentPosition(
      (p) => { setForm((f) => ({ ...f, lokasi: { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), akurasi: Math.round(p.coords.accuracy) } })); setGps(''); },
      () => setGps('Lokasi tidak bisa diambil. Izinkan akses lokasi atau isi alamat saja.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };
  const kirim = () => {
    if (form.alamat.trim().length < 5) return tampil('Isi alamat penjemputan');
    const s = SLOT.find((x) => x[0] === form.slot);
    ajukanJemput(saya.id, { alamat: form.alamat.trim(), waktu: `${tanggal(form.hari)}, ${s[1].toLowerCase()} (${s[2]})`, perkiraan: form.perkiraan, catatan: form.catatan.trim(), lokasi: form.lokasi });
    tutup(); setTab('aktif'); tampil('Permintaan terkirim ke petugas');
  };
  const togel = (k) => setForm((f) => ({ ...f, perkiraan: f.perkiraan.includes(k) ? f.perkiraan.filter((x) => x !== k) : [...f.perkiraan, k] }));

  return (
    <div className="halaman">
      <Kepala judul="Penjemputan" sub={staf ? `${aktif.length} permintaan aktif` : 'Sampah terpilah dijemput ke rumah'} kanan={!staf && saya && <button className="btn kecil" onClick={() => setForm(awalForm())}><Plus size={16} /> Ajukan</button>} />
      <div className="tab">
        <button className={tab === 'aktif' ? 'aktif' : ''} onClick={() => setTab('aktif')}>Aktif ({aktif.length})</button>
        <button className={tab === 'lama' ? 'aktif' : ''} onClick={() => setTab('lama')}>Riwayat ({lama.length})</button>
      </div>
      {tampilList.length ? tampilList.map((j) => <Kartu key={j.id} j={j} staf={staf} nama={nama(j.nasabahId)} />)
        : <div className="kartu"><Kosong ikon={<Truck size={28} />} judul={tab === 'aktif' ? 'Tidak ada penjemputan aktif' : 'Belum ada riwayat'}>{staf ? 'Permintaan dari nasabah akan muncul di sini beserta notifikasinya.' : 'Ajukan penjemputan saat sampah terpilah Anda sudah terkumpul.'}</Kosong></div>}

      {form && (
        <Sheet judul="Ajukan penjemputan" onTutup={tutup}>
          <label className="f">Alamat<textarea value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Jalan, nomor rumah, RT/RW, patokan" /></label>
          <div className="baris">
            <button className="btn sekunder kecil" onClick={ambilLokasi} disabled={gps === 'mencari'}>{gps === 'mencari' ? <Loader2 size={15} className="putar" /> : <Navigation size={15} />} {form.lokasi ? 'Perbarui titik GPS' : 'Sertakan titik GPS'}</button>
            {form.lokasi && <span className="chip"><Check size={12} /> {form.lokasi.lat}, {form.lokasi.lng} (±{form.lokasi.akurasi} m)</span>}
          </div>
          {gps && gps !== 'mencari' && <span className="muted kecil">{gps}</span>}
          <div className="f" role="group" aria-label="Hari">Hari
            <div className="tab">{HARI_PILIH.map(([v, l]) => <button type="button" key={v} className={form.hari === v ? 'aktif' : ''} aria-pressed={form.hari === v} onClick={() => setForm({ ...form, hari: v })}>{l}</button>)}</div>
          </div>
          <div className="f" role="group" aria-label="Waktu">Waktu
            <div className="pilihan">{SLOT.map(([id, l, w]) => <button type="button" key={id} className={form.slot === id ? 'aktif' : ''} aria-pressed={form.slot === id} onClick={() => setForm({ ...form, slot: id })}>{l}<small>{w}</small></button>)}</div>
          </div>
          <div className="kolom" style={{ gap: 8 }}>
            <span className="mini">Perkiraan isi (boleh lebih dari satu)</span>
            <div className="pil-kat">{URUTAN.map((k) => <button type="button" key={k} className={form.perkiraan.includes(k) ? 'aktif' : ''} onClick={() => togel(k)}><IkonKategori k={k} ukuran={34} />{KATEGORI[k].nama}</button>)}</div>
          </div>
          <label className="f">Catatan (opsional)<input type="text" value={form.catatan} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder="Misalnya: 2 karung botol plastik" /></label>
          <button className="btn blok" onClick={kirim}><Truck size={18} /> Kirim permintaan</button>
        </Sheet>
      )}
    </div>
  );
}
