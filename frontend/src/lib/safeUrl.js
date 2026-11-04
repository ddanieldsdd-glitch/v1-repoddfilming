/** Devuelve la URL solo si es http(s); bloquea javascript:, data:, etc. */
export function safeHref(url) {
  const raw = String(url || "").trim();
  if (!/^https?:\/\//i.test(raw)) return undefined;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? raw : undefined;
  } catch {
    return undefined;
  }
}
