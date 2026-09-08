/**
 * Helper CORS para las funciones serverless.
 * Solo permite peticiones desde el propio dominio (same-origin en producción)
 * y desde localhost en desarrollo.
 */

const ALLOWED_ORIGINS = new Set([
  'https://ddanidiaz.com',
  'https://www.ddanidiaz.com',
]);

/**
 * Aplica headers CORS y gestiona preflight.
 * @returns {boolean} true si la petición ya fue respondida (preflight).
 */
module.exports = function applyCors(req, res) {
  const origin = req.headers.origin || '';
  const isDev = process.env.NODE_ENV !== 'production';

  const allowed =
    ALLOWED_ORIGINS.has(origin) ||
    (isDev && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')));

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }

  return false;
};
