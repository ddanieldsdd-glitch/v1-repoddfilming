/**
 * Reconocimiento: URL + visibilidad independiente en Home y Work.
 * Compatible con string[] legacy y showOnCard (aplica a ambas pantallas).
 */

function cardFlagsFromLegacy(item) {
  if (item.showOnHome != null || item.showOnWork != null) {
    return {
      showOnHome: item.showOnHome === true,
      showOnWork: item.showOnWork === true,
    };
  }
  const onCard = item.showOnCard !== false;
  return { showOnHome: onCard, showOnWork: onCard };
}

export function normalizeRecognition(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const url = item.trim();
    return url ? { url, showOnHome: true, showOnWork: true } : null;
  }
  const url = String(item.url || "").trim();
  if (!url) return null;
  const flags = cardFlagsFromLegacy(item);
  return { url, ...flags };
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

/** Reconocimientos para tarjetas según pantalla (home | work). */
export function getCardRecognitions(project, surface) {
  if (surface !== "home" && surface !== "work") return [];
  const key = surface === "home" ? "showOnHome" : "showOnWork";
  return getDetailRecognitions(project).filter((r) => r[key]);
}

/** Añade URLs nuevas sin duplicar. Por defecto no se marcan en tarjetas. */
export function mergeRecognitionUrls(
  existing,
  urls,
  { showOnHome = false, showOnWork = false } = {},
) {
  const next = normalizeRecognitions(existing);
  const seen = new Set(next.map((r) => r.url));
  urls.forEach((raw) => {
    const url = String(raw || "").trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    next.push({ url, showOnHome, showOnWork });
  });
  return next;
}
