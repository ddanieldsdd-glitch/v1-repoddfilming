import { extractVimeoId, isVimeoUrl } from "./vimeoMeta";

describe("vimeoMeta", () => {
  test("extractVimeoId accepts numeric ids", () => {
    expect(extractVimeoId("123456789")).toBe("123456789");
  });

  test("extractVimeoId parses standard Vimeo URLs", () => {
    expect(extractVimeoId("https://vimeo.com/123456789")).toBe("123456789");
    expect(extractVimeoId("https://vimeo.com/video/123456789")).toBe("123456789");
  });

  test("extractVimeoId rejects invalid input", () => {
    expect(extractVimeoId("https://youtube.com/watch?v=abc")).toBeNull();
    expect(extractVimeoId("")).toBeNull();
  });

  test("isVimeoUrl detects Vimeo previews", () => {
    expect(isVimeoUrl("https://vimeo.com/123456789")).toBe(true);
    expect(isVimeoUrl("https://youtube.com/watch?v=abc")).toBe(false);
  });
});
