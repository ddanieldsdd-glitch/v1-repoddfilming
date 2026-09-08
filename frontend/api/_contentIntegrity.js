const IDENTITY_FIELDS = ['title', 'category', 'year', 'director', 'preview_url', 'cover', 'published'];

function normalizeUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function normalizeValue(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value;
  return value ?? '';
}

function findDuplicateKeys(projects, key) {
  const map = new Map();
  projects.forEach((project, index) => {
    const value = String(project?.[key] || '').trim();
    if (!value) return;
    if (!map.has(value)) map.set(value, []);
    map.get(value).push({ index, project });
  });
  return [...map.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([value, entries]) => ({ key, value, entries }));
}

function findCrossKeyConflicts(projects) {
  const conflicts = [];
  const slugToIds = new Map();
  const idToSlugs = new Map();

  projects.forEach((project, index) => {
    const slug = String(project?.slug || '').trim();
    const id = String(project?.id || '').trim();
    if (slug) {
      if (!slugToIds.has(slug)) slugToIds.set(slug, new Set());
      slugToIds.get(slug).add(id || `__missing__@${index}`);
    }
    if (id) {
      if (!idToSlugs.has(id)) idToSlugs.set(id, new Set());
      idToSlugs.get(id).add(slug || `__missing__@${index}`);
    }
  });

  slugToIds.forEach((ids, slug) => {
    if (ids.size > 1) {
      conflicts.push({
        code: 'SLUG_ID_MISMATCH',
        slug,
        ids: [...ids],
      });
    }
  });

  idToSlugs.forEach((slugs, id) => {
    if (slugs.size > 1) {
      conflicts.push({
        code: 'ID_SLUG_MISMATCH',
        id,
        slugs: [...slugs],
      });
    }
  });

  return conflicts;
}

function findIntraArrayDuplicates(project) {
  const findings = [];
  const fields = [
    ['stills', project?.stills || []],
    ['bts', project?.bts || []],
  ];

  fields.forEach(([field, values]) => {
    const seen = new Map();
    values.forEach((url, index) => {
      const normalized = normalizeUrl(url);
      if (!normalized) return;
      if (seen.has(normalized)) {
        findings.push({
          code: 'INTRA_ARRAY_DUP',
          field,
          url: normalized,
          indices: [seen.get(normalized), index],
        });
      } else {
        seen.set(normalized, index);
      }
    });
  });

  const recognitionUrls = new Map();
  (project?.recognitions || []).forEach((item, index) => {
    const normalized = normalizeUrl(item?.url);
    if (!normalized) return;
    if (recognitionUrls.has(normalized)) {
      findings.push({
        code: 'INTRA_ARRAY_DUP',
        field: 'recognitions',
        url: normalized,
        indices: [recognitionUrls.get(normalized), index],
      });
    } else {
      recognitionUrls.set(normalized, index);
    }
  });

  return findings;
}

function identityDiff(a, b) {
  return IDENTITY_FIELDS.filter((field) => {
    return normalizeValue(a?.[field]) !== normalizeValue(b?.[field]);
  });
}

function diagnoseProjects(projects = []) {
  const issues = [];

  projects.forEach((project, index) => {
    if (!String(project?.slug || '').trim() || !String(project?.id || '').trim()) {
      issues.push({
        severity: 'warn',
        code: 'EMPTY_SLUG_OR_ID',
        index,
        slug: project?.slug,
        id: project?.id,
      });
    }

    findIntraArrayDuplicates(project).forEach((finding) => {
      issues.push({
        severity: 'warn',
        projectIndex: index,
        slug: project?.slug,
        id: project?.id,
        ...finding,
      });
    });
  });

  findDuplicateKeys(projects, 'slug').forEach(({ value, entries }) => {
    const identityConflict = entries.some((left, i) =>
      entries.slice(i + 1).some((right) => identityDiff(left.project, right.project).length > 0),
    );
    issues.push({
      severity: identityConflict ? 'error' : 'warn',
      code: 'DUPLICATE_SLUG',
      slug: value,
      entries: entries.map(({ index, project }) => ({
        index,
        id: project.id,
        title: project.title,
      })),
      identityConflict,
    });
  });

  findDuplicateKeys(projects, 'id').forEach(({ value, entries }) => {
    const identityConflict = entries.some((left, i) =>
      entries.slice(i + 1).some((right) => identityDiff(left.project, right.project).length > 0),
    );
    issues.push({
      severity: identityConflict ? 'error' : 'warn',
      code: 'DUPLICATE_ID',
      id: value,
      entries: entries.map(({ index, project }) => ({
        index,
        slug: project.slug,
        title: project.title,
      })),
      identityConflict,
    });
  });

  findCrossKeyConflicts(projects).forEach((conflict) => {
    issues.push({
      severity: 'error',
      ...conflict,
    });
  });

  return issues;
}

function dedupeUrlList(values = []) {
  const seen = new Set();
  const next = [];
  values.forEach((value) => {
    const normalized = normalizeUrl(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    next.push(value);
  });
  return next;
}

function dedupeRecognitions(values = []) {
  const seen = new Set();
  const next = [];
  values.forEach((item) => {
    const normalized = normalizeUrl(item?.url);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    next.push(item);
  });
  return next;
}

function dedupeProjectArrays(project) {
  return {
    ...project,
    stills: dedupeUrlList(project?.stills || []),
    bts: dedupeUrlList(project?.bts || []),
    recognitions: dedupeRecognitions(project?.recognitions || []),
  };
}

function buildDedupePlan(projects = []) {
  const issues = diagnoseProjects(projects);
  const blocked = issues.some(
    (issue) =>
      issue.severity === 'error' ||
      issue.code === 'DUPLICATE_SLUG' && issue.identityConflict ||
      issue.code === 'DUPLICATE_ID' && issue.identityConflict ||
      issue.code === 'SLUG_ID_MISMATCH' ||
      issue.code === 'ID_SLUG_MISMATCH',
  );

  const actions = [];
  projects.forEach((project, index) => {
    const deduped = dedupeProjectArrays(project);
    const changed =
      JSON.stringify(deduped.stills) !== JSON.stringify(project?.stills || []) ||
      JSON.stringify(deduped.bts) !== JSON.stringify(project?.bts || []) ||
      JSON.stringify(deduped.recognitions) !== JSON.stringify(project?.recognitions || []);

    if (changed) {
      actions.push({
        type: 'DEDUPE_INTRA_ARRAY',
        index,
        slug: project.slug,
        id: project.id,
      });
    }
  });

  return {
    blocked,
    issues,
    actions,
    nextProjects: projects.map((project) => dedupeProjectArrays(project)),
  };
}

function applyDedupePlan(projects = []) {
  return buildDedupePlan(projects).nextProjects;
}

function assertUniqueProject(projects, project, { ignoreId = null } = {}) {
  const slug = String(project?.slug || '').trim();
  const id = String(project?.id || '').trim();
  if (!slug || !id) {
    return { ok: false, code: 'INVALID_PROJECT', message: 'Project id and slug are required' };
  }

  const slugConflict = projects.find(
    (item) => item.id !== ignoreId && String(item.slug || '').trim() === slug,
  );
  if (slugConflict) {
    return { ok: false, code: 'DUPLICATE_SLUG', message: `Slug already in use: ${slug}` };
  }

  const idConflict = projects.find(
    (item) => item.id !== ignoreId && String(item.id || '').trim() === id,
  );
  if (idConflict) {
    return { ok: false, code: 'DUPLICATE_ID', message: `Project id already in use: ${id}` };
  }

  return { ok: true };
}

function reorderProjects(projects = [], order = []) {
  const byId = new Map(projects.map((project) => [project.id, project]));
  const ordered = [];
  const seen = new Set();

  order.forEach((id) => {
    const project = byId.get(id);
    if (!project || seen.has(id)) return;
    ordered.push(project);
    seen.add(id);
  });

  projects.forEach((project) => {
    if (!seen.has(project.id)) ordered.push(project);
  });

  return ordered;
}

function mergeHomeLayoutPatches(projects = [], patches = [], homeMax) {
  const patchById = new Map(
    (patches || []).map((patch) => [String(patch.id || ''), patch]).filter(([id]) => id),
  );

  const allowed = [
    'home_featured',
    'home_order',
    'home_size',
    'home_still',
    'home_still_ratio',
  ];

  return projects.map((project) => {
    const patch = patchById.get(project.id);
    if (!patch) return project;
    const next = { ...project };
    allowed.forEach((key) => {
      if (patch[key] !== undefined) next[key] = patch[key];
    });
    return next;
  });
}

function normalizeHomeOrder(projects = []) {
  const featured = projects
    .filter((project) => project.home_featured !== false)
    .sort((a, b) => Number(a.home_order) - Number(b.home_order) || String(a.title || '').localeCompare(String(b.title || '')));
  const rest = projects.filter((project) => project.home_featured === false);
  const orderById = new Map();
  featured.forEach((project, index) => orderById.set(project.id, index + 1));
  rest.forEach((project, index) => orderById.set(project.id, featured.length + index + 1));
  return projects.map((project) => ({
    ...project,
    home_order: orderById.get(project.id) ?? project.home_order,
  }));
}

module.exports = {
  IDENTITY_FIELDS,
  normalizeUrl,
  diagnoseProjects,
  buildDedupePlan,
  applyDedupePlan,
  dedupeProjectArrays,
  assertUniqueProject,
  reorderProjects,
  mergeHomeLayoutPatches,
  normalizeHomeOrder,
};
