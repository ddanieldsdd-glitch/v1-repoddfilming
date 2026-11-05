const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const FAILURE_TTL_MS = 10 * 60 * 1000;

const cache = new Map();

function extractVimeoId(urlOrId) {
  const raw = String(urlOrId || '').trim();
  if (!raw) return null;
  if (/^\d{5,}$/.test(raw)) return raw;
  const match = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? match[1] : null;
}

function buildVimeoPageUrl(id) {
  return `https://vimeo.com/${id}`;
}

function normalizeMeta(data) {
  const width = Number(data?.width);
  const height = Number(data?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }
  const duration = Number(data?.duration);
  return {
    width,
    height,
    aspect_ratio: width / height,
    duration: Number.isFinite(duration) && duration > 0 ? duration : undefined,
    upload_date: toIsoUploadDate(data?.upload_date),
  };
}

/** "2026-09-08 11:10:40" (oEmbed de Vimeo) → "2026-09-08T11:10:40+00:00". */
function toIsoUploadDate(value) {
  const m = String(value || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}+00:00` : undefined;
}

async function fetchVimeoOembed(id) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(buildVimeoPageUrl(id))}`;
    const res = await fetch(oembedUrl, { signal: controller.signal, redirect: 'follow' });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return normalizeMeta(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function getVimeoMeta(urlOrId, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const id = extractVimeoId(urlOrId);
  if (!id) return null;

  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < ttlMs) {
    return cached.data;
  }

  const data = await fetchVimeoOembed(id);
  // Un fallo puntual de Vimeo no debe quedarse cacheado 24 h.
  cache.set(id, { ts: data ? Date.now() : Date.now() - ttlMs + FAILURE_TTL_MS, data });
  return data;
}

module.exports = {
  DEFAULT_TTL_MS,
  extractVimeoId,
  getVimeoMeta,
  normalizeMeta,
};
