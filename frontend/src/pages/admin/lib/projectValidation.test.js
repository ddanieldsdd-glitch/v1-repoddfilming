import { validateProject, validateSite } from "./projectValidation";

describe("projectValidation", () => {
  test("requires title and valid slug", () => {
    const errors = validateProject({ id: "p-1", title: "", slug: "Bad Slug" }, []);
    expect(errors.title).toBeTruthy();
    expect(errors.slug).toBeTruthy();
  });

  test("detects duplicate slugs", () => {
    const errors = validateProject(
      { id: "p-2", title: "Two", slug: "one" },
      [{ id: "p-1", slug: "one" }],
    );
    expect(errors.slug).toMatch(/en uso/);
  });

  test("validateSite checks email", () => {
    expect(validateSite({ social: { email: "nope" } }).email).toBeTruthy();
    expect(validateSite({ social: { email: "a@b.com" } }).email).toBeFalsy();
  });
});
