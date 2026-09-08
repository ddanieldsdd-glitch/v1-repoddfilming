export const DEFAULT_VIDEO_RATIO = 16 / 9;

export const extractVimeoId = (urlOrId) => {
  const raw = String(urlOrId || "").trim();
  if (!raw) return null;
  if (/^\d{5,}$/.test(raw)) return raw;
  const match = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match ? match[1] : null;
};

export const isVimeoUrl = (url) => Boolean(extractVimeoId(url));

export const fetchVimeoMeta = async (urlOrId) => {
  const id = extractVimeoId(urlOrId);
  if (!id) return null;

  const params = new URLSearchParams({ id });
  const res = await fetch(`/api/vimeo-meta?${params.toString()}`, {
    credentials: "same-origin",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json().catch(() => null);
  if (!data || typeof data.aspect_ratio !== "number") return null;
  return data;
};
