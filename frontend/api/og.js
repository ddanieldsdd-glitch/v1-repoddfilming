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

const { MongoClient } = require('mongodb');
const defaultContent = require('../src/data/content.json');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME   = process.env.DB_NAME || 'ddp_portfolio';
const BASE_URL  = 'https://ddanidiaz.com';

// ─── MongoDB ──────────────────────────────────────────────────────────────────

let _mongoClient = null;

async function getContent() {
  if (!MONGO_URL) return defaultContent;
  try {
    if (!_mongoClient) {
      _mongoClient = new MongoClient(MONGO_URL);
      await _mongoClient.connect();
    }
    const doc = await _mongoClient
      .db(DB_NAME)
      .collection('content')
      .findOne({}, { projection: { _id: 0 } });
    return doc || defaultContent;
  } catch {
    return defaultContent;
  }
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
    const r = await fetch(`${BASE_URL}/`, { headers: { 'User-Agent': 'og-injector/1.0' } });
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

const BOT_RE = /bot|crawler|spider|facebookexternalhit|whatsapp|telegram|slack|discord|twitter|linkedin|googlebot|bingbot|duckduck/i;

function isBot(ua) {
  return BOT_RE.test(ua || '');
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
  if (url.includes('/upload/w_1200')) return url;
  const t = mode === 'fill'
    ? 'w_1200,h_630,c_fill,g_auto,q_auto,f_jpg'
    : 'w_1200,h_630,c_pad,b_rgb:000000,q_auto,f_jpg';
  return url.replace('/upload/', `/upload/${t}/`);
}

/**
 * Construye los datos OG de un proyecto.
 * Prioridad de imagen: poster (cartel) → cover → fallback logo.
 */
function buildOGData(project) {
  const title       = esc(`${project.title} — Dani Díaz`);
  const description = esc(
    project.synopsis?.es || project.synopsis?.en || 'Proyecto cinematográfico de Dani Díaz, Director de Fotografía.'
  );

  // Poster (cartel, portrait) → c_pad con fondo negro para respetar composición
  // Cover (landscape) → c_fill con recorte inteligente
  const image = project.poster
    ? toOGImage(project.poster, 'pad')
    : project.cover
    ? toOGImage(project.cover, 'fill')
    : `${BASE_URL}/og-fallback.jpg`;

  const url = `${BASE_URL}/project/${project.slug}`;

  return { title, description, image, url };
}

/** HTML mínimo para bots: solo necesitan los meta tags, no ejecutan JS. */
function buildBotHTML({ title, description, image, url }) {
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
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Dani Díaz — Director de Fotografía" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${url}" />
  <meta property="og:locale" content="es_ES" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@ddani_00" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body style="background:#000000;">
  <noscript>Necesitas habilitar JavaScript para ver esta web.</noscript>
  <div id="root"></div>
</body>
</html>`;
}

/**
 * Inyecta meta tags OG de proyecto en el HTML real del SPA.
 * Elimina los meta tags genéricos del home y añade los del proyecto.
 */
function injectOGTags(html, { title, description, image, url }) {
  let out = html;

  // Reemplazar <title>
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // Eliminar meta tags OG/Twitter/description y canonical existentes
  out = out.replace(/<meta\s+(?:property="(?:og|twitter):[^"]*"|name="(?:twitter|description)[^"]*")[^>]*\/?>\s*/gi, '');
  out = out.replace(/<link\s+rel="canonical"[^>]*\/?>\s*/gi, '');

  // Inyectar antes de </head>
  const tags = `
  <link rel="canonical" href="${url}" />
  <meta name="description" content="${description}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Dani Díaz — Director de Fotografía" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${url}" />
  <meta property="og:locale" content="es_ES" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@ddani_00" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />`;

  out = out.replace('</head>', `${tags}\n</head>`);
  return out;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  // Vercel preserva el path original en req.url cuando reescribe a una función
  const { URL: NodeURL } = require('url');
  const parsed = new NodeURL(req.url, 'http://localhost');
  const pathname = parsed.pathname;

  const projectMatch = pathname.match(/^\/project\/([^/?#]+)/);

  if (!projectMatch) {
    return res.status(404).end();
  }

  const slug    = decodeURIComponent(projectMatch[1]);
  const content = await getContent();
  const project = (content.projects || []).find(
    (p) => p.slug === slug && p.published !== false
  );

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cloudflare cachea la respuesta hasta 1 hora; el navegador 10 min
  res.setHeader('Cache-Control', 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400');

  // Proyecto no encontrado → devolver el SPA para que React muestre su 404
  if (!project) {
    const baseHtml = await getBaseHtml();
    if (baseHtml) return res.status(200).send(baseHtml);
    return res.redirect(302, '/');
  }

  const ogData = buildOGData(project);
  const ua     = req.headers['user-agent'] || '';

  if (isBot(ua)) {
    // Bots no ejecutan JS → HTML mínimo con meta tags es suficiente
    return res.status(200).send(buildBotHTML(ogData));
  }

  // Usuario real → necesita el SPA completo con React + los meta tags del proyecto
  const baseHtml = await getBaseHtml();
  if (baseHtml) {
    return res.status(200).send(injectOGTags(baseHtml, ogData));
  }

  // Fallback si el CDN no responde aún (ej: primer deploy)
  return res.status(200).send(buildBotHTML(ogData));
};
