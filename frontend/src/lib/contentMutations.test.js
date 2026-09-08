const {
  updateSiteSection,
  updateHomeLayoutSection,
  replaceFullContent,
  createProject,
  updateProject,
  reorderProjectList,
  ensureDocumentTimestamps,
} = require('../../api/_contentMutations');

describe('_contentMutations', () => {
  const baseDoc = () =>
    ensureDocumentTimestamps({
      site: { name: 'DDP', home_max: 12 },
      about: { es: 'Hola', en: 'Hello' },
      projects: [
        {
          id: 'p-1',
          slug: 'one',
          title: 'One',
          category: 'fiction',
          home_featured: true,
          home_order: 1,
          home_size: 'medium',
          home_still: '',
          home_still_ratio: 16 / 9,
        },
        {
          id: 'p-2',
          slug: 'two',
          title: 'Two',
          category: 'fiction',
          home_featured: false,
          home_order: 2,
          home_size: 'medium',
          home_still: '',
        },
      ],
    });

  test('updateSiteSection does not mutate projects', async () => {
    const doc = baseDoc();
    const db = {
      collection: () => ({
        findOne: async () => doc,
        updateOne: async () => ({ matchedCount: 1 }),
        insertOne: async () => ({}),
      }),
    };

    const result = await updateSiteSection(db, 'content', {
      site_updated_at: doc.site_updated_at,
      site: { tagline: 'Nuevo tagline' },
      about: { es: 'Nuevo about' },
    });

    expect(result.site.tagline).toBe('Nuevo tagline');
    expect(result.about.es).toBe('Nuevo about');
    expect(doc.projects).toHaveLength(2);
  });

  test('updateHomeLayoutSection only patches home fields', async () => {
    const doc = baseDoc();
    const db = {
      collection: () => ({
        findOne: async () => doc,
        updateOne: async () => ({ matchedCount: 1 }),
        insertOne: async () => ({}),
      }),
    };

    const result = await updateHomeLayoutSection(db, 'content', {
      home_updated_at: doc.home_updated_at,
      home_max: 8,
      projects: [{
        id: 'p-1',
        home_featured: true,
        home_order: 2,
        home_size: 'wide',
        home_still: 'still.jpg',
        home_still_ratio: 2.39,
      }],
    });

    expect(result.site.home_max).toBe(8);
    expect(result.projects[0].home_size).toBe('wide');
    expect(result.projects[0].home_still_ratio).toBe(2.39);
    expect(result.projects[0].title).toBe('One');
  });

  test('replaceFullContent rejects duplicate slugs', async () => {
    const doc = baseDoc();
    const db = {
      collection: () => ({
        findOne: async () => doc,
        replaceOne: async () => ({}),
        updateOne: async () => ({ matchedCount: 1 }),
        insertOne: async () => ({}),
      }),
    };

    await expect(
      replaceFullContent(db, 'content', {
        updated_at: doc.updated_at,
        site: doc.site,
        about: doc.about,
        projects: [
          { id: 'p-a', slug: 'dup', title: 'A' },
          { id: 'p-b', slug: 'dup', title: 'B' },
        ],
      }),
    ).rejects.toMatchObject({ status: 409 });
  });

  test('createProject rejects duplicate slug', async () => {
    const doc = baseDoc();
    const db = {
      collection: () => ({
        findOne: async () => doc,
        updateOne: async () => ({ matchedCount: 1 }),
        insertOne: async () => ({}),
      }),
    };

    await expect(
      createProject(db, 'content', {
        updated_at: doc.updated_at,
        project: { id: 'p-3', slug: 'one', title: 'Dup' },
      }),
    ).rejects.toMatchObject({ code: 'DUPLICATE_SLUG' });
  });

  test('reorderProjectList reorders ids', async () => {
    const doc = baseDoc();
    const db = {
      collection: () => ({
        findOne: async () => doc,
        updateOne: async () => ({ matchedCount: 1 }),
        insertOne: async () => ({}),
      }),
    };

    const result = await reorderProjectList(db, 'content', {
      updated_at: doc.updated_at,
      order: ['p-2', 'p-1'],
    });

    expect(result.order).toEqual(['p-2', 'p-1']);
  });

  test('updateProject preserves home layout fields', async () => {
    const doc = baseDoc();
    const db = {
      collection: () => ({
        findOne: async () => doc,
        updateOne: async () => ({ matchedCount: 1 }),
        insertOne: async () => ({}),
      }),
    };

    const result = await updateProject(db, 'content', 'p-1', {
      updated_at: doc.projects[0].updated_at,
      project: {
        ...doc.projects[0],
        title: 'Updated',
        home_still: 'stale.jpg',
        home_still_ratio: 1,
        home_size: 'hero',
      },
    });

    expect(result.project.title).toBe('Updated');
    expect(result.project.home_still).toBe('');
    expect(result.project.home_still_ratio).toBe(16 / 9);
    expect(result.project.home_size).toBe('medium');
  });

  test('replaceFullContent requires version when document exists', async () => {
    const doc = baseDoc();
    const db = {
      collection: () => ({
        findOne: async () => doc,
        updateOne: async () => ({ matchedCount: 1 }),
        insertOne: async () => ({}),
      }),
    };

    await expect(
      replaceFullContent(db, 'content', {
        site: doc.site,
        about: doc.about,
        projects: doc.projects,
      }),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
  });
});
