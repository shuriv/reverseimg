import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vi } from "vitest";

import { createDefaultSettings } from "../../src/shared/settings";
import type { Settings } from "../../src/shared/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadPageBody(fileName: string): void {
  const html = fs.readFileSync(path.join(root, "src", fileName), "utf8");
  const bodyMatch = html.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    throw new Error(`No body found in ${fileName}`);
  }
  const classMatch = bodyMatch[1].match(/class="([^"]*)"/);
  document.body.className = classMatch?.[1] ?? "";
  document.body.innerHTML = bodyMatch[2].replace(
    /<script[\s\S]*?<\/script>/gi,
    ""
  );
  document.documentElement.lang = "en";
}

export interface BrowserMockOptions {
  settings?: Settings;
  recent?: string[];
}

export function installBrowserMock(options: BrowserMockOptions = {}) {
  const storage: Record<string, unknown> = {};
  if (options.settings) {
    storage.settings = options.settings;
  }
  if (options.recent) {
    storage.recentSearches = options.recent;
  }

  const set = vi.fn(async (values: Record<string, unknown>) => {
    Object.assign(storage, values);
  });
  const get = vi.fn(async (key?: string | string[] | Record<string, unknown> | null) => {
    if (typeof key === "string") {
      return { [key]: storage[key] };
    }
    if (Array.isArray(key)) {
      return Object.fromEntries(key.map((item) => [item, storage[item]]));
    }
    return { ...storage };
  });

  const browserMock = {
    i18n: {
      getUILanguage: () => "en",
      getMessage: (key: string) => key
    },
    storage: {
      local: { get, set }
    },
    runtime: {
      getManifest: () => ({ version: "0.1.0" }),
      getURL: (pathValue: string) => `moz-extension://test/${pathValue}`,
      openOptionsPage: vi.fn(async () => undefined)
    },
    tabs: {
      create: vi.fn(async () => ({})),
      update: vi.fn(async () => ({})),
      getCurrent: vi.fn(async () => ({ id: 1 })),
      remove: vi.fn(async () => undefined)
    }
  };

  vi.stubGlobal("browser", browserMock);
  return { browserMock, storage, get, set };
}

export function defaultSettings(): Settings {
  return createDefaultSettings();
}
