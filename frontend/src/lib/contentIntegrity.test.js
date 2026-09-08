const {
  buildDedupePlan,
  diagnoseProjects,
  mergeHomeLayoutPatches,
  reorderProjects,
  assertUniqueProject,
  normalizeHomeOrder,
} = require('../../api/_contentIntegrity');

describe('contentIntegrity', () => {
  test('detects duplicate slug conflicts', () => {
    const issues = diagnoseProjects([
      { id: 'p-a', slug: 'origami', title: 'Origami A' },
      { id: 'p-b', slug: 'origami', title: 'Origami B' },
    ]);
    expect(issues.some((issue) => issue.code === 'DUPLICATE_SLUG')).toBe(true);
  });

  test('dedupes repeated still URLs safely', () => {
    const plan = buildDedupePlan([
      {
        id: 'p-v1',
        slug: 'v1',
        stills: ['https://example.com/a.jpg', 'https://example.com/a.jpg'],
        bts: [],
        recognitions: [],
      },
    ]);
    expect(plan.blocked).toBe(false);
    expect(plan.actions).toHaveLength(1);
    expect(plan.nextProjects[0].stills).toHaveLength(1);
  });

  test('reorderProjects keeps unknown ids at the end', () => {
    const projects = [
      { id: 'p-1', slug: 'one' },
      { id: 'p-2', slug: 'two' },
      { id: 'p-3', slug: 'three' },
    ];
    const next = reorderProjects(projects, ['p-3', 'p-1']);
    expect(next.map((p) => p.id)).toEqual(['p-3', 'p-1', 'p-2']);
  });

  test('mergeHomeLayoutPatches only updates home fields', () => {
    const projects = [
      {
        id: 'p-1',
        slug: 'one',
        title: 'One',
        home_featured: false,
        home_order: 9,
        home_size: 'medium',
        home_still: '',
      },
    ];
    const next = mergeHomeLayoutPatches(
      projects,
      [{ id: 'p-1', home_featured: true, home_order: 1, home_size: 'wide', home_still: 'still.jpg', title: 'Changed' }],
      12,
    );
    expect(next[0].home_featured).toBe(true);
    expect(next[0].home_size).toBe('wide');
    expect(next[0].title).toBe('One');
  });

  test('normalizeHomeOrder compacts featured order to 1..n', () => {
    const next = normalizeHomeOrder([
      { id: 'a', home_featured: true, home_order: 9, title: 'A' },
      { id: 'b', home_featured: false, home_order: 1, title: 'B' },
      { id: 'c', home_featured: true, home_order: 2, title: 'C' },
    ]);
    expect(next.find((p) => p.id === 'c').home_order).toBe(1);
    expect(next.find((p) => p.id === 'a').home_order).toBe(2);
    expect(next.find((p) => p.id === 'b').home_order).toBe(3);
  });

  test('assertUniqueProject rejects duplicate slug', () => {
    const result = assertUniqueProject(
      [{ id: 'p-1', slug: 'origami' }],
      { id: 'p-2', slug: 'origami' },
    );
    expect(result.ok).toBe(false);
    expect(result.code).toBe('DUPLICATE_SLUG');
  });
});
