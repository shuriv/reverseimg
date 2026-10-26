import "./options.css";

import {
  keywordEngines,
  reverseEngines
} from "../shared/engines";
import {
  applyTheme,
  formatNumber,
  initPage,
  t
} from "../shared/i18n";
import {
  clearRecentSearches,
  createDefaultSettings,
  exportSettings,
  getSettings,
  importSettings,
  saveSettings,
  updateSettings
} from "../shared/settings";
import type {
  KeywordEngineId,
  ReverseEngineId,
  Settings,
  Theme
} from "../shared/types";

type EngineKind = "reverse" | "keyword";

const state: {
  settings: Settings;
  statusTimer: number | null;
} = {
  settings: createDefaultSettings(),
  statusTimer: null
};

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

const statusElement = getElement<HTMLDivElement>("status");
const reverseContainer = getElement<HTMLDivElement>("reverse-engines");
const keywordContainer = getElement<HTMLDivElement>("keyword-engines");
const openNewTab = getElement<HTMLInputElement>("open-new-tab");
const showSubmenu = getElement<HTMLInputElement>("show-submenu");
const rememberLast = getElement<HTMLInputElement>("remember-last");
const themeSelect = getElement<HTMLSelectElement>("theme");
const clearRecentButton = getElement<HTMLButtonElement>("clear-recent");
const exportButton = getElement<HTMLButtonElement>("export-settings");
const importButton = getElement<HTMLButtonElement>("import-settings");
const importFile = getElement<HTMLInputElement>("import-file");
const resetButton = getElement<HTMLButtonElement>("reset-settings");
const versionElement = getElement<HTMLElement>("about-version");
const privacyLink = getElement<HTMLAnchorElement>("privacy-link");

function setStatus(message: string, kind: "info" | "error" | "success" = "info"): void {
  if (state.statusTimer !== null) {
    window.clearTimeout(state.statusTimer);
  }
  statusElement.textContent = message;
  statusElement.classList.remove("hidden", "is-error", "is-success");
  if (kind === "error") {
    statusElement.classList.add("is-error");
  } else if (kind === "success") {
    statusElement.classList.add("is-success");
  }
  state.statusTimer = window.setTimeout(() => {
    statusElement.classList.add("hidden");
  }, 3600);
}

function engineName(kind: EngineKind, id: string): string {
  if (kind === "reverse") {
    return reverseEngines.find((engine) => engine.id === id)?.name ?? id;
  }
  return keywordEngines.find((engine) => engine.id === id)?.name ?? id;
}

function engineUpload(kind: EngineKind, id: string): { maxBytes: number } | undefined {
  if (kind === "reverse") {
    return reverseEngines.find((engine) => engine.id === id)?.upload;
  }
  return undefined;
}

function createEngineRow(
  kind: EngineKind,
  id: string,
  enabled: boolean,
  isDefault: boolean,
  isFirst: boolean,
  isLast: boolean
): HTMLElement {
  const row = document.createElement("div");
  row.className = "engine-row";
  row.dataset.engine = id;
  if (!enabled) {
    row.classList.add("is-disabled");
  }

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "engine-toggle";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = enabled;
  checkbox.setAttribute("aria-label", `${t("enabled")}: ${engineName(kind, id)}`);
  checkbox.addEventListener("change", () => {
    void setEngineEnabled(kind, id, checkbox.checked);
  });
  toggleLabel.append(checkbox);

  const name = document.createElement("div");
  name.className = "engine-name";
  const dot = document.createElement("span");
  dot.className = "dot";
  dot.setAttribute("aria-hidden", "true");
  const nameText = document.createElement("span");
  nameText.textContent = engineName(kind, id);
  name.append(dot, nameText);

  const capability = document.createElement("span");
  capability.className = "engine-capability";
  if (kind === "reverse") {
    const upload = engineUpload(kind, id);
    capability.textContent = upload
      ? t("uploadsUpTo", [
          formatNumber(upload.maxBytes / (1024 * 1024), {
            maximumFractionDigits: 0
          })
        ])
      : t("urlOnly");
  } else {
    capability.hidden = true;
  }

  const defaultLabel = document.createElement("label");
  defaultLabel.className = "default-choice";
  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = `${kind}-default-engine`;
  radio.checked = isDefault;
  radio.disabled = !enabled;
  radio.setAttribute("aria-label", `${t("defaultEngine")}: ${engineName(kind, id)}`);
  radio.addEventListener("change", () => {
    void setDefaultEngine(kind, id);
  });
  const defaultText = document.createElement("span");
  defaultText.textContent = t("defaultEngine");
  defaultLabel.append(radio, defaultText);

  const moveButtons = document.createElement("div");
  moveButtons.className = "move-buttons";
  const up = document.createElement("button");
  up.type = "button";
  up.textContent = "↑";
  up.disabled = isFirst;
  up.title = t("moveUp");
  up.setAttribute("aria-label", `${t("moveUp")}: ${engineName(kind, id)}`);
  up.addEventListener("click", () => {
    void moveEngine(kind, id, -1);
  });
  const down = document.createElement("button");
  down.type = "button";
  down.textContent = "↓";
  down.disabled = isLast;
  down.title = t("moveDown");
  down.setAttribute("aria-label", `${t("moveDown")}: ${engineName(kind, id)}`);
  down.addEventListener("click", () => {
    void moveEngine(kind, id, 1);
  });
  moveButtons.append(up, down);

  row.append(toggleLabel, name, capability, defaultLabel, moveButtons);
  return row;
}

function renderEngines(kind: EngineKind): void {
  const container = kind === "reverse" ? reverseContainer : keywordContainer;
  const order = kind === "reverse" ? state.settings.reverse.order : state.settings.keyword.order;
  const enabledIds: readonly string[] =
    kind === "reverse" ? state.settings.reverse.enabled : state.settings.keyword.enabled;
  const defaultId = kind === "reverse" ? state.settings.reverse.default : state.settings.keyword.default;
  container.replaceChildren();

  order.forEach((id, index) => {
    const enabled = enabledIds.includes(id);
    container.append(
      createEngineRow(
        kind,
        id,
        enabled,
        defaultId === id,
        index === 0,
        index === order.length - 1
      )
    );
  });
}

function renderControls(): void {
  openNewTab.checked = state.settings.behavior.openInNewTab;
  showSubmenu.checked = state.settings.behavior.showContextSubmenu;
  rememberLast.checked = state.settings.behavior.rememberLastEngine;
  themeSelect.value = state.settings.behavior.theme;
}

function renderAll(): void {
  renderEngines("reverse");
  renderEngines("keyword");
  renderControls();
}

async function persist(
  mutator: (current: Settings) => Settings,
  successMessage = true
): Promise<void> {
  try {
    state.settings = await updateSettings(mutator);
    applyTheme(state.settings.behavior.theme);
    renderAll();
    if (successMessage) {
      setStatus(t("saved"), "success");
    }
  } catch (error) {
    console.error("ReverseIMG: settings save failed", error);
    setStatus(t("saveFailed"), "error");
  }
}

function withEnabled(
  current: ReverseEngineId[],
  id: ReverseEngineId,
  enabled: boolean
): ReverseEngineId[] {
  return enabled
    ? current.includes(id)
      ? current
      : [...current, id]
    : current.filter((item) => item !== id);
}

async function setEngineEnabled(
  kind: EngineKind,
  id: string,
  enabled: boolean
): Promise<void> {
  const group =
    kind === "reverse" ? state.settings.reverse : state.settings.keyword;
  if (!enabled && group.enabled.length <= 1) {
    setStatus(t("atLeastOneEngine"), "error");
    renderEngines(kind);
    return;
  }

  await persist((current) => {
    if (kind === "reverse") {
      const engineId = id as ReverseEngineId;
      const nextEnabled = withEnabled(current.reverse.enabled, engineId, enabled);
      const nextDefault = nextEnabled.includes(current.reverse.default)
        ? current.reverse.default
        : nextEnabled[0];
      return {
        ...current,
        reverse: {
          ...current.reverse,
          enabled: current.reverse.order.filter((item) => nextEnabled.includes(item)),
          default: nextDefault
        }
      };
    }
    const engineId = id as KeywordEngineId;
    const nextEnabled = enabled
      ? current.keyword.enabled.includes(engineId)
        ? current.keyword.enabled
        : [...current.keyword.enabled, engineId]
      : current.keyword.enabled.filter((item) => item !== engineId);
    const nextDefault = nextEnabled.includes(current.keyword.default)
      ? current.keyword.default
      : nextEnabled[0];
    return {
      ...current,
      keyword: {
        ...current.keyword,
        enabled: current.keyword.order.filter((item) => nextEnabled.includes(item)),
        default: nextDefault
      }
    };
  });
}

async function setDefaultEngine(kind: EngineKind, id: string): Promise<void> {
  await persist((current) => {
    if (kind === "reverse") {
      const engineId = id as ReverseEngineId;
      return {
        ...current,
        reverse: {
          ...current.reverse,
          enabled: withEnabled(current.reverse.enabled, engineId, true),
          default: engineId
        }
      };
    }
    const engineId = id as KeywordEngineId;
    return {
      ...current,
      keyword: {
        ...current.keyword,
        enabled: current.keyword.enabled.includes(engineId)
          ? current.keyword.enabled
          : [...current.keyword.enabled, engineId],
        default: engineId
      }
    };
  });
}

async function moveEngine(
  kind: EngineKind,
  id: string,
  direction: -1 | 1
): Promise<void> {
  await persist((current) => {
    if (kind === "reverse") {
      const order = [...current.reverse.order];
      const index = order.indexOf(id as ReverseEngineId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= order.length) {
        return current;
      }
      [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
      return { ...current, reverse: { ...current.reverse, order } };
    }
    const order = [...current.keyword.order];
    const index = order.indexOf(id as KeywordEngineId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) {
      return current;
    }
    [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
    return { ...current, keyword: { ...current.keyword, order } };
  });
}

async function updateBehavior(): Promise<void> {
  await persist(
    (current) => ({
      ...current,
      behavior: {
        ...current.behavior,
        openInNewTab: openNewTab.checked,
        showContextSubmenu: showSubmenu.checked,
        rememberLastEngine: rememberLast.checked,
        theme: themeSelect.value as Theme
      },
      last: rememberLast.checked ? current.last : {}
    }),
    false
  );
}

async function clearRecent(): Promise<void> {
  try {
    await clearRecentSearches();
    setStatus(t("recentCleared"), "success");
  } catch (error) {
    console.error("ReverseIMG: recent search clear failed", error);
    setStatus(t("saveFailed"), "error");
  }
}

async function resetSettings(): Promise<void> {
  if (!window.confirm(t("resetConfirm"))) {
    return;
  }
  const defaults = createDefaultSettings();
  try {
    await saveSettings(defaults);
    state.settings = defaults;
    applyTheme(defaults.behavior.theme);
    renderAll();
    setStatus(t("resetDone"), "success");
  } catch (error) {
    console.error("ReverseIMG: settings reset failed", error);
    setStatus(t("saveFailed"), "error");
  }
}

function exportToFile(): void {
  const blob = new Blob([exportSettings(state.settings)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "reverseimg-settings.json";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importFromFile(file: File): Promise<void> {
  try {
    const text = await file.text();
    const imported = importSettings(text);
    await saveSettings(imported);
    state.settings = imported;
    applyTheme(imported.behavior.theme);
    renderAll();
    setStatus(t("importDone"), "success");
  } catch (error) {
    console.error("ReverseIMG: settings import failed", error);
    setStatus(t("importFailed"), "error");
  } finally {
    importFile.value = "";
  }
}

function bindEvents(): void {
  openNewTab.addEventListener("change", () => void updateBehavior());
  showSubmenu.addEventListener("change", () => void updateBehavior());
  rememberLast.addEventListener("change", () => void updateBehavior());
  themeSelect.addEventListener("change", () => void updateBehavior());
  clearRecentButton.addEventListener("click", () => void clearRecent());
  resetButton.addEventListener("click", () => void resetSettings());
  exportButton.addEventListener("click", exportToFile);
  importButton.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", () => {
    const file = importFile.files?.[0];
    if (file) {
      void importFromFile(file);
    }
  });
}

async function init(): Promise<void> {
  initPage("optionsTitle");
  privacyLink.href = browser.runtime.getURL("privacy.html");
  versionElement.textContent = browser.runtime.getManifest().version;
  bindEvents();

  try {
    state.settings = await getSettings();
    applyTheme(state.settings.behavior.theme);
    renderAll();
  } catch (error) {
    console.error("ReverseIMG: options load failed", error);
    setStatus(t("loadFailed"), "error");
  }
}

void init();
