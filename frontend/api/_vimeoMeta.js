const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

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
  return {
    width,
    height,
    aspect_ratio: width / height,
  };
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
  cache.set(id, { ts: Date.now(), data });
  return data;
}

module.exports = {
  DEFAULT_TTL_MS,
  extractVimeoId,
  getVimeoMeta,
  normalizeMeta,
};
