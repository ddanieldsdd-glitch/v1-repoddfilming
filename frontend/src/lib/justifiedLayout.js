/**
 * Justified rows: native aspect ratio, no crop, no stretch.
 * Desktop prefers two large stills per row (mixed widths from different ARs).
 * "hero" no longer isolates a still on its own row.
 */

export const DEFAULT_RATIO = 16 / 9;

export function packJustified(items, containerWidth, opts = {}) {
  const gap = opts.gap ?? 14;
  const minH = opts.minH ?? 240;
  const windowH = opts.windowH ?? 900;
  const maxH = opts.maxH ?? Math.round(windowH * 0.48);
  const soloMaxH = opts.soloMaxH ?? Math.round(windowH * 0.4);
  const maxPerRow = opts.maxPerRow ?? 2;
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
    const cap = current.length === 1 ? Math.min(maxH, soloMaxH) : maxH;
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
    if (current.length >= maxPerRow) flush();
    if (current.length && !fits(item)) flush();
    current.push(item);
  }
  flush();

  return rows;
}
