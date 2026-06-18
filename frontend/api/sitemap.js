/**
 * Genera el sitemap XML dinámico a partir de los proyectos publicados en MongoDB.
 * Accesible en /sitemap.xml gracias al rewrite en vercel.json.
 *
 * Google Search Console requiere:
 *  - Content-Type: application/xml   (no text/html)
 *  - XML válido con namespace http://www.sitemaps.org/schemas/sitemap/0.9
 */

const { MongoClient } = require('mongodb');
const defaultContent = require('../src/data/content.json');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME   = process.env.DB_NAME || 'ddp_portfolio';
const BASE_URL  = 'https://ddanidiaz.com';

let _client = null;

async function getProjects() {
  if (!MONGO_URL) return defaultContent.projects || [];
  try {
    if (!_client) {
      _client = new MongoClient(MONGO_URL);
      await _client.connect();
    }
    const doc = await _client
      .db(DB_NAME)
      .collection('content')
      .findOne({}, { projection: { _id: 0, projects: 1 } });
    return doc?.projects || defaultContent.projects || [];
  } catch {
    return defaultContent.projects || [];
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

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const projects    = await getProjects();
  const published   = projects.filter((p) => p.published !== false);
  const today       = new Date().toISOString().split('T')[0];

  // Categorías únicas presentes en los proyectos publicados
  const categories  = [...new Set(published.map((p) => p.category).filter(Boolean))];

  // ── Páginas estáticas ─────────────────────────────────────────────────────
  const staticUrls = [
    { loc: '/',        priority: '1.0', changefreq: 'weekly',  lastmod: today },
    { loc: '/work',    priority: '0.9', changefreq: 'weekly',  lastmod: today },
    { loc: '/about',   priority: '0.8', changefreq: 'monthly', lastmod: today },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: today },
  ];

  // ── Páginas de categoría (/work/:category) ────────────────────────────────
  const categoryUrls = categories.map((cat) => ({
    loc:        `/work/${escXml(cat)}`,
    priority:   '0.8',
    changefreq: 'weekly',
    lastmod:    today,
  }));

  // ── Páginas de proyecto (/project/:slug) ──────────────────────────────────
  const projectUrls = published.map((p) => ({
    loc:        `/project/${escXml(p.slug)}`,
    priority:   '0.9',
    changefreq: 'monthly',
    lastmod:    p.year ? `${p.year}-06-01` : today,
  }));

  const allUrls = [...staticUrls, ...categoryUrls, ...projectUrls];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...allUrls.map(({ loc, lastmod, changefreq, priority }) =>
      [
        '  <url>',
        `    <loc>${BASE_URL}${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
      ].join('\n')
    ),
    '</urlset>',
  ].join('\n');

  // Content-Type: application/xml es lo que Google Search Console requiere
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(xml);
};
