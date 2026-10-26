import { describe, expect, it } from "vitest";

import {
  createDefaultSettings,
  exportSettings,
  importSettings,
  isTheme,
  normalizeSettings,
  selectedKeywordEngineIds,
  selectedReverseEngineIds
} from "../src/shared/settings";

describe("settings normalization", () => {
  it("returns defaults for missing or broken values", () => {
    expect(normalizeSettings(undefined)).toEqual(createDefaultSettings());
    expect(normalizeSettings("nope")).toEqual(createDefaultSettings());
    expect(normalizeSettings({ reverse: "nope", keyword: 42 })).toEqual(
      createDefaultSettings()
    );
  });

  it("filters unknown ids and repairs incomplete order lists", () => {
    const settings = normalizeSettings({
      reverse: {
        enabled: ["googleLens", "unknown", "googleLens", "bing"],
        order: ["bing", "unknown"],
        default: "unknown"
      },
      keyword: {
        enabled: ["duckduckgo"],
        order: ["duckduckgo"],
        default: "googleImages"
      }
    });

    expect(settings.reverse.order).toContain("googleLens");
    expect(settings.reverse.order).toContain("yandex");
    expect(settings.reverse.order).not.toContain("unknown");
    expect(settings.reverse.enabled).toEqual(["bing", "googleLens"]);
    expect(settings.reverse.enabled).toContain(settings.reverse.default);
    expect(settings.keyword.enabled).toEqual(["duckduckgo"]);
    expect(settings.keyword.enabled).toContain(settings.keyword.default);
  });

  it("never leaves a category with zero engines", () => {
    const settings = normalizeSettings({
      reverse: { enabled: [], order: [], default: "tineye" },
      keyword: { enabled: [], order: [], default: "braveImages" }
    });
    expect(settings.reverse.enabled.length).toBeGreaterThan(0);
    expect(settings.keyword.enabled.length).toBeGreaterThan(0);
    expect(settings.reverse.enabled).toContain(settings.reverse.default);
    expect(settings.keyword.enabled).toContain(settings.keyword.default);
  });

  it("keeps only valid enabled last-engine values", () => {
    const settings = normalizeSettings({
      reverse: {
        enabled: ["bing"],
        order: ["googleLens", "bing", "yandex", "tineye", "saucenao"],
        default: "bing"
      },
      keyword: {
        enabled: ["googleImages"],
        order: [
          "googleImages",
          "bingImages",
          "yandexImages",
          "duckduckgo",
          "braveImages"
        ],
        default: "googleImages"
      },
      last: { reverse: "googleLens", keyword: "duckduckgo" }
    });
    expect(settings.last.reverse).toBeUndefined();
    expect(settings.last.keyword).toBeUndefined();
  });

  it("preserves valid behavior and last engines", () => {
    const settings = normalizeSettings({
      reverse: {
        enabled: ["googleLens", "bing"],
        order: ["googleLens", "bing"],
        default: "googleLens"
      },
      keyword: {
        enabled: ["googleImages", "bingImages"],
        order: ["googleImages", "bingImages"],
        default: "bingImages"
      },
      behavior: {
        openInNewTab: false,
        showContextSubmenu: false,
        rememberLastEngine: false,
        theme: "dark"
      },
      last: { reverse: "bing", keyword: "bingImages" }
    });
    expect(settings.behavior).toEqual({
      openInNewTab: false,
      showContextSubmenu: false,
      rememberLastEngine: false,
      theme: "dark"
    });
    expect(settings.last).toEqual({
      reverse: "bing",
      keyword: "bingImages"
    });
  });

  it("orders selected engines by the saved order", () => {
    const settings = createDefaultSettings();
    settings.reverse.order = ["bing", "googleLens", "yandex", "tineye", "saucenao"];
    settings.reverse.enabled = ["googleLens", "bing"];
    settings.keyword.order = [
      "braveImages",
      "googleImages",
      "bingImages",
      "yandexImages",
      "duckduckgo"
    ];
    settings.keyword.enabled = ["googleImages", "braveImages"];
    expect(selectedReverseEngineIds(settings)).toEqual(["bing", "googleLens"]);
    expect(selectedKeywordEngineIds(settings)).toEqual([
      "braveImages",
      "googleImages"
    ]);
  });
});

describe("settings backup", () => {
  it("round-trips exported settings", () => {
    const settings = normalizeSettings({
      behavior: { theme: "light", openInNewTab: false }
    });
    const text = exportSettings(settings);
    expect(text).toContain("ReverseIMG");
    expect(importSettings(text)).toEqual(settings);
  });

  it("rejects broken JSON", () => {
    expect(() => importSettings("{")).toThrow();
  });

  it("validates theme values", () => {
    expect(isTheme("system")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("blue")).toBe(false);
  });
});
