const verifyToken = require('../_verifyToken');
const applyCors = require('../_cors');
const { getDb, COLLECTION } = require('../_content');
const { updateProject, deleteProject, toHttpError } = require('../_contentMutations');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (applyCors(req, res)) return;

  const payload = verifyToken(req);
  if (!payload) {
    return res.status(401).json({ ok: false, message: 'No autorizado' });
  }

  const projectId = req.query?.id || req.query?.slug;
  if (!projectId) {
    return res.status(400).json({ ok: false, message: 'Missing project id' });
  }

  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    if (req.method === 'PUT') {
      const result = await updateProject(db, COLLECTION, projectId, req.body || {});
      return res.status(200).json({ ok: true, ...result });
    }

    if (req.method === 'DELETE') {
      const result = await deleteProject(db, COLLECTION, projectId, req.body || {});
      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  } catch (err) {
    const http = toHttpError(err);
    return res.status(http.status).json(http.body);
  }
};
