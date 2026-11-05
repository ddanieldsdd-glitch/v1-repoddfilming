#!/usr/bin/env node
/**
 * Genera el secreto 2FA (TOTP) del panel /admin.
 *
 *   node scripts/totp-setup.js
 *
 * 1. En tu app de autenticación (Google Authenticator, 1Password, Authy…)
 *    añade una cuenta con "Introducir clave de configuración" y pega la clave,
 *    o abre la URI otpauth:// en un dispositivo que la soporte.
 * 2. En Vercel → Settings → Environment Variables crea TOTP_SECRET con la
 *    misma clave (Production) y vuelve a desplegar.
 *
 * No compartas la clave ni la pegues en webs de generación de QR: con ella
 * cualquiera puede generar tus códigos.
 */
const { generateSecret, verifyTotp, hotp, base32Decode, currentStep } = require('../api/_totp');

const secret = process.argv[2] || generateSecret();
const label = encodeURIComponent('ddanidiaz.com:admin');
const issuer = encodeURIComponent('ddanidiaz.com');
const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

const now = hotp(base32Decode(secret), currentStep());
if (verifyTotp(secret, now) === null) throw new Error('Self-check failed');

console.log('\nClave TOTP (TOTP_SECRET):\n');
console.log(`  ${secret.match(/.{1,4}/g).join(' ')}`);
console.log('\nURI para apps de autenticación:\n');
console.log(`  ${uri}`);
console.log(`\nCódigo actual (para comprobar que tu app coincide): ${now}\n`);
