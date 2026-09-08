#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { buildDedupePlan, diagnoseProjects } = require('../api/_contentIntegrity');
const { requireMongoEnv, safeMongoLabel } = require('./lib/loadEnv');

const APPLY = process.argv.includes('--apply');
const SOURCE = process.argv.includes('--source=json') ? 'json' : 'mongo';
const backupRefArg = process.argv.find((arg) => arg.startsWith('--backup-ref='));
const backupRef = backupRefArg ? backupRefArg.split('=').slice(1).join('=') : null;

async function loadDocument() {
  if (SOURCE === 'json') {
    const contentPath = path.join(__dirname, '../src/data/content.json');
    return {
      doc: JSON.parse(fs.readFileSync(contentPath, 'utf8')),
      label: contentPath,
      writable: false,
    };
  }

  const { MONGO_URL, DB_NAME } = requireMongoEnv();
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const col = client.db(DB_NAME).collection('content');
  const doc = await col.findOne({});
  if (!doc) {
    await client.close();
    console.error('No content document found.');
    process.exit(2);
  }
  return { doc, label: safeMongoLabel(MONGO_URL, DB_NAME), writable: true, client, col };
}

async function main() {
  const loaded = await loadDocument();
  const plan = buildDedupePlan(loaded.doc.projects || []);

  console.log(`${APPLY ? 'Applying' : 'Dry-run'} content dedupe`);
  console.log(`Source: ${loaded.label}`);
  console.log(`Actions: ${plan.actions.length}`);
  console.log(`Blocked: ${plan.blocked}`);

  plan.actions.forEach((action) => {
    console.log(`- ${action.type} ${action.slug || action.id}`);
  });

  if (plan.blocked) {
    console.error('\nConflicts detected. Resolve manually before applying dedupe.');
    process.exit(1);
  }

  if (!plan.actions.length) {
    console.log('Nothing to dedupe.');
    if (loaded.client) await loaded.client.close();
    process.exit(0);
  }

  if (!APPLY) {
    console.log('\nDry-run complete. Re-run with --apply --backup-ref=<file> to persist.');
    if (loaded.client) await loaded.client.close();
    process.exit(0);
  }

  if (SOURCE === 'json') {
    console.error('Cannot apply dedupe to JSON source. Use Mongo source.');
    process.exit(1);
  }

  if (!backupRef || !fs.existsSync(backupRef)) {
    console.error('A valid --backup-ref file is required before --apply.');
    process.exit(1);
  }

  const beforeCount = loaded.doc.projects.length;
  const nextProjects = plan.nextProjects;
  const now = new Date().toISOString();

  const result = await loaded.col.updateOne(
    {
      _id: loaded.doc._id,
      $expr: { $eq: [{ $size: '$projects' }, beforeCount] },
    },
    {
      $set: {
        projects: nextProjects,
        updated_at: now,
      },
    },
  );

  await loaded.client.close();

  if (result.matchedCount !== 1) {
    console.error('Concurrent modification detected. Re-run diagnose and try again.');
    process.exit(1);
  }

  const postIssues = diagnoseProjects(nextProjects).filter((issue) => issue.severity === 'error');
  if (postIssues.length) {
    console.error('Post-apply verification failed:', postIssues);
    process.exit(1);
  }

  console.log(`Updated ${plan.actions.length} project array(s).`);
}

main().catch(async (err) => {
  console.error('Dedupe failed:', err.message);
  process.exit(1);
});
