/** Normalized crop window on source media (fractions 0–1). */

export const FULL_CROP = { x: 0, y: 0, w: 1, h: 1 };

export function normalizeCrop(crop) {
  if (!crop || typeof crop !== "object") return { ...FULL_CROP };
  const w = clamp01(Number(crop.w), 1);
  const h = clamp01(Number(crop.h), 1);
  const x = clamp01(Number(crop.x), 0);
  const y = clamp01(Number(crop.y), 0);
  const cw = Math.min(w, 1 - x);
  const ch = Math.min(h, 1 - y);
  if (cw < 0.02 || ch < 0.02) return { ...FULL_CROP };
  return { x, y, w: cw, h: ch };
}

function clamp01(n, fallback) {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, n));
}

/** Aspect ratio (width/height) of crop region in pixel space. */
export function cropAspectRatio(crop, imgW, imgH) {
  const c = normalizeCrop(crop);
  if (!imgW || !imgH) return c.w / c.h;
  return (c.w * imgW) / (c.h * imgH);
}

/** w/h in normalized coords for a 16:9 window on this image. */
export function workCropWHRatio(imgW, imgH) {
  if (!imgW || !imgH) return 16 / 9;
  return (16 / 9) * (imgH / imgW);
}

export function defaultWorkCrop(imgW, imgH) {
  if (!imgW || !imgH) return { ...FULL_CROP };
  const wh = workCropWHRatio(imgW, imgH);
  const imgAr = imgW / imgH;
  const targetAr = 16 / 9;
  if (imgAr > targetAr) {
    const h = 1;
    const w = targetAr / imgAr;
    return { x: (1 - w) / 2, y: 0, w, h };
  }
  const w = 1;
  const h = imgAr / targetAr;
  return { x: 0, y: (1 - h) / 2, w, h };
}

export function defaultHomeCrop() {
  return { ...FULL_CROP };
}

/** CSS for positioning source inside a crop frame. */
export function cropImageStyle(crop) {
  const c = normalizeCrop(crop);
  return {
    position: "absolute",
    maxWidth: "none",
    width: `${100 / c.w}%`,
    height: `${100 / c.h}%`,
    left: `${(-c.x / c.w) * 100}%`,
    top: `${(-c.y / c.h) * 100}%`,
  };
}

/** Center point for object-position on cover video. */
export function cropObjectPosition(crop) {
  const c = normalizeCrop(crop);
  const cx = (c.x + c.w / 2) * 100;
  const cy = (c.y + c.h / 2) * 100;
  return `${cx}% ${cy}%`;
}

/** Build work crop from pan (0–1) and zoom (0–1, 1 = widest). */
export function workCropFromPanZoom(panX, panY, zoom, imgW, imgH) {
  const wh = workCropWHRatio(imgW, imgH);
  let h = Math.max(0.08, Math.min(1, zoom));
  let w = h * wh;
  if (w > 1) {
    w = 1;
    h = w / wh;
  }
  const maxX = 1 - w;
  const maxY = 1 - h;
  const x = maxX * clamp01(panX, 0.5);
  const y = maxY * clamp01(panY, 0.5);
  return { x, y, w, h };
}

/** Build home crop from pan, zoom and aspect (w/h in normalized space). */
export function homeCropFromPanZoom(panX, panY, zoom, aspectWH, imgW, imgH) {
  let h = Math.max(0.08, Math.min(1, zoom));
  let w = h * aspectWH;
  if (w > 1) {
    w = 1;
    h = w / aspectWH;
  }
  if (h > 1) {
    h = 1;
    w = h * aspectWH;
  }
  const maxX = Math.max(0, 1 - w);
  const maxY = Math.max(0, 1 - h);
  const x = maxX * clamp01(panX, 0.5);
  const y = maxY * clamp01(panY, 0.5);
  return { x, y, w, h };
}

export function panZoomFromCrop(crop, imgW, imgH, mode = "free") {
  const c = normalizeCrop(crop);
  const maxX = Math.max(0, 1 - c.w);
  const maxY = Math.max(0, 1 - c.h);
  const panX = maxX > 0 ? c.x / maxX : 0.5;
  const panY = maxY > 0 ? c.y / maxY : 0.5;
  const zoom = mode === "16:9" ? c.h : Math.max(c.w, c.h);
  const aspectWH = c.w / c.h;
  return { panX, panY, zoom, aspectWH };
}

export const SHOWREEL_PLACEMENTS = [
  { id: "nav", es: "Solo en el menú", en: "Navbar only" },
  { id: "home", es: "Solo en la portada", en: "Home only" },
  { id: "both", es: "Menú y portada", en: "Navbar and home" },
];

export function showreelInNav(placement) {
  const p = placement || "nav";
  return p === "nav" || p === "both";
}

export function showreelOnHome(placement) {
  const p = placement || "nav";
  return p === "home" || p === "both";
}
