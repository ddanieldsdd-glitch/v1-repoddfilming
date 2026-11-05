const crypto = require('crypto');
const { check, recordFailure, recordSuccess } = require('./_rateLimiter');
const applyCors = require('./_cors');
const {
  getJwtSecret,
  readAdmin,
  isAllowedOrigin,
  isJsonRequest,
  issueSession,
  clearSession,
  bumpSessionVersion,
  claimTotpStep,
} = require('./_auth');
const { verifyTotp } = require('./_totp');

/** Comparación en tiempo constante (los hashes igualan la longitud). */
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const INVALID = { ok: false, message: 'Credenciales inválidas' };

async function safely(fn, label) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[admin-login] ${label}:`, err.message);
    return undefined;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (applyCors(req, res)) return;

  const authMode = req.query?.auth;

  if (authMode === 'logout') {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }
    if (!isAllowedOrigin(req)) {
      return res.status(403).json({ ok: false, message: 'Origen no permitido' });
    }
    // Solo una sesión válida puede revocar todas (evita cierres forzados ajenos).
    if (await safely(() => readAdmin(req), 'logout session')) {
      await safely(() => bumpSessionVersion(), 'bump session version');
    }
    clearSession(res);
    return res.status(200).json({ ok: true });
  }

  if (authMode === 'session') {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }
    const payload = await safely(() => readAdmin(req), 'session');
    if (!payload) return res.status(401).json({ ok: false, message: 'No autorizado' });
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ ok: false, message: 'Origen no permitido' });
  }
  if (!isJsonRequest(req)) {
    return res.status(415).json({ ok: false, message: 'Se esperaba JSON' });
  }

  const serverPassword = process.env.ADMIN_PASSWORD;
  const totpSecret = process.env.TOTP_SECRET;
  if (!getJwtSecret() || !serverPassword) {
    console.error('[admin-login] ADMIN_PASSWORD or JWT_SECRET (min 32 chars) missing');
    return res.status(500).json({ ok: false, message: 'Error de configuración del servidor' });
  }
  if (!totpSecret) {
    console.warn('[admin-login] TOTP_SECRET not set: login is password-only');
  }

  const limit = (await safely(() => check(req), 'rate limit check')) || { blocked: false };
  if (limit.blocked) {
    res.setHeader('Retry-After', String(limit.retryAfterSec));
    return res.status(429).json({ ok: false, message: 'Demasiados intentos. Inténtalo más tarde.' });
  }

  const { password, code } = req.body || {};
  const passwordOk = typeof password === 'string' && safeEqual(password, serverPassword);

  let totpOk = !totpSecret;
  if (totpSecret && passwordOk) {
    const step = verifyTotp(totpSecret, code);
    totpOk = step !== null && (await safely(() => claimTotpStep(step), 'totp replay')) === true;
  }

  if (!passwordOk || !totpOk) {
    await safely(() => recordFailure(req), 'record failure');
    // Misma respuesta falle la contraseña o el código.
    return res.status(401).json({ ...INVALID, needsCode: Boolean(totpSecret) });
  }

  await safely(() => recordSuccess(req), 'record success');
  await issueSession(res);
  return res.status(200).json({ ok: true });
};
