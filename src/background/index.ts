import { getReverseEngine, getKeywordEngine } from "../shared/engines";
import { openErrorPage, openUploadPage, openUrl } from "../shared/open";
import {
  base64ToBlob,
  dataUrlToBlob,
  isSupportedImageType,
  isValidImageUrl,
  sniffBlobMime
} from "../shared/image";
import { t } from "../shared/i18n";
import { putPending } from "../shared/pending";
import {
  createDefaultSettings,
  getSettings,
  saveSettings,
  SETTINGS_KEY
} from "../shared/settings";
import type { Settings } from "../shared/types";

const REVERSE_DEFAULT_MENU = "reverse-default";
const REVERSE_SUBMENU = "reverse-submenu";
const REVERSE_PREFIX = "reverse:";
const KEYWORD_SELECTION_MENU = "keyword-selection";

async function blobToBase64InPage(url: string): Promise<{
  data: string;
  type: string;
}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image fetch failed: ${response.status}`);
  }
  const blob = await response.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return { data: btoa(binary), type: blob.type };
}

let menuRebuildQueue: Promise<void> = Promise.resolve();

async function rebuildMenus(): Promise<void> {
  await browser.menus.removeAll();
  const settings = await getSettings();
  const reverseIds = settings.reverse.order.filter((id) =>
    settings.reverse.enabled.includes(id)
  );
  const keywordIds = settings.keyword.order.filter((id) =>
    settings.keyword.enabled.includes(id)
  );

  if (reverseIds.length > 0) {
    const defaultEngine =
      getReverseEngine(settings.reverse.default) ?? getReverseEngine(reverseIds[0]);
    if (defaultEngine) {
      browser.menus.create({
        id: REVERSE_DEFAULT_MENU,
        title: t("menuSearchImage", defaultEngine.name),
        contexts: ["image"]
      });
    }

    if (settings.behavior.showContextSubmenu && reverseIds.length > 1) {
      browser.menus.create({
        id: REVERSE_SUBMENU,
        title: t("menuSearchImageWith"),
        contexts: ["image"]
      });
      for (const id of reverseIds) {
        const engine = getReverseEngine(id);
        if (!engine) {
          continue;
        }
        browser.menus.create({
          id: `${REVERSE_PREFIX}${engine.id}`,
          parentId: REVERSE_SUBMENU,
          title: engine.name,
          contexts: ["image"]
        });
      }
    }
  }

  if (keywordIds.length > 0) {
    browser.menus.create({
      id: KEYWORD_SELECTION_MENU,
      title: t("menuSearchSelection"),
      contexts: ["selection"]
    });
  }
}

function requestMenuRebuild(): Promise<void> {
  const run = () =>
    rebuildMenus().catch((error) => {
      console.error("ReverseIMG: menu rebuild failed", error);
    });
  menuRebuildQueue = menuRebuildQueue.then(run, run);
  return menuRebuildQueue;
}

async function normalizeImageBlob(blob: Blob): Promise<Blob> {
  if (isSupportedImageType(blob.type)) {
    return blob;
  }
  const detected = await sniffBlobMime(blob);
  return detected ? blob.slice(0, blob.size, detected) : blob;
}

async function readBlobFromTab(
  tabId: number,
  frameId: number | undefined,
  srcUrl: string
): Promise<{ blob: Blob; name: string }> {
  const target: browser.scripting.InjectionTarget = { tabId };
  if (typeof frameId === "number") {
    target.frameIds = [frameId];
  }
  const results = await browser.scripting.executeScript({
    target,
    func: blobToBase64InPage,
    args: [srcUrl]
  });
  const result = results[0]?.result as { data: string; type: string } | undefined;
  if (!result?.data) {
    throw new Error("Could not read the image from the page");
  }
  const name = srcUrl.split("/").pop()?.split("?")[0] || "image";
  return {
    blob: base64ToBlob(result.data, result.type || "application/octet-stream"),
    name
  };
}

async function reverseSearch(
  engineId: string,
  srcUrl: string | undefined,
  tabId: number | undefined,
  frameId: number | undefined,
  settings: Settings
): Promise<void> {
  const engine = getReverseEngine(engineId);
  if (!engine) {
    await openErrorPage("no-engine", engineId);
    return;
  }
  if (!srcUrl) {
    await openErrorPage("no-image", engineId);
    return;
  }

  if (isValidImageUrl(srcUrl)) {
    await openUrl(engine.urlSearch(srcUrl), settings.behavior.openInNewTab);
    return;
  }

  if (srcUrl.startsWith("data:")) {
    if (!engine.upload) {
      await openErrorPage("no-upload", engineId);
      return;
    }
    try {
      const blob = await normalizeImageBlob(dataUrlToBlob(srcUrl));
      const pendingId = await putPending(blob, "image", blob.type);
      await openUploadPage(engine.id, pendingId, settings.behavior.openInNewTab);
    } catch (error) {
      console.error("ReverseIMG: data image failed", error);
      await openErrorPage("unsupported", engineId);
    }
    return;
  }

  if (srcUrl.startsWith("blob:")) {
    if (!engine.upload) {
      await openErrorPage("no-upload", engineId);
      return;
    }
    if (typeof tabId !== "number" || tabId < 0) {
      await openErrorPage("blob", engineId);
      return;
    }
    try {
      const { blob, name } = await readBlobFromTab(tabId, frameId, srcUrl);
      const normalized = await normalizeImageBlob(blob);
      const pendingId = await putPending(normalized, name, normalized.type);
      await openUploadPage(engine.id, pendingId, settings.behavior.openInNewTab);
    } catch (error) {
      console.error("ReverseIMG: blob image failed", error);
      await openErrorPage("blob", engineId);
    }
    return;
  }

  await openErrorPage("unsupported", engineId);
}

async function handleMenuClick(
  info: browser.menus.OnClickData,
  tab: browser.tabs.Tab | undefined
): Promise<void> {
  const settings = await getSettings();
  const menuId = String(info.menuItemId);

  if (menuId === REVERSE_DEFAULT_MENU || menuId.startsWith(REVERSE_PREFIX)) {
    const engineId =
      menuId === REVERSE_DEFAULT_MENU
        ? settings.reverse.default
        : menuId.slice(REVERSE_PREFIX.length);
    await reverseSearch(
      engineId,
      info.srcUrl,
      tab?.id,
      info.frameId,
      settings
    );
    return;
  }

  if (menuId === KEYWORD_SELECTION_MENU) {
    const text = info.selectionText?.trim();
    if (!text) {
      return;
    }
    const engine = getKeywordEngine(settings.keyword.default);
    if (!engine) {
      await openErrorPage("no-engine");
      return;
    }
    await openUrl(engine.searchUrl(text), settings.behavior.openInNewTab);
  }
}

browser.menus.onClicked.addListener((info, tab) => {
  void handleMenuClick(info, tab).catch(async (error) => {
    console.error("ReverseIMG: menu action failed", error);
    await openErrorPage("unknown");
  });
});

browser.runtime.onInstalled.addListener(() => {
  void (async () => {
    const stored = await browser.storage.local.get(SETTINGS_KEY);
    if (!stored[SETTINGS_KEY]) {
      await saveSettings(createDefaultSettings());
    }
    await requestMenuRebuild();
  })();
});

browser.runtime.onStartup.addListener(() => {
  void requestMenuRebuild();
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[SETTINGS_KEY]) {
    void requestMenuRebuild();
  }
});

browser.runtime.onMessage.addListener((message: unknown) => {
  if (
    message &&
    typeof message === "object" &&
    (message as { type?: string }).type === "refreshMenus"
  ) {
    void requestMenuRebuild();
    return Promise.resolve({ ok: true });
  }
  return undefined;
});

// Build menus when the background page loads. This also covers temporary
// add-on reloads, where onStartup/onInstalled may not fire again.
void requestMenuRebuild();
