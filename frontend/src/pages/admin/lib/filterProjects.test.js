import { filterProjects } from "./filterProjects";

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
