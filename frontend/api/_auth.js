/**
 * Guardia única del panel /admin.
 *
 * - Sesión: JWT HS256 en cookie __Host-dd_admin (HttpOnly, Secure, SameSite=Strict).
 * - Revocación: cada token lleva `sv` (session_version). Cerrar sesión la
 *   incrementa en Mongo y deja inválidos TODOS los tokens emitidos antes.
 * - Escrituras: solo desde el propio dominio (Origin/Referer) y con JSON.
 */
const jwt = require('jsonwebtoken');
const { getDb } = require('./_content');

const COOKIE_NAME = '__Host-dd_admin';
const SESSION_TTL_SEC = 2 * 60 * 60;
const JWT_ISSUER = 'ddanidiaz.com';
const JWT_AUDIENCE = 'ddanidiaz-admin';
const MIN_SECRET_LENGTH = 32;
const AUTH_COLLECTION = 'auth_state';
const AUTH_DOC_ID = 'admin';

const PROD_ORIGINS = new Set(['https://ddanidiaz.com', 'https://www.ddanidiaz.com']);

// Respaldo en memoria si Mongo no está disponible (desarrollo local sin MONGO_URL).
const memoryState = { session_version: 0, last_totp_step: 0 };

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || '';
  return secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

async function authCollection() {
  try {
    const db = await getDb();
    return db ? db.collection(AUTH_COLLECTION) : null;
  } catch (err) {
    console.error('[auth] MongoDB unavailable:', err.message);
    return null;
  }
}

async function getSessionVersion() {
  const col = await authCollection();
  if (!col) return memoryState.session_version;
  const doc = await col.findOne({ _id: AUTH_DOC_ID });
  return Number(doc?.session_version) || 0;
}

/** Invalida todas las sesiones abiertas. */
async function bumpSessionVersion() {
  const col = await authCollection();
  if (!col) {
    memoryState.session_version += 1;
    return memoryState.session_version;
  }
  const res = await col.findOneAndUpdate(
    { _id: AUTH_DOC_ID },
    { $inc: { session_version: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  const doc = res && 'value' in res ? res.value : res;
  return Number(doc?.session_version) || 0;
}

/**
 * Antirreplay TOTP: un código (paso de tiempo) solo vale una vez.
 * Atómico en Mongo: solo gana si el paso es posterior al último usado.
 */
async function claimTotpStep(step) {
  const col = await authCollection();
  if (!col) {
    if (step <= memoryState.last_totp_step) return false;
    memoryState.last_totp_step = step;
    return true;
  }
  try {
    const res = await col.updateOne(
      {
        _id: AUTH_DOC_ID,
        $or: [{ last_totp_step: { $lt: step } }, { last_totp_step: { $exists: false } }],
      },
      { $set: { last_totp_step: step } },
      { upsert: true },
    );
    return res.modifiedCount === 1 || res.upsertedCount === 1;
  } catch (err) {
    // Upsert con el doc ya existente y paso repetido → clave duplicada = replay.
    if (err.code === 11000) return false;
    throw err;
  }
}

function readCookie(req) {
  const cookie = req.headers?.cookie || '';
  const match = cookie.match(/(?:^|;\s*)__Host-dd_admin=([^;]+)/);
  return match ? match[1] : null;
}

/** Verifica firma, algoritmo, emisor, audiencia y rol. No consulta la versión. */
function decodeSession(req) {
  const secret = getJwtSecret();
  const token = readCookie(req);
  if (!secret || !token) return null;
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload?.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

/** Sesión válida y no revocada, o null. */
async function readAdmin(req) {
  const payload = decodeSession(req);
  if (!payload) return null;
  const version = await getSessionVersion();
  return Number(payload.sv) === version ? payload : null;
}

function allowedOrigins() {
  const set = new Set(PROD_ORIGINS);
  if (process.env.VERCEL_URL) set.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) set.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  return set;
}

function isAllowedOrigin(req) {
  const raw = req.headers?.origin || req.headers?.referer || '';
  let origin;
  try {
    origin = new URL(raw).origin;
  } catch {
    return false;
  }
  if (allowedOrigins().has(origin)) return true;
  const isDev = process.env.NODE_ENV !== 'production';
  return isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function isJsonRequest(req) {
  return /^application\/json\b/i.test(String(req.headers?.['content-type'] || ''));
}

/**
 * Exige sesión de admin. Si falla, responde y devuelve null.
 * @param {{ mutating?: boolean, requireJson?: boolean }} opts
 */
async function requireAdmin(req, res, opts = {}) {
  const mutating = opts.mutating ?? !['GET', 'HEAD'].includes(req.method);
  const requireJson = opts.requireJson ?? mutating;

  if (!getJwtSecret()) {
    console.error('[auth] JWT_SECRET missing or shorter than 32 characters');
    res.status(500).json({ ok: false, message: 'Error de configuración del servidor' });
    return null;
  }

  if (mutating && !isAllowedOrigin(req)) {
    res.status(403).json({ ok: false, message: 'Origen no permitido' });
    return null;
  }

  if (requireJson && !isJsonRequest(req)) {
    res.status(415).json({ ok: false, message: 'Se esperaba JSON' });
    return null;
  }

  let payload = null;
  try {
    payload = await readAdmin(req);
  } catch (err) {
    console.error('[auth] session check failed:', err.message);
  }
  if (!payload) {
    res.status(401).json({ ok: false, message: 'No autorizado' });
    return null;
  }
  return payload;
}

function sessionCookie(token, maxAge) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

async function issueSession(res) {
  const secret = getJwtSecret();
  const sv = await getSessionVersion();
  const token = jwt.sign({ role: 'admin', sv }, secret, {
    algorithm: 'HS256',
    expiresIn: SESSION_TTL_SEC,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  res.setHeader('Set-Cookie', [
    sessionCookie(token, SESSION_TTL_SEC),
    // Borra la cookie antigua (nombre previo) si sigue en el navegador.
    'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
  ]);
}

function clearSession(res) {
  res.setHeader('Set-Cookie', [
    sessionCookie('', 0),
    'token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
  ]);
}

module.exports = {
  COOKIE_NAME,
  MIN_SECRET_LENGTH,
  getJwtSecret,
  readAdmin,
  requireAdmin,
  isAllowedOrigin,
  isJsonRequest,
  issueSession,
  clearSession,
  bumpSessionVersion,
  claimTotpStep,
  _memoryState: memoryState,
};
