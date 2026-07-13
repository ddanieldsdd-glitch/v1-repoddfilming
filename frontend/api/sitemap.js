/**
 * Genera el sitemap XML con soporte de Video Sitemap (namespace video:).
 * Lee proyectos desde MongoDB (Admin) — content.json solo es fallback local.
 */

const { getMergedContent, getPublishedProjects } = require('./_content');
const {
  parseVideoUrl,
  buildVideoSitemapBlock,
  buildProjectVideoSitemapBlock,
} = require('./_videoSeo');
const defaultContent = require('../src/data/content.json');

const BASE_URL = 'https://ddanidiaz.com';

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
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
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

  const showreelVideo = buildVideoSitemapBlock({
    videoUrl: content.site?.showreel_url,
    title: 'Showreel — Dani Díaz',
    description: siteDesc,
    thumb: parseVideoUrl(content.site?.showreel_url)?.defaultThumbnail || '',
  });

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

  const projectUrls = published.map((p) => {
    const lastmod    = p.year ? `${p.year}-06-01` : today;
    const videoBlock = buildProjectVideoSitemapBlock(p);
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
