/**
 * Límite de intentos de login, persistente en MongoDB (colección auth_attempts
 * con índice TTL) para que valga entre todas las instancias serverless.
 *
 * - Por IP: MAX_IP_FAILURES fallos en una ventana de 15 min → 15 min de bloqueo.
 * - Global: MAX_GLOBAL_FAILURES fallos en 1 h (todas las IPs) → login cerrado 1 h.
 *   Frena ataques repartidos entre muchas IPs.
 *
 * Sin Mongo (desarrollo local) se usa un mapa en memoria con las mismas reglas.
 */
const { getDb } = require('./_content');

const MAX_IP_FAILURES = 5;
const IP_WINDOW_MS = 15 * 60 * 1000;
const IP_LOCK_MS = 15 * 60 * 1000;
const MAX_GLOBAL_FAILURES = 20;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const GLOBAL_LOCK_MS = 60 * 60 * 1000;
const COLLECTION = 'auth_attempts';

let indexReady = false;
const memory = new Map();

function getIp(req) {
  // Vercel fija x-real-ip / x-forwarded-for; cf-connecting-ip no es fiable
  // porque no hay Cloudflare delante y cualquiera puede enviarla.
  return (
    req.headers?.['x-real-ip'] ||
    String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
    'unknown'
  );
}

async function collection() {
  try {
    const db = await getDb();
    if (!db) return null;
    const col = db.collection(COLLECTION);
    if (!indexReady) {
      await col.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
      indexReady = true;
    }
    return col;
  } catch (err) {
    console.error('[rateLimiter] MongoDB unavailable, using memory:', err.message);
    return null;
  }
}

function keys(ip, now) {
  return {
    ipBucket: `ip:${ip}:${Math.floor(now / IP_WINDOW_MS)}`,
    ipLock: `lock:ip:${ip}`,
    globalBucket: `global:${Math.floor(now / GLOBAL_WINDOW_MS)}`,
    globalLock: 'lock:global',
  };
}

// ─── Memoria (respaldo) ───────────────────────────────────────────────────────

function memGet(id, now) {
  const entry = memory.get(id);
  if (!entry) return null;
  if (entry.expireAt <= now) {
    memory.delete(id);
    return null;
  }
  return entry;
}

function memInc(id, now, ttlMs) {
  const entry = memGet(id, now) || { count: 0, expireAt: now + ttlMs };
  entry.count += 1;
  memory.set(id, entry);
  return entry.count;
}

// ─── API ─────────────────────────────────────────────────────────────────────

/**
 * @returns {Promise<{ blocked: boolean, retryAfterSec: number }>}
 */
async function check(req) {
  const now = Date.now();
  const k = keys(getIp(req), now);
  const col = await collection();

  let locks;
  if (col) {
    locks = await col
      .find({ _id: { $in: [k.ipLock, k.globalLock] }, expireAt: { $gt: new Date(now) } })
      .toArray();
    locks = locks.map((doc) => doc.expireAt.getTime());
  } else {
    locks = [memGet(k.ipLock, now), memGet(k.globalLock, now)]
      .filter(Boolean)
      .map((entry) => entry.expireAt);
  }

  if (!locks.length) return { blocked: false, retryAfterSec: 0 };
  const until = Math.max(...locks);
  return { blocked: true, retryAfterSec: Math.ceil((until - now) / 1000) };
}

async function incrementAndLock(col, bucketId, lockId, now, windowMs, lockMs, max) {
  if (!col) {
    const count = memInc(bucketId, now, windowMs);
    if (count >= max) memory.set(lockId, { count, expireAt: now + lockMs });
    return;
  }
  const res = await col.findOneAndUpdate(
    { _id: bucketId },
    { $inc: { count: 1 }, $setOnInsert: { expireAt: new Date(now + windowMs) } },
    { upsert: true, returnDocument: 'after' },
  );
  const doc = res && 'value' in res ? res.value : res;
  if ((doc?.count || 0) >= max) {
    await col.updateOne(
      { _id: lockId },
      { $set: { expireAt: new Date(now + lockMs) } },
      { upsert: true },
    );
  }
}

/** Registra un intento fallido (IP + contador global). */
async function recordFailure(req) {
  const now = Date.now();
  const k = keys(getIp(req), now);
  const col = await collection();
  await incrementAndLock(col, k.ipBucket, k.ipLock, now, IP_WINDOW_MS, IP_LOCK_MS, MAX_IP_FAILURES);
  await incrementAndLock(
    col,
    k.globalBucket,
    k.globalLock,
    now,
    GLOBAL_WINDOW_MS,
    GLOBAL_LOCK_MS,
    MAX_GLOBAL_FAILURES,
  );
}

/** Limpia los fallos de la IP tras un login correcto. */
async function recordSuccess(req) {
  const now = Date.now();
  const k = keys(getIp(req), now);
  const col = await collection();
  if (!col) {
    memory.delete(k.ipBucket);
    return;
  }
  await col.deleteOne({ _id: k.ipBucket });
}

module.exports = {
  check,
  recordFailure,
  recordSuccess,
  getIp,
  MAX_IP_FAILURES,
  MAX_GLOBAL_FAILURES,
  _memory: memory,
};
