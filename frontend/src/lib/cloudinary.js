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
    let transforms = `w_${width},${qParam},f_auto,c_${crop}`;
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
  if (!/\bc_(limit|fill|pad|fit|scale)/.test(transforms)) {
    transforms += `,c_${crop}`;
  }
  if (gravity && crop === "fill" && !/\bg_/.test(transforms)) {
    transforms += `,g_${gravity}`;
  }

  segments[0] = transforms;
  return `${base}/upload/${segments.join("/")}`;
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

  return {
    src: build(widths[widths.length - 1]),
    srcSet: widths.map((w) => `${build(w)} ${w}w`).join(", "),
    sizes: sizes || "100vw",
  };
}

/** Ancho recomendado según contexto de uso */
export const IMG = {
  card: 560,
  cardEager: 720,
  cardDecor: 280,
  hero: 1280,
  poster: 480,
  still: 900,
  stillGallery: 1600,
  stillSide: 960,
  stillRow: 640,
  stillThumb: 560,
  lightbox: 1920,
  about: 1200,
  avatar: 128,
  logo: 88,
};

/** Tarjetas de proyecto — prioridad móvil (100vw en pantallas <768px). */
export const CARD_PRESETS = {
  lazy: {
    widths: [280, 400, 520, 640],
    sizes: "(min-width: 1024px) 28vw, (min-width: 768px) 44vw, 100vw",
    aspect: 16 / 9,
    quality: "good",
  },
  eager: {
    widths: [360, 480, 640, 800],
    sizes: "(min-width: 1024px) 42vw, (min-width: 768px) 58vw, 100vw",
    aspect: 16 / 9,
    quality: "good",
  },
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
    widths: [360, 480, 640, 960, 1280],
    sizes: "(min-width: 1024px) 58vw, (min-width: 768px) 92vw, 100vw",
    aspect: 16 / 9,
  },
  side: {
    widths: [240, 360, 480, 640],
    sizes: "(min-width: 1024px) 22vw, (min-width: 768px) 42vw, 100vw",
    aspect: 16 / 9,
  },
  row: {
    widths: [180, 260, 360, 480],
    sizes: "(min-width: 1024px) 22vw, (min-width: 768px) 46vw, 50vw",
    aspect: 16 / 9,
  },
};
