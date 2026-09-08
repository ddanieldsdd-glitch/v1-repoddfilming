import { isVersionConflict } from "./useSectionDraft";

describe("isVersionConflict", () => {
  test("detects ContentConflictError and VERSION_CONFLICT", () => {
    expect(isVersionConflict({ name: "ContentConflictError" })).toBe(true);
    expect(isVersionConflict({ code: "VERSION_CONFLICT" })).toBe(true);
    expect(isVersionConflict({ message: "fail" })).toBe(false);
  });
});
