/**
 * Inserta transformaciones Cloudinary para servir imágenes más ligeras en web/móvil.
 * Respeta transforms existentes (e_trim, c_pad, etc.) y añade w_, q_auto, f_auto si faltan.
 */
export function optimizeCloudinaryUrl(url, { width = 800, crop = "limit", quality = "auto" } = {}) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;

  const qParam =
    quality === "good" ? "q_auto:good" : quality === "best" ? "q_auto:best" : "q_auto";

  const [base, rest] = url.split("/upload/");
  if (!rest) return url;

  const segments = rest.split("/");
  const first = segments[0];

  if (/^v\d+/.test(first)) {
    return `${base}/upload/w_${width},${qParam},f_auto,c_${crop}/${rest}`;
  }

  let transforms = first;
  if (!/\bw_\d+/.test(transforms)) transforms += `,w_${width}`;
  if (!/q_auto/.test(transforms)) transforms += `,${qParam}`;
  if (!/f_auto/.test(transforms)) transforms += ",f_auto";
  if (!/\bc_(limit|fill|pad|fit|scale)/.test(transforms)) {
    transforms += `,c_${crop}`;
  }

  segments[0] = transforms;
  return `${base}/upload/${segments.join("/")}`;
}

/** Ancho recomendado según contexto de uso */
export const IMG = {
  card: 720,
  cardEager: 960,
  hero: 1280,
  poster: 480,
  still: 900,
  stillGallery: 2400,
  stillRow: 1400,
  stillThumb: 560,
  lightbox: 1920,
  about: 1200,
  avatar: 128,
  logo: 220,
};
