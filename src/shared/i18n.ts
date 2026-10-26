import type { Theme } from "./types";

export const SUPPORTED_LOCALES = [
  "en",
  "ru",
  "fr",
  "es",
  "zh_CN",
  "de",
  "pt_BR",
  "hi"
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function resolveLocale(): SupportedLocale {
  const uiLocale = browser.i18n.getUILanguage().replace(/-/g, "_");
  if ((SUPPORTED_LOCALES as readonly string[]).includes(uiLocale)) {
    return uiLocale as SupportedLocale;
  }
  const primary = uiLocale.split("_")[0];
  if (primary === "zh") {
    return "zh_CN";
  }
  if (primary === "pt") {
    return "pt_BR";
  }
  if ((SUPPORTED_LOCALES as readonly string[]).includes(primary)) {
    return primary as SupportedLocale;
  }
  return "en";
}

export function toBcp47(locale: string): string {
  return locale.replace(/_/g, "-");
}

export function t(
  key: string,
  substitutions?: string | string[]
): string {
  const message = browser.i18n.getMessage(key, substitutions);
  return message || key;
}

export function applyTheme(theme: Theme): void {
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
}

export function localizeDocument(root: ParentNode = document): void {
  const locale = resolveLocale();
  document.documentElement.lang = toBcp47(locale);
  document.documentElement.dir = "ltr";

  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (key) {
      element.textContent = t(key);
    }
  });

  root.querySelectorAll<HTMLInputElement>("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (key) {
      element.placeholder = t(key);
    }
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((element) => {
    const key = element.dataset.i18nTitle;
    if (key) {
      element.title = t(key);
    }
  });

  root.querySelectorAll<HTMLElement>("[data-i18n-aria-label]").forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (key) {
      element.setAttribute("aria-label", t(key));
    }
  });

  root.querySelectorAll<HTMLImageElement>("[data-i18n-alt]").forEach((element) => {
    const key = element.dataset.i18nAlt;
    if (key) {
      element.alt = t(key);
    }
  });
}

export function initPage(titleKey: string): void {
  localizeDocument();
  document.title = t(titleKey);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(toBcp47(resolveLocale()), options).format(value);
}

export function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${formatNumber(megabytes, { maximumFractionDigits: 1 })} MB`;
}
