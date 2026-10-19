const LOGO_ID = "v1777731841/DD_BLANCO_l8xqal";
export const LOGO_BASE = "https://res.cloudinary.com/dsphxo7mx/image/upload";

// El logo del nav y los favicons son vectoriales: src/components/LogoMark.jsx
// y scripts/build-favicons.py.

/** OG 1200×630 — logo blanco visible (e_negate invierte el PNG oscuro de Cloudinary). */
export const SITE_OG_LOGO =
  `${LOGO_BASE}/c_scale,w_700/q_auto,f_jpg/e_negate/c_pad,b_rgb:000000,w_1200,h_630,g_center/${LOGO_ID}.png`;
