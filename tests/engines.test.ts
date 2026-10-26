import { describe, expect, it } from "vitest";

import {
  ALL_KEYWORD_IDS,
  ALL_REVERSE_IDS,
  blobToBase64,
  getKeywordEngine,
  getReverseEngine,
  keywordEngines,
  reverseEngines
} from "../src/shared/engines";

describe("engine registry", () => {
  it("has unique ids and matching maps", () => {
    expect(new Set(ALL_REVERSE_IDS).size).toBe(ALL_REVERSE_IDS.length);
    expect(new Set(ALL_KEYWORD_IDS).size).toBe(ALL_KEYWORD_IDS.length);
    for (const id of ALL_REVERSE_IDS) {
      expect(getReverseEngine(id)?.id).toBe(id);
    }
    for (const id of ALL_KEYWORD_IDS) {
      expect(getKeywordEngine(id)?.id).toBe(id);
    }
  });

  it("builds encoded keyword URLs", () => {
    const google = getKeywordEngine("googleImages");
    const bing = getKeywordEngine("bingImages");
    const yandex = getKeywordEngine("yandexImages");
    const duck = getKeywordEngine("duckduckgo");
    const brave = getKeywordEngine("braveImages");
    expect(google?.searchUrl("red fox & cat")).toContain("q=red%20fox%20%26%20cat");
    expect(bing?.searchUrl("red fox")).toContain("q=red%20fox");
    expect(yandex?.searchUrl("red fox")).toContain("text=red%20fox");
    expect(duck?.searchUrl("red fox")).toContain("ia=images");
    expect(brave?.searchUrl("red fox")).toContain("q=red%20fox");
  });

  it("builds encoded reverse-image URLs", () => {
    const imageUrl = "https://example.com/a b.jpg?x=1&y=2";
    for (const engine of reverseEngines) {
      const url = engine.urlSearch(imageUrl);
      expect(url.startsWith("https://")).toBe(true);
      expect(url).toContain("example.com");
      expect(url).not.toContain("a b.jpg");
    }
  });

  it("describes upload support accurately", () => {
    expect(getReverseEngine("googleLens")?.upload?.maxBytes).toBeGreaterThan(0);
    expect(getReverseEngine("bing")?.upload?.maxBytes).toBeGreaterThan(0);
    expect(getReverseEngine("tineye")?.upload?.maxBytes).toBeGreaterThan(0);
    expect(getReverseEngine("saucenao")?.upload?.maxBytes).toBeGreaterThan(0);
    expect(getReverseEngine("yandex")?.upload).toBeUndefined();
  });

  it("builds a multipart Google Lens form", async () => {
    const engine = getReverseEngine("googleLens");
    const spec = await engine?.upload?.build({
      blob: new Blob(["image"], { type: "image/png" }),
      name: "photo.png",
      type: "image/png",
      size: 5
    });
    expect(spec?.action).toBe("https://lens.google.com/v3/upload");
    expect(spec?.enctype).toBe("multipart/form-data");
    expect(spec?.fields).toEqual([{ kind: "file", name: "encoded_image" }]);
  });

  it("builds an encoded Bing imageBin form", async () => {
    const blob = new Blob(["hello"], { type: "image/png" });
    expect(await blobToBase64(blob)).toBe("aGVsbG8=");
    const engine = getReverseEngine("bing");
    const spec = await engine?.upload?.build({
      blob,
      name: "hello world.png",
      type: "image/png",
      size: blob.size
    });
    expect(spec?.enctype).toBe("application/x-www-form-urlencoded");
    expect(spec?.action).toContain("iss=sbiupload");
    expect(spec?.action).toContain("sbifnm=hello+world.png");
    expect(spec?.fields).toContainEqual({
      kind: "hidden",
      name: "imageBin",
      value: "aGVsbG8="
    });
  });

  it("keeps all engines unique by name", () => {
    const names = [
      ...reverseEngines.map((engine) => engine.name),
      ...keywordEngines.map((engine) => engine.name)
    ];
    expect(new Set(names).size).toBe(names.length);
  });
});
