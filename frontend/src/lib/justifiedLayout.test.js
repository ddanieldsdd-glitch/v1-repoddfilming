import { packJustified } from "./justifiedLayout";

describe("packJustified", () => {
  test("keeps featured and panoramic projects on their own editorial rows", () => {
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
      ["featured"],
      ["first", "second"],
      ["panoramic"],
    ]);
  });
});
