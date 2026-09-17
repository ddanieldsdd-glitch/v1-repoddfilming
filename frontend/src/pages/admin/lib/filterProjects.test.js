import { canReorderProjects, filterProjects, swapAdjacentInSubsequence } from "./filterProjects";

const projects = [
  { id: "p-1", title: "Origami", slug: "origami", director: "Ana", category: "fiction", year: 2024, published: true, home_featured: true },
  { id: "p-2", title: "Spot", slug: "spot", director: "Luis", category: "commercial", year: 2022, published: false, home_featured: false, preview_url: "https://vimeo.com/1" },
];

describe("filterProjects", () => {
  test("searches title slug director category year", () => {
    expect(filterProjects(projects, { query: "orig" })).toHaveLength(1);
    expect(filterProjects(projects, { query: "2022" })[0].project.id).toBe("p-2");
    expect(filterProjects(projects, { query: "luis" })[0].project.id).toBe("p-2");
  });

  test("filters draft, home and sorts by year", () => {
    expect(filterProjects(projects, { status: "draft" })).toHaveLength(1);
    expect(filterProjects(projects, { homeOnly: true })).toHaveLength(1);
    expect(filterProjects(projects, { sort: "year" })[0].project.year).toBe(2024);
  });
});

describe("swapAdjacentInSubsequence", () => {
  const ordered = [
    { id: "f1", category: "fiction" },
    { id: "c1", category: "commercial" },
    { id: "f2", category: "fiction" },
    { id: "f3", category: "fiction" },
    { id: "c2", category: "commercial" },
  ];

  test("swaps within a category without mixing others", () => {
    const fictionIds = ["f1", "f2", "f3"];
    expect(swapAdjacentInSubsequence(ordered, fictionIds, 1, -1)).toEqual(["f2", "c1", "f1", "f3", "c2"]);
    expect(swapAdjacentInSubsequence(ordered, fictionIds, 1, 1)).toEqual(["f1", "c1", "f3", "f2", "c2"]);
  });

  test("swaps adjacent items when the subsequence is the full list", () => {
    const ids = ordered.map((p) => p.id);
    expect(swapAdjacentInSubsequence(ordered, ids, 0, 1)).toEqual(["c1", "f1", "f2", "f3", "c2"]);
  });

  test("is a no-op at the edges", () => {
    const ids = ordered.map((p) => p.id);
    expect(swapAdjacentInSubsequence(ordered, ids, 0, -1)).toEqual(ids);
    expect(swapAdjacentInSubsequence(ordered, ids, ids.length - 1, 1)).toEqual(ids);
  });
});

describe("canReorderProjects", () => {
  test("only allows reorder on current work order without extra filters", () => {
    expect(canReorderProjects()).toBe(true);
    expect(canReorderProjects({ sort: "title" })).toBe(false);
    expect(canReorderProjects({ query: "ori" })).toBe(false);
    expect(canReorderProjects({ homeOnly: true })).toBe(false);
    expect(canReorderProjects({ ratioOnly: true })).toBe(false);
  });
});
