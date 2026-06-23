import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { getPageSeo } from "../lib/seo";
import { getVimeoPosterUrl } from "../lib/vimeo";

const setMeta = (key, value, property = false) => {
  if (!value) return;
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
};

const setCanonical = (href) => {
  if (!href) return;
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const PRELOAD_ID = "ddp-lcp-poster";

/** Sincroniza title, description, imagen social y canonical en cada ruta pública. */
export function SeoHead() {
  const content = useContent();
  const [lang] = useLang();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const { title, description, canonical, image, imageAlt, ogType } = getPageSeo(
      pathname,
      content,
      lang,
    );

    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", canonical, true);
    setMeta("og:type", ogType || "website", true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:card", "summary_large_image");

    if (image) {
      setMeta("og:image", image, true);
      setMeta("og:image:width", "1200", true);
      setMeta("og:image:height", "630", true);
      setMeta("og:image:alt", imageAlt || title, true);
      setMeta("twitter:image", image);
      setMeta("twitter:image:alt", imageAlt || title);
    }

    setCanonical(canonical);
  }, [content, lang, pathname]);

  // Preload del poster LCP en home (mejora PageSpeed)
  useEffect(() => {
    if (pathname !== "/") {
      document.getElementById(PRELOAD_ID)?.remove();
      return undefined;
    }

    const poster = getVimeoPosterUrl(content.site?.showreel_url);
    if (!poster) return undefined;

    let link = document.getElementById(PRELOAD_ID);
    if (!link) {
      link = document.createElement("link");
      link.id = PRELOAD_ID;
      link.rel = "preload";
      link.as = "image";
      link.setAttribute("fetchpriority", "high");
      document.head.appendChild(link);
    }
    link.href = poster;

    return () => document.getElementById(PRELOAD_ID)?.remove();
  }, [pathname, content.site?.showreel_url]);

  return null;
}
