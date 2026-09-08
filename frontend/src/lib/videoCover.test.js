import {
  computeCoverScale,
  computeCropZoom,
  computeVideoCoverVars,
  resolveVideoRatio,
} from "./videoCover";

describe("videoCover", () => {
  test("resolveVideoRatio falls back to 16:9", () => {
    expect(resolveVideoRatio(undefined)).toBeCloseTo(16 / 9);
    expect(resolveVideoRatio(0)).toBeCloseTo(16 / 9);
    expect(resolveVideoRatio(-1)).toBeCloseTo(16 / 9);
  });

  test("computeCoverScale keeps 1:1 ratio containers unchanged", () => {
    const ratio = 16 / 9;
    expect(computeCoverScale(ratio, ratio)).toBeCloseTo(1);
  });

  test("computeCoverScale scales wider anamorphic video in 16:9 card", () => {
    const scale = computeCoverScale(2.39, 16 / 9);
    expect(scale).toBeGreaterThan(1);
    expect(scale).toBeCloseTo(2.39 / (16 / 9), 5);
  });

  test("computeCoverScale scales vertical video in 16:9 card", () => {
    const scale = computeCoverScale(9 / 16, 16 / 9);
    expect(scale).toBeGreaterThan(1);
    expect(scale).toBeCloseTo((16 / 9) / (9 / 16), 5);
  });

  test("computeCropZoom respects manual crop window", () => {
    expect(computeCropZoom({ x: 0, y: 0, w: 0.5, h: 0.5 })).toBe(2);
  });

  test("computeVideoCoverVars exposes CSS variables", () => {
    const vars = computeVideoCoverVars({
      previewVideoRatio: 2.39,
      containerRatio: 16 / 9,
      crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.45 },
    });

    expect(Number(vars["--vf-zoom"])).toBeGreaterThan(1);
    expect(vars["--vf-x"]).toMatch(/%$/);
    expect(vars["--vf-y"]).toMatch(/%$/);
    expect(Number(vars["--vf-cover-w"])).toBeGreaterThan(1);
  });
});
