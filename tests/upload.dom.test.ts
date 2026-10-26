// @vitest-environment jsdom

import { beforeAll, describe, expect, it, vi } from "vitest";

import { installBrowserMock, loadPageBody } from "./helpers/page";

vi.mock("../src/shared/pending", () => ({
  getPending: vi.fn(async () => undefined)
}));

beforeAll(async () => {
  loadPageBody("upload.html");
  window.history.replaceState(
    {},
    "",
    "/upload.html?engine=googleLens&id=expired-id"
  );
  installBrowserMock();
  await import("../src/upload/main");
  await vi.waitFor(() => {
    expect(document.querySelector("#status-title")?.textContent).toBe(
      "uploadExpiredTitle"
    );
  });
});

describe("upload page DOM smoke test", () => {
  it("renders an expired handoff without inventing image data", () => {
    expect(document.querySelector("#status-title")?.textContent).toBe(
      "uploadExpiredTitle"
    );
    expect(document.querySelector("#status-body")?.textContent).toBe(
      "uploadExpiredBody"
    );
    expect(document.querySelector<HTMLElement>("#page-subtitle")?.hidden).toBe(
      true
    );
    expect(document.querySelectorAll("#actions button")).toHaveLength(1);
  });
});
