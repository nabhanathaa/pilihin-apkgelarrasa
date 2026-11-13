import { useState } from 'react';
import { UserPlus, Wallet, Banknote, Trash2, Share2 } from 'lucide-react';
import { useStore } from '../lib/store.jsx';
import { daftarKategori } from '../data/kategori';
import { saldoNasabah } from '../lib/stats';
import { Kosong, Modal, useToast } from '../components/ui.jsx';
import { rupiah, kg, tglJam } from '../lib/format';

export default function Bank() {
  const { state, ubahHarga, tambahNasabah, hapusNasabah, tarik } = useStore();
  const tampil = useToast();
  const [tab, setTab] = useState('nasabah');
  const [nama, setNama] = useState('');
  const [buka, setBuka] = useState(null);
  const [jumlah, setJumlah] = useState('');
  const n = state.nasabah.find((x) => x.id === buka);

  const tambah = () => { if (!nama.trim()) return; tambahNasabah(nama.trim()); setNama(''); tampil('Nasabah ditambahkan'); };
  const setoran = n ? state.scans.filter((s) => s.nasabahId === n.id) : [];
  const sd = n ? saldoNasabah(n.id, state.scans, state.penarikan) : null;
  const tarikan = n ? state.penarikan.filter((p) => p.nasabahId === n.id) : [];

  const bagikan = async () => {
    const teks = `${state.pengaturan.unit}\nNasabah: ${n.nama}\nSetoran: ${setoran.length} kali, ${kg(setoran.reduce((a, s) => a + (s.berat || 0), 0))}\nTotal setoran: ${rupiah(sd.masuk)}\nPenarikan: ${rupiah(sd.keluar)}\nSaldo: ${rupiah(sd.saldo)}`;
    try { if (navigator.share) await navigator.share({ text: teks }); else { await navigator.clipboard.writeText(teks); tampil('Ringkasan disalin'); } } catch { /* dibatalkan */ }
  };

  return (
    <div className="halaman">
      <div className="tab"><button className={tab === 'nasabah' ? 'aktif' : ''} onClick={() => setTab('nasabah')}>Nasabah</button><button className={tab === 'harga' ? 'aktif' : ''} onClick={() => setTab('harga')}>Harga per kg</button></div>

      {tab === 'harga' && (
        <div className="kartu kolom">
          <p className="muted kecil">Harga bawaan hanya perkiraan awal. Sesuaikan dengan daftar harga bank sampah Anda; perubahan berlaku untuk scan berikutnya.</p>
          {daftarKategori().map((k) => (
            <div className="baris" key={k.id}>
              <div className="ikon-bulat" style={{ background: k.warna, width: 36, height: 36 }}><k.Ikon size={18} /></div>
              <b style={{ flex: 1 }}>{k.nama}</b>
              <div className="baris" style={{ gap: 6 }}>Rp<input type="number" min="0" step="100" style={{ width: 96 }} value={state.pengaturan.harga[k.id] ?? 0} onChange={(e) => ubahHarga(k.id, parseFloat(e.target.value) || 0)} aria-label={`Harga ${k.nama} per kg`} /><span className="muted kecil">/kg</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'nasabah' && (
        <>
          <div className="baris" style={{ gap: 8 }}>
            <input type="text" placeholder="Nama nasabah baru" value={nama} onChange={(e) => setNama(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tambah()} />
            <button className="btn" onClick={tambah}><UserPlus size={18} /></button>
          </div>
          <div className="kartu rata0 daftar">
            {state.nasabah.length === 0 ? <Kosong ikon={<Wallet size={34} />} judul="Belum ada nasabah">Tambahkan nasabah, lalu pilih namanya saat menyimpan hasil pindai agar saldo terhitung.</Kosong> : state.nasabah.map((x) => {
              const s = saldoNasabah(x.id, state.scans, state.penarikan);
              return (
                <button key={x.id} className="item" style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 0, cursor: 'pointer' }} onClick={() => setBuka(x.id)}>
                  <div className="ikon-bulat" style={{ background: 'var(--hijau)' }}>{x.nama.slice(0, 1).toUpperCase()}</div>
                  <div style={{ flex: 1 }}><b>{x.nama}</b><div className="muted kecil">{state.scans.filter((y) => y.nasabahId === x.id).length} setoran</div></div>
                  <b>{rupiah(s.saldo)}</b>
                </button>
              );
            })}
          </div>
        </>
      )}

      {n && (
        <Modal judul={n.nama} onTutup={() => { setBuka(null); setJumlah(''); }}>
          <div className="kolom">
            <div className="grid3">
              <div className="stat"><b style={{ fontSize: '1rem' }}>{rupiah(sd.masuk)}</b><span>total setoran</span></div>
              <div className="stat"><b style={{ fontSize: '1rem' }}>{rupiah(sd.keluar)}</b><span>ditarik</span></div>
              <div className="stat"><b style={{ fontSize: '1rem', color: 'var(--hijau)' }}>{rupiah(sd.saldo)}</b><span>saldo</span></div>
            </div>
            <div className="baris" style={{ gap: 8 }}>
              <input type="number" min="0" placeholder="Jumlah penarikan (Rp)" value={jumlah} onChange={(e) => setJumlah(e.target.value)} />
              <button className="btn" onClick={() => { const j = parseFloat(jumlah); if (!j || j <= 0) return; if (j > sd.saldo) { tampil('Melebihi saldo'); return; } tarik(n.id, j); setJumlah(''); tampil('Penarikan dicatat'); }}><Banknote size={18} /> Tarik</button>
            </div>
            <b className="kecil">Riwayat</b>
            <div className="daftar" style={{ maxHeight: 220, overflow: 'auto' }}>
              {[...setoran.map((s) => ({ ts: s.ts, teks: `Setor ${kg(s.berat)} (${s.kategori})`, nilai: s.nilai })), ...tarikan.map((p) => ({ ts: p.ts, teks: 'Penarikan', nilai: -p.jumlah }))].sort((a, b) => b.ts - a.ts).map((r, i) => (
                <div className="baris antara kecil" style={{ padding: '8px 0' }} key={i}><span>{r.teks}<div className="muted">{tglJam(r.ts)}</div></span><b style={{ color: r.nilai < 0 ? 'var(--merah)' : 'var(--hijau)' }}>{r.nilai < 0 ? '-' : '+'}{rupiah(Math.abs(r.nilai))}</b></div>
              ))}
            </div>
            <div className="grid2">
              <button className="btn sekunder" onClick={bagikan}><Share2 size={18} /> Bagikan ringkasan</button>
              <button className="btn bahaya" onClick={() => { if (confirm(`Hapus nasabah ${n.nama} beserta riwayat penarikannya?`)) { hapusNasabah(n.id); setBuka(null); } }}><Trash2 size={18} /> Hapus</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
