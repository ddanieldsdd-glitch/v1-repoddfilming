#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Rellena preview_video_ratio en proyectos Vimeo existentes.
 *
 * Uso:
 *   MONGO_URL="..." DB_NAME="ddp_portfolio" node scripts/backfill-vimeo-ratios.js
 *   MONGO_URL="..." DB_NAME="ddp_portfolio" node scripts/backfill-vimeo-ratios.js --apply
 */
const { MongoClient } = require('mongodb');
const { extractVimeoId, getVimeoMeta } = require('../api/_vimeoMeta');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ddp_portfolio';
const COLLECTION = 'content';
const APPLY = process.argv.includes('--apply');

if (!MONGO_URL) {
  console.error('Error: define MONGO_URL antes de ejecutar este script.');
  process.exit(1);
}

const isVimeoPreview = (project) => {
  const url = project?.preview_url || project?.cover;
  return Boolean(extractVimeoId(url));
};

const previewUrl = (project) => project?.preview_url || project?.cover;

async function backfill() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const col = client.db(DB_NAME).collection(COLLECTION);
    const doc = await col.findOne({});
    if (!doc?.projects?.length) {
      console.log('No hay documento content con proyectos.');
      return;
    }

    const pending = doc.projects.filter(
      (project) =>
        isVimeoPreview(project) &&
        !(typeof project.preview_video_ratio === 'number' && project.preview_video_ratio > 0),
    );

    if (!pending.length) {
      console.log('No hay proyectos Vimeo pendientes de ratio.');
      return;
    }

    console.log(`${APPLY ? 'Aplicando' : 'Dry-run'}: ${pending.length} proyecto(s) pendientes.`);

    const updates = [];
    for (const project of pending) {
      const url = previewUrl(project);
      const meta = await getVimeoMeta(url);
      const ratio = meta?.aspect_ratio;
      console.log(
        `- ${project.slug || project.id}: ${url} -> ${
          ratio ? ratio.toFixed(4) : 'sin metadata (se mantendrá fallback 16:9)'
        }`,
      );
      if (typeof ratio === 'number' && ratio > 0) {
        updates.push({ slug: project.slug, id: project.id, ratio });
      }
    }

    if (!updates.length) {
      console.log('Nada que escribir.');
      return;
    }

    if (!APPLY) {
      console.log('\nDry-run completado. Ejecuta con --apply para persistir los cambios.');
      return;
    }

    const nextProjects = doc.projects.map((project) => {
      const match = updates.find(
        (item) => item.slug === project.slug || item.id === project.id,
      );
      if (!match) return project;
      return { ...project, preview_video_ratio: match.ratio };
    });

    await col.updateOne(
      { _id: doc._id },
      { $set: { projects: nextProjects } },
    );

    console.log(`\nActualizados ${updates.length} proyecto(s) en ${DB_NAME}.${COLLECTION}.`);
  } finally {
    await client.close();
  }
}

backfill().catch((err) => {
  console.error('Error durante el backfill:', err.message);
  process.exit(1);
});
