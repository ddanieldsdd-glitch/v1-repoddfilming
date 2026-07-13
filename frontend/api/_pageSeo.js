/**
 * Metadatos y HTML estático por ruta para crawlers (og.js).
 * Espejo server-side de src/lib/seo.js — CommonJS para las funciones Vercel.
 */

const defaultContent = require('../src/data/content.json');
const { getPublishedProjects } = require('./_content');
const { resolveProjectVideo } = require('./_videoSeo');

const BASE_URL = 'https://ddanidiaz.com';
const OG_LOGO =
  'https://res.cloudinary.com/dsphxo7mx/image/upload/c_scale,w_700/q_auto,f_jpg/e_negate/c_pad,b_rgb:000000,w_1200,h_630,g_center/v1777731841/DD_BLANCO_l8xqal.png';

const CATEGORIES = [
  { id: 'fiction', es: 'Ficción', en: 'Fiction' },
  { id: 'documentary', es: 'Documental', en: 'Documentary' },
  { id: 'commercial', es: 'Publicidad', en: 'Commercials' },
  { id: 'music-video', es: 'Videoclips', en: 'Music Videos' },
];

const T = {
  work: { title: { es: 'Obra seleccionada', en: 'Selected work' } },
  about: { title: { es: 'Sobre mí', en: 'About' } },
  contact: {
    title: { es: 'Contacto', en: 'Contact' },
    intro: {
      es: 'Para nuevos proyectos, colaboraciones o referencias técnicas.',
      en: 'For new projects, collaborations or technical references.',
    },
  },
  hero: { showreel: { es: 'Showreel', en: 'Showreel' } },
};

function tr(obj, lang = 'es') {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.es || obj.en || '';
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isVideoUrl(url) {
  return /vimeo\.com|youtube\.com|youtu\.be/i.test(String(url || ''));
}

function buildOgLogoUrl(logoUrl) {
  if (!logoUrl || !logoUrl.includes('cloudinary.com')) return OG_LOGO;
  if (logoUrl.includes('w_1200,h_630')) return logoUrl;
  const asset = logoUrl.split('/upload/').pop();
  if (!asset) return OG_LOGO;
  return `https://res.cloudinary.com/dsphxo7mx/image/upload/c_scale,w_700/q_auto,f_jpg/e_negate/c_pad,b_rgb:000000,w_1200,h_630,g_center/${asset}`;
}

function toOGImage(url, mode = 'pad') {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('w_1200')) return url;
  const t =
    mode === 'fill'
      ? 'w_1200,h_630,c_fill,g_auto,q_auto,f_jpg'
      : 'w_1200,h_630,c_pad,b_rgb:000000,q_auto,f_jpg';
  return url.replace('/upload/', `/upload/${t}/`);
}

function getActiveCategories(projects = []) {
  return CATEGORIES.filter((c) =>
    projects.some((p) => p.category === c.id && p.published !== false),
  );
}

function getSiteDescription(content) {
  return (
    content?.site?.meta_description?.es
    || defaultContent.site?.meta_description?.es
    || ''
  );
}

function getSiteTitle(content) {
  const name = content?.site?.name || 'Dani Díaz';
  const title = content?.site?.title?.es || defaultContent.site?.title?.es || 'Director de Fotografía';
  return `${name} — ${title}`;
}

function getHomeShareImage(content) {
  const logo = content?.site?.logo_white;
  if (logo?.includes('cloudinary')) return buildOgLogoUrl(logo);
  return OG_LOGO;
}

function getProjectShareImage(project) {
  if (!project) return OG_LOGO;
  const cover = project.cover && String(project.cover).trim();
  if (cover && !isVideoUrl(cover)) return toOGImage(cover, 'fill');
  const poster = project.poster && String(project.poster).trim();
  if (poster) return toOGImage(poster, 'pad');
  return OG_LOGO;
}

function buildStaticPageJsonLd(pathname, content) {
  const meta = getPageMeta(pathname, content);
  if (!meta) return '';
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${meta.url}#webpage`,
          url: meta.url,
          name: meta.title,
          description: meta.description,
          inLanguage: ['es', 'en'],
          author: { '@id': 'https://ddanidiaz.com/#person' },
          isPartOf: { '@id': 'https://ddanidiaz.com/#website' },
        },
      ],
    },
    null,
    2,
  );
}

/** Metadatos sin escapar (JSON-LD, etc.). */
function getPageMeta(pathname, content) {
  const name = content?.site?.name || 'Dani Díaz';
  const siteDesc = getSiteDescription(content);

  if (pathname === '/about') {
    return {
      title: `${tr(T.about.title)} — ${name}`,
      description: siteDesc,
      url: `${BASE_URL}/about`,
      image: getHomeShareImage(content),
      ogType: 'website',
      imageAlt: 'Logotipo DD de Dani Díaz, Director de Fotografía',
    };
  }

  if (pathname === '/contact') {
    return {
      title: `${tr(T.contact.title)} — ${name}`,
      description: tr(T.contact.intro),
      url: `${BASE_URL}/contact`,
      image: getHomeShareImage(content),
      ogType: 'website',
      imageAlt: 'Logotipo DD de Dani Díaz, Director de Fotografía',
    };
  }

  if (pathname === '/work' || pathname.startsWith('/work/')) {
    const catMatch = pathname.match(/^\/work\/([^/]+)/);
    let title = `${tr(T.work.title)} — ${name}`;
    if (catMatch) {
      const cat = getActiveCategories(content.projects || []).find((c) => c.id === catMatch[1]);
      if (cat) title = `${cat.es} — ${name}`;
    }
    return {
      title,
      description: `Obra seleccionada de ${name}, Director de Fotografía. Ficción, documental, publicidad y videoclips.`,
      url: `${BASE_URL}${pathname}`,
      image: getHomeShareImage(content),
      ogType: 'website',
      imageAlt: 'Logotipo DD de Dani Díaz, Director de Fotografía',
    };
  }

  return null;
}

/** Datos OG escapados listos para inyectar en HTML. */
function getPageSeoData(pathname, content) {
  const meta = getPageMeta(pathname, content);
  if (!meta) return null;
  return {
    title: esc(meta.title),
    description: esc(meta.description),
    image: meta.image,
    url: meta.url,
    ogType: meta.ogType,
    imageAlt: esc(meta.imageAlt),
    embedUrl: null,
  };
}

function buildSiteNavHtml() {
  return `<nav aria-label="Navegación principal" style="margin-top:2rem;font-size:14px;line-height:2">
  <a href="${BASE_URL}/">Inicio</a> ·
  <a href="${BASE_URL}/work">Obra</a> ·
  <a href="${BASE_URL}/showreel">Showreel</a> ·
  <a href="${BASE_URL}/about">Sobre mí</a> ·
  <a href="${BASE_URL}/contact">Contacto</a>
</nav>`;
}

function buildStaticBodyHtml(pathname, content, embedHtml = '') {
  const name = content?.site?.name || 'Dani Díaz';
  const nav = buildSiteNavHtml();

  if (pathname === '/about') {
    const paragraphs = String(content.about?.es || defaultContent.about?.es || '')
      .split('\n')
      .filter(Boolean)
      .map((p) => `<p>${esc(p)}</p>`)
      .join('\n');
    return `<main id="seo-static-content" style="max-width:720px;margin:2rem auto;padding:0 1.5rem;color:#fff;font-family:system-ui,sans-serif">
  <h1>${esc(tr(T.about.title))} — ${esc(name)}</h1>
  ${paragraphs}
  ${nav}
</main>`;
  }

  if (pathname === '/contact') {
    const email = content.site?.social?.email || 'ddfilming@gmail.com';
    return `<main id="seo-static-content" style="max-width:720px;margin:2rem auto;padding:0 1.5rem;color:#fff;font-family:system-ui,sans-serif">
  <h1>${esc(tr(T.contact.title))} — ${esc(name)}</h1>
  <p>${esc(tr(T.contact.intro))}</p>
  <p><a href="mailto:${esc(email)}" style="color:#fff">${esc(email)}</a></p>
  ${nav}
</main>`;
  }

  if (pathname === '/work' || pathname.startsWith('/work/')) {
    const catMatch = pathname.match(/^\/work\/([^/]+)/);
    const published = getPublishedProjects(content);
    const filtered = catMatch
      ? published.filter((p) => p.category === catMatch[1])
      : published;
    const heading = catMatch
      ? getActiveCategories(published).find((c) => c.id === catMatch[1])?.es || tr(T.work.title)
      : tr(T.work.title);
    const items = filtered
      .map(
        (p) =>
          `<li><a href="${BASE_URL}/project/${esc(p.slug)}" style="color:#fff">${esc(p.title)}</a></li>`,
      )
      .join('\n');
    return `<main id="seo-static-content" style="max-width:720px;margin:2rem auto;padding:0 1.5rem;color:#fff;font-family:system-ui,sans-serif">
  <h1>${esc(heading)} — ${esc(name)}</h1>
  <p>Proyectos de ${esc(name)}, Director de Fotografía.</p>
  <ul>${items}</ul>
  ${nav}
</main>`;
  }

  const projectMatch = pathname.match(/^\/project\/([^/?#]+)/);
  if (projectMatch) {
    const project = getPublishedProjects(content).find((p) => p.slug === projectMatch[1]);
    if (!project) return '';
    const synopsis = project.synopsis?.es || project.synopsis?.en || '';
    const video = resolveProjectVideo(project);
    const videoBlock = video
      ? `<iframe src="${video.embedUrl}" title="${esc(project.title)}" width="960" height="540" style="width:100%;max-width:100%;aspect-ratio:16/9;border:0;display:block;min-height:360px;margin-top:1.5rem" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
      : '';
    return `<main id="seo-static-content" style="max-width:960px;margin:2rem auto;padding:0 1.5rem;color:#fff;font-family:system-ui,sans-serif">
  <h1>${esc(project.title)} — ${esc(name)}</h1>
  <p>${esc(synopsis)}</p>
  ${videoBlock || embedHtml}
  ${nav}
</main>`;
  }

  if (pathname === '/showreel') {
    return `<main id="seo-static-content" style="max-width:960px;margin:2rem auto;padding:0 1.5rem;color:#fff;font-family:system-ui,sans-serif">
  <h1>Showreel — ${esc(name)}</h1>
  <p>${esc(getSiteDescription(content))}</p>
  ${embedHtml}
  ${nav}
</main>`;
  }

  return '';
}

module.exports = {
  BASE_URL,
  getPageSeoData,
  buildStaticBodyHtml,
  buildStaticPageJsonLd,
  getPublishedProjects,
};
