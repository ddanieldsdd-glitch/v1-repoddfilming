#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { requireMongoEnv, safeMongoLabel } = require('./lib/loadEnv');

const APPLY = process.argv.includes('--apply');
const fromArg = process.argv.find((arg) => arg.startsWith('--from='));
const fromPath = fromArg ? fromArg.split('=').slice(1).join('=') : null;

if (!fromPath || !fs.existsSync(fromPath)) {
  console.error('Uso: node scripts/content-restore.js --from=scripts/backups/content-....json [--apply]');
  process.exit(1);
}

async function main() {
  const snapshot = JSON.parse(fs.readFileSync(path.resolve(fromPath), 'utf8'));
  if (!snapshot.site || !Array.isArray(snapshot.projects)) {
    console.error('Backup inválido: falta site/projects.');
    process.exit(1);
  }

  const { MONGO_URL, DB_NAME } = requireMongoEnv();
  console.log(`${APPLY ? 'Restaurando' : 'Dry-run restore'} ${fromPath}`);
  console.log(`Target: ${safeMongoLabel(MONGO_URL, DB_NAME)}`);
  console.log(`Projects: ${snapshot.projects.length}`);

  if (!APPLY) {
    console.log('Ejecuta con --apply para escribir.');
    return;
  }

  const client = new MongoClient(MONGO_URL);
  await client.connect();
  try {
    const col = client.db(DB_NAME).collection('content');
    const existing = await col.findOne({});
    const payload = { ...snapshot };
    delete payload._id;
    if (existing?._id) {
      await col.replaceOne({ _id: existing._id }, payload);
    } else {
      await col.insertOne(payload);
    }
    console.log('Restore completado.');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Restore failed:', err.message);
  process.exit(1);
});
