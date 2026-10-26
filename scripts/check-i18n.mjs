import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { localeOrder, localeSources, validateLocales } from "./generate-locales.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const localesRoot = path.join(root, "public", "_locales");
const errors = [...validateLocales().errors];
const englishKeys = Object.keys(localeSources.en);

for (const locale of localeOrder) {
  const file = path.join(localesRoot, locale, "messages.json");
  if (!fs.existsSync(file)) {
    errors.push(`${locale}: generated messages.json is missing`);
    continue;
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${locale}: messages.json is not valid JSON (${error.message})`);
    continue;
  }
  const keys = Object.keys(parsed);
  for (const key of englishKeys) {
    if (!parsed[key]?.message) {
      errors.push(`${locale}: generated file is missing "${key}"`);
    }
  }
  for (const key of keys) {
    if (!englishKeys.includes(key)) {
      errors.push(`${locale}: generated file has extra key "${key}"`);
    }
  }
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "public", "manifest.json"), "utf8")
);
if (manifest.description !== "__MSG_extensionDescription__") {
  errors.push("manifest.json description must use __MSG_extensionDescription__");
}
if (!manifest.default_locale) {
  errors.push("manifest.json is missing default_locale");
}

console.log(
  `Checked ${localeOrder.length} locales: ${localeOrder.join(", ")} (${englishKeys.length} keys each)`
);

if (errors.length > 0) {
  console.error(errors.map((error) => `  - ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("i18n check passed.");
}
