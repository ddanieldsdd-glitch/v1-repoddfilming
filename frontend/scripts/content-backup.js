#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { requireMongoEnv, safeMongoLabel } = require('./lib/loadEnv');

const SOURCE = process.argv.includes('--source=json') ? 'json' : 'mongo';
const backupDir = path.join(__dirname, 'backups');

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function loadDocument() {
  if (SOURCE === 'json') {
    const contentPath = path.join(__dirname, '../src/data/content.json');
    return {
      doc: JSON.parse(fs.readFileSync(contentPath, 'utf8')),
      label: contentPath,
    };
  }

  const { MONGO_URL, DB_NAME } = requireMongoEnv();
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const doc = await client.db(DB_NAME).collection('content').findOne({});
    if (!doc) {
      console.error('No content document found.');
      process.exit(2);
    }
    return { doc, label: safeMongoLabel(MONGO_URL, DB_NAME) };
  } finally {
    await client.close();
  }
}

async function main() {
  const { doc, label } = await loadDocument();
  fs.mkdirSync(backupDir, { recursive: true });

  const fileName = `content-${stamp()}.json`;
  const filePath = path.join(backupDir, fileName);
  const metaPath = path.join(backupDir, fileName.replace('.json', '.meta.json'));
  const payload = { ...doc };
  delete payload._id;

  const hash = crypto.createHash('sha256').update(JSON.stringify(payload.projects || [])).digest('hex');
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  fs.writeFileSync(
    metaPath,
    JSON.stringify(
      {
        source: label,
        createdAt: new Date().toISOString(),
        projectCount: (payload.projects || []).length,
        slugList: (payload.projects || []).map((project) => project.slug),
        projectsHash: hash,
      },
      null,
      2,
    ),
  );

  console.log(`Backup written to ${filePath}`);
  console.log(`Meta written to ${metaPath}`);
}

main().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});
