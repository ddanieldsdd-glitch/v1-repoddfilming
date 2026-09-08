#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Rellena home_still_ratio para los fotogramas Cloudinary usados en portada.
 *
 * Uso:
 *   MONGO_URL="..." DB_NAME="ddp_portfolio" node scripts/backfill-home-still-ratios.js
 *   MONGO_URL="..." DB_NAME="ddp_portfolio" node scripts/backfill-home-still-ratios.js --apply
 */
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ddp_portfolio';
const COLLECTION = 'content';
const APPLY = process.argv.includes('--apply');

if (!MONGO_URL) {
  console.error('Error: define MONGO_URL antes de ejecutar este script.');
  process.exit(1);
}

function resolveHomeStill(project) {
  const chosen = String(project?.home_still || '').trim();
  if (chosen) return chosen;
  const cover = String(project?.cover || '').trim();
  if (cover && !/vimeo\.com|youtube\.com|youtu\.be/.test(cover)) return cover;
  return project?.stills?.[0] || project?.poster || '';
}

function cloudinaryInfoUrl(url) {
  const marker = '/image/upload/';
  if (!String(url).includes('res.cloudinary.com') || !String(url).includes(marker)) {
    return null;
  }
  return String(url).replace(marker, `${marker}fl_getinfo/`);
}

async function readCloudinaryRatio(url) {
  const infoUrl = cloudinaryInfoUrl(url);
  if (!infoUrl) return null;
  const response = await fetch(infoUrl);
  if (!response.ok) throw new Error(`Cloudinary respondió HTTP ${response.status}`);
  const info = await response.json();
  const width = Number(info?.output?.width ?? info?.input?.width);
  const height = Number(info?.output?.height ?? info?.input?.height);
  return width > 0 && height > 0 ? Number((width / height).toFixed(6)) : null;
}

async function backfill() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const collection = client.db(DB_NAME).collection(COLLECTION);
    const doc = await collection.findOne({});
    if (!doc?.projects?.length) {
      console.log('No hay documento content con proyectos.');
      return;
    }

    const pending = doc.projects.filter((project) => {
      const ratio = Number(project.home_still_ratio);
      return project.home_featured !== false && resolveHomeStill(project) && !(ratio > 0);
    });

    if (!pending.length) {
      console.log('No hay proyectos de portada pendientes de ratio.');
      return;
    }

    console.log(`${APPLY ? 'Aplicando' : 'Dry-run'}: ${pending.length} proyecto(s) pendientes.`);
    const ratios = new Map();

    for (const project of pending) {
      const still = resolveHomeStill(project);
      try {
        const ratio = await readCloudinaryRatio(still);
        console.log(
          `- ${project.slug || project.id}: ${ratio ? ratio.toFixed(4) : 'URL no compatible'}`,
        );
        if (ratio) ratios.set(project.id, ratio);
      } catch (error) {
        console.warn(`- ${project.slug || project.id}: ${error.message}`);
      }
    }

    if (!ratios.size) {
      console.log('Nada que escribir.');
      return;
    }
    if (!APPLY) {
      console.log('\nDry-run completado. Ejecuta con --apply para persistir los cambios.');
      return;
    }

    const now = new Date().toISOString();
    const projects = doc.projects.map((project) =>
      ratios.has(project.id)
        ? { ...project, home_still_ratio: ratios.get(project.id), updated_at: now }
        : project,
    );
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          projects,
          updated_at: now,
          home_updated_at: now,
        },
      },
    );
    console.log(`\nActualizados ${ratios.size} proyecto(s) en ${DB_NAME}.${COLLECTION}.`);
  } finally {
    await client.close();
  }
}

backfill().catch((error) => {
  console.error('Error durante el backfill:', error.message);
  process.exit(1);
});
