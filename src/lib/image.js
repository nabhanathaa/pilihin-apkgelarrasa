export async function bitmapDariFile(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    return await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }
}

/** Gambar diperkecil agar pemrosesan dan penyimpanan ringan. */
export function keCanvas(sumber, sisiMaks = 640) {
  const w = sumber.videoWidth || sumber.naturalWidth || sumber.width;
  const h = sumber.videoHeight || sumber.naturalHeight || sumber.height;
  const skala = Math.min(1, sisiMaks / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * skala); c.height = Math.round(h * skala);
  c.getContext('2d').drawImage(sumber, 0, 0, c.width, c.height);
  return c;
}

export function mini(canvas, sisi = 144) {
  const skala = sisi / Math.max(canvas.width, canvas.height);
  const c = document.createElement('canvas');
  c.width = Math.round(canvas.width * skala); c.height = Math.round(canvas.height * skala);
  c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7);
}
