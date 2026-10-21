"use client";

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through (HEIC on some browsers, etc.) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function draw(src: ImageBitmap | HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const w = "naturalWidth" in src ? src.naturalWidth : src.width;
  const h = "naturalHeight" in src ? src.naturalHeight : src.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export interface PreparedImage {
  blob: Blob; // JPEG, max 1024px side, for upload
  previewUrl: string; // data URL for on-screen preview
  thumb: string; // tiny data URL for the daily log (localStorage friendly)
}

/** Resize + compress a photo client-side before upload. */
export async function prepareImage(file: Blob, maxSide = 1024): Promise<PreparedImage> {
  const bmp = await loadBitmap(file);
  const big = draw(bmp, maxSide);
  const blob: Blob = await new Promise((resolve, reject) =>
    big.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode image"))), "image/jpeg", 0.82),
  );
  const previewUrl = big.toDataURL("image/jpeg", 0.8);
  const thumb = draw(bmp, 160).toDataURL("image/jpeg", 0.7);
  if ("close" in bmp) bmp.close();
  return { blob, previewUrl, thumb };
}
