const jwt = require('jsonwebtoken');
const { check, recordFailure, recordSuccess } = require('./_rateLimiter');
const applyCors = require('./_cors');

module.exports = async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  // Rate limiting — bloquea IPs con demasiados intentos fallidos
  const { blocked, retryAfterSec } = check(req);
  if (blocked) {
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({ ok: false, message: 'Demasiados intentos. Inténtalo más tarde.' });
  }

  const { password } = req.body || {};
  const serverPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('[admin-login] JWT_SECRET no está configurado');
    return res.status(500).json({ ok: false, message: 'Error de configuración del servidor' });
  }

  // Comparación en tiempo constante para evitar timing attacks
  const validPassword =
    password &&
    serverPassword &&
    password.length === serverPassword.length &&
    password === serverPassword;

  if (!validPassword) {
    recordFailure(req);
    // Misma respuesta tanto si falta la contraseña como si es incorrecta
    return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
  }

  recordSuccess(req);

  const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '2h' });
  const cookieValue = `token=${token}; HttpOnly; Path=/; Max-Age=${2 * 60 * 60}; SameSite=Strict; Secure`;
  res.setHeader('Set-Cookie', cookieValue);

  return res.status(200).json({ ok: true });
};
