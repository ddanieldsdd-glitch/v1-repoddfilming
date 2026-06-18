/**
 * Rate limiter en memoria por IP.
 * En serverless cada instancia tiene su propio mapa, pero con Cloudflare
 * delante la mayoría de ataques se detienen antes de llegar aquí.
 *
 * Límite: MAX_ATTEMPTS intentos fallidos en WINDOW_MS → bloqueo LOCKOUT_MS.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;  // 15 minutos
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos de bloqueo

/** @type {Map<string, { count: number, firstAt: number, lockedUntil: number | null }>} */
const store = new Map();

function getIp(req) {
  // Cloudflare pone la IP real en CF-Connecting-IP
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown'
  );
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    const expired = entry.lockedUntil
      ? now > entry.lockedUntil
      : now - entry.firstAt > WINDOW_MS;
    if (expired) store.delete(key);
  }
}

/**
 * Comprueba si la IP está bloqueada.
 * @returns {{ blocked: boolean, retryAfterSec: number }}
 */
function check(req) {
  cleanup();
  const ip = getIp(req);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry) return { blocked: false, retryAfterSec: 0 };

  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { blocked: true, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
  }

  if (now - entry.firstAt > WINDOW_MS) {
    store.delete(ip);
    return { blocked: false, retryAfterSec: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    return { blocked: true, retryAfterSec: Math.ceil(LOCKOUT_MS / 1000) };
  }

  return { blocked: false, retryAfterSec: 0 };
}

/** Registra un intento fallido para la IP. */
function recordFailure(req) {
  const ip = getIp(req);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.firstAt > WINDOW_MS) {
    store.set(ip, { count: 1, firstAt: now, lockedUntil: null });
  } else {
    entry.count += 1;
    if (entry.count >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_MS;
    }
  }
}

/** Limpia los intentos fallidos tras un login exitoso. */
function recordSuccess(req) {
  store.delete(getIp(req));
}

module.exports = { check, recordFailure, recordSuccess };
