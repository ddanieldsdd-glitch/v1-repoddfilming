/**
 * Migra el contenido actual de content.json a MongoDB.
 * Ejecutar UNA SOLA VEZ con:
 *   MONGO_URL="mongodb+srv://..." DB_NAME="ddp_portfolio" node scripts/seed-mongodb.js
 */
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ddp_portfolio';
const COLLECTION = 'content';

if (!MONGO_URL) {
  console.error('Error: define la variable de entorno MONGO_URL antes de ejecutar este script.');
  process.exit(1);
}

const contentPath = path.join(__dirname, '../src/data/content.json');
const rawContent = fs.readFileSync(contentPath, 'utf-8');
const content = JSON.parse(rawContent);

const now = new Date().toISOString();
content.projects = content.projects.map((p) => ({
  ...p,
  published: p.published !== undefined ? p.published : true,
  updated_at: p.updated_at || now,
}));

// Strip internal README keys before inserting
const doc = Object.fromEntries(
  Object.entries({
    ...content,
    updated_at: now,
    site_updated_at: now,
    home_updated_at: now,
  }).filter(([k]) => !k.startsWith('_'))
);

async function seed() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    console.log('Conectado a MongoDB Atlas');

    const db = client.db(DB_NAME);
    const col = db.collection(COLLECTION);

    const existing = await col.findOne({});
    if (existing) {
      console.log('Ya existe un documento en la colección. ¿Sobreescribir? (ctrl+c para cancelar)');
      await new Promise((r) => setTimeout(r, 3000));
    }

    await col.replaceOne({}, doc, { upsert: true });
    console.log(`Migración completada. ${doc.projects.length} proyectos insertados en ${DB_NAME}.${COLLECTION}`);
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error('Error durante la migración:', err.message);
  process.exit(1);
});
