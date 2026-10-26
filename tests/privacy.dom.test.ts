// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vitest";

import { installBrowserMock, loadPageBody } from "./helpers/page";

beforeAll(async () => {
  loadPageBody("privacy.html");
  installBrowserMock();
  await import("../src/privacy/main");
});

describe("privacy page DOM smoke test", () => {
  it("localizes the static policy sections and document title", () => {
    expect(document.title).toBe("privacyTitle");
    expect(document.documentElement.lang).toBe("en");
    expect(document.querySelector("h1")?.textContent).toBe("privacyTitle");
    expect(document.querySelectorAll("article section")).toHaveLength(11);
  });
});
