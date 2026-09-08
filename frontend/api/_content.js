/**
 * Fuente de verdad del contenido: MongoDB en producción, content.json como fallback.
 * Usado por og.js, sitemap.js y content.js para que todos lean los mismos proyectos
 * (incluidos los creados desde Admin).
 */

const { MongoClient } = require('mongodb');
const defaultContent = require('../src/data/content.json');

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || 'ddp_portfolio';
const COLLECTION = 'content';

let _client = null;

function mergeContent(doc) {
  if (!doc) return { ...defaultContent };
  return {
    ...defaultContent,
    ...doc,
    updated_at: doc.updated_at,
    site_updated_at: doc.site_updated_at,
    home_updated_at: doc.home_updated_at,
    site: {
      ...defaultContent.site,
      ...doc.site,
      meta_description: {
        ...(defaultContent.site?.meta_description || {}),
        ...(doc.site?.meta_description || {}),
      },
      social: {
        ...(defaultContent.site?.social || {}),
        ...(doc.site?.social || {}),
      },
    },
    about: { ...defaultContent.about, ...doc.about },
    projects: Array.isArray(doc.projects) ? doc.projects : defaultContent.projects,
  };
}

async function getDb() {
  if (!MONGO_URL) return null;
  if (!_client) {
    _client = new MongoClient(MONGO_URL);
    await _client.connect();
  }
  return _client.db(DB_NAME);
}

/** Raw Mongo document including _id and timestamps. */
async function getRawContentDocument() {
  if (!MONGO_URL) return null;
  try {
    const db = await getDb();
    return db.collection(COLLECTION).findOne({});
  } catch (err) {
    console.error('[api/_content] MongoDB raw read error:', err.message);
    return null;
  }
}

/** Contenido completo (MongoDB → defaults). Sin filtrar publicados. */
async function getMergedContent() {
  if (!MONGO_URL) return mergeContent(null);
  try {
    const db = await getDb();
    const doc = await db.collection(COLLECTION).findOne({}, { projection: { _id: 0 } });
    return mergeContent(doc);
  } catch (err) {
    console.error('[api/_content] MongoDB error, using defaults:', err.message);
    return mergeContent(null);
  }
}

/** Proyectos visibles en la web pública. */
function getPublishedProjects(content) {
  return (content?.projects || []).filter((p) => p.published !== false);
}

module.exports = {
  defaultContent,
  mergeContent,
  getMergedContent,
  getRawContentDocument,
  getPublishedProjects,
  getDb,
  DB_NAME,
  COLLECTION,
};
