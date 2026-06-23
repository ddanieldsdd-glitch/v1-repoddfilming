import { LOGO_BASE, SITE_OG_LOGO } from "./siteAssets";

export { SITE_OG_LOGO };

const isVideoUrl = (url) =>
  /vimeo\.com|youtube\.com|youtu\.be/i.test(String(url || ""));

/** Imagen 1200×630 para carteles/covers de proyecto. */
export function toOgShareImage(url, mode = "pad") {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("res.cloudinary.com/") || !url.includes("/upload/")) return url;
  if (url.includes("w_1200")) return url;

  const t =
    mode === "fill"
      ? "w_1200,h_630,c_fill,g_auto,q_auto,f_jpg"
      : "w_1200,h_630,c_pad,b_rgb:000000,q_auto,f_jpg";

  return url.replace("/upload/", `/upload/${t}/`);
}

/** Logo del sitio → blanco sobre negro 1200×630 (el PNG fuente es oscuro). */
export function buildOgLogoUrl(logoUrl) {
  if (!logoUrl || !logoUrl.includes("cloudinary.com")) return SITE_OG_LOGO;
  if (logoUrl.includes("w_1200,h_630")) return logoUrl;

  const asset = logoUrl.split("/upload/").pop();
  if (!asset) return SITE_OG_LOGO;

  return `${LOGO_BASE}/c_scale,w_700/q_auto,f_jpg/e_negate/c_pad,b_rgb:000000,w_1200,h_630,g_center/${asset}`;
}

/** Home y páginas genéricas → logo blanco visible. */
export function getHomeShareImage(content) {
  const logo = content?.site?.logo_white;
  if (logo?.includes("cloudinary")) return buildOgLogoUrl(logo);
  return SITE_OG_LOGO;
}

/** Proyecto → cartel (poster) o cover si no hay cartel. */
export function getProjectShareImage(project) {
  if (!project) return SITE_OG_LOGO;

  const poster = project.poster && String(project.poster).trim();
  if (poster) {
    return toOgShareImage(poster, "pad") || SITE_OG_LOGO;
  }

  const cover = project.cover && String(project.cover).trim();
  if (cover && !isVideoUrl(cover)) {
    return toOgShareImage(cover, "fill") || SITE_OG_LOGO;
  }

  return SITE_OG_LOGO;
}
