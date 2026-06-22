/**
 * Inserta transformaciones Cloudinary para servir imágenes más ligeras en web/móvil.
 * Respeta transforms existentes (e_trim, c_pad, etc.) y añade w_, q_auto, f_auto si faltan.
 */
export function optimizeCloudinaryUrl(
  url,
  { width = 800, height, crop = "limit", quality = "auto", gravity } = {},
) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;

  const qParam =
    quality === "eco"
      ? "q_auto:eco"
      : quality === "good"
        ? "q_auto:good"
        : quality === "best"
          ? "q_auto:best"
          : "q_auto";

  const [base, rest] = url.split("/upload/");
  if (!rest) return url;

  const segments = rest.split("/");
  const first = segments[0];

  const buildTransforms = () => {
    let transforms = `w_${width},${qParam},f_auto,c_${crop},fl_progressive`;
    if (height) transforms += `,h_${height}`;
    if (gravity && crop === "fill") transforms += `,g_${gravity}`;
    return transforms;
  };

  if (/^v\d+/.test(first)) {
    return `${base}/upload/${buildTransforms()}/${rest}`;
  }

  let transforms = first;
  if (!/\bw_\d+/.test(transforms)) transforms += `,w_${width}`;
  if (height && !/\bh_\d+/.test(transforms)) transforms += `,h_${height}`;
  if (!/q_auto/.test(transforms)) transforms += `,${qParam}`;
  if (!/f_auto/.test(transforms)) transforms += ",f_auto";
  if (!/fl_progressive/.test(transforms)) transforms += ",fl_progressive";
  if (!/\bc_(limit|fill|pad|fit|scale)/.test(transforms)) {
    transforms += `,c_${crop}`;
  }
  if (gravity && crop === "fill" && !/\bg_/.test(transforms)) {
    transforms += `,g_${gravity}`;
  }

  segments[0] = transforms;
  return `${base}/upload/${segments.join("/")}`;
}

/** Devuelve la URL sin transforms (solo versión + public_id). */
export function stripCloudinaryTransforms(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;

  const [base, rest] = url.split("/upload/");
  if (!rest) return url;

  const segments = rest.split("/");
  const versionIdx = segments.findIndex((s) => /^v\d+$/.test(s));
  if (versionIdx === -1) return url;

  return `${base}/upload/${segments.slice(versionIdx).join("/")}`;
}

/** Lightbox: nunca recortar el frame original (sin c_fill / h_ forzados). */
export function lightboxCloudinaryUrl(url, { width, quality = "best" } = {}) {
  if (!url) return url;
  const clean = stripCloudinaryTransforms(url);
  return optimizeCloudinaryUrl(clean, { width, quality, crop: "limit" });
}

/** src + srcSet acorde al tamaño real en pantalla (evita descargar 2400px en móvil). */
export function cloudinaryResponsive(
  url,
  { widths, sizes, quality = "good", crop = "limit", aspect, gravity = "center" } = {},
) {
  if (!url || !widths?.length) {
    return { src: url, srcSet: undefined, sizes: sizes || "100vw" };
  }

  const build = (w) => {
    const opts = {
      width: w,
      quality,
      crop: aspect ? "fill" : crop,
      gravity: aspect ? gravity : undefined,
    };
    if (aspect) opts.height = Math.round(w / aspect);
    return optimizeCloudinaryUrl(url, opts);
  };

  // Fallback `src` en ancho medio — evita descargar el máximo antes de que el navegador elija srcSet
  const srcIndex = Math.max(0, Math.min(widths.length - 1, Math.floor(widths.length / 2)));

  return {
    src: build(widths[srcIndex]),
    srcSet: widths.map((w) => `${build(w)} ${w}w`).join(", "),
    sizes: sizes || "100vw",
  };
}

/** Precarga en caché del navegador (idle) para galerías. */
export function prefetchCloudinaryImages(urls, preset, { limit = 8 } = {}) {
  if (!urls?.length || !preset) return;
  urls.slice(0, limit).forEach((url) => {
    const { src } = cloudinaryResponsive(url, preset);
    if (!src) return;
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  });
}

/** Ancho recomendado según contexto de uso */
export const IMG = {
  card: 960,
  cardEager: 1280,
  cardDecor: 280,
  hero: 1600,
  poster: 480,
  still: 900,
  stillGallery: 1800,
  stillSide: 1000,
  stillRow: 800,
  stillThumb: 560,
  lightbox: 2400,
  about: 1200,
  avatar: 128,
  logo: 88,
};

/** Tarjetas de proyecto — equilibrio calidad / peso. */
export const CARD_PRESETS = {
  lazy: {
    widths: [400, 640, 960, 1200],
    sizes: "(min-width: 1024px) 28vw, (min-width: 768px) 44vw, 100vw",
    aspect: 16 / 9,
    quality: "good",
  },
  eager: {
    widths: [640, 960, 1280, 1600],
    sizes: "(min-width: 1024px) 42vw, (min-width: 768px) 58vw, 100vw",
    aspect: 16 / 9,
    quality: "good",
  },
};

/** Cover / hero de ficha de proyecto (ancho completo). */
export const COVER_PRESET = {
  widths: [640, 960, 1280, 1600, 1920],
  sizes: "100vw",
  aspect: 16 / 9,
  quality: "good",
};

/** Fondos decorativos (baja opacidad) — muy ligeros en móvil. */
export const DECOR_PRESET = {
  widths: [160, 240, 320],
  sizes: "100vw",
  aspect: 16 / 9,
  quality: "eco",
};

export const STILL_PRESETS = {
  hero: {
    widths: [480, 720, 1080, 1400, 1800],
    sizes: "(min-width: 1024px) 58vw, (min-width: 768px) 92vw, 100vw",
    aspect: 16 / 9,
    quality: "good",
  },
  side: {
    widths: [360, 540, 720, 1000],
    sizes: "(min-width: 1024px) 22vw, (min-width: 768px) 42vw, 100vw",
    aspect: 16 / 9,
    quality: "good",
  },
  row: {
    widths: [280, 420, 560, 800],
    sizes: "(min-width: 1024px) 22vw, (min-width: 768px) 46vw, 50vw",
    aspect: 16 / 9,
    quality: "good",
  },
};

/** Lightbox — calidad máxima con srcSet (no descargar 2400px en móvil). */
export const LIGHTBOX_PRESET = {
  widths: [960, 1280, 1600, 1920, 2400],
  sizes: "100vw",
  quality: "best",
};

/** Vista rápida del lightbox mientras llega la versión HD. */
export const LIGHTBOX_PREVIEW_WIDTH = 1400;
