#!/usr/bin/env node
/**
 * Mueve el index.html del build junto a api/og.js.
 * og.js lo lee del disco en vez de pedirlo a producción (cleanUrls redirige
 * /index.html → / y el auto-fetch desde la función suele fallar).
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'build', 'index.html');
const dest = path.join(__dirname, '..', 'api', '_spa.html');

if (!fs.existsSync(src)) {
  console.error('copy-spa-html: no existe build/index.html');
  process.exit(1);
}

const html = fs.readFileSync(src, 'utf8');
if (!html.includes('id="root"') || !html.includes('static/js')) {
  console.error('copy-spa-html: index.html no parece el shell del SPA');
  process.exit(1);
}

fs.writeFileSync(dest, html);
// Sin build/index.html, Vercel no sirve el shell estático en "/" y la ruta
// pasa por los rewrites hacia api/og.js (SEO + preload del reel).
fs.unlinkSync(src);
console.log('Moved build/index.html → api/_spa.html');
