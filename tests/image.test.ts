import { describe, expect, it } from "vitest";

import {
  base64ToBlob,
  basename,
  dataUrlToBlob,
  isSupportedImageFile,
  isSupportedImageType,
  isValidImageUrl,
  sniffImageMime
} from "../src/shared/image";

describe("image helpers", () => {
  it("accepts supported MIME types and extensions", () => {
    expect(isSupportedImageType("image/jpeg")).toBe(true);
    expect(isSupportedImageType("image/png")).toBe(true);
    expect(isSupportedImageType("image/svg+xml")).toBe(false);
    expect(isSupportedImageFile({ name: "photo.PNG", type: "" })).toBe(true);
    expect(isSupportedImageFile({ name: "photo.txt", type: "text/plain" })).toBe(
      false
    );
  });

  it("validates only http and https image URLs", () => {
    expect(isValidImageUrl("https://example.com/a.jpg")).toBe(true);
    expect(isValidImageUrl("http://example.com/a.jpg")).toBe(true);
    expect(isValidImageUrl("file:///C:/a.jpg")).toBe(false);
    expect(isValidImageUrl("javascript:alert(1)")).toBe(false);
    expect(isValidImageUrl("not a url")).toBe(false);
  });

  it("decodes base64 and plain data URLs", async () => {
    const base64 = dataUrlToBlob(
      "data:image/png;base64,aGVsbG8="
    );
    expect(base64.type).toBe("image/png");
    expect(await base64.text()).toBe("hello");

    const plain = dataUrlToBlob("data:text/plain,hello%20world");
    expect(await plain.text()).toBe("hello world");
  });

  it("converts base64 into a blob", async () => {
    const blob = base64ToBlob("aGVsbG8=", "image/jpeg");
    expect(blob.type).toBe("image/jpeg");
    expect(await blob.text()).toBe("hello");
  });

  it("sniffs common image signatures", () => {
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0
    ]);
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0
    ]);
    const webp = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50
    ]);
    expect(sniffImageMime(png)).toBe("image/png");
    expect(sniffImageMime(jpeg)).toBe("image/jpeg");
    expect(sniffImageMime(webp)).toBe("image/webp");
    expect(sniffImageMime(new Uint8Array(4))).toBeUndefined();
  });

  it("sanitizes file names", () => {
    expect(basename("C:\\photos\\cat.png")).toBe("cat.png");
    expect(basename("https://example.com/a%20b.jpg")).toBe("a%20b.jpg");
    expect(basename('bad"name.png')).toBe("badname.png");
    expect(basename("")).toBe("image");
  });
});
