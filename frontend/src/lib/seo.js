import defaultContent from "../data/content.json";
import { T, tr } from "./i18n";
import { getActiveCategories } from "./contentStore";

const BASE_URL = "https://ddanidiaz.com";

export const DEFAULT_META = defaultContent.site?.meta_description || {
  es: "Dani Díaz, Director de Fotografía entre Sevilla y Barcelona. Formado en la ESCAC. Ficción, documental, publicidad y videoclips.",
  en: "Dani Díaz, Cinematographer based between Seville and Barcelona. ESCAC-trained. Fiction, documentary, commercials and music videos.",
};

/** Descripción del sitio para Google (prioriza admin → default). */
export function getSiteDescription(content, lang) {
  return (
    tr(content?.site?.meta_description, lang) ||
    tr(DEFAULT_META, lang) ||
    ""
  );
}

export function getSiteTitle(content, lang) {
  const name = content?.site?.name || "Dani Díaz";
  return `${name} — ${tr(content?.site?.title, lang)}`;
}

/** Meta por ruta para SeoHead. */
export function getPageSeo(pathname, content, lang) {
  const name = content?.site?.name || "Dani Díaz";
  const siteDesc = getSiteDescription(content, lang);
  const canonical = `${BASE_URL}${pathname === "/" ? "/" : pathname}`;

  if (pathname === "/") {
    return { title: getSiteTitle(content, lang), description: siteDesc, canonical };
  }

  if (pathname === "/work" || pathname.startsWith("/work/")) {
    const catMatch = pathname.match(/^\/work\/([^/]+)/);
    let title = `${tr(T.work.title, lang)} — ${name}`;
    if (catMatch) {
      const cat = getActiveCategories(content.projects || []).find((c) => c.id === catMatch[1]);
      if (cat) title = `${cat[lang]} — ${name}`;
    }
    return {
      title,
      description:
        lang === "es"
          ? `Obra seleccionada de ${name}, Director de Fotografía. Ficción, documental, publicidad y videoclips.`
          : `Selected work by ${name}, Cinematographer. Fiction, documentary, commercials and music videos.`,
      canonical: `${BASE_URL}${pathname}`,
    };
  }

  if (pathname === "/about") {
    return {
      title: `${tr(T.about.title, lang)} — ${name}`,
      description: getSiteDescription(content, lang),
      canonical: `${BASE_URL}/about`,
    };
  }

  if (pathname === "/contact") {
    return {
      title: `${tr(T.contact.title, lang)} — ${name}`,
      description: tr(T.contact.intro, lang),
      canonical: `${BASE_URL}/contact`,
    };
  }

  if (pathname === "/showreel") {
    return {
      title: `${tr(T.hero.showreel, lang)} — ${name}`,
      description:
        lang === "es"
          ? `Showreel de ${name}, Director de Fotografía. Selección de trabajos en ficción, documental, publicidad y videoclips.`
          : `Showreel by ${name}, Cinematographer. A selection of fiction, documentary, commercials and music videos.`,
      canonical: `${BASE_URL}/showreel`,
    };
  }

  return { title: getSiteTitle(content, lang), description: siteDesc, canonical };
}
