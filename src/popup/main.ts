import "./popup.css";

import {
  getKeywordEngine,
  getReverseEngine,
  keywordEngines,
  reverseEngines
} from "../shared/engines";
import {
  addRecentSearch,
  clearRecentSearches,
  createDefaultSettings,
  getRecentSearches,
  getSettings,
  removeRecentSearch,
  selectedKeywordEngineIds,
  selectedReverseEngineIds,
  updateSettings
} from "../shared/settings";
import {
  applyTheme,
  formatFileSize,
  formatNumber,
  initPage,
  t
} from "../shared/i18n";
import {
  GLOBAL_MAX_BYTES,
  isSupportedImageFile,
  isValidImageUrl
} from "../shared/image";
import { openUrl, uploadPageUrl } from "../shared/open";
import { cleanupPending, putPending } from "../shared/pending";
import type {
  KeywordEngineId,
  ReverseEngineId,
  Settings
} from "../shared/types";

type TabName = "find" | "reverse";
type ReverseMode = "upload" | "url";

const state: {
  settings: Settings;
  recent: string[];
  tab: TabName;
  mode: ReverseMode;
  keywordEngine: KeywordEngineId;
  reverseEngine: ReverseEngineId;
  file: File | null;
  previewUrl: string | null;
} = {
  settings: createDefaultSettings(),
  recent: [],
  tab: "find",
  mode: "upload",
  keywordEngine: "googleImages",
  reverseEngine: "googleLens",
  file: null,
  previewUrl: null
};

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

const findInput = getElement<HTMLInputElement>("find-input");
const findForm = getElement<HTMLFormElement>("find-form");
const keywordEnginesContainer = getElement<HTMLDivElement>("keyword-engines");
const recentList = getElement<HTMLUListElement>("recent-list");
const clearRecentButton = getElement<HTMLButtonElement>("clear-recent");
const statusElement = getElement<HTMLDivElement>("status");
const reverseSearchButton = getElement<HTMLButtonElement>("reverse-search");
const reverseNote = getElement<HTMLParagraphElement>("reverse-note");
const reverseEnginesContainer = getElement<HTMLDivElement>("reverse-engines");
const dropZone = getElement<HTMLDivElement>("drop-zone");
const fileInput = getElement<HTMLInputElement>("file-input");
const previewCard = getElement<HTMLDivElement>("preview-card");
const previewImage = getElement<HTMLImageElement>("preview-image");
const previewName = getElement<HTMLElement>("preview-name");
const previewSize = getElement<HTMLElement>("preview-size");
const removeImageButton = getElement<HTMLButtonElement>("remove-image");
const imageUrlInput = getElement<HTMLInputElement>("image-url");
const urlMode = getElement<HTMLDivElement>("url-mode");
const uploadMode = getElement<HTMLDivElement>("upload-mode");
const modeUploadButton = getElement<HTMLButtonElement>("mode-upload");
const modeUrlButton = getElement<HTMLButtonElement>("mode-url");
const tabFindButton = getElement<HTMLButtonElement>("tab-find");
const tabReverseButton = getElement<HTMLButtonElement>("tab-reverse");
const panelFind = getElement<HTMLElement>("panel-find");
const panelReverse = getElement<HTMLElement>("panel-reverse");
const openOptionsButton = getElement<HTMLButtonElement>("open-options");

function setStatus(message: string, kind: "info" | "error" | "success" = "info"): void {
  statusElement.textContent = message;
  statusElement.classList.remove("hidden", "is-error", "is-success");
  if (kind === "error") {
    statusElement.classList.add("is-error");
  } else if (kind === "success") {
    statusElement.classList.add("is-success");
  }
}

function clearStatus(): void {
  statusElement.textContent = "";
  statusElement.classList.add("hidden");
  statusElement.classList.remove("is-error", "is-success");
}

function setTab(tab: TabName): void {
  state.tab = tab;
  const isFind = tab === "find";
  panelFind.classList.toggle("hidden", !isFind);
  panelReverse.classList.toggle("hidden", isFind);
  tabFindButton.classList.toggle("is-active", isFind);
  tabReverseButton.classList.toggle("is-active", !isFind);
  tabFindButton.setAttribute("aria-selected", String(isFind));
  tabReverseButton.setAttribute("aria-selected", String(!isFind));
  if (isFind) {
    findInput.focus();
  } else if (state.mode === "url") {
    imageUrlInput.focus();
  } else {
    dropZone.focus();
  }
}

function setMode(mode: ReverseMode): void {
  state.mode = mode;
  const isUpload = mode === "upload";
  uploadMode.classList.toggle("hidden", !isUpload);
  urlMode.classList.toggle("hidden", isUpload);
  modeUploadButton.classList.toggle("is-active", isUpload);
  modeUrlButton.classList.toggle("is-active", !isUpload);
  modeUploadButton.setAttribute("aria-checked", String(isUpload));
  modeUrlButton.setAttribute("aria-checked", String(!isUpload));
  updateReverseState();
  if (!isUpload) {
    imageUrlInput.focus();
  }
}

function chooseKeywordEngine(): KeywordEngineId {
  const enabled = selectedKeywordEngineIds(state.settings);
  const remembered = state.settings.behavior.rememberLastEngine
    ? state.settings.last.keyword
    : undefined;
  if (remembered && enabled.includes(remembered)) {
    return remembered;
  }
  if (enabled.includes(state.settings.keyword.default)) {
    return state.settings.keyword.default;
  }
  return enabled[0] ?? "googleImages";
}

function chooseReverseEngine(): ReverseEngineId {
  const enabled = selectedReverseEngineIds(state.settings);
  const remembered = state.settings.behavior.rememberLastEngine
    ? state.settings.last.reverse
    : undefined;
  if (remembered && enabled.includes(remembered)) {
    return remembered;
  }
  if (enabled.includes(state.settings.reverse.default)) {
    return state.settings.reverse.default;
  }
  return enabled[0] ?? "googleLens";
}

function renderKeywordEngines(): void {
  keywordEnginesContainer.replaceChildren();
  const enabled = selectedKeywordEngineIds(state.settings);
  if (!enabled.includes(state.keywordEngine)) {
    state.keywordEngine = chooseKeywordEngine();
  }

  for (const id of enabled) {
    const engine = keywordEngines.find((item) => item.id === id);
    if (!engine) {
      continue;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = "engine-chip";
    button.dataset.engine = engine.id;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(engine.id === state.keywordEngine));
    button.classList.toggle("is-selected", engine.id === state.keywordEngine);

    const dot = document.createElement("span");
    dot.className = "dot";
    dot.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.textContent = engine.name;
    button.append(dot, name);
    button.addEventListener("click", () => {
      state.keywordEngine = engine.id;
      renderKeywordEngines();
    });
    keywordEnginesContainer.append(button);
  }
}

function renderReverseEngines(): void {
  reverseEnginesContainer.replaceChildren();
  const enabled = selectedReverseEngineIds(state.settings);
  if (!enabled.includes(state.reverseEngine)) {
    state.reverseEngine = chooseReverseEngine();
  }

  for (const id of enabled) {
    const engine = reverseEngines.find((item) => item.id === id);
    if (!engine) {
      continue;
    }
    const card = document.createElement("button");
    card.type = "button";
    card.className = "engine-card";
    card.dataset.engine = engine.id;
    card.setAttribute("role", "radio");
    card.setAttribute("aria-checked", String(engine.id === state.reverseEngine));
    card.classList.toggle("is-selected", engine.id === state.reverseEngine);

    const nameRow = document.createElement("span");
    nameRow.className = "engine-name";
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.textContent = engine.name;
    nameRow.append(dot, name);

    const capability = document.createElement("span");
    capability.className = "capability";
    if (engine.upload) {
      capability.textContent = t("uploadsUpTo", [
        formatNumber(engine.upload.maxBytes / (1024 * 1024), {
          maximumFractionDigits: 0
        })
      ]);
    } else {
      capability.textContent = t("urlOnly");
      capability.classList.add("is-warning");
    }

    card.append(nameRow, capability);
    card.addEventListener("click", () => {
      state.reverseEngine = engine.id;
      renderReverseEngines();
      updateReverseState();
    });
    reverseEnginesContainer.append(card);
  }
  updateReverseState();
}

function renderRecent(): void {
  recentList.replaceChildren();
  clearRecentButton.classList.toggle("hidden", state.recent.length === 0);

  if (state.recent.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-recent";
    empty.textContent = t("noRecent");
    recentList.append(empty);
    return;
  }

  for (const search of state.recent) {
    const item = document.createElement("li");
    item.className = "recent-item";

    const searchButton = document.createElement("button");
    searchButton.type = "button";
    searchButton.className = "recent-search";
    searchButton.textContent = search;
    searchButton.title = search;
    searchButton.addEventListener("click", () => {
      findInput.value = search;
      void runKeywordSearch();
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "recent-remove";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", t("removeRecent"));
    removeButton.addEventListener("click", async () => {
      try {
        state.recent = await removeRecentSearch(search);
        renderRecent();
      } catch (error) {
        console.error("ReverseIMG: recent removal failed", error);
        setStatus(t("searchFailed"), "error");
      }
    });

    item.append(searchButton, removeButton);
    recentList.append(item);
  }
}

function updateReverseState(): void {
  const engine = getReverseEngine(state.reverseEngine);
  const hasFile = Boolean(state.file);
  const tooLarge = Boolean(
    state.file && engine?.upload && state.file.size > engine.upload.maxBytes
  );
  const uploadUnavailable = state.mode === "upload" && Boolean(engine && !engine.upload);

  if (uploadUnavailable && engine) {
    reverseNote.textContent = t("uploadNotSupported", engine.name);
    reverseNote.classList.remove("hidden");
  } else if (tooLarge && engine?.upload) {
    reverseNote.textContent = t("fileTooLarge", [
      formatNumber(engine.upload.maxBytes / (1024 * 1024), {
        maximumFractionDigits: 0
      })
    ]);
    reverseNote.classList.remove("hidden");
  } else {
    reverseNote.textContent = "";
    reverseNote.classList.add("hidden");
  }

  let disabled = !engine;
  if (engine && state.mode === "upload") {
    disabled = !hasFile || !engine.upload || tooLarge;
  } else if (engine) {
    disabled = !isValidImageUrl(imageUrlInput.value.trim());
  }
  reverseSearchButton.disabled = disabled;
  reverseSearchButton.textContent = engine
    ? t("searchWith", engine.name)
    : t("searchButton");
}

function revokePreview(): void {
  if (state.previewUrl) {
    URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = null;
  }
}

function clearFile(): void {
  state.file = null;
  revokePreview();
  previewImage.removeAttribute("src");
  previewCard.classList.add("hidden");
  dropZone.classList.remove("hidden");
  fileInput.value = "";
  updateReverseState();
}

async function setFile(file: File): Promise<void> {
  clearStatus();
  if (!isSupportedImageFile(file)) {
    setStatus(t("unsupportedFile"), "error");
    return;
  }
  if (file.size > GLOBAL_MAX_BYTES) {
    setStatus(
      t("fileTooLarge", [
        formatNumber(GLOBAL_MAX_BYTES / (1024 * 1024), {
          maximumFractionDigits: 0
        })
      ]),
      "error"
    );
    return;
  }

  state.file = file;
  revokePreview();
  state.previewUrl = URL.createObjectURL(file);
  previewImage.src = state.previewUrl;
  previewName.textContent = file.name || "image";
  previewSize.textContent = formatFileSize(file.size);
  previewCard.classList.remove("hidden");
  dropZone.classList.add("hidden");
  updateReverseState();
}

async function rememberLast(kind: "keyword" | "reverse"): Promise<void> {
  if (!state.settings.behavior.rememberLastEngine) {
    return;
  }
  state.settings = await updateSettings((current) => ({
    ...current,
    last: {
      ...current.last,
      [kind]: kind === "keyword" ? state.keywordEngine : state.reverseEngine
    }
  }));
}

async function closeAfterSearch(): Promise<void> {
  window.setTimeout(() => window.close(), 60);
}

async function runKeywordSearch(): Promise<void> {
  clearStatus();
  const text = findInput.value.trim();
  if (!text) {
    setStatus(t("enterQuery"), "error");
    findInput.focus();
    return;
  }
  const engine = getKeywordEngine(state.keywordEngine);
  if (!engine) {
    setStatus(t("searchFailed"), "error");
    return;
  }
  try {
    state.recent = await addRecentSearch(text);
    renderRecent();
    await rememberLast("keyword");
    await openUrl(engine.searchUrl(text), state.settings.behavior.openInNewTab);
    await closeAfterSearch();
  } catch (error) {
    console.error("ReverseIMG: keyword search failed", error);
    setStatus(t("searchFailed"), "error");
  }
}

async function runReverseSearch(): Promise<void> {
  clearStatus();
  const engine = getReverseEngine(state.reverseEngine);
  if (!engine) {
    setStatus(t("searchFailed"), "error");
    return;
  }

  if (state.mode === "url") {
    const imageUrl = imageUrlInput.value.trim();
    if (!isValidImageUrl(imageUrl)) {
      setStatus(t("invalidUrl"), "error");
      imageUrlInput.focus();
      return;
    }
    try {
      await rememberLast("reverse");
      await openUrl(
        engine.urlSearch(imageUrl),
        state.settings.behavior.openInNewTab
      );
      await closeAfterSearch();
    } catch (error) {
      console.error("ReverseIMG: URL search failed", error);
      setStatus(t("searchFailed"), "error");
    }
    return;
  }

  const file = state.file;
  if (!file) {
    setStatus(t("selectImageFirst"), "error");
    return;
  }
  if (!engine.upload) {
    setStatus(t("uploadNotSupported", engine.name), "error");
    return;
  }
  if (file.size > engine.upload.maxBytes) {
    setStatus(
      t("fileTooLarge", [
        formatNumber(engine.upload.maxBytes / (1024 * 1024), {
          maximumFractionDigits: 0
        })
      ]),
      "error"
    );
    return;
  }

  try {
    const pendingId = await putPending(file, file.name, file.type);
    await rememberLast("reverse");
    await openUrl(
      uploadPageUrl(engine.id, pendingId),
      state.settings.behavior.openInNewTab
    );
    await closeAfterSearch();
  } catch (error) {
    console.error("ReverseIMG: upload setup failed", error);
    setStatus(t("searchFailed"), "error");
  }
}

function bindStaticEvents(): void {
  findForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void runKeywordSearch();
  });

  tabFindButton.addEventListener("click", () => setTab("find"));
  tabReverseButton.addEventListener("click", () => setTab("reverse"));

  modeUploadButton.addEventListener("click", () => setMode("upload"));
  modeUrlButton.addEventListener("click", () => setMode("url"));

  clearRecentButton.addEventListener("click", async () => {
    try {
      await clearRecentSearches();
      state.recent = [];
      renderRecent();
    } catch (error) {
      console.error("ReverseIMG: clearing recent searches failed", error);
      setStatus(t("searchFailed"), "error");
    }
  });

  openOptionsButton.addEventListener("click", async () => {
    await browser.runtime.openOptionsPage();
    window.close();
  });

  reverseSearchButton.addEventListener("click", () => {
    void runReverseSearch();
  });

  imageUrlInput.addEventListener("input", updateReverseState);
  imageUrlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void runReverseSearch();
    }
  });

  dropZone.addEventListener("click", () => fileInput.click());
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (file) {
      void setFile(file);
    }
  });
  removeImageButton.addEventListener("click", clearFile);

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("is-dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("is-dragging");
    });
  });
  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void setFile(file);
    }
  });

  document.addEventListener("paste", (event) => {
    const items = event.clipboardData?.items;
    if (items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            setTab("reverse");
            setMode("upload");
            void setFile(file);
            return;
          }
        }
      }
    }
    const text = event.clipboardData?.getData("text/plain").trim();
    if (
      text &&
      isValidImageUrl(text) &&
      document.activeElement !== imageUrlInput &&
      document.activeElement !== findInput
    ) {
      event.preventDefault();
      setTab("reverse");
      setMode("url");
      imageUrlInput.value = text;
      updateReverseState();
    }
  });
}

async function init(): Promise<void> {
  initPage("popupTitle");
  bindStaticEvents();

  try {
    const [settings, recent] = await Promise.all([
      getSettings(),
      getRecentSearches()
    ]);
    state.settings = settings;
    state.recent = recent;
    state.keywordEngine = chooseKeywordEngine();
    state.reverseEngine = chooseReverseEngine();
    applyTheme(settings.behavior.theme);
    renderKeywordEngines();
    renderReverseEngines();
    renderRecent();
    setMode("upload");
    setTab("find");
    if (selectedKeywordEngineIds(settings).length === 0) {
      setStatus(t("atLeastOneEngine"), "error");
    }
    void cleanupPending().catch((error) => {
      console.warn("ReverseIMG: pending cleanup failed", error);
    });
  } catch (error) {
    console.error("ReverseIMG: popup failed", error);
    setStatus(t("searchFailed"), "error");
  }
}

window.addEventListener("beforeunload", revokePreview);
void init();
