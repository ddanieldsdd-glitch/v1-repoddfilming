import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useContent, useLang } from "../lib/useContent";
import { tr } from "../lib/i18n";

const DEFAULT_DESC =
  "Dani Díaz, Director de Fotografía entre Sevilla y Barcelona. Formado en la ESCAC. Ficción, documental, publicidad y videoclips.";

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

/** Sincroniza title y meta description con el contenido del admin (MongoDB). */
export function SeoHead() {
  const content = useContent();
  const [lang] = useLang();
  const { pathname } = useLocation();

  useEffect(() => {
    // Meta del sitio en home; otras rutas mantienen su propio SEO (p. ej. og.js en proyectos)
    if (pathname !== "/") return;

    const title = `${content.site?.name || "Dani Díaz"} — ${tr(content.site?.title, lang)}`;
    const description =
      tr(content.site?.meta_description, lang) ||
      String(content.about?.[lang] || content.about?.es || "")
        .split("\n")
        .filter(Boolean)[0]
        ?.slice(0, 320) ||
      DEFAULT_DESC;

    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
  }, [content, lang, pathname]);

  return null;
}
