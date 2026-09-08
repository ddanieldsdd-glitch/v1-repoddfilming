const {
  assertUniqueProject,
  mergeHomeLayoutPatches,
  reorderProjects,
  normalizeHomeOrder,
} = require('./_contentIntegrity');
const { recordHistory } = require('./_contentHistory');

const HOME_LOCKED_FIELDS = [
  'home_featured',
  'home_order',
  'home_size',
  'home_still',
  'home_still_ratio',
];

const VALID_CATEGORIES = new Set(['fiction', 'documentary', 'commercial', 'music-video']);

function nowIso() {
  return new Date().toISOString();
}

function sanitizeProject(project) {
  const next = { ...project };
  Object.keys(next).forEach((key) => {
    if (key.startsWith('_')) delete next[key];
  });
  return next;
}

function stripInternalKeys(doc) {
  const next = { ...doc };
  delete next._id;
  Object.keys(next).forEach((key) => {
    if (key.startsWith('_')) delete next[key];
  });
  return next;
}

function ensureDocumentTimestamps(doc) {
  const now = nowIso();
  return {
    ...doc,
    updated_at: doc?.updated_at || now,
    site_updated_at: doc?.site_updated_at || doc?.updated_at || now,
    home_updated_at: doc?.home_updated_at || doc?.updated_at || now,
    projects: (doc?.projects || []).map((project) => ({
      ...project,
      updated_at: project?.updated_at || doc?.updated_at || now,
    })),
  };
}

function versionConflict(expected, actual, scope) {
  const err = new Error(`${scope} was modified in another session`);
  err.code = 'VERSION_CONFLICT';
  err.status = 409;
  err.serverUpdatedAt = actual || null;
  return err;
}

function assertVersion(expected, actual, scope) {
  if (expected == null || expected === '') return;
  if (String(expected) !== String(actual || '')) {
    throw versionConflict(expected, actual, scope);
  }
}

function validateProject(project) {
  if (!project || typeof project !== 'object') {
    return { ok: false, message: 'Invalid project payload' };
  }
  if (!String(project.id || '').trim() || !String(project.slug || '').trim()) {
    return { ok: false, message: 'Project id and slug are required' };
  }
  if (project.category && !VALID_CATEGORIES.has(project.category)) {
    return { ok: false, message: 'Invalid project category' };
  }
  return { ok: true };
}

function validateProjectsUnique(projects) {
  const slugs = new Set();
  const ids = new Set();
  for (const project of projects) {
    const slug = String(project.slug || '').trim();
    const id = String(project.id || '').trim();
    if (slugs.has(slug)) return { ok: false, message: `Duplicate slug: ${slug}` };
    if (ids.has(id)) return { ok: false, message: `Duplicate id: ${id}` };
    slugs.add(slug);
    ids.add(id);
  }
  return { ok: true };
}

function buildPublicDocument(doc) {
  return stripInternalKeys(ensureDocumentTimestamps(doc || {}));
}

async function readRawDocument(db, collectionName) {
  return db.collection(collectionName).findOne({});
}

async function writeDocument(db, collectionName, doc, filter = {}) {
  const payload = stripInternalKeys(doc);
  const result = await db.collection(collectionName).replaceOne(filter, payload, { upsert: true });
  return result;
}

async function updateDocument(db, collectionName, docId, currentDoc, mutator) {
  const working = ensureDocumentTimestamps({ ...currentDoc });
  const next = await mutator(working);
  const now = nowIso();
  next.updated_at = now;

  const result = await db.collection(collectionName).updateOne(
    { _id: docId, updated_at: currentDoc.updated_at ?? null },
    { $set: stripInternalKeys(next) },
  );

  if (result.matchedCount !== 1) {
    throw versionConflict(currentDoc.updated_at, null, 'Document');
  }

  return next;
}

async function createProject(db, collectionName, body) {
  const doc = ensureDocumentTimestamps(await readRawDocument(db, collectionName));
  assertVersion(body.updated_at, doc.updated_at, 'Document');

  const project = sanitizeProject(body.project || body);
  const validation = validateProject(project);
  if (!validation.ok) {
    const err = new Error(validation.message);
    err.status = 400;
    throw err;
  }

  const unique = assertUniqueProject(doc.projects || [], project);
  if (!unique.ok) {
    const err = new Error(unique.message);
    err.status = 409;
    err.code = unique.code;
    throw err;
  }

  const now = nowIso();
  project.updated_at = now;
  await recordHistory(db, { scope: 'project-create', snapshot: doc, extra: { projectId: project.id } });
  const position = body.position === 'end' ? 'end' : 'start';
  const projects = [...(doc.projects || [])];
  if (position === 'end') projects.push(project);
  else projects.unshift(project);

  const next = {
    ...doc,
    projects,
    updated_at: now,
  };

  const result = await db.collection(collectionName).updateOne(
    { _id: doc._id, updated_at: doc.updated_at ?? null },
    { $set: stripInternalKeys(next) },
  );
  if (result.matchedCount !== 1) throw versionConflict(body.updated_at, doc.updated_at, 'Document');

  return { project, updated_at: now, site_updated_at: next.site_updated_at, home_updated_at: next.home_updated_at };
}

async function updateProject(db, collectionName, projectId, body) {
  const doc = ensureDocumentTimestamps(await readRawDocument(db, collectionName));
  const index = (doc.projects || []).findIndex((item) => item.id === projectId);
  if (index < 0) {
    const err = new Error('Project not found');
    err.status = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  const current = doc.projects[index];
  assertVersion(body.updated_at ?? body.project?.updated_at, current.updated_at, 'Project');

  const incoming = sanitizeProject({ ...current, ...body.project, id: projectId });
  HOME_LOCKED_FIELDS.forEach((key) => {
    incoming[key] = current[key];
  });
  const project = incoming;
  const validation = validateProject(project);
  if (!validation.ok) {
    const err = new Error(validation.message);
    err.status = 400;
    throw err;
  }

  const unique = assertUniqueProject(doc.projects || [], project, { ignoreId: projectId });
  if (!unique.ok) {
    const err = new Error(unique.message);
    err.status = 409;
    err.code = unique.code;
    throw err;
  }

  const now = nowIso();
  project.updated_at = now;
  await recordHistory(db, { scope: 'project', snapshot: current, extra: { projectId } });
  const projects = [...doc.projects];
  projects[index] = project;
  const next = { ...doc, projects, updated_at: now };

  const result = await db.collection(collectionName).updateOne(
    { _id: doc._id, updated_at: doc.updated_at ?? null },
    { $set: stripInternalKeys(next) },
  );
  if (result.matchedCount !== 1) throw versionConflict(body.updated_at, doc.updated_at, 'Document');

  return {
    project,
    updated_at: now,
    site_updated_at: next.site_updated_at,
    home_updated_at: next.home_updated_at,
  };
}

async function deleteProject(db, collectionName, projectId, body) {
  const doc = ensureDocumentTimestamps(await readRawDocument(db, collectionName));
  const current = (doc.projects || []).find((item) => item.id === projectId);
  if (!current) {
    const err = new Error('Project not found');
    err.status = 404;
    err.code = 'PROJECT_NOT_FOUND';
    throw err;
  }

  assertVersion(body.updated_at ?? body.project?.updated_at, current.updated_at, 'Project');

  const now = nowIso();
  await recordHistory(db, { scope: 'project-delete', snapshot: current, extra: { projectId } });
  const projects = (doc.projects || []).filter((item) => item.id !== projectId);
  const next = { ...doc, projects, updated_at: now };

  const result = await db.collection(collectionName).updateOne(
    { _id: doc._id, updated_at: doc.updated_at ?? null },
    { $set: stripInternalKeys(next) },
  );
  if (result.matchedCount !== 1) throw versionConflict(body.updated_at, doc.updated_at, 'Document');

  return { updated_at: now, site_updated_at: next.site_updated_at, home_updated_at: next.home_updated_at };
}

async function reorderProjectList(db, collectionName, body) {
  const doc = ensureDocumentTimestamps(await readRawDocument(db, collectionName));
  assertVersion(body.updated_at, doc.updated_at, 'Document');

  const order = Array.isArray(body.order) ? body.order.map(String) : null;
  if (!order?.length) {
    const err = new Error('Invalid order payload');
    err.status = 400;
    throw err;
  }

  const now = nowIso();
  const projects = reorderProjects(doc.projects || [], order).map((project) => ({
    ...project,
    updated_at: project.updated_at || now,
  }));

  const next = { ...doc, projects, updated_at: now };
  const result = await db.collection(collectionName).updateOne(
    { _id: doc._id, updated_at: doc.updated_at ?? null },
    { $set: stripInternalKeys(next) },
  );
  if (result.matchedCount !== 1) throw versionConflict(body.updated_at, doc.updated_at, 'Document');

  return { updated_at: now, order: projects.map((project) => project.id), site_updated_at: next.site_updated_at, home_updated_at: next.home_updated_at };
}

async function updateSiteSection(db, collectionName, body) {
  const doc = ensureDocumentTimestamps(await readRawDocument(db, collectionName));
  assertVersion(body.site_updated_at, doc.site_updated_at, 'Site');

  const now = nowIso();
  await recordHistory(db, { scope: 'site', snapshot: { site: doc.site, about: doc.about } });
  const next = {
    ...doc,
    site: { ...doc.site, ...(body.site || {}) },
    about: body.about ? { ...doc.about, ...body.about } : doc.about,
    site_updated_at: now,
    updated_at: now,
  };

  const result = await db.collection(collectionName).updateOne(
    { _id: doc._id, site_updated_at: doc.site_updated_at ?? null },
    {
      $set: {
        site: next.site,
        about: next.about,
        site_updated_at: now,
        updated_at: now,
      },
    },
  );
  if (result.matchedCount !== 1) throw versionConflict(body.site_updated_at, doc.site_updated_at, 'Site');

  return {
    site: next.site,
    about: next.about,
    updated_at: now,
    site_updated_at: now,
    home_updated_at: next.home_updated_at,
  };
}

async function updateHomeLayoutSection(db, collectionName, body) {
  const doc = ensureDocumentTimestamps(await readRawDocument(db, collectionName));
  assertVersion(body.home_updated_at, doc.home_updated_at, 'Home layout');

  const now = nowIso();
  const projects = normalizeHomeOrder(
    mergeHomeLayoutPatches(doc.projects || [], body.projects || [], body.home_max),
  ).map((project) => ({
    ...project,
    updated_at: project.updated_at || now,
  }));

  await recordHistory(db, { scope: 'home', snapshot: { site: doc.site, projects: doc.projects } });

  const next = {
    ...doc,
    site: {
      ...doc.site,
      home_max: Number(body.home_max ?? doc.site?.home_max ?? 12) || 12,
      ...(body.showreel_url !== undefined ? { showreel_url: body.showreel_url } : {}),
      ...(body.showreel_placement !== undefined ? { showreel_placement: body.showreel_placement } : {}),
    },
    projects,
    home_updated_at: now,
    updated_at: now,
  };

  const result = await db.collection(collectionName).updateOne(
    { _id: doc._id, home_updated_at: doc.home_updated_at ?? null },
    {
      $set: {
        site: next.site,
        projects: next.projects,
        home_updated_at: now,
        updated_at: now,
      },
    },
  );
  if (result.matchedCount !== 1) throw versionConflict(body.home_updated_at, doc.home_updated_at, 'Home layout');

  return {
    site: next.site,
    projects: next.projects,
    updated_at: now,
    site_updated_at: next.site_updated_at,
    home_updated_at: now,
  };
}

async function replaceFullContent(db, collectionName, body) {
  if (!body || !body.site || !Array.isArray(body.projects)) {
    const err = new Error('Invalid content structure');
    err.status = 400;
    throw err;
  }

  const unique = validateProjectsUnique(body.projects);
  if (!unique.ok) {
    const err = new Error(unique.message);
    err.status = 409;
    throw err;
  }

  const existing = await readRawDocument(db, collectionName);
  if (existing) {
    if (body.updated_at == null || body.updated_at === '') {
      throw versionConflict(null, existing.updated_at || null, 'Document');
    }
    if (existing.updated_at) {
      assertVersion(body.updated_at, existing.updated_at, 'Document');
    }
  }

  const now = nowIso();
  await recordHistory(db, { scope: 'replace', snapshot: existing });
  const payload = ensureDocumentTimestamps({
    ...body,
    updated_at: now,
    site_updated_at: body.site_updated_at || now,
    home_updated_at: body.home_updated_at || now,
    projects: body.projects.map((project) => ({
      ...sanitizeProject(project),
      updated_at: project.updated_at || now,
    })),
  });

  if (existing?._id) {
    const result = await db.collection(collectionName).updateOne(
      { _id: existing._id, updated_at: existing.updated_at ?? null },
      { $set: stripInternalKeys(payload) },
    );
    if (result.matchedCount !== 1) throw versionConflict(body.updated_at, existing.updated_at, 'Document');
  } else {
    await writeDocument(db, collectionName, payload, {});
  }
  return { updated_at: now, site_updated_at: payload.site_updated_at, home_updated_at: payload.home_updated_at };
}

function toHttpError(err) {
  return {
    status: err.status || 500,
    body: {
      ok: false,
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      server_updated_at: err.serverUpdatedAt || null,
    },
  };
}

module.exports = {
  VALID_CATEGORIES,
  nowIso,
  sanitizeProject,
  stripInternalKeys,
  ensureDocumentTimestamps,
  buildPublicDocument,
  readRawDocument,
  createProject,
  updateProject,
  deleteProject,
  reorderProjectList,
  updateSiteSection,
  updateHomeLayoutSection,
  replaceFullContent,
  validateProjectsUnique,
  toHttpError,
  HOME_LOCKED_FIELDS,
};
