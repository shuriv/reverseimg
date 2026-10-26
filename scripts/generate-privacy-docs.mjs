import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { localeOrder, localeSources } from "./generate-locales.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outputDir = path.join(root, "docs", "privacy");
fs.mkdirSync(outputDir, { recursive: true });

const nativeNames = {
  en: "English",
  ru: "Русский",
  fr: "Français",
  es: "Español",
  zh_CN: "简体中文",
  de: "Deutsch",
  pt_BR: "Português (Brasil)",
  hi: "हिन्दी"
};

for (const locale of localeOrder) {
  const messages = localeSources[locale];
  const content = `# ${messages.privacyTitle}

${messages.privacyIntro}

## ${messages.privacyDataTitle}

${messages.privacyDataBody}

## ${messages.privacyLocalTitle}

${messages.privacyLocalBody}

## ${messages.privacyThirdPartyTitle}

${messages.privacyThirdPartyBody}

## ${messages.privacyNoTrackingTitle}

${messages.privacyNoTrackingBody}

## ${messages.privacyPermissionsTitle}

${messages.privacyPermissionsBody}

## ${messages.privacyDeclarationTitle}

${messages.privacyDeclarationBody}

## ${messages.privacyRetentionTitle}

${messages.privacyRetentionBody}

## ${messages.privacyChildrenTitle}

${messages.privacyChildrenBody}

## ${messages.privacyChangesTitle}

${messages.privacyChangesBody}

## ${messages.privacyContactTitle}

${messages.privacyContactBody}

## ${messages.privacyScopeTitle}

${messages.privacyScopeBody}

---

${messages.privacyEnglishNote}

[${messages.privacyPolicy} (English)](../../PRIVACY.md)
`;
  fs.writeFileSync(path.join(outputDir, `${locale}.md`), content, "utf8");
  console.log(`Wrote docs/privacy/${locale}.md`);
}

const readme = `# ReverseIMG privacy policy translations

The canonical policy is [PRIVACY.md](../../PRIVACY.md) in English. These pages are localized translations generated from the extension's own translations. If there is a conflict, the English version governs.

${localeOrder
  .map(
    (locale) =>
      `- [${nativeNames[locale]} (${locale})](./${locale}.md)`
  )
  .join("\n")}

## AMO privacy policy link

Use the public GitHub link to the canonical policy, for example:

\`\`\`text
https://github.com/shuriv/reverseimg/blob/main/PRIVACY.md
\`\`\`

If you publish the localized pages too, link them from the repository README.
`;
fs.writeFileSync(path.join(outputDir, "README.md"), readme, "utf8");
console.log("Wrote docs/privacy/README.md");
