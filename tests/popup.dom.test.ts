// @vitest-environment jsdom

import { beforeAll, describe, expect, it, vi } from "vitest";

import { installBrowserMock, loadPageBody } from "./helpers/page";

vi.mock("../src/shared/pending", () => ({
  cleanupPending: vi.fn(async () => undefined),
  putPending: vi.fn(async () => "pending-id")
}));

let mock: ReturnType<typeof installBrowserMock>;

beforeAll(async () => {
  loadPageBody("popup.html");
  mock = installBrowserMock();
  await import("../src/popup/main");
  await vi.waitFor(() => {
    expect(document.querySelectorAll("#keyword-engines .engine-chip")).toHaveLength(5);
  });
});

describe("popup DOM smoke test", () => {
  it("renders all five keyword and reverse engines", () => {
    expect(document.querySelectorAll("#keyword-engines .engine-chip")).toHaveLength(5);
    expect(document.querySelectorAll("#reverse-engines .engine-card")).toHaveLength(5);
    expect(document.querySelector("#recent-list .empty-recent")).not.toBeNull();
  });

  it("switches tabs and enables URL mode for a valid URL", () => {
    const reverseTab = document.querySelector<HTMLButtonElement>("#tab-reverse");
    const reversePanel = document.querySelector<HTMLElement>("#panel-reverse");
    expect(reverseTab).not.toBeNull();
    expect(reversePanel).not.toBeNull();
    reverseTab?.click();
    expect(reversePanel?.classList.contains("hidden")).toBe(false);

    document.querySelector<HTMLButtonElement>("#mode-url")?.click();
    const urlInput = document.querySelector<HTMLInputElement>("#image-url");
    const searchButton = document.querySelector<HTMLButtonElement>("#reverse-search");
    expect(urlInput).not.toBeNull();
    expect(searchButton?.disabled).toBe(true);

    if (urlInput) {
      urlInput.value = "https://example.com/photo.jpg";
      urlInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    expect(searchButton?.disabled).toBe(false);
  });

  it("rejects an empty keyword query before opening a tab", () => {
    const findInput = document.querySelector<HTMLInputElement>("#find-input");
    const form = document.querySelector<HTMLFormElement>("#find-form");
    const status = document.querySelector<HTMLElement>("#status");
    if (findInput) {
      findInput.value = "   ";
    }
    form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    expect(status?.textContent).toBe("enterQuery");
    expect(mock.browserMock.tabs.create).not.toHaveBeenCalled();
  });
});
