const applyCors = require('./_cors');
const verifyToken = require('./_verifyToken');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ ok: false, message: 'Method not allowed' });
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ ok: false, message: 'No autorizado' });
  return res.status(200).json({ ok: true });
};
