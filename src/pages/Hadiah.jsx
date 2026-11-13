import { useMemo, useState } from 'react';
import { Gift, Coins, Trophy, Check, Plus, Trash2, Crown, Ticket } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { poin, totalKg, level, peringkat, mulaiBulan } from '../lib/hitung';
import { angka, tglPendek, bulanNama, desimal } from '../lib/format';
import { Kepala, Avatar, Kosong, Sheet, useToast } from '../components/ui.jsx';

export default function Hadiah() {
  const { state, akun, tukar, serahkan, tambahHadiah, hapusHadiah } = useStore();
  const tampil = useToast();
  const staf = akun.peran !== 'nasabah';
  const pengelola = akun.peran === 'pengelola';
  const [pilih, setPilih] = useState(null);
  const [baru, setBaru] = useState(null);
  const saya = state.nasabah.find((n) => n.id === akun.nasabahId);
  const pn = saya ? poin(state, saya.id) : null;
  const lv = saya ? level(totalKg(state, saya.id)) : null;
  const papan = useMemo(() => peringkat(state, mulaiBulan()).slice(0, 8), [state]);
  const menunggu = state.penukaran.filter((p) => p.status === 'menunggu');
  const milik = saya ? state.penukaran.filter((p) => p.nasabahId === saya.id) : [];
  const nama = (id) => state.nasabah.find((n) => n.id === id)?.nama || 'Nasabah';

  return (
    <div className="halaman">
      <Kepala judul="Poin & hadiah" kembali={staf} sub={staf ? 'Penukaran dan papan peringkat' : undefined} />
      {saya && (
        <div className="hero">
          <span className="mini">Poin saya</span>
          <div className="besar" style={{ marginTop: 6 }}>{angka(pn.saldo, 0)}<small>poin</small></div>
          <div style={{ fontSize: '.82rem', opacity: .85, marginTop: 4 }}>Tingkat {lv.nama}. Setiap 1 kg setoran memberi {state.unit.poinPerKg} poin, dan kuis memberi bonus.</div>
          <div className="grid3" style={{ marginTop: 14 }}>
            <div className="ubin"><span className="mini">Setoran</span><b>{angka(pn.setor, 0)}</b></div>
            <div className="ubin"><span className="mini">Bonus</span><b>{angka(pn.bonus, 0)}</b></div>
            <div className="ubin"><span className="mini">Ditukar</span><b>{angka(pn.pakai, 0)}</b></div>
          </div>
        </div>
      )}

      {staf && (
        <>
          <div className="judul-seksi"><h2>Menunggu diserahkan</h2><span className="chip kuning">{menunggu.length}</span></div>
          {menunggu.length ? (
            <div className="daftar">
              {menunggu.map((p) => (
                <div key={p.id} className="item">
                  <div className="ikon-lembut" style={{ background: 'var(--ungu-muda)', color: 'var(--ungu)' }}><Ticket size={20} /></div>
                  <div className="isi"><b className="potong">{p.nama}</b><span className="muted kecil">{nama(p.nasabahId)} · kode <b>{p.kode}</b></span></div>
                  <button className="btn kecil" onClick={() => { serahkan(p.id); tampil('Ditandai sudah diserahkan'); }}><Check size={15} /> Serahkan</button>
                </div>
              ))}
            </div>
          ) : <div className="kartu"><Kosong ikon={<Gift size={28} />} judul="Tidak ada antrean">Penukaran poin dari nasabah akan muncul di sini.</Kosong></div>}
        </>
      )}

      <div className="judul-seksi"><h2>Katalog hadiah</h2>{pengelola && <button onClick={() => setBaru({ nama: '', poin: '' })}><Plus size={14} style={{ verticalAlign: -2 }} /> Tambah</button>}</div>
      <div className="daftar">
        {state.hadiah.map((h) => {
          const cukup = pn && pn.saldo >= h.poin;
          return (
            <div key={h.id} className="item">
              <div className="ikon-lembut" style={{ background: 'var(--kuning-muda)', color: '#d97706' }}><Gift size={20} /></div>
              <div className="isi"><b className="potong">{h.nama}</b><span className="muted kecil"><Coins size={12} style={{ verticalAlign: -2 }} /> {angka(h.poin, 0)} poin{pn && !cukup ? ` · kurang ${angka(h.poin - pn.saldo, 0)}` : ''}</span></div>
              {saya && <button className="btn kecil" disabled={!cukup} onClick={() => setPilih(h)}>Tukar</button>}
              {pengelola && <button className="ikon-btn" style={{ width: 36, height: 36, color: 'var(--merah)' }} onClick={() => hapusHadiah(h.id)} aria-label={`Hapus ${h.nama}`}><Trash2 size={16} /></button>}
            </div>
          );
        })}
        {!state.hadiah.length && <Kosong ikon={<Gift size={28} />} judul="Katalog kosong">Pengelola belum menambahkan hadiah.</Kosong>}
      </div>
      <span className="muted kecil">Katalog bawaan hanyalah contoh. Pengelola menentukan hadiah dan jumlah poinnya.</span>

      {saya && milik.length > 0 && (
        <>
          <div className="judul-seksi"><h2>Penukaran saya</h2></div>
          <div className="daftar">
            {milik.map((p) => (
              <div key={p.id} className="item">
                <div className="ikon-lembut" style={{ background: 'var(--ungu-muda)', color: 'var(--ungu)' }}><Ticket size={20} /></div>
                <div className="isi"><b className="potong">{p.nama}</b><span className="muted kecil">Kode <b>{p.kode}</b> · {tglPendek(p.ts)}</span></div>
                <span className={`chip ${p.status === 'menunggu' ? 'kuning' : ''}`}>{p.status === 'menunggu' ? 'Menunggu' : 'Diterima'}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="judul-seksi"><h2>Papan peringkat</h2><span className="chip abu">{bulanNama(Date.now())}</span></div>
      {papan.length ? (
        <div className="daftar">
          {papan.map((t, i) => (
            <div key={t.nasabahId} className="item" style={saya && t.nasabahId === saya.id ? { background: 'var(--hijau-muda)' } : undefined}>
              <span className="angka" style={{ width: 22, textAlign: 'center', color: i === 0 ? '#d97706' : 'var(--teks2)' }}>{i === 0 ? <Crown size={18} /> : i + 1}</span>
              <Avatar nama={t.nama} ukuran={38} />
              <div className="isi"><b className="potong">{t.nama}{saya && t.nasabahId === saya.id ? ' (Anda)' : ''}</b><span className="muted kecil">{t.n} kali setor</span></div>
              <b className="angka">{angka(t.berat, 1)} kg</b>
            </div>
          ))}
        </div>
      ) : <div className="kartu"><Kosong ikon={<Trophy size={28} />} judul="Belum ada setoran bulan ini">Peringkat dihitung dari total berat setoran tiap nasabah.</Kosong></div>}

      {pilih && (
        <Sheet judul="Tukar poin" onTutup={() => setPilih(null)}>
          <div className="baris"><div className="ikon-lembut" style={{ background: 'var(--kuning-muda)', color: '#d97706' }}><Gift size={22} /></div><div className="isi"><b>{pilih.nama}</b><div className="muted kecil">{angka(pilih.poin, 0)} poin. Sisa poin setelah ditukar: {angka(pn.saldo - pilih.poin, 0)}.</div></div></div>
          <p className="muted kecil">Anda akan mendapat kode penukaran. Tunjukkan kode itu ke petugas saat mengambil hadiah.</p>
          <button className="btn blok" onClick={() => { const r = tukar(saya.id, pilih); setPilih(null); tampil(`Berhasil. Kode Anda ${r.kode}`); }}>Tukar sekarang</button>
        </Sheet>
      )}
      {baru && (
        <Sheet judul="Tambah hadiah" onTutup={() => setBaru(null)}>
          <label className="f">Nama hadiah<input type="text" value={baru.nama} onChange={(e) => setBaru({ ...baru, nama: e.target.value })} placeholder="Misalnya: Gula 1 kg" /></label>
          <label className="f">Poin yang dibutuhkan<input type="text" inputMode="numeric" value={baru.poin} onChange={(e) => setBaru({ ...baru, poin: e.target.value.replace(/\D/g, '') })} placeholder="Misalnya 300" /></label>
          <button className="btn blok" onClick={() => { const p = Math.round(desimal(baru.poin)); if (baru.nama.trim().length < 2 || p <= 0) return tampil('Isi nama dan jumlah poin'); tambahHadiah(baru.nama.trim(), p); setBaru(null); tampil('Hadiah ditambahkan'); }}>Simpan</button>
        </Sheet>
      )}
    </div>
  );
}
