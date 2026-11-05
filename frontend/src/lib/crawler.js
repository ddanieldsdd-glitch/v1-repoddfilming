/**
 * Detecta crawlers de buscadores / redes (Googlebot, Bingbot…).
 *
 * Las vistas previas de vídeo de las tarjetas y el fondo del inicio son
 * decorativas. Si Google las renderiza, asocia a cada página vídeos de OTROS
 * proyectos ("El vídeo no está en una página de visualización"). A los
 * crawlers se les muestra la imagen fija; el vídeo principal de cada ficha y
 * del showreel se sigue cargando igual para todos.
 */
const CRAWLER_RE =
  /googlebot|google-inspectiontool|storebot-google|googleother|adsbot-google|mediapartners-google|apis-google|bingbot|bingpreview|yandex|baiduspider|duckduckbot|slurp|applebot|facebookexternalhit|twitterbot|linkedinbot|embedly|pinterest|petalbot|semrushbot|ahrefsbot|headlesschrome|lighthouse|chrome-lighthouse/i;

let cached;

export function isCrawler() {
  if (cached !== undefined) return cached;
  cached = typeof navigator !== "undefined" && CRAWLER_RE.test(navigator.userAgent || "");
  return cached;
}
