// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vitest";

import { installBrowserMock, loadPageBody } from "./helpers/page";

beforeAll(async () => {
  loadPageBody("error.html");
  window.history.replaceState(
    {},
    "",
    "/error.html?code=no-upload&engine=yandex"
  );
  installBrowserMock();
  await import("../src/error/main");
});

describe("error page DOM smoke test", () => {
  it("explains why Yandex upload is unavailable and offers actions", () => {
    expect(document.querySelector("#error-title")?.textContent).toBe(
      "errorNoUploadTitle"
    );
    expect(document.querySelector("#error-body")?.textContent).toBe(
      "errorNoUploadBody"
    );
    expect(document.querySelectorAll("#actions button")).toHaveLength(3);
    expect(document.title).toContain("errorNoUploadTitle");
  });
});
