/**
 * TOTP (RFC 6238) con crypto nativo: códigos de 6 dígitos cada 30 s,
 * compatibles con Google Authenticator, 1Password, Authy…
 */
const crypto = require('crypto');

const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input) {
  const clean = String(input || '').toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = BASE32.indexOf(ch);
    if (idx === -1) throw new Error('Invalid base32 secret');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

/** Código para un paso de tiempo concreto. `algorithm` solo para tests RFC. */
function hotp(key, counter, { digits = DIGITS, algorithm = 'sha1' } = {}) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac(algorithm, key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

function currentStep(nowMs = Date.now()) {
  return Math.floor(nowMs / 1000 / STEP_SECONDS);
}

/**
 * Verifica un código (±1 paso de margen por desfase de reloj).
 * @returns {number|null} el paso que coincidió (para antirreplay) o null.
 */
function verifyTotp(secret, code, { nowMs = Date.now(), window = 1 } = {}) {
  const clean = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean) || !secret) return null;
  const key = base32Decode(secret);
  const step = currentStep(nowMs);
  for (let i = -window; i <= window; i += 1) {
    const expected = hotp(key, step + i);
    if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(clean))) return step + i;
  }
  return null;
}

function generateSecret(bytes = 20) {
  return base32Encode(crypto.randomBytes(bytes));
}

module.exports = {
  STEP_SECONDS,
  base32Decode,
  base32Encode,
  hotp,
  currentStep,
  verifyTotp,
  generateSecret,
};
