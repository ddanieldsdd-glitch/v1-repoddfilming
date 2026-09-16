import { packJustified } from "./justifiedLayout";

describe("packJustified", () => {
  test("packs featured and panoramic projects without forced empty side space", () => {
    const rows = packJustified(
      [
        { id: "featured", size: "hero", ratio: 1.9 },
        { id: "first", size: "medium", ratio: 2.3 },
        { id: "second", size: "medium", ratio: 1.8 },
        { id: "panoramic", size: "wide", ratio: 2.6 },
      ],
      1200,
      { minH: 220, maxH: 480, windowH: 900, maxPerRow: 2 },
    );

    expect(rows.map((row) => row.map((item) => item.id))).toEqual([
      ["featured", "first"],
      ["second", "panoramic"],
    ]);
  });

  test("solo rows share the container width regardless of still ratio", () => {
    const rows = packJustified(
      [
        { id: "wide", size: "wide", ratio: 2.39 },
        { id: "standard", size: "medium", ratio: 16 / 9 },
      ],
      800,
      { minH: 220, maxH: 500, windowH: 2000, maxPerRow: 1 },
    );

    expect(rows).toHaveLength(2);
    expect(rows[0][0].width).toBe(800);
    expect(rows[1][0].width).toBe(800);
    expect(rows[0][0].height).toBeCloseTo(800 / 2.39, 5);
    expect(rows[1][0].height).toBeCloseTo(800 / (16 / 9), 5);
    expect(rows[0][0].height).toBeLessThan(rows[1][0].height);
  });

  test("caps only very tall solo stills", () => {
    const rows = packJustified(
      [{ id: "portrait", size: "tall", ratio: 9 / 16 }],
      800,
      { windowH: 900, maxPerRow: 1 },
    );
    expect(rows[0][0].width).toBe(800);
    expect(rows[0][0].height).toBe(Math.round(900 * 0.7));
  });
});
