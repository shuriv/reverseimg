import {
  ALL_KEYWORD_IDS,
  ALL_REVERSE_IDS,
  isKeywordEngineId,
  isReverseEngineId
} from "./engines";
import {
  SETTINGS_VERSION,
  type KeywordEngineId,
  type ReverseEngineId,
  type Settings,
  type Theme
} from "./types";

export const SETTINGS_KEY = "settings";
export const RECENT_KEY = "recentSearches";
export const MAX_RECENT = 10;

export function createDefaultSettings(): Settings {
  return {
    version: SETTINGS_VERSION,
    reverse: {
      enabled: [...ALL_REVERSE_IDS],
      order: [...ALL_REVERSE_IDS],
      default: "googleLens"
    },
    keyword: {
      enabled: [...ALL_KEYWORD_IDS],
      order: [...ALL_KEYWORD_IDS],
      default: "googleImages"
    },
    behavior: {
      openInNewTab: true,
      showContextSubmenu: true,
      rememberLastEngine: true,
      theme: "system"
    },
    last: {}
  };
}

function uniqueValid<T extends string>(
  values: unknown,
  valid: (value: unknown) => value is T,
  fallback: T[]
): T[] {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const result: T[] = [];
  for (const value of values) {
    if (valid(value) && !result.includes(value)) {
      result.push(value);
    }
  }
  return result.length ? result : [...fallback];
}

function normalizeGroup<T extends string>(
  raw: unknown,
  all: T[],
  isValid: (value: unknown) => value is T,
  fallbackDefault: T
): { enabled: T[]; order: T[]; default: T } {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const order = uniqueValid(source.order, isValid, all);
  for (const id of all) {
    if (!order.includes(id)) {
      order.push(id);
    }
  }

  const enabled = uniqueValid(source.enabled, isValid, order).filter((id) =>
    order.includes(id)
  );
  const safeEnabled = (enabled.length ? enabled : [order[0]]).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  let defaultEngine =
    typeof source.default === "string" && isValid(source.default)
      ? source.default
      : fallbackDefault;
  if (!safeEnabled.includes(defaultEngine)) {
    defaultEngine = safeEnabled[0];
  }

  return { enabled: safeEnabled, order, default: defaultEngine };
}

export function normalizeSettings(raw: unknown): Settings {
  const defaults = createDefaultSettings();
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const behaviorRaw = (
    source.behavior && typeof source.behavior === "object" ? source.behavior : {}
  ) as Record<string, unknown>;
  const lastRaw = (
    source.last && typeof source.last === "object" ? source.last : {}
  ) as Record<string, unknown>;

  const reverse = normalizeGroup(
    source.reverse,
    ALL_REVERSE_IDS,
    isReverseEngineId,
    defaults.reverse.default
  );
  const keyword = normalizeGroup(
    source.keyword,
    ALL_KEYWORD_IDS,
    isKeywordEngineId,
    defaults.keyword.default
  );

  const theme =
    behaviorRaw.theme === "light" ||
    behaviorRaw.theme === "dark" ||
    behaviorRaw.theme === "system"
      ? (behaviorRaw.theme as Theme)
      : defaults.behavior.theme;

  const last: Settings["last"] = {};
  if (
    isKeywordEngineId(lastRaw.keyword) &&
    keyword.enabled.includes(lastRaw.keyword)
  ) {
    last.keyword = lastRaw.keyword;
  }
  if (isReverseEngineId(lastRaw.reverse) && reverse.enabled.includes(lastRaw.reverse)) {
    last.reverse = lastRaw.reverse;
  }

  return {
    version: SETTINGS_VERSION,
    reverse,
    keyword,
    behavior: {
      openInNewTab:
        typeof behaviorRaw.openInNewTab === "boolean"
          ? behaviorRaw.openInNewTab
          : defaults.behavior.openInNewTab,
      showContextSubmenu:
        typeof behaviorRaw.showContextSubmenu === "boolean"
          ? behaviorRaw.showContextSubmenu
          : defaults.behavior.showContextSubmenu,
      rememberLastEngine:
        typeof behaviorRaw.rememberLastEngine === "boolean"
          ? behaviorRaw.rememberLastEngine
          : defaults.behavior.rememberLastEngine,
      theme
    },
    last
  };
}

let settingsQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = settingsQueue.then(operation, operation);
  settingsQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(stored[SETTINGS_KEY]);
}

export function saveSettings(settings: Settings): Promise<void> {
  return enqueue(async () => {
    const normalized = normalizeSettings(settings);
    await browser.storage.local.set({ [SETTINGS_KEY]: normalized });
  });
}

export function updateSettings(
  updater: (settings: Settings) => Settings
): Promise<Settings> {
  return enqueue(async () => {
    const current = await getSettings();
    const next = normalizeSettings(updater(current));
    await browser.storage.local.set({ [SETTINGS_KEY]: next });
    return next;
  });
}

export async function getRecentSearches(): Promise<string[]> {
  const stored = await browser.storage.local.get(RECENT_KEY);
  const value = stored[RECENT_KEY];
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, MAX_RECENT);
}

export async function addRecentSearch(search: string): Promise<string[]> {
  const trimmed = search.trim();
  if (!trimmed) {
    return getRecentSearches();
  }
  const current = await getRecentSearches();
  const next = [
    trimmed,
    ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
  ].slice(0, MAX_RECENT);
  await browser.storage.local.set({ [RECENT_KEY]: next });
  return next;
}

export async function removeRecentSearch(search: string): Promise<string[]> {
  const current = await getRecentSearches();
  const next = current.filter((item) => item !== search);
  await browser.storage.local.set({ [RECENT_KEY]: next });
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  await browser.storage.local.set({ [RECENT_KEY]: [] });
}

export function exportSettings(settings: Settings): string {
  return JSON.stringify(
    {
      app: "ReverseIMG",
      version: SETTINGS_VERSION,
      settings
    },
    null,
    2
  );
}

export function importSettings(text: string): Settings {
  const parsed: unknown = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid settings file");
  }
  const record = parsed as Record<string, unknown>;
  const candidate = record.settings ?? parsed;
  return normalizeSettings(candidate);
}

export function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

export function selectedReverseEngineIds(settings: Settings): ReverseEngineId[] {
  return settings.reverse.order.filter((id) => settings.reverse.enabled.includes(id));
}

export function selectedKeywordEngineIds(settings: Settings): KeywordEngineId[] {
  return settings.keyword.order.filter((id) => settings.keyword.enabled.includes(id));
}
