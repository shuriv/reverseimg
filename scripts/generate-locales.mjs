import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import en from "./locales/en.mjs";
import ru from "./locales/ru.mjs";
import fr from "./locales/fr.mjs";
import es from "./locales/es.mjs";
import zhCN from "./locales/zh_CN.mjs";
import de from "./locales/de.mjs";
import ptBR from "./locales/pt_BR.mjs";
import hi from "./locales/hi.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

export const localeSources = {
  en,
  ru,
  fr,
  es,
  zh_CN: zhCN,
  de,
  pt_BR: ptBR,
  hi
};

export const localeOrder = ["en", "ru", "fr", "es", "zh_CN", "de", "pt_BR", "hi"];

function placeholders(value) {
  return [...value.matchAll(/\$(\d+)/g)]
    .map((match) => match[1])
    .sort((a, b) => Number(a) - Number(b));
}

export function validateLocales() {
  const errors = [];
  const englishKeys = Object.keys(en);
  const englishSet = new Set(englishKeys);

  for (const locale of localeOrder) {
    const messages = localeSources[locale];
    if (!messages) {
      errors.push(`Missing locale source: ${locale}`);
      continue;
    }
    const keys = Object.keys(messages);
    for (const key of englishKeys) {
      if (!(key in messages)) {
        errors.push(`${locale}: missing key "${key}"`);
      }
    }
    for (const key of keys) {
      if (!englishSet.has(key)) {
        errors.push(`${locale}: extra key "${key}"`);
      }
    }
    for (const key of englishKeys) {
      const translation = messages[key];
      if (typeof translation !== "string" || !translation.trim()) {
        errors.push(`${locale}: empty value for "${key}"`);
        continue;
      }
      if (locale !== "en") {
        const expected = placeholders(en[key]);
        const actual = placeholders(translation);
        if (expected.join(",") !== actual.join(",")) {
          errors.push(
            `${locale}: placeholder mismatch for "${key}" (expected ${expected.join(",") || "none"}, got ${actual.join(",") || "none"})`
          );
        }
      }
    }
  }

  const description = en.extensionDescription;
  if (description.length > 132) {
    errors.push(
      `English extension description is ${description.length} characters (limit is 132)`
    );
  }

  return { errors, englishKeys };
}

export function writeLocales() {
  const outputRoot = path.join(root, "public", "_locales");
  for (const locale of localeOrder) {
    const messages = localeSources[locale];
    const output = {};
    for (const key of Object.keys(en)) {
      output[key] = { message: messages[key] };
    }
    const directory = path.join(outputRoot, locale);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, "messages.json"),
      `${JSON.stringify(output, null, 2)}\n`,
      "utf8"
    );
    console.log(`Wrote ${locale}/messages.json (${Object.keys(output).length} keys)`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { errors } = validateLocales();
  if (errors.length > 0) {
    console.error("Locale validation failed:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
  } else {
    writeLocales();
  }
}
