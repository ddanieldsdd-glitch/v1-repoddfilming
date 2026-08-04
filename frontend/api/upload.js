/**
 * @deprecated Usar /api/upload-sign + subida directa desde el cliente.
 * Se mantiene por compatibilidad; redirige errores claros.
 */
const verifyToken = require('./_verifyToken');
const applyCors = require('./_cors');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ ok: false, message: 'No autorizado' });
  }

  return res.status(410).json({
    ok: false,
    message: 'Usa la subida directa (upload-sign). Actualiza la página.',
  });
};
