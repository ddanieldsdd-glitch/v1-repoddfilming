const verifyToken = require('./_verifyToken');
const applyCors = require('./_cors');
const { getMergedContent, getPublishedProjects, DB_NAME, COLLECTION } = require('./_content');
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL;

let _client = null;
async function getDb() {
  if (!_client) {
    _client = new MongoClient(MONGO_URL);
    await _client.connect();
  }
  return _client.db(DB_NAME);
}

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

      const body = req.body;
      if (!body || !body.site || !Array.isArray(body.projects)) {
        return res.status(400).json({ ok: false, message: 'Estructura de contenido inválida' });
      }

      delete body._id;

      const db = await getDb();
      await db.collection(COLLECTION).replaceOne({}, body, { upsert: true });

      const sitemapUrl = encodeURIComponent('https://ddanidiaz.com/sitemap.xml');
      fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`).catch(() => {});
      fetch(`https://www.bing.com/ping?sitemap=${sitemapUrl}`).catch(() => {});

      return res.status(200).json({ ok: true });
    }

    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[api/content]', err.message);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};
