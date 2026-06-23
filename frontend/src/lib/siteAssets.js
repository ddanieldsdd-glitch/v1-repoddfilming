const LOGO_ID = "v1777731841/DD_BLANCO_l8xqal";
export const LOGO_BASE = "https://res.cloudinary.com/dsphxo7mx/image/upload";

/** Nav: h-8 (32px) móvil, h-11 (44px) desktop — WebP/AVIF vía f_auto. */
export const SITE_NAV_LOGO =
  `${LOGO_BASE}/e_trim,w_88,h_44,c_fit,q_auto,f_auto/${LOGO_ID}.png`;

export const SITE_NAV_LOGO_SRCSET =
  `${LOGO_BASE}/e_trim,w_88,h_44,c_fit,q_auto,f_auto/${LOGO_ID}.png 1x, ` +
  `${LOGO_BASE}/e_trim,w_176,h_88,c_fit,q_auto,f_auto/${LOGO_ID}.png 2x`;

/** Logo escalado para favicon, PWA, redes. */
export const SITE_FAVICON_32 =
  `https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_32,h_32,c_pad,b_rgb:000000,q_auto,f_png/${LOGO_ID}.png`;

export const SITE_FAVICON_192 =
  `https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_192,h_192,c_pad,b_rgb:000000,q_auto,f_png/${LOGO_ID}.png`;

export const SITE_APPLE_TOUCH_ICON =
  `https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_180,h_180,c_pad,b_rgb:000000,q_auto,f_png/${LOGO_ID}.png`;

/** OG 1200×630 — logo blanco visible (e_negate invierte el PNG oscuro de Cloudinary). */
export const SITE_OG_LOGO =
  `${LOGO_BASE}/c_scale,w_700/q_auto,f_jpg/e_negate/c_pad,b_rgb:000000,w_1200,h_630,g_center/${LOGO_ID}.png`;
