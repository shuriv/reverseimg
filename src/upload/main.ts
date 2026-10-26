import "./upload.css";

import { getReverseEngine } from "../shared/engines";
import { formatNumber, initPage, t } from "../shared/i18n";
import { isSupportedImageFile } from "../shared/image";
import { getPending } from "../shared/pending";
import type { UploadFormSpec } from "../shared/types";

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element #${id}`);
  }
  return element as T;
}

const pageTitle = getElement<HTMLElement>("page-title");
const pageSubtitle = getElement<HTMLElement>("page-subtitle");
const statusTitle = getElement<HTMLElement>("status-title");
const statusBody = getElement<HTMLParagraphElement>("status-body");
const spinner = getElement<HTMLDivElement>("spinner");
const actions = getElement<HTMLDivElement>("actions");
const formHost = getElement<HTMLDivElement>("form-host");

interface Action {
  label: string;
  primary?: boolean;
  onClick: () => void;
}

function renderActions(items: Action[]): void {
  actions.replaceChildren();
  if (items.length === 0) {
    actions.classList.add("hidden");
    return;
  }
  actions.classList.remove("hidden");
  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = item.primary ? "primary" : "secondary";
    button.textContent = item.label;
    button.addEventListener("click", item.onClick);
    actions.append(button);
  }
}

function showStatus(title: string, body: string, items: Action[] = []): void {
  pageTitle.textContent = title;
  pageSubtitle.hidden = true;
  document.title = `${title} — ReverseIMG`;
  statusTitle.textContent = title;
  statusBody.textContent = body;
  spinner.classList.add("hidden");
  renderActions(items);
}

function showPreparing(engineName: string): void {
  const title = t("uploadTitle", engineName);
  pageTitle.textContent = title;
  pageSubtitle.hidden = false;
  document.title = `${title} — ReverseIMG`;
  statusTitle.textContent = t("uploadSending", engineName);
  statusBody.textContent = t("uploadWait");
  spinner.classList.remove("hidden");
  actions.classList.add("hidden");
  actions.replaceChildren();
}

function backAction(): Action {
  return {
    label: t("uploadBack"),
    onClick: () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.close();
      }
    }
  };
}

function openEngineAction(engineName: string, homepage: string): Action {
  return {
    label: t("uploadOpenEngine", engineName),
    primary: true,
    onClick: () => {
      void browser.tabs.create({ url: homepage });
    }
  };
}

function createForm(spec: UploadFormSpec, pending: {
  blob: Blob;
  name: string;
  type: string;
}): HTMLFormElement {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = spec.action;
  form.enctype = spec.enctype;
  form.acceptCharset = "UTF-8";
  form.target = "_self";

  for (const field of spec.fields) {
    const input = document.createElement("input");
    input.name = field.name;
    if (field.kind === "hidden") {
      input.type = "hidden";
      input.value = field.value;
    } else {
      input.type = "file";
      const transfer = new DataTransfer();
      transfer.items.add(
        new File([pending.blob], pending.name || "image", {
          type: pending.type || pending.blob.type || "application/octet-stream"
        })
      );
      input.files = transfer.files;
    }
    form.append(input);
  }

  formHost.append(form);
  return form;
}

async function run(): Promise<void> {
  initPage("uploadPreparing");
  const params = new URLSearchParams(window.location.search);
  const engineId = params.get("engine") ?? "";
  const pendingId = params.get("id") ?? "";
  const engine = getReverseEngine(engineId);

  if (!engine) {
    showStatus(
      t("uploadMissingTitle"),
      t("uploadMissingBody"),
      [backAction()]
    );
    return;
  }

  if (!pendingId) {
    showStatus(
      t("uploadMissingTitle"),
      t("uploadMissingBody"),
      [backAction()]
    );
    return;
  }

  const sentKey = `reverseimg:upload-sent:${pendingId}`;
  let alreadySent = false;
  try {
    alreadySent = sessionStorage.getItem(sentKey) === "1";
  } catch {
    // Session storage is optional; continue with a fresh submission.
  }
  if (alreadySent) {
    showStatus(
      t("uploadSentTitle"),
      t("uploadSentBody"),
      [openEngineAction(engine.name, engine.homepage), backAction()]
    );
    return;
  }

  if (!engine.upload) {
    showStatus(
      t("uploadUnsupportedTitle"),
      t("uploadUnsupportedBody", engine.name),
      [openEngineAction(engine.name, engine.homepage), backAction()]
    );
    return;
  }

  try {
    const pending = await getPending(pendingId);
    if (!pending) {
      showStatus(
        t("uploadExpiredTitle"),
        t("uploadExpiredBody"),
        [backAction()]
      );
      return;
    }

    if (!isSupportedImageFile({ name: pending.name, type: pending.type })) {
      showStatus(
        t("errorUnsupportedTitle"),
        t("errorUnsupportedBody"),
        [backAction()]
      );
      return;
    }

    if (pending.size > engine.upload.maxBytes) {
      showStatus(
        t("uploadTooLargeTitle"),
        t("uploadTooLargeBody", [
          engine.name,
          formatNumber(engine.upload.maxBytes / (1024 * 1024), {
            maximumFractionDigits: 0
          })
        ]),
        [openEngineAction(engine.name, engine.homepage), backAction()]
      );
      return;
    }

    showPreparing(engine.name);
    const spec = await engine.upload.build({
      blob: pending.blob,
      name: pending.name,
      type: pending.type,
      size: pending.size
    });

    const form = createForm(spec, pending);
    try {
      sessionStorage.setItem(sentKey, "1");
    } catch {
      // Session storage is optional; the form can still be submitted.
    }

    window.setTimeout(() => {
      showStatus(
        t("uploadFailedTitle"),
        t("uploadFailedBody", engine.name),
        [openEngineAction(engine.name, engine.homepage), backAction()]
      );
    }, 10000);

    window.requestAnimationFrame(() => {
      try {
        form.submit();
      } catch (error) {
        console.error("ReverseIMG: form submit failed", error);
        showStatus(
          t("uploadFailedTitle"),
          t("uploadFailedBody", engine.name),
          [openEngineAction(engine.name, engine.homepage), backAction()]
        );
      }
    });
  } catch (error) {
    console.error("ReverseIMG: upload failed", error);
    showStatus(
      t("uploadFailedTitle"),
      t("uploadFailedBody", engine.name),
      [openEngineAction(engine.name, engine.homepage), backAction()]
    );
  }
}

window.addEventListener("pageshow", (event) => {
  if (!event.persisted) {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const engine = getReverseEngine(params.get("engine") ?? "");
  if (engine) {
    showStatus(
      t("uploadSentTitle"),
      t("uploadSentBody"),
      [openEngineAction(engine.name, engine.homepage), backAction()]
    );
  }
});

void run();
