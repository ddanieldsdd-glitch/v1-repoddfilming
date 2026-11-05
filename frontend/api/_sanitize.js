/**
 * Validación de todo lo que el admin escribe en MongoDB.
 *
 * - Claves peligrosas: operadores de Mongo ($…), rutas con punto y
 *   __proto__/constructor/prototype.
 * - Campos de enlace/imagen: solo http(s). Bloquea javascript:, data:, etc.
 *   (evita XSS almacenado en la web pública aunque roben la sesión).
 * - Tamaño máximo del cuerpo.
 */

const MAX_BODY_BYTES = 1_000_000;

const URL_KEYS = new Set([
  'cover',
  'poster',
  'preview_url',
  'external_link',
  'stills',
  'bts',
  'home_still',
  'showreel_url',
  'logo_white',
  'about_image',
  'url',
  'image',
]);

// Dentro de site.social todo es enlace salvo estos campos de texto.
const SOCIAL_TEXT_KEYS = new Set(['email', 'phone']);
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_DEPTH = 12;

function invalid(message) {
  const err = new Error(message);
  err.code = 'INVALID_PAYLOAD';
  err.status = 400;
  err.expose = true;
  return err;
}

function isSafeUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function walk(value, key, path, inSocial, depth) {
  if (depth > MAX_DEPTH) throw invalid('Contenido demasiado anidado');

  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, key, `${path}[${i}]`, inSocial, depth + 1));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.') || FORBIDDEN_KEYS.has(k)) {
        throw invalid(`Campo no permitido: ${path ? `${path}.` : ''}${k}`);
      }
      walk(v, k, path ? `${path}.${k}` : k, inSocial || k === 'social', depth + 1);
    }
    return;
  }

  const isUrlField = URL_KEYS.has(key) || (inSocial && !SOCIAL_TEXT_KEYS.has(key));
  if (isUrlField && typeof value === 'string' && !isSafeUrl(value)) {
    throw invalid(`Enlace no válido en ${path}: debe empezar por https://`);
  }
}

/** Lanza un error 400 si el cuerpo no es seguro. */
function assertSafePayload(body) {
  if (body == null) return;
  let size;
  try {
    size = Buffer.byteLength(JSON.stringify(body));
  } catch {
    throw invalid('Contenido no serializable');
  }
  if (size > MAX_BODY_BYTES) throw invalid('Contenido demasiado grande');
  walk(body, '', '', false, 0);
}

module.exports = { assertSafePayload, isSafeUrl, MAX_BODY_BYTES };
