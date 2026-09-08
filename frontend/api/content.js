const verifyToken = require('./_verifyToken');
const applyCors = require('./_cors');
const { getMergedContent, getPublishedProjects, getDb, COLLECTION } = require('./_content');
const { replaceFullContent, toHttpError } = require('./_contentMutations');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (applyCors(req, res)) return;

  try {
    if (req.method === 'GET') {
      const isAdmin = !!verifyToken(req);
      const content = await getMergedContent();

      if (!isAdmin) {
        content.projects = getPublishedProjects(content);
      }

      return res.status(200).json(content);
    }

    if (req.method === 'PUT') {
      const payload = verifyToken(req);
      if (!payload) {
        return res.status(401).json({ ok: false, message: 'No autorizado' });
      }

      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, message: 'Database unavailable' });

      const result = await replaceFullContent(db, COLLECTION, req.body);

      const sitemapUrl = encodeURIComponent('https://ddanidiaz.com/sitemap.xml');
      fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(() => {});
      fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`).catch(() => {});

      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[api/content]', err.message);
    const http = toHttpError(err);
    return res.status(http.status).json(http.body);
  }
};
