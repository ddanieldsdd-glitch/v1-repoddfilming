/**
 * Justified rows: packing by crop aspect ratio.
 * home_size controls solo rows (hero/wide/large) vs packed rows.
 */

export const DEFAULT_RATIO = 16 / 9;

const SOLO_SIZES = new Set(["wide"]);

function maxPerRowForSize(size, globalMax) {
  if (SOLO_SIZES.has(size)) return 1;
  if (size === "small") return Math.min(3, globalMax);
  return Math.min(2, globalMax);
}

function soloMaxHForSize(size, windowH) {
  if (size === "hero") return Math.round(windowH * 0.55);
  if (size === "wide") return Math.round(windowH * 0.36);
  if (size === "large") return Math.round(windowH * 0.48);
  return Math.round(windowH * 0.4);
}

export function packJustified(items, containerWidth, opts = {}) {
  const gap = opts.gap ?? 14;
  const minH = opts.minH ?? 240;
  const windowH = opts.windowH ?? 900;
  const maxH = opts.maxH ?? Math.round(windowH * 0.48);
  const globalMaxPerRow = opts.maxPerRow ?? 2;
  const soloAll = Boolean(opts.soloAll);

  if (!containerWidth || containerWidth < 80 || !items.length) {
    return [];
  }

  const rows = [];
  let current = [];

  const fillH = (list) => {
    const n = list.length;
    const gaps = gap * Math.max(0, n - 1);
    const sumR = list.reduce((s, i) => s + i.ratio, 0);
    return (containerWidth - gaps) / sumR;
  };

  const fits = (item) => fillH([...current, item]) >= minH;

  const flush = () => {
    if (!current.length) return;
    let height = fillH(current);
    const cap =
      current.length === 1
        ? Math.min(maxH, soloMaxHForSize(current[0].size, windowH))
        : maxH;
    height = Math.min(height, cap);
    if (current.length > 1) height = Math.max(minH, Math.min(height, maxH));
    height = Math.min(height, fillH(current));
    rows.push(
      current.map((item) => ({
        ...item,
        height,
        width: height * item.ratio,
      })),
    );
    current = [];
  };

  for (const item of items) {
    if (soloAll) {
      current = [item];
      flush();
      continue;
    }

    const itemSolo = SOLO_SIZES.has(item.size);
    if (itemSolo && current.length) flush();
    if (current.length && SOLO_SIZES.has(current[0].size)) flush();

    const rowMax = itemSolo
      ? 1
      : Math.min(
          globalMaxPerRow,
          maxPerRowForSize(item.size, globalMaxPerRow),
          current.length
            ? maxPerRowForSize(current[0].size, globalMaxPerRow)
            : globalMaxPerRow,
        );

    if (current.length >= rowMax) flush();
    if (current.length && !fits(item)) flush();
    current.push(item);
    if (itemSolo) flush();
  }
  flush();

  return rows;
}
