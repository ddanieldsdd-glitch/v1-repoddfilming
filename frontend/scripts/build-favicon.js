#!/usr/bin/env node
/**
 * Genera el data URI del favicon SVG autocontenido.
 *
 * El problema que resuelve:
 *   Los navegadores NO cargan recursos externos (https://...) referenciados
 *   dentro de un <image href="..."> cuando el SVG va inline como
 *   data:image/svg+xml en un <link rel="icon">. Eso hacía que solo se viera
 *   el rectángulo oscuro del favicon, sin el logo "DD".
 *
 * Solución:
 *   Embebemos el logo PNG en base64 dentro del propio SVG, de modo que el
 *   favicon sea 100% autocontenido (sin red externa) y funcione en todos
 *   los navegadores.
 *
 * Entradas:
 *   frontend/public/favicon-logo-64.png  (logo blanco, RGBA, 64x64)
 * Salida:
 *   - frontend/public/favicon.svg              (SVG autocontenido)
 *   - frontend/public/favicon-data-uri.txt    (data URI URL-encoded listo para HTML)
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const LOGO_PNG = path.join(PUBLIC_DIR, 'favicon-logo-64.png');
const OUT_SVG = path.join(PUBLIC_DIR, 'favicon.svg');
const OUT_DATA_URI = path.join(PUBLIC_DIR, 'favicon-data-uri.txt');

if (!fs.existsSync(LOGO_PNG)) {
  console.error(`[build-favicon] No existe ${LOGO_PNG}. Ejecuta antes el paso que descarga/redimensiona el logo.`);
  process.exit(1);
}

const pngBase64 = fs.readFileSync(LOGO_PNG).toString('base64');

// SVG: rectángulo oscuro redondeado + logo embebido en base64 (sin red externa)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#0a0a0a"/>
  <image href="data:image/png;base64,${pngBase64}" x="2" y="2" width="28" height="28"/>
</svg>`;

fs.writeFileSync(OUT_SVG, svg, 'utf8');
console.log(`[build-favicon] SVG escrito en ${OUT_SVG} (${svg.length} bytes)`);

// data:image/svg+xml URL-encoded para usar en <link rel="icon" href="data:...">
// Solo necesitamos escapar: # % " ' < > y caracteres no ASCII. encodeURIComponent
// sobre todo el SVG es lo más seguro y produce un data URI portable.
const dataUri = 'data:image/svg+xml,' + encodeURIComponent(svg)
  .replace(/'/g, '%27')
  .replace(/"/g, '%22');

fs.writeFileSync(OUT_DATA_URI, dataUri, 'utf8');
console.log(`[build-favicon] data URI escrito en ${OUT_DATA_URI} (${dataUri.length} chars)`);
console.log(`[build-favicon] Listo. Pega el contenido del .txt en index.html dentro de <link rel="icon" type="image/svg+xml" href="..." />`);
