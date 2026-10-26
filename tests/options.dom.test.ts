// @vitest-environment jsdom

import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  defaultSettings,
  installBrowserMock,
  loadPageBody
} from "./helpers/page";
import type { Settings } from "../src/shared/types";

let mock: ReturnType<typeof installBrowserMock>;

beforeAll(async () => {
  loadPageBody("options.html");
  mock = installBrowserMock({ settings: defaultSettings() });
  await import("../src/options/main");
  await vi.waitFor(() => {
    expect(document.querySelectorAll("#reverse-engines .engine-row")).toHaveLength(5);
  });
});

describe("options DOM smoke test", () => {
  it("renders engine rows, controls, and version", () => {
    expect(document.querySelectorAll("#reverse-engines .engine-row")).toHaveLength(5);
    expect(document.querySelectorAll("#keyword-engines .engine-row")).toHaveLength(5);
    expect(document.querySelector<HTMLSelectElement>("#theme")?.value).toBe("system");
    expect(document.querySelector("#about-version")?.textContent).toBe("0.1.0");
    expect(document.querySelector<HTMLAnchorElement>("#privacy-link")?.href).toContain(
      "privacy.html"
    );
  });

  it("disables an engine and persists the change", async () => {
    const checkbox = document.querySelector<HTMLInputElement>(
      '[data-engine="yandex"] input[type="checkbox"]'
    );
    expect(checkbox?.checked).toBe(true);
    checkbox?.click();
    await vi.waitFor(() => {
      const saved = mock.storage.settings as Settings;
      expect(saved.reverse.enabled).not.toContain("yandex");
    });
  });

  it("changes the theme immediately", async () => {
    const theme = document.querySelector<HTMLSelectElement>("#theme");
    if (theme) {
      theme.value = "dark";
      theme.dispatchEvent(new Event("change", { bubbles: true }));
    }
    await vi.waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe("dark");
    });
  });
});
