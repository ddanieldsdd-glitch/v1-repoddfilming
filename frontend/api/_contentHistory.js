const HISTORY_COLLECTION = 'content_history';

function stripId(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  const next = { ...doc };
  delete next._id;
  return next;
}

async function recordHistory(db, { scope, snapshot, extra = {} } = {}) {
  if (!db) return;
  try {
    await db.collection(HISTORY_COLLECTION).insertOne({
      scope: scope || 'content',
      createdAt: new Date().toISOString(),
      extra,
      snapshot: stripId(snapshot),
    });
  } catch (err) {
    console.error('[content-history]', err.message);
  }
}

async function listHistory(db, { limit = 30 } = {}) {
  return db
    .collection(HISTORY_COLLECTION)
    .find({}, { projection: { snapshot: 0 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

async function getHistoryEntry(db, id) {
  const { ObjectId } = require('mongodb');
  return db.collection(HISTORY_COLLECTION).findOne({ _id: new ObjectId(id) });
}

module.exports = {
  HISTORY_COLLECTION,
  recordHistory,
  listHistory,
  getHistoryEntry,
};
