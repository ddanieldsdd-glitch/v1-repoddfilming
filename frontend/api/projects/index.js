const verifyToken = require('./_verifyToken');
const applyCors = require('./_cors');
const { getDb, COLLECTION } = require('./_content');
const { createProject, toHttpError } = require('./_contentMutations');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ ok: false, message: 'No autorizado' });
  }

  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    const result = await createProject(db, COLLECTION, req.body || {});
    return res.status(201).json({ ok: true, ...result });
  } catch (err) {
    const http = toHttpError(err);
    return res.status(http.status).json(http.body);
  }
};
