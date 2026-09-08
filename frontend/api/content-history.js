const verifyToken = require('./_verifyToken');
const applyCors = require('./_cors');
const { getDb } = require('./_content');
const { listHistory, getHistoryEntry } = require('./_contentHistory');
const { replaceFullContent, toHttpError } = require('./_contentMutations');
const { COLLECTION } = require('./_content');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (applyCors(req, res)) return;

  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ ok: false, message: 'No autorizado' });

  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ ok: false, message: 'Database unavailable' });

    if (req.method === 'GET') {
      const items = await listHistory(db);
      return res.status(200).json({
        ok: true,
        items: items.map((item) => ({
          id: String(item._id),
          scope: item.scope,
          createdAt: item.createdAt,
          extra: item.extra || {},
        })),
      });
    }

    if (req.method === 'POST') {
      const entry = await getHistoryEntry(db, req.body?.id);
      if (!entry?.snapshot) {
        return res.status(404).json({ ok: false, message: 'Entrada no encontrada' });
      }
      const current = await db.collection(COLLECTION).findOne({});
      const result = await replaceFullContent(db, COLLECTION, {
        ...entry.snapshot,
        updated_at: current?.updated_at,
      });
      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  } catch (err) {
    const http = toHttpError(err);
    return res.status(http.status).json(http.body);
  }
};
