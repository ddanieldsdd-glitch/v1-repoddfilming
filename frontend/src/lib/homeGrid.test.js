import {
  getHomeProjects,
  resolveHomeStillRatio,
} from "./homeGrid";

describe("homeGrid", () => {
  test("uses a persisted home still ratio", () => {
    const [tile] = getHomeProjects([
      {
        id: "p-1",
        slug: "project",
        title: "Project",
        cover: "cover.jpg",
        home_featured: true,
        home_still_ratio: 2.39,
      },
    ]);

    expect(tile.ratio).toBe(2.39);
  });

  test("rejects missing or invalid ratios without changing them at runtime", () => {
    expect(resolveHomeStillRatio({ home_still_ratio: null })).toBeNull();
    expect(resolveHomeStillRatio({ home_still_ratio: 0 })).toBeNull();
    expect(resolveHomeStillRatio({ home_still_ratio: "1.85" })).toBe(1.85);
  });
});
