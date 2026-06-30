import defaultContent from "../data/content.json";
import { T, tr } from "./i18n";
import { getActiveCategories } from "./contentStore";
import { getHomeShareImage, getProjectShareImage, SITE_OG_LOGO } from "./ogShare";
import { hasProjectWatchPage } from "./videoSeo";

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
  const logoAlt =
    lang === "es"
      ? "Logotipo DD de Dani Díaz, Director de Fotografía"
      : "DD logo — Dani Díaz, Cinematographer";

  const withImage = (base, image, imageAlt = logoAlt) => ({
    ...base,
    image,
    imageAlt,
  });

  if (pathname === "/") {
    return withImage(
      { title: getSiteTitle(content, lang), description: siteDesc, canonical, ogType: "website" },
      getHomeShareImage(content),
      logoAlt,
    );
  }

  const projectMatch = pathname.match(/^\/project\/([^/]+)/);
  if (projectMatch) {
    const project = (content.projects || []).find((p) => p.slug === projectMatch[1]);
    if (project) {
      const description =
        tr(project.synopsis, lang) ||
        (lang === "es"
          ? `${project.title} — proyecto de ${name}, Director de Fotografía.`
          : `${project.title} — project by ${name}, Cinematographer.`);
      const hasVideo = hasProjectWatchPage(project);
      return withImage(
        {
          title: `${project.title} — ${name}`,
          description,
          canonical: `${BASE_URL}/project/${project.slug}`,
          ogType: hasVideo ? "video.other" : "article",
        },
        getProjectShareImage(project),
        `${project.title} — ${name}`,
      );
    }
  }

  if (pathname === "/work" || pathname.startsWith("/work/")) {
    const catMatch = pathname.match(/^\/work\/([^/]+)/);
    let title = `${tr(T.work.title, lang)} — ${name}`;
    if (catMatch) {
      const cat = getActiveCategories(content.projects || []).find((c) => c.id === catMatch[1]);
      if (cat) title = `${cat[lang]} — ${name}`;
    }
    return withImage(
      {
        title,
        description:
          lang === "es"
            ? `Obra seleccionada de ${name}, Director de Fotografía. Ficción, documental, publicidad y videoclips.`
            : `Selected work by ${name}, Cinematographer. Fiction, documentary, commercials and music videos.`,
        canonical: `${BASE_URL}${pathname}`,
        ogType: "website",
      },
      getHomeShareImage(content),
    );
  }

  if (pathname === "/about") {
    return withImage(
      {
        title: `${tr(T.about.title, lang)} — ${name}`,
        description: siteDesc,
        canonical: `${BASE_URL}/about`,
        ogType: "website",
      },
      getHomeShareImage(content),
    );
  }

  if (pathname === "/contact") {
    return withImage(
      {
        title: `${tr(T.contact.title, lang)} — ${name}`,
        description: tr(T.contact.intro, lang),
        canonical: `${BASE_URL}/contact`,
        ogType: "website",
      },
      getHomeShareImage(content),
    );
  }

  if (pathname === "/showreel") {
    return withImage(
      {
        title: `${tr(T.hero.showreel, lang)} — ${name}`,
        description:
          lang === "es"
            ? `Showreel de ${name}, Director de Fotografía. Selección de trabajos en ficción, documental, publicidad y videoclips.`
            : `Showreel by ${name}, Cinematographer. A selection of fiction, documentary, commercials and music videos.`,
        canonical: `${BASE_URL}/showreel`,
        ogType: "video.other",
      },
      getHomeShareImage(content),
    );
  }

  return withImage(
    { title: getSiteTitle(content, lang), description: siteDesc, canonical, ogType: "website" },
    SITE_OG_LOGO,
  );
}
