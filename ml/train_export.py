#!/usr/bin/env python3
"""
Latih model ringan (siswa) dari keluaran pipeline v4.1 lalu ekspor ke ONNX untuk aplikasi Pilahin.

PENTING (aturan lomba):
- Skrip ini TERPISAH dari notebook kompetisi dan dijalankan SETELAH submission final dikumpulkan.
- Hanya memakai gambar TRAIN dan keluaran pipeline (pseudo-label dan probabilitas OOF). Tidak memakai
  gambar test dan tidak memakai label manual tim.

Contoh di Kaggle (GPU T4):
  !pip -q install timm onnx onnxruntime
  !python train_export.py \
      --train_dir /kaggle/input/<dataset-kompetisi>/train \
      --labels /kaggle/input/<dataset-keluaran-v41>/pseudo_label_train_r2.csv \
      --soft /kaggle/input/<dataset-keluaran-v41>/oof_convnext_base_r2.npy \
             /kaggle/input/<dataset-keluaran-v41>/oof_tf_efficientnetv2_m_r2.npy \
      --out /kaggle/working/model

Hasil: model/pilahin.onnx dan model/labels.json -> salin ke public/models/ pada proyek.
Uji cepat tanpa data: python train_export.py --smoke --out /tmp/model_uji
"""
import argparse, json, os, random, time, glob
import numpy as np

CLASSES = ["glass", "paper", "electronic", "metal", "plastic", "cardboard", "textile", "foodwaste"]  # urutan sama dengan notebook kompetisi
SEED = 2026


def seed_all(s):
    import torch
    random.seed(s); np.random.seed(s); torch.manual_seed(s); torch.cuda.manual_seed_all(s)


def cari_berkas(train_dir, image_id):
    for ext in ("jpg", "jpeg", "png", "JPG", "JPEG", "PNG"):
        p = os.path.join(train_dir, f"{image_id}.{ext}")
        if os.path.exists(p):
            return p
    raise FileNotFoundError(f"gambar {image_id} tidak ditemukan di {train_dir}")


def buat_data_uji(folder, n=96):
    """Gambar sintetis berwarna untuk menguji alur skrip (BUKAN data sebenarnya)."""
    from PIL import Image
    os.makedirs(folder, exist_ok=True)
    rng = np.random.RandomState(0)
    ids, y = [], []
    warna = rng.randint(30, 225, size=(8, 3))
    for i in range(n):
        k = i % 8
        arr = np.clip(warna[k] + rng.randint(-25, 25, size=(160, 200, 3)), 0, 255).astype("uint8")
        Image.fromarray(arr).save(os.path.join(folder, f"{i:04d}.jpg"))
        ids.append(f"{i:04d}"); y.append(CLASSES[k])
    soft = np.eye(8)[[CLASSES.index(v) for v in y]] * 0.9 + 0.1 / 8
    return ids, y, soft


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--train_dir"); ap.add_argument("--labels"); ap.add_argument("--soft", nargs="*", default=[])
    ap.add_argument("--out", required=True)
    ap.add_argument("--arch", default="efficientnet_b0.ra_in1k")
    ap.add_argument("--size", type=int, default=224)
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--bs", type=int, default=32)
    ap.add_argument("--lr", type=float, default=4e-4)
    ap.add_argument("--alpha", type=float, default=0.5, help="bobot label keras terhadap probabilitas guru")
    ap.add_argument("--holdout", type=float, default=0.15)
    ap.add_argument("--smoke", action="store_true")
    a = ap.parse_args()

    import torch, timm, torch.nn.functional as F
    from PIL import Image
    import torchvision.transforms as T
    from sklearn.model_selection import train_test_split

    seed_all(SEED)
    dev = "cuda" if torch.cuda.is_available() else "cpu"
    os.makedirs(a.out, exist_ok=True)

    # ---------- data ----------
    if a.smoke:
        train_dir = os.path.join(a.out, "_data_uji")
        ids, ylab, soft = buat_data_uji(train_dir)
        a.epochs = 2; pretrained = False
    else:
        import pandas as pd
        train_dir = a.train_dir
        df = pd.read_csv(a.labels, dtype={"image_id": str})
        ids = df["image_id"].tolist()
        ylab = df["label"].tolist() if "label" in df.columns else df["pseudo_label"].tolist()
        soft = np.mean([np.load(p) for p in a.soft], axis=0) if a.soft else np.eye(8)[[CLASSES.index(v) for v in ylab]]
        assert soft.shape == (len(ids), 8), f"bentuk probabilitas guru {soft.shape} tidak cocok dengan {len(ids)} gambar"
        pretrained = True
    y = np.array([CLASSES.index(v) for v in ylab])
    target = a.alpha * np.eye(8)[y] + (1 - a.alpha) * soft
    target = target / target.sum(1, keepdims=True)
    print(f"gambar {len(ids)} | kesepakatan argmax guru vs label: {(soft.argmax(1) == y).mean():.4f} | perangkat: {dev}")
    paths = [cari_berkas(train_dir, i) for i in ids]

    cfg_model = timm.create_model(a.arch, pretrained=False, num_classes=8)
    cfg = timm.data.resolve_data_config({}, model=cfg_model)
    mean, std = list(cfg["mean"]), list(cfg["std"])

    tf_train = T.Compose([T.RandomResizedCrop(a.size, scale=(0.55, 1.0), ratio=(0.75, 1.33)), T.RandomHorizontalFlip(), T.RandomRotation(12),
                          T.ColorJitter(0.25, 0.25, 0.2, 0.02), T.ToTensor(), T.Normalize(mean, std), T.RandomErasing(p=0.15, scale=(0.02, 0.12))])
    tf_eval = T.Compose([T.Resize((a.size, a.size)), T.ToTensor(), T.Normalize(mean, std)])  # sama dengan aplikasi: seluruh gambar diperas ke size x size

    class DS(torch.utils.data.Dataset):
        def __init__(s, idx, tf): s.idx, s.tf = list(idx), tf
        def __len__(s): return len(s.idx)
        def __getitem__(s, i):
            j = s.idx[i]
            im = Image.open(paths[j]).convert("RGB")
            return s.tf(im), torch.tensor(target[j], dtype=torch.float32), j

    def latih(idx_tr, epochs):
        model = timm.create_model(a.arch, pretrained=pretrained, num_classes=8, drop_rate=0.2).to(dev)
        opt = torch.optim.AdamW(model.parameters(), lr=a.lr, weight_decay=0.02)
        dl = torch.utils.data.DataLoader(DS(idx_tr, tf_train), batch_size=a.bs, shuffle=True, num_workers=2, drop_last=len(idx_tr) > a.bs, pin_memory=dev == "cuda")
        total = epochs * len(dl); warm = max(1, len(dl))
        sched = torch.optim.lr_scheduler.LambdaLR(opt, lambda s: (s + 1) / warm if s < warm else 0.5 * (1 + np.cos(np.pi * (s - warm) / max(1, total - warm))))
        scaler = torch.amp.GradScaler(enabled=dev == "cuda")
        for ep in range(epochs):
            model.train(); t0 = time.time(); rugi = 0; n = 0
            for x, t, _ in dl:
                x, t = x.to(dev), t.to(dev)
                with torch.autocast(device_type="cuda", dtype=torch.float16, enabled=dev == "cuda"):
                    lo = model(x)
                loss = -(t * F.log_softmax(lo.float(), 1)).sum(1).mean()
                opt.zero_grad(set_to_none=True); scaler.scale(loss).backward(); scaler.step(opt); scaler.update(); sched.step()
                rugi += loss.item() * len(x); n += len(x)
            print(f"  epoch {ep + 1:2d}/{epochs} | loss {rugi / n:.4f} | {time.time() - t0:.0f} dtk")
        return model

    @torch.no_grad()
    def prediksi(model, idx):
        model.eval(); dl = torch.utils.data.DataLoader(DS(idx, tf_eval), batch_size=64, num_workers=2)
        out = []
        for x, _, _ in dl:
            x = x.to(dev); out.append(((F.softmax(model(x).float(), 1) + F.softmax(model(torch.flip(x, [3])).float(), 1)) / 2).cpu().numpy())
        return np.concatenate(out)

    # ---------- tahap 1: ukur kesesuaian pada gambar yang ditahan ----------
    idx = np.arange(len(ids))
    tr, ho = train_test_split(idx, test_size=a.holdout, random_state=SEED, stratify=y)
    print("Tahap 1: latih pada", len(tr), "gambar, ukur pada", len(ho), "gambar yang ditahan")
    m1 = latih(tr, a.epochs)
    p = prediksi(m1, ho)
    kes = float((p.argmax(1) == y[ho]).mean())
    kes_ragu = float((p.max(1) >= 0.5).mean())
    print(f"Kesesuaian dengan label guru pada gambar ditahan: {kes:.4f} | porsi keyakinan >= 0,5: {kes_ragu:.3f}")
    del m1

    # ---------- tahap 2: latih ulang pada semua gambar lalu ekspor ----------
    print("Tahap 2: latih ulang pada semua gambar")
    model = latih(idx, a.epochs).cpu().eval()
    dummy = torch.zeros(1, 3, a.size, a.size)
    onnx_path = os.path.join(a.out, "pilahin.onnx")
    torch.onnx.export(model, dummy, onnx_path, input_names=["input"], output_names=["logits"], opset_version=17,
                      dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}}, dynamo=False)
    import onnxruntime as ort
    sesi = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
    x = torch.randn(2, 3, a.size, a.size)
    selisih = float(np.abs(sesi.run(None, {"input": x.numpy()})[0] - model(x).detach().numpy()).max())
    print(f"Verifikasi ONNX: selisih maksimum logit terhadap PyTorch = {selisih:.2e}")
    assert selisih < 1e-3, "keluaran ONNX tidak cocok dengan PyTorch"

    meta = {
        "versi": time.strftime("%Y-%m-%d"),
        "arsitektur": f"{a.arch.split('.')[0]} (distilasi dari ensemble)",
        "file": "pilahin.onnx",
        "labels": CLASSES,
        "input_size": a.size, "resize": "squash", "mean": mean, "std": std,
        "output": "logit", "tta": False,
        "kesesuaian_oof": None if a.smoke else round(kes, 4),
        "catatan": ("MODEL UJI ALUR, bukan model sebenarnya." if a.smoke else
                    f"Dilatih dari gambar train dan keluaran pipeline (pseudo-label dan probabilitas OOF). Kesesuaian dengan label guru diukur pada {len(ho)} gambar yang ditahan, bukan akurasi lapangan."),
    }
    json.dump(meta, open(os.path.join(a.out, "labels.json"), "w"), indent=1, ensure_ascii=False)
    print("Selesai:", onnx_path, f"({os.path.getsize(onnx_path) / 1e6:.1f} MB)", "dan labels.json")


if __name__ == "__main__":
    main()
