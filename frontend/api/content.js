const { requireAdmin, readAdmin } = require('./_auth');
const { assertSafePayload } = require('./_sanitize');
const applyCors = require('./_cors');
const { getMergedContent, getPublishedProjects, getDb, COLLECTION } = require('./_content');
const { listHistory, getHistoryEntry } = require('./_contentHistory');
const { replaceFullContent, toHttpError } = require('./_contentMutations');

// Lo único que ve la web pública (sin claves internas como _README).
const PUBLIC_KEYS = ['site', 'about', 'projects', 'updated_at', 'site_updated_at', 'home_updated_at'];

function toPublicContent(content) {
  const out = {};
  for (const key of PUBLIC_KEYS) {
    if (content[key] !== undefined) out[key] = content[key];
  }
  out.projects = getPublishedProjects(content);
  return out;
}

async function handleHistory(req, res) {
  if (!(await requireAdmin(req, res))) return undefined;

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
    assertSafePayload(req.body);
    const entry = await getHistoryEntry(db, String(req.body?.id || ''));
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
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (applyCors(req, res)) return;

  try {
    if (req.query?.action === 'history') {
      return handleHistory(req, res);
    }

    if (req.method === 'GET') {
      const isAdmin = Boolean(await readAdmin(req).catch(() => null));
      const content = await getMergedContent();
      // La respuesta del admin incluye borradores: nunca debe quedar en una caché compartida.
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).json(isAdmin ? content : toPublicContent(content));
    }

    if (req.method === 'PUT') {
      if (!(await requireAdmin(req, res))) return undefined;
      assertSafePayload(req.body);

      const db = await getDb();
      if (!db) return res.status(503).json({ ok: false, message: 'Database unavailable' });

      const result = await replaceFullContent(db, COLLECTION, req.body);

      return res.status(200).json({ ok: true, ...result });
    }

    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    const http = toHttpError(err);
    return res.status(http.status).json(http.body);
  }
};
