// Daftar barang umum untuk pencarian "barang ini masuk mana?" dan bahan kuis. Bekerja sepenuhnya offline.
export const BARANG = [
  ['Botol air mineral', 'plastic', 'Lepas tutup dan label, bilas, lalu pipihkan.'],
  ['Gelas plastik minuman', 'plastic', 'Bilas bersih dan tumpuk.'],
  ['Kantong kresek', 'plastic', 'Kumpulkan terpisah, nilainya rendah.'],
  ['Sachet kopi atau sampo', 'plastic', 'Kemasan berlapis, kumpulkan untuk TPS3R atau kerajinan.'],
  ['Botol sampo', 'plastic', 'Bilas dan lepas pompa.'],
  ['Ember plastik rusak', 'plastic', 'Plastik keras, laku dijual.'],
  ['Galon bekas', 'plastic', 'Bilas dan jual utuh.'],
  ['Botol sirup kaca', 'glass', 'Bilas dan lepas tutup.'],
  ['Toples kaca', 'glass', 'Bilas dan lepas tutup.'],
  ['Pecahan beling', 'glass', 'Bungkus dengan kardus dan beri tanda.'],
  ['Botol saus', 'glass', 'Bilas dan lepas tutup.'],
  ['Koran bekas', 'paper', 'Jaga kering dan ikat.'],
  ['Kertas HVS', 'paper', 'Lepas klip dan staples besar.'],
  ['Majalah', 'paper', 'Tumpuk rapi.'],
  ['Buku tulis bekas', 'paper', 'Lepas kawat spiral bila ada.'],
  ['Amplop', 'paper', 'Kertas campur.'],
  ['Kardus mi instan', 'cardboard', 'Ratakan dan lepas lakban.'],
  ['Kotak sepatu', 'cardboard', 'Ratakan.'],
  ['Karton telur', 'cardboard', 'Jaga kering.'],
  ['Kemasan susu karton', 'cardboard', 'Ratakan; pada data pelatihan termasuk kardus.'],
  ['Kotak pizza bersih', 'cardboard', 'Bagian berminyak sebaiknya dipisah.'],
  ['Kaleng minuman', 'metal', 'Bilas dan pipihkan.'],
  ['Kaleng sarden', 'metal', 'Bilas bersih, hati-hati tepi tajam.'],
  ['Kawat atau paku', 'metal', 'Kumpulkan dalam wadah.'],
  ['Panci rusak', 'metal', 'Jual sebagai logam campur.'],
  ['Tutup botol logam', 'metal', 'Kumpulkan dalam wadah kecil.'],
  ['Baterai bekas', 'electronic', 'Limbah B3, simpan terpisah dalam wadah kering.'],
  ['Charger dan kabel', 'electronic', 'Limbah elektronik, serahkan ke titik kumpul.'],
  ['Ponsel rusak', 'electronic', 'Jangan dibongkar.'],
  ['Lampu LED atau neon', 'electronic', 'Mudah pecah, simpan dalam kardus.'],
  ['Kipas angin rusak', 'electronic', 'Serahkan ke pengelola e-waste.'],
  ['Baju bekas layak pakai', 'textile', 'Donasikan.'],
  ['Kain perca', 'textile', 'Pakai ulang sebagai lap.'],
  ['Handuk usang', 'textile', 'Jadikan lap.'],
  ['Seprai atau sarung bantal', 'textile', 'Donasikan bila layak.'],
  ['Kulit pisang', 'foodwaste', 'Kompos.'],
  ['Nasi sisa', 'foodwaste', 'Kompos atau pakan maggot.'],
  ['Sayur layu', 'foodwaste', 'Kompos.'],
  ['Ampas kopi', 'foodwaste', 'Kompos.'],
  ['Kulit telur', 'foodwaste', 'Hancurkan sebelum dikomposkan.'],
  ['Sisa buah', 'foodwaste', 'Kompos.'],
];

export const cariBarang = (q) => {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return BARANG.filter(([nama]) => nama.toLowerCase().includes(s)).map(([nama, kategori, catatan]) => ({ nama, kategori, catatan }));
};

// kuis: pilih n barang acak, pilihan jawaban 4 kategori
export const buatKuis = (n = 8) => {
  const pool = [...BARANG].sort(() => Math.random() - 0.5).slice(0, n);
  const semua = ['plastic', 'cardboard', 'paper', 'glass', 'metal', 'foodwaste', 'textile', 'electronic'];
  return pool.map(([nama, jawab, catatan]) => {
    const lain = semua.filter((k) => k !== jawab).sort(() => Math.random() - 0.5).slice(0, 3);
    const pilihan = [jawab, ...lain].sort(() => Math.random() - 0.5);
    return { nama, jawab, catatan, pilihan };
  });
};
