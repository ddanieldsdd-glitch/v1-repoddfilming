/**
 * Reconocimiento: URL + flag para tarjetas Home/Work.
 * Compatible con el formato legacy string[] (solo URL).
 */

export function normalizeRecognition(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const url = item.trim();
    return url ? { url, showOnCard: true } : null;
  }
  const url = String(item.url || "").trim();
  if (!url) return null;
  return {
    url,
    showOnCard: item.showOnCard !== false,
  };
}

export function normalizeRecognitions(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeRecognition).filter(Boolean);
}

export function getRecognitionUrl(item) {
  return normalizeRecognition(item)?.url || "";
}

/** Todos los reconocimientos (ficha del proyecto), en orden del Admin. */
export function getDetailRecognitions(project) {
  return normalizeRecognitions(project?.recognitions);
}

/** Solo los marcados para tarjetas Home/Work, en orden del Admin. */
export function getCardRecognitions(project) {
  return getDetailRecognitions(project).filter((r) => r.showOnCard);
}

/** Añade URLs nuevas sin duplicar. */
export function mergeRecognitionUrls(existing, urls, { showOnCard = true } = {}) {
  const next = normalizeRecognitions(existing);
  const seen = new Set(next.map((r) => r.url));
  urls.forEach((raw) => {
    const url = String(raw || "").trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    next.push({ url, showOnCard });
  });
  return next;
}
