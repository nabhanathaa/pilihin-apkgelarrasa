// Menyalin berkas runtime WASM onnxruntime-web ke public/ort agar bisa dipakai offline.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
const src = 'node_modules/onnxruntime-web/dist';
const dst = 'public/ort';
mkdirSync(dst, { recursive: true });
let n = 0;
for (const f of readdirSync(src)) {
  if (/^ort-wasm-simd-threaded.*\.(wasm|mjs)$/.test(f) && !f.includes('jsep') && !f.includes('asyncify') && !f.includes('jspi')) { cpSync(`${src}/${f}`, `${dst}/${f}`); n++; }
}
console.log(`ort: ${n} berkas disalin ke ${dst}`);
