import "./error.css";

import { getReverseEngine } from "../shared/engines";
import { initPage, t } from "../shared/i18n";

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

const titleElement = getElement<HTMLElement>("error-title");
const bodyElement = getElement<HTMLParagraphElement>("error-body");
const actionsElement = getElement<HTMLDivElement>("actions");

interface Action {
  label: string;
  primary?: boolean;
  onClick: () => void;
}

function renderActions(items: Action[]): void {
  actionsElement.replaceChildren();
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = item.primary ? "primary" : "secondary";
    button.textContent = item.label;
    button.addEventListener("click", item.onClick);
    actionsElement.append(button);
  }
}

async function closeTab(): Promise<void> {
  try {
    const current = await browser.tabs.getCurrent();
    if (current?.id !== undefined) {
      await browser.tabs.remove(current.id);
      return;
    }
  } catch {
    // Fall back to window.close below.
  }
  window.close();
}

function openSettings(): void {
  void browser.runtime.openOptionsPage();
}

initPage("errorTitle");

const params = new URLSearchParams(window.location.search);
const code = params.get("code") ?? "unknown";
const engine = getReverseEngine(params.get("engine") ?? "");

let title = t("errorTitle");
let body = t("errorUnknown");
const actions: Action[] = [];

switch (code) {
  case "no-image":
    title = t("errorNoImageTitle");
    body = t("errorNoImageBody");
    break;
  case "blob":
    title = t("errorBlobTitle");
    body = t("errorBlobBody");
    break;
  case "unsupported":
    title = t("errorUnsupportedTitle");
    body = t("errorUnsupportedBody");
    if (engine) {
      actions.push({
        label: t("errorOpenEngine", engine.name),
        onClick: () => void browser.tabs.create({ url: engine.homepage })
      });
    }
    break;
  case "no-engine":
    title = t("errorNoEngineTitle");
    body = t("errorNoEngineBody");
    actions.push({ label: t("errorOpenSettings"), primary: true, onClick: openSettings });
    break;
  case "no-upload":
    title = t("errorNoUploadTitle");
    body = engine
      ? t("errorNoUploadBody", engine.name)
      : t("errorNoEngineBody");
    if (engine) {
      actions.push({
        label: t("errorOpenEngine", engine.name),
        onClick: () => void browser.tabs.create({ url: engine.homepage })
      });
    }
    actions.push({ label: t("errorOpenSettings"), onClick: openSettings });
    break;
  default:
    title = t("errorTitle");
    body = t("errorUnknown");
    break;
}

titleElement.textContent = title;
bodyElement.textContent = body;
document.title = `${title} — ReverseIMG`;
actions.push({ label: t("errorCloseTab"), primary: true, onClick: () => void closeTab() });
renderActions(actions);
