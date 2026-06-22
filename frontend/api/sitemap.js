/**
 * Genera el sitemap XML con soporte de Video Sitemap (namespace video:).
 * Accesible en /sitemap.xml gracias al rewrite en vercel.json.
 *
 * Google Search Console requiere:
 *  - Content-Type: application/xml
 *  - Namespace xmlns:video para que Google indexe los vídeos de Vimeo
 */

const { MongoClient } = require('mongodb');
const defaultContent = require('../src/data/content.json');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME   = process.env.DB_NAME || 'ddp_portfolio';
const BASE_URL  = 'https://ddanidiaz.com';

let _client = null;

async function getContent() {
  if (!MONGO_URL) return defaultContent;
  try {
    if (!_client) {
      _client = new MongoClient(MONGO_URL);
      await _client.connect();
    }
    const doc = await _client
      .db(DB_NAME)
      .collection('content')
      .findOne({}, { projection: { _id: 0 } });
    if (!doc) return defaultContent;
    return {
      ...defaultContent,
      ...doc,
      site: { ...defaultContent.site, ...doc.site },
      projects: doc.projects || defaultContent.projects || [],
    };
  } catch {
    return defaultContent;
  }
}

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Extrae el ID numérico de una URL de Vimeo: https://vimeo.com/123456 → "123456" */
function vimeoId(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * Aplica transformación Cloudinary para thumbnail de vídeo (16:9, 1280×720).
 * Google recomienda al menos 160×90 px y hasta 1920×1080 px.
 */
function toVideoThumb(url) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/w_1280')) return url;
  return url.replace('/upload/', '/upload/w_1280,h_720,c_fill,g_auto,q_auto,f_jpg/');
}

/** Bloque <video:video> genérico para una URL de Vimeo. */
function buildVideoBlockFromUrl(vimeoUrl, title, description, thumb) {
  const id = vimeoId(vimeoUrl);
  if (!id) return '';

  const playerLoc = `https://player.vimeo.com/video/${id}`;
  const poster = thumb || `https://vumbnail.com/${id}.jpg`;

  return [
    '    <video:video>',
    `      <video:thumbnail_loc>${escXml(poster)}</video:thumbnail_loc>`,
    `      <video:title>${escXml(title)}</video:title>`,
    description ? `      <video:description>${escXml(description.slice(0, 2048))}</video:description>` : '',
    `      <video:player_loc>${playerLoc}</video:player_loc>`,
    '      <video:family_friendly>yes</video:family_friendly>',
    '    </video:video>',
  ].filter(Boolean).join('\n');
}

/** Bloque <video:video> para un proyecto con vídeo de Vimeo. */
function buildVideoBlock(project) {
  const desc = (project.synopsis?.es || project.synopsis?.en || '').slice(0, 2048);
  return buildVideoBlockFromUrl(
    project.preview_url,
    project.title,
    desc,
    toVideoThumb(project.cover || project.poster || ''),
  );
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const content   = await getContent();
  const projects  = content.projects || [];
  const published = projects.filter((p) => p.published !== false);
  const today     = new Date().toISOString().split('T')[0];
  const siteDesc  = content.site?.meta_description?.es
    || defaultContent.site?.meta_description?.es
    || 'Showreel de Dani Díaz, Director de Fotografía.';

  const categories = [...new Set(published.map((p) => p.category).filter(Boolean))];

  const showreelVideo = buildVideoBlockFromUrl(
    content.site?.showreel_url,
    'Showreel — Dani Díaz',
    siteDesc,
    content.site?.showreel_url ? `https://vumbnail.com/${vimeoId(content.site.showreel_url)}.jpg` : '',
  );

  // ── Páginas estáticas ─────────────────────────────────────────────────────
  const staticUrls = [
    { loc: '/',        priority: '1.0', changefreq: 'weekly',  lastmod: today, video: '' },
    { loc: '/showreel', priority: '0.95', changefreq: 'monthly', lastmod: today, video: showreelVideo },
    { loc: '/work',    priority: '0.9', changefreq: 'weekly',  lastmod: today, video: '' },
    { loc: '/about',   priority: '0.8', changefreq: 'monthly', lastmod: today, video: '' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: today, video: '' },
  ].map(({ loc, priority, changefreq, lastmod, video }) =>
    [
      '  <url>',
      `    <loc>${BASE_URL}${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      video,
      '  </url>',
    ].filter(Boolean).join('\n')
  );

  // ── Páginas de categoría ─────────────────────────────────────────────────
  const categoryUrls = categories.map((cat) =>
    [
      '  <url>',
      `    <loc>${BASE_URL}/work/${escXml(cat)}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>',
    ].join('\n')
  );

  // ── Páginas de proyecto + bloque de vídeo si procede ─────────────────────
  const projectUrls = published.map((p) => {
    const lastmod    = p.year ? `${p.year}-06-01` : today;
    const videoBlock = buildVideoBlock(p);
    return [
      '  <url>',
      `    <loc>${BASE_URL}/project/${escXml(p.slug)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      '    <changefreq>monthly</changefreq>',
      '    <priority>0.9</priority>',
      videoBlock,
      '  </url>',
    ].filter(Boolean).join('\n');
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">',
    ...staticUrls,
    ...categoryUrls,
    ...projectUrls,
    '</urlset>',
  ].join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(xml);
};
