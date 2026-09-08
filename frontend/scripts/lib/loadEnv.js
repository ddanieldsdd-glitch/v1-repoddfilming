const path = require('path');

function loadEnv() {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
  } catch {
    /* optional */
  }
}

function requireMongoEnv() {
  loadEnv();
  const MONGO_URL = process.env.MONGO_URL;
  const DB_NAME = process.env.DB_NAME || 'ddp_portfolio';
  if (!MONGO_URL) {
    console.error('Error: define MONGO_URL (p. ej. en frontend/.env.local).');
    process.exit(1);
  }
  return { MONGO_URL, DB_NAME };
}

function safeMongoLabel(url, db) {
  try {
    const normalized = String(url)
      .replace(/^mongodb\+srv:\/\//, 'https://')
      .replace(/^mongodb:\/\//, 'http://');
    const parsed = new URL(normalized);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}/${db}`;
  } catch {
    return `[redacted]/${db}`;
  }
}

module.exports = {
  loadEnv,
  requireMongoEnv,
  safeMongoLabel,
};
