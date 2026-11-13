// Klasifikasi di perangkat dengan onnxruntime-web. Tidak ada foto yang dikirim ke server.
// Model dan labels.json diletakkan di public/models/. Tanpa model, aplikasi masuk "mode manual".
import * as ort from 'onnxruntime-web/wasm';

// BASE bisa relatif ('./'); jadikan absolut terhadap halaman agar benar untuk fetch dan runtime WASM
const BASE = new URL(import.meta.env.BASE_URL, document.baseURI).href;
const status = { tahap: 'belum', meta: null, sesi: null, galat: null };
let janji = null;

export const infoModel = () => ({ ...status });

export function muatModel() {
  if (janji) return janji;
  janji = (async () => {
    status.tahap = 'memuat';
    try {
      const r = await fetch(`${BASE}models/labels.json`, { cache: 'no-cache' });
      if (!r.ok) throw new Error('labels.json tidak ada');
      const meta = await r.json();
      if (!meta || !Array.isArray(meta.labels)) throw new Error('labels.json tidak valid');
      status.meta = meta;
      ort.env.wasm.wasmPaths = `${BASE}ort/`;
      ort.env.wasm.numThreads = 1; // GitHub Pages tidak mengirim header COOP/COEP, jadi tanpa multi-thread
      ort.env.wasm.proxy = false;
      status.sesi = await ort.InferenceSession.create(`${BASE}models/${meta.file || 'pilahin.onnx'}`, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
      status.tahap = 'siap';
    } catch (e) {
      status.tahap = 'tidak-ada';
      status.galat = String(e && e.message ? e.message : e);
    }
    return infoModel();
  })();
  return janji;
}

function tensorDari(sumber, meta, balik) {
  const S = meta.input_size || 224;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d', { willReadFrequently: true });
  const w = sumber.width, h = sumber.height;
  if (meta.resize === 'center_crop') {
    const sisi = Math.min(w, h);
    g.drawImage(sumber, (w - sisi) / 2, (h - sisi) / 2, sisi, sisi, 0, 0, S, S);
  } else {
    g.drawImage(sumber, 0, 0, w, h, 0, 0, S, S); // seluruh gambar diperas ke S x S, sama dengan pelatihan
  }
  if (balik) { g.save(); g.scale(-1, 1); g.drawImage(c, -S, 0); g.restore(); }
  const d = g.getImageData(0, 0, S, S).data;
  const mean = meta.mean || [0.485, 0.456, 0.406];
  const std = meta.std || [0.229, 0.224, 0.225];
  const out = new Float32Array(3 * S * S);
  for (let i = 0; i < S * S; i++) {
    out[i] = (d[i * 4] / 255 - mean[0]) / std[0];
    out[S * S + i] = (d[i * 4 + 1] / 255 - mean[1]) / std[1];
    out[2 * S * S + i] = (d[i * 4 + 2] / 255 - mean[2]) / std[2];
  }
  return new ort.Tensor('float32', out, [1, 3, S, S]);
}

const softmax = (z) => { const m = Math.max(...z); const e = z.map((v) => Math.exp(v - m)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); };

/** sumber: canvas, ImageBitmap, atau <img>. Hasil: {probs, top3, ms}. */
export async function klasifikasi(sumber) {
  await muatModel();
  if (status.tahap !== 'siap') throw new Error('Model belum tersedia');
  const { meta, sesi } = status;
  const t0 = performance.now();
  const masuk = sesi.inputNames[0];
  const keluar = sesi.outputNames[0];
  const jalankan = async (balik) => {
    const o = await sesi.run({ [masuk]: tensorDari(sumber, meta, balik) });
    const v = Array.from(o[keluar].data);
    return meta.output === 'probabilitas' ? v : softmax(v);
  };
  let p = await jalankan(false);
  if (meta.tta) {
    const q = await jalankan(true);
    p = p.map((v, i) => (v + q[i]) / 2);
  }
  const probs = Object.fromEntries(meta.labels.map((k, i) => [k, p[i]]));
  const top3 = Object.entries(probs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => ({ k, p: v }));
  return { probs, top3, ms: Math.round(performance.now() - t0) };
}
