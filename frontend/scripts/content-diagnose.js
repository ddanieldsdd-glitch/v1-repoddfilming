#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { diagnoseProjects } = require('../api/_contentIntegrity');
const { requireMongoEnv, safeMongoLabel } = require('./lib/loadEnv');

const SOURCE = process.argv.includes('--source=json') ? 'json' : 'mongo';
const JSON_OUT = process.argv.find((arg) => arg.startsWith('--json-out='))?.split('=')[1];

async function loadProjects() {
  if (SOURCE === 'json') {
    const contentPath = path.join(__dirname, '../src/data/content.json');
    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    return { projects: content.projects || [], label: contentPath };
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
    return {
      projects: doc.projects || [],
      label: safeMongoLabel(MONGO_URL, DB_NAME),
    };
  } finally {
    await client.close();
  }
}

async function main() {
  const { projects, label } = await loadProjects();
  const issues = diagnoseProjects(projects);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warn');

  console.log('=== content-diagnose (read-only) ===');
  console.log(`Source: ${label}`);
  console.log(`Projects: ${projects.length}`);
  console.log(`Summary: ${errors.length} error(s), ${warnings.length} warning(s)`);

  issues.forEach((issue) => {
    const prefix = issue.severity === 'error' ? '[ERROR]' : '[WARN]';
    console.log(`${prefix} ${issue.code}`, JSON.stringify(issue));
  });

  if (JSON_OUT) {
    fs.writeFileSync(JSON_OUT, JSON.stringify({ projects: projects.length, issues }, null, 2));
    console.log(`Report written to ${JSON_OUT}`);
  }

  process.exit(errors.length ? 1 : 0);
}

main().catch((err) => {
  console.error('Diagnose failed:', err.message);
  process.exit(1);
});
