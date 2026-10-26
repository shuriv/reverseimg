import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesRoot = path.join(root, "public", "_locales");
const localeCodes = ["en", "ru", "fr", "es", "zh_CN", "de", "pt_BR", "hi"];

function readLocale(code: string): Record<string, { message: string }> {
  return JSON.parse(
    fs.readFileSync(path.join(localesRoot, code, "messages.json"), "utf8")
  );
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\$(\d+)/g)]
    .map((match) => match[1])
    .sort((a, b) => Number(a) - Number(b));
}

function walk(directory: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

describe("localization coverage", () => {
  const english = readLocale("en");
  const englishKeys = Object.keys(english).sort();

  it("ships all eight locales with identical keys", () => {
    for (const code of localeCodes) {
      const messages = readLocale(code);
      expect(Object.keys(messages).sort(), code).toEqual(englishKeys);
    }
  });

  it("keeps placeholder counts aligned", () => {
    for (const code of localeCodes) {
      const messages = readLocale(code);
      for (const key of englishKeys) {
        expect(
          placeholders(messages[key].message),
          `${code}:${key}`
        ).toEqual(placeholders(english[key].message));
      }
    }
  });

  it("localizes every key used by HTML and TypeScript", () => {
    const sourceFiles = [
      ...walk(path.join(root, "src")),
      path.join(root, "public", "manifest.json")
    ];
    const used = new Set<string>();
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf8");
      for (const match of content.matchAll(
        /data-i18n(?:-[a-z-]+)?="([A-Za-z0-9_]+)"/g
      )) {
        used.add(match[1]);
      }
      for (const match of content.matchAll(
        /\b(?:t|initPage)\(\s*"([A-Za-z0-9_]+)"/g
      )) {
        used.add(match[1]);
      }
      for (const match of content.matchAll(/__MSG_([A-Za-z0-9_]+)__/g)) {
        used.add(match[1]);
      }
    }
    for (const key of used) {
      expect(english[key], `missing locale key: ${key}`).toBeDefined();
    }
  });

  it("keeps the manifest description within AMO limits", () => {
    expect(english.extensionDescription.message.length).toBeLessThanOrEqual(132);
    expect(english.extensionDescription.message).not.toMatch(/\n/);
  });
});
