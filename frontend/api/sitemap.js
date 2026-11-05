/**
 * Genera el sitemap XML con soporte de Video Sitemap (namespace video:).
 * Lee proyectos desde MongoDB (Admin) — content.json solo es fallback local.
 */

const { getMergedContent, getPublishedProjects } = require('./_content');
const {
  parseVideoUrl,
  resolveProjectVideo,
  getVideoMeta,
  FALLBACK_UPLOAD_DATE,
  buildVideoSitemapBlock,
  buildProjectVideoSitemapBlock,
} = require('./_videoSeo');
const defaultContent = require('../src/data/content.json');

const BASE_URL = 'https://ddanidiaz.com';

// Cambios desde /admin: la CDN sirve el sitemap como mucho 1 h desfasado.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

/** ISO → "YYYY-MM-DD" (lastmod real: Google ignora lastmod que cambia a diario). */
function toDay(value, fallback) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().split('T')[0] : fallback;
}

function latestDay(values, fallback) {
  const days = values.map((v) => toDay(v, null)).filter(Boolean).sort();
  return days.length ? days[days.length - 1] : fallback;
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
  if (req.method === 'HEAD') {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).end();
  }
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  const content   = await getMergedContent();
  const published = getPublishedProjects(content);
  const today     = new Date().toISOString().split('T')[0];
  const siteDesc  = content.site?.meta_description?.es
    || defaultContent.site?.meta_description?.es
    || 'Showreel de Dani Díaz, Director de Fotografía.';

  const categories = [...new Set(published.map((p) => p.category).filter(Boolean))];

  const showreel = parseVideoUrl(content.site?.showreel_url);
  // Metadatos de Vimeo en paralelo (caché 24 h por id, 3 s máx. cada uno).
  const [showreelMeta, ...projectMetas] = await Promise.all([
    getVideoMeta(showreel),
    ...published.map((p) => getVideoMeta(resolveProjectVideo(p))),
  ]);

  const showreelVideo = buildVideoSitemapBlock({
    videoUrl: content.site?.showreel_url,
    title: 'Showreel — Dani Díaz',
    description: siteDesc,
    thumb: showreel?.defaultThumbnail || '',
    publicationDate: showreelMeta?.upload_date || FALLBACK_UPLOAD_DATE,
    durationSec: showreelMeta?.duration,
  });

  const siteDay = toDay(content.site_updated_at || content.updated_at, today);
  const homeDay = latestDay([content.home_updated_at, content.site_updated_at], siteDay);
  const workDay = latestDay(published.map((p) => p.updated_at), siteDay);

  const staticUrls = [
    { loc: '/',        priority: '1.0', changefreq: 'weekly',  lastmod: latestDay([homeDay, workDay], today), video: '' },
    { loc: '/showreel', priority: '0.95', changefreq: 'monthly', lastmod: siteDay, video: showreelVideo },
    { loc: '/work',    priority: '0.9', changefreq: 'weekly',  lastmod: workDay, video: '' },
    { loc: '/about',   priority: '0.8', changefreq: 'monthly', lastmod: siteDay, video: '' },
    { loc: '/contact', priority: '0.7', changefreq: 'monthly', lastmod: siteDay, video: '' },
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

  const categoryUrls = categories.map((cat) =>
    [
      '  <url>',
      `    <loc>${BASE_URL}/work/${escXml(cat)}</loc>`,
      `    <lastmod>${latestDay(published.filter((p) => p.category === cat).map((p) => p.updated_at), workDay)}</lastmod>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>0.8</priority>',
      '  </url>',
    ].join('\n')
  );

  const projectUrls = published.map((p, i) => {
    const lastmod    = toDay(p.updated_at, p.year ? `${p.year}-06-01` : today);
    const videoBlock = buildProjectVideoSitemapBlock(p, projectMetas[i]);
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
  res.setHeader('Cache-Control', CACHE_CONTROL);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(xml);
};
