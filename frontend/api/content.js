const { MongoClient } = require('mongodb');
const verifyToken = require('./_verifyToken');
const defaultContent = require('../src/data/content.json');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ddp_portfolio';
const COLLECTION = 'content';

// Reuse the client across warm invocations
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

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const db = await getDb();

    if (req.method === 'GET') {
      const isAdmin = !!verifyToken(req);
      const doc = await db.collection(COLLECTION).findOne({}, { projection: { _id: 0 } });
      const content = doc ? { ...doc } : { ...defaultContent };

      // Public visitors only see published projects; admin sees all
      if (!isAdmin && Array.isArray(content.projects)) {
        content.projects = content.projects.filter((p) => p.published !== false);
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

      // Strip any accidental _id that would break replaceOne
      delete body._id;

      await db.collection(COLLECTION).replaceOne({}, body, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error('[api/content]', err.message);
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  }
};
