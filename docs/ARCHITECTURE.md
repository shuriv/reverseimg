# Architecture

ReverseIMG is a Firefox MV3 extension built with TypeScript and Vite. It has no backend and no host permissions.

## High-level flow

```text
Right-click image
  └─ background menu handler
       ├─ http(s) image → open engine URL search
       ├─ data: image   → decode → IndexedDB → upload.html → HTML form POST
       ├─ blob: image   → scripting.executeScript → base64 → IndexedDB → upload.html
       └─ other/no src  → error.html

Popup
  ├─ keyword text → open keyword image search URL
  ├─ reverse URL  → open reverse URL search
  └─ file/drag/paste → validate → IndexedDB → upload.html → HTML form POST
```

## Modules

| Path | Responsibility |
| --- | --- |
| `src/shared/types.ts` | Engine, settings, pending upload, and form types. |
| `src/shared/engines.ts` | Reverse/keyword engine registry, URL builders, upload form specs, base64 helper. |
| `src/shared/settings.ts` | Defaults, normalization, storage, recent searches, import/export. |
| `src/shared/i18n.ts` | `browser.i18n` helpers, document localization, theme application, number formatting. |
| `src/shared/pending.ts` | IndexedDB store for short-lived image uploads and 15-minute cleanup. |
| `src/shared/image.ts` | MIME/extension validation, data-URL/base64 conversion, URL validation, filename cleanup. |
| `src/shared/open.ts` | Tab/upload-page/error-page navigation. |
| `src/background/index.ts` | Menus, reverse routing, blob/data extraction, pending upload creation. |
| `src/popup/main.ts` | Popup state, keyword search, reverse modes, validation, recent searches. |
| `src/options/main.ts` | Engine settings, behavior, themes, backup/restore, reset. |
| `src/upload/main.ts` | Loads pending image, builds a hidden HTML form, submits it to the selected engine. |
| `src/error/main.ts` | Maps error codes to localized messages/actions. |
| `src/privacy/main.ts` | Localizes the privacy policy page. |

## Storage

- `browser.storage.local` — one `Settings` object under `reverseimg.settings.v1`, plus recent keyword searches. Settings are normalized on read so older or corrupted values cannot break the UI.
- `IndexedDB` — database `reverseimg`, object store `pending`. Each entry contains a Blob, name, type, size, and creation time. `getPending` deletes stale entries older than 15 minutes; successful upload handoff also cleans up on the next write.
- `sessionStorage` — only a per-upload “sent” marker, used to avoid resubmitting when the user navigates back to the upload page.

## Permission model

- `menus` — menu entries.
- `storage` — settings/search history.
- `activeTab` — explicit user action on the current tab.
- `scripting` — blob extraction for a right-clicked image.

No host permissions are requested. Search URLs and form actions are the only way data leaves the browser.

## Upload security

The upload page is an extension page. It builds an HTML form whose `action` is one of the allow-listed engine origins in the manifest's `form-action` CSP. A file `input` is populated with the pending Blob via `DataTransfer`. Hidden fields are created with DOM APIs, not `innerHTML`.

The form is placed in an offscreen host (`position: fixed; left: -10000px`) so it can submit without displaying a second form. The page submits the form on the next animation frame. A 10-second fallback shows a localized error if navigation does not occur.

## URL and input validation

- Image URLs must parse as `http:` or `https:`.
- MIME types are restricted to JPEG, PNG, WebP, GIF, and AVIF; extensions are used when the OS reports an empty MIME type.
- Upload length is checked against the engine limit before the upload page is opened.
- Keyword queries are always encoded with `encodeURIComponent`/`URLSearchParams`.
- No user input is inserted with `innerHTML`.

## Localization

- Firefox `_locales` system, `default_locale: "en"`.
- Eight locales: `en`, `ru`, `fr`, `es`, `zh_CN`, `de`, `pt_BR`, `hi`.
- `scripts/locales/*.mjs` is the source of truth; `scripts/generate-locales.mjs` writes `public/_locales/*/messages.json`.
- `scripts/check-i18n.mjs` and `tests/i18n.test.ts` enforce key and placeholder parity.
- UI follows the Firefox language; there is no in-app picker in 0.1.0.

## Build

- Vite multi-page build: popup, options, upload, error, privacy.
- `background/index.ts` is a separate Rollup input and emits `dist/background.js`.
- `public/` is copied to `dist/` (manifest, icons, locale files).
- `AMO=1` disables source maps/minification for the release build.
- `scripts/sync-version.mjs` copies `package.json` version into the manifest before every build.

## Trade-offs

- No host permissions means no generic in-page overlay or automatic image scraping. The right-click menu gives the user explicit control.
- Using form POSTs avoids a developer server but is inherently tied to third-party form changes. URL search modes are provided for every engine.
- Yandex local upload is intentionally omitted because its upload endpoint was not stable enough to ship without real-browser verification.
- The extension is desktop-first. The minimum is Firefox 142 so the AMO `data_collection_permissions` declaration is supported and enforced consistently.
