/**
 * Pack items into justified rows.
 * Each item keeps its native aspect ratio; a row is scaled as a whole
 * (never stretching a still on its own, never cropping). Order is preserved.
 */

export const DEFAULT_RATIO = 16 / 9;

const SOLO_SIZES = new Set(["hero", "large", "wide"]);

function maxHeightFor(item, count, windowH, defaultMaxH) {
  if (count === 1) {
    if (item.size === "hero") return Math.round(windowH * 0.7);
    if (item.size === "large") return Math.round(windowH * 0.58);
    if (item.size === "wide") return Math.round(windowH * 0.44);
  }
  return defaultMaxH;
}

export function packJustified(items, containerWidth, opts = {}) {
  const gap = opts.gap ?? 12;
  const minH = opts.minH ?? 150;
  const windowH = opts.windowH ?? 900;
  const defaultMaxH = opts.maxH ?? Math.round(windowH * 0.55);
  const soloAll = Boolean(opts.soloAll);

  if (!containerWidth || containerWidth < 80 || !items.length) {
    return [];
  }

  const rows = [];
  let current = [];

  const flush = () => {
    if (!current.length) return;
    const n = current.length;
    const gaps = gap * Math.max(0, n - 1);
    const sumR = current.reduce((s, i) => s + i.ratio, 0);
    const fillH = (containerWidth - gaps) / sumR;

    // Scale the whole row to the content width. maxH caps portraits so a
    // vertical still never becomes a full-viewport tower.
    let height = fillH;
    const cap = Math.min(...current.map((i) => maxHeightFor(i, n, windowH, defaultMaxH)));
    height = Math.min(height, cap);
    if (n > 1) height = Math.max(minH, height);
    height = Math.min(height, fillH);

    rows.push(
      current.map((item) => ({
        ...item,
        height,
        width: height * item.ratio,
      })),
    );
    current = [];
  };

  const wouldFit = (item) => {
    const n = current.length + 1;
    const gaps = gap * (n - 1);
    const sumR = current.reduce((s, i) => s + i.ratio, 0) + item.ratio;
    return (containerWidth - gaps) / sumR >= minH;
  };

  for (const item of items) {
    const solo = soloAll || SOLO_SIZES.has(item.size);
    if (solo) {
      flush();
      current = [item];
      flush();
      continue;
    }
    if (current.length && !wouldFit(item)) flush();
    current.push(item);
  }
  flush();

  return rows;
}
