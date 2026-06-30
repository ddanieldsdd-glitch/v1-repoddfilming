/**
 * Serverless function que gestiona el Open Graph para todos los proyectos.
 *
 * Flujo:
 *  - Bot (WhatsApp, Telegram, etc.) visita /project/:slug
 *    → rewrite en vercel.json envía aquí
 *    → se sirve HTML mínimo con meta tags OG correctas (bots no ejecutan JS)
 *
 *  - Usuario normal visita /project/:slug
 *    → rewrite envía aquí también
 *    → se obtiene el index.html real del CDN (en caché), se inyectan los
 *      meta tags del proyecto y se sirve el SPA completo con React
 */

const defaultContent = require('../src/data/content.json');
const { getMergedContent, getPublishedProjects } = require('./_content');
const {
  isVideoUrl,
  parseVideoUrl,
  resolveProjectVideo,
  buildProjectVideoJsonLd,
} = require('./_videoSeo');

const BASE_URL = 'https://ddanidiaz.com';
const OG_LOGO   = 'https://res.cloudinary.com/dsphxo7mx/image/upload/c_scale,w_700/q_auto,f_jpg/e_negate/c_pad,b_rgb:000000,w_1200,h_630,g_center/v1777731841/DD_BLANCO_l8xqal.png';

function buildOgLogoUrl(logoUrl) {
  if (!logoUrl || !logoUrl.includes('cloudinary.com')) return OG_LOGO;
  if (logoUrl.includes('w_1200,h_630')) return logoUrl;
  const asset = logoUrl.split('/upload/').pop();
  if (!asset) return OG_LOGO;
  return `https://res.cloudinary.com/dsphxo7mx/image/upload/c_scale,w_700/q_auto,f_jpg/e_negate/c_pad,b_rgb:000000,w_1200,h_630,g_center/${asset}`;
}

// ─── Base HTML (React SPA) cache ──────────────────────────────────────────────
// Se obtiene del CDN de producción y se reutiliza entre invocaciones calientes.

let _baseHtml = null;
let _baseHtmlFetchedAt = 0;
const BASE_HTML_TTL = 20 * 60 * 1000; // 20 minutos

async function getBaseHtml() {
  const now = Date.now();
  if (_baseHtml && now - _baseHtmlFetchedAt < BASE_HTML_TTL) return _baseHtml;
  try {
    const r = await fetch(`${BASE_URL}/index.html`, { headers: { 'User-Agent': 'og-injector/1.0' } });
    if (r.ok) {
      _baseHtml = await r.text();
      _baseHtmlFetchedAt = now;
    }
  } catch {
    // Usa la caché obsoleta si existe
  }
  return _baseHtml;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Bots sociales: HTML mínimo con OG tags. Los buscadores reciben el SPA completo
// con iframe estático para que Google detecte la página como "watch page".
const SOCIAL_BOT_RE = /facebookexternalhit|whatsapp|telegram|slack|discord|twitterbot|linkedinbot|pinterest/i;

function isSocialBot(ua) {
  return SOCIAL_BOT_RE.test(ua || '');
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Inserta transformaciones de Cloudinary en una URL de imagen para obtener
 * un recuadro de 1200×630 px óptimo para Open Graph.
 *
 * mode = 'pad'  → cartel de cine (portrait): añade franjas negras laterales.
 *                  Ideal para mantener la composición del cartel intacta.
 * mode = 'fill' → cover horizontal (landscape): recorte inteligente.
 */
function toOGImage(url, mode = 'pad') {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Evitar doble transformación
  if (url.includes('w_1200')) return url;
  const t = mode === 'fill'
    ? 'w_1200,h_630,c_fill,g_auto,q_auto,f_jpg'
    : 'w_1200,h_630,c_pad,b_rgb:000000,q_auto,f_jpg';
  return url.replace('/upload/', `/upload/${t}/`);
}

function buildVideoMetaTags(embedUrl) {
  if (!embedUrl) return '';
  return `
  <meta property="og:video" content="${embedUrl}" />
  <meta property="og:video:secure_url" content="${embedUrl}" />
  <meta property="og:video:type" content="text/html" />
  <meta property="og:video:width" content="1920" />
  <meta property="og:video:height" content="1080" />`;
}

/** iframe estático en HTML inicial: Google lo necesita para indexar la página como watch page. */
function buildVideoEmbedHtml(embedUrl, title) {
  if (!embedUrl) return '';
  return `<main id="video-watch-page" style="margin:0;padding:0;background:#000">
  <iframe src="${embedUrl}" title="${title}" width="960" height="540" style="width:100%;max-width:100%;aspect-ratio:16/9;border:0;display:block;min-height:360px" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
</main>`;
}

function injectVideoEmbed(html, embedUrl, title) {
  if (!embedUrl) return html;
  const embed = buildVideoEmbedHtml(embedUrl, title);
  if (html.includes('<div id="root">')) {
    return html.replace('<div id="root">', `${embed}\n<div id="root">`);
  }
  return html.replace('</body>', `${embed}\n</body>`);
}

/**
 * Genera el bloque JSON-LD (VideoObject + WebPage) para una página de proyecto.
 * Aplica automáticamente a cualquier proyecto con preview_url o cover de vídeo.
 */
function buildProjectJsonLd(project, pageUrl) {
  return buildProjectVideoJsonLd(project, pageUrl);
}

function buildShowreelJsonLd(content, pageUrl) {
  const video = parseVideoUrl(content.site?.showreel_url);
  const title = 'Showreel — Dani Díaz';
  const description =
    content.site?.meta_description?.es
    || defaultContent.site?.meta_description?.es
    || 'Showreel de Dani Díaz, Director de Fotografía.';
  const thumb = video?.defaultThumbnail || buildOgLogoUrl(content.site?.logo_white);
  const videoNodeId = video ? `${pageUrl}#video` : undefined;

  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      inLanguage: ['es', 'en'],
      author: { '@id': 'https://ddanidiaz.com/#person' },
      mainEntity: videoNodeId ? { '@id': videoNodeId } : undefined,
    },
  ];

  if (video) {
    graph.push({
      '@type': 'VideoObject',
      '@id': `${pageUrl}#video`,
      name: title,
      description,
      thumbnailUrl: thumb,
      contentUrl: video.contentUrl,
      embedUrl: video.embedUrl,
      url: pageUrl,
      isPartOf: { '@id': `${pageUrl}#webpage` },
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, (_, v) => v === undefined ? undefined : v, 2);
}

function buildShowreelOG(content) {
  const video = parseVideoUrl(content.site?.showreel_url);
  const title = esc('Showreel — Dani Díaz');
  const description = esc(
    content.site?.meta_description?.es
    || defaultContent.site?.meta_description?.es
    || 'Showreel de Dani Díaz, Director de Fotografía.',
  );
  const image = video?.defaultThumbnail || buildOgLogoUrl(content.site?.logo_white);
  const url = `${BASE_URL}/showreel`;
  return {
    title,
    description,
    image,
    url,
    ogType: video ? 'video.other' : 'website',
    imageAlt: title,
    embedUrl: video?.embedUrl || null,
  };
}

/**
 * Construye los datos OG de un proyecto.
 * Prioridad de imagen: cover (si no es vídeo) → poster (cartel) → logo blanco.
 */
function buildOGData(project) {
  const title       = esc(`${project.title} — Dani Díaz`);
  const description = esc(
    project.synopsis?.es || project.synopsis?.en || 'Proyecto cinematográfico de Dani Díaz, Director de Fotografía.'
  );

  let image = OG_LOGO;
  const cover = project.cover && String(project.cover).trim();
  if (cover && !isVideoUrl(cover)) {
    image = toOGImage(cover, 'fill');
  } else {
    const poster = project.poster && String(project.poster).trim();
    if (poster) {
      image = toOGImage(poster, 'pad');
    }
  }

  const url = `${BASE_URL}/project/${project.slug}`;
  const video = resolveProjectVideo(project);

  return {
    title,
    description,
    image,
    url,
    ogType: video ? 'video.other' : 'article',
    imageAlt: esc(`${project.title} — Dani Díaz`),
    embedUrl: video?.embedUrl || null,
  };
}

/** HTML mínimo para bots sociales: OG tags + iframe de vídeo si aplica. */
function buildBotHTML({ title, description, image, url, ogType = 'article', imageAlt = title, embedUrl = null }, jsonLd = '') {
  const favicon = 'https://res.cloudinary.com/dsphxo7mx/image/upload/e_trim,w_32,h_32,c_pad,b_rgb:000000,q_auto,f_png/v1777731841/DD_BLANCO_l8xqal.png';
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${url}" />
  <link rel="icon" type="image/png" sizes="32x32" href="${favicon}" />
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Dani Díaz — Director de Fotografía" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:locale" content="es_ES" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@ddani_00" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${imageAlt}" />${buildVideoMetaTags(embedUrl)}
</head>
<body style="background:#000000;">
  ${buildVideoEmbedHtml(embedUrl, title)}
  <noscript>Necesitas habilitar JavaScript para ver esta web.</noscript>
  <div id="root"></div>
</body>
</html>`;
}

/**
 * Inyecta meta tags OG de proyecto en el HTML real del SPA.
 * Elimina los meta tags genéricos del home y añade los del proyecto.
 */
function injectOGTags(html, { title, description, image, url, ogType = 'article', imageAlt = title, embedUrl = null }, jsonLd = '') {
  let out = html;

  // Reemplazar <title>
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // Eliminar meta tags OG/Twitter/description y canonical existentes
  out = out.replace(/<meta\s+(?:property="(?:og|twitter):[^"]*"|name="(?:twitter|description)[^"]*")[^>]*\/?>\s*/gi, '');
  out = out.replace(/<link\s+rel="canonical"[^>]*\/?>\s*/gi, '');

  // Eliminar JSON-LD existente del home para inyectar el del proyecto
  out = out.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '');

  // Inyectar antes de </head>
  const tags = `
  <link rel="canonical" href="${url}" />
  <meta name="description" content="${description}" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:site_name" content="Dani Díaz — Director de Fotografía" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${imageAlt}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:locale" content="es_ES" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@ddani_00" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta name="twitter:image:alt" content="${imageAlt}" />${buildVideoMetaTags(embedUrl)}
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}`;

  out = out.replace('</head>', `${tags}\n</head>`);
  out = injectVideoEmbed(out, embedUrl, title);
  return out;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // Vercel preserva el path original en req.url cuando reescribe a una función
  const { URL: NodeURL } = require('url');
  const parsed = new NodeURL(req.url, 'http://localhost');
  const pathname = parsed.pathname;

  if (pathname === '/showreel') {
    const content = await getMergedContent();
    const ogData  = buildShowreelOG(content);
    const jsonLd  = buildShowreelJsonLd(content, `${BASE_URL}/showreel`);
    const ua      = req.headers['user-agent'] || '';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');

    if (isSocialBot(ua)) {
      return res.status(200).send(buildBotHTML(ogData, jsonLd));
    }

    const baseHtml = await getBaseHtml();
    if (baseHtml) {
      return res.status(200).send(injectOGTags(baseHtml, ogData, jsonLd));
    }

    return res.status(200).send(buildBotHTML(ogData, jsonLd));
  }

  const projectMatch = pathname.match(/^\/project\/([^/?#]+)/);

  if (!projectMatch) {
    return res.status(404).end();
  }

  const slug    = decodeURIComponent(projectMatch[1]);
  const content = await getMergedContent();
  const project = getPublishedProjects(content).find((p) => p.slug === slug);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cloudflare cachea la respuesta hasta 1 hora; el navegador 10 min
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');

  // Proyecto no encontrado → devolver el SPA para que React muestre su 404
  if (!project) {
    const baseHtml = await getBaseHtml();
    if (baseHtml) return res.status(200).send(baseHtml);
    return res.redirect(302, '/');
  }

  const ogData  = buildOGData(project);
  const jsonLd  = buildProjectJsonLd(project, `${BASE_URL}/project/${project.slug}`);
  const ua      = req.headers['user-agent'] || '';

  if (isSocialBot(ua)) {
    return res.status(200).send(buildBotHTML(ogData, jsonLd));
  }

  const baseHtml = await getBaseHtml();
  if (baseHtml) {
    return res.status(200).send(injectOGTags(baseHtml, ogData, jsonLd));
  }

  return res.status(200).send(buildBotHTML(ogData, jsonLd));
};
