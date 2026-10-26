# ReverseIMG

ReverseIMG is a Firefox extension for **reverse image search** and **keyword image search**. Right-click an image and send it to Google Lens, Bing, Yandex, TinEye, or SauceNAO. Open the toolbar popup to search Google Images, Bing Images, Yandex Images, DuckDuckGo, or Brave Images.

Created by **matthew** — [github.com/shuriv](https://github.com/shuriv). Source: [github.com/shuriv/reverseimg](https://github.com/shuriv/reverseimg).

> Status: `0.1.0` is ready for AMO submission. The source and privacy policy are public on GitHub; the add-on listing has not been published yet.

## Features

- Right-click any image for a reverse search.
- Optional full submenu with every enabled reverse engine.
- Popup with keyword image search and reverse search.
- Upload a file, drag and drop, paste from the clipboard, or enter an image URL.
- Up to five reverse engines and five keyword engines.
- Choose the default engine, enable/disable engines, and reorder them.
- Light, dark, and system themes.
- Recent keyword searches stored locally.
- Export and import settings.
- Eight fully localized UI languages: English, Russian, French, Spanish, Simplified Chinese, German, Brazilian Portuguese, and Hindi.
- No analytics, accounts, advertising, or developer servers.

## Engines

### Reverse image search

| Engine | URL search | File upload | Upload limit |
| --- | --- | --- | --- |
| Google Lens | Yes | Yes | 20 MB |
| Bing | Yes | Yes | 4 MB |
| Yandex | Yes | No | — |
| TinEye | Yes | Yes | 20 MB |
| SauceNAO | Yes | Yes | 10 MB |

TinEye and SauceNAO may show a Cloudflare check or reject automated form posts. The popup's image-URL mode is the fallback for those engines.

### Keyword image search

- Google Images
- Bing Images
- Yandex Images
- DuckDuckGo
- Brave Images

## Requirements

- Windows, macOS, or Linux
- [Node.js](https://nodejs.org/) 22 or newer
- npm 10 or newer
- Firefox 142 or newer for desktop testing

## Quick start

```powershell
cd C:\WorkSpace\ff_extensions
npm install
npm run build
```

Load the extension temporarily in Firefox:

1. Open Firefox.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…**.
4. Select `C:\WorkSpace\ff_extensions\dist\manifest.json`.
5. Click the ReverseIMG toolbar icon and try a keyword search.
6. Right-click an image and try **Search image with Google Lens**.

A temporary add-on disappears when Firefox closes. That is normal.

To let `web-ext` open Firefox for you:

```powershell
npm run start
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Rebuilds `dist/` when source files change. |
| `npm run start` | Builds, then launches Firefox with `web-ext run`. |
| `npm run build` | Development build with source maps. |
| `npm run build:amo` | Clean AMO build without source maps or minification. |
| `npm test` | Runs the unit and DOM tests. |
| `npm run typecheck` | Type-checks the TypeScript. |
| `npm run lint` | Lints TypeScript and scripts. |
| `npm run i18n:build` | Regenerates `public/_locales/*/messages.json` and localized privacy pages. |
| `npm run i18n:check` | Verifies all eight locales have the same keys and placeholders. |
| `npm run privacy:docs` | Regenerates `docs/privacy/*.md` from the translation source. |
| `npm run package` | Builds the AMO zip at `artifacts/reverseimg-<version>.zip`. |
| `npm run lint:ext` | Runs `web-ext lint` against `dist/`. |
| `npm run test:all` | Runs typecheck, lint, tests, i18n check, AMO build, and `web-ext lint`. |

## Project layout

```text
.
├─ public/
│  ├─ manifest.json          Firefox manifest
│  ├─ icons/                 Generated PNG icons and SVG source
│  └─ _locales/              Generated Firefox locale files
├─ scripts/
│  ├─ locales/               Translation source, one file per language
│  ├─ generate-locales.mjs   Builds _locales from translation source
│  ├─ check-i18n.mjs         Checks locale coverage
│  ├─ generate-icons.mjs     Builds PNG icons with sharp
│  └─ sync-version.mjs       Keeps manifest version in sync with package.json
├─ src/
│  ├─ background/            Context menus and image handoff
│  ├─ popup/                 Toolbar popup
│  ├─ options/               Settings page
│  ├─ upload/                Offscreen form that posts to the selected engine
│  ├─ error/                 User-facing error page
│  ├─ privacy/               Bundled privacy policy page
│  ├─ shared/                Engines, settings, i18n, IndexedDB, URL helpers
│  ├─ styles/                Shared CSS
│  └─ *.html                 Extension pages
├─ tests/                    Vitest tests
├─ dist/                     Build output (generated)
└─ artifacts/                Release zip (generated)
```

## Permissions

ReverseIMG asks for:

- `menus` — add the right-click image menu.
- `storage` — remember settings and recent searches.
- `activeTab` — read the image that was right-clicked when you choose a menu item.
- `scripting` — read `blob:` image data from the page for uploads.

It intentionally does **not** request host permissions. Searches are normal browser navigations and form submissions. There are no background network requests to a ReverseIMG server.

## Privacy

ReverseIMG has no analytics, accounts, advertising, or developer servers. Settings and recent searches stay in the Firefox profile. Temporary image data is stored in IndexedDB for at most 15 minutes and then cleaned up. When you start a search, the image or query goes directly to the engine you chose; that engine's privacy policy applies.

Read [PRIVACY.md](PRIVACY.md) for the canonical policy. The extension also includes a localized privacy policy page. Localized translations are in [docs/privacy/](docs/privacy/README.md); the English text governs.

## Data collection declaration

The AMO manifest declares:

```json
"data_collection_permissions": {
  "required": ["searchTerms", "websiteContent"]
}
```

This is required because the extension sends user-entered search terms to search engines and reads image content from pages the user explicitly acts on. The developer does not receive or store this data.

## Localization

The UI uses Firefox's `_locales` system and follows the Firefox UI language. There is no in-app language picker in `0.1.0`.

Supported locales:

- `en` — English
- `ru` — Russian
- `fr` — French
- `es` — Spanish
- `zh_CN` — Simplified Chinese
- `de` — German
- `pt_BR` — Brazilian Portuguese
- `hi` — Hindi

To edit translations, change the files in `scripts/locales/`, then run:

```powershell
npm run i18n:build
npm run i18n:check
```

## Packaging and AMO

Build the submission zip:

```powershell
npm run package
```

The file is written to `artifacts\reverseimg-0.1.0.zip`. AMO also asks for source code when the submitted package is generated by a build tool. See [GUIDE.md](GUIDE.md) for the full, very explicit publishing walkthrough.

## Testing

See [docs/TESTING.md](docs/TESTING.md) for the manual test checklist and [docs/AMO-LISTING.md](docs/AMO-LISTING.md) for listing copy. Reviewers and maintainers can use [docs/REVIEWER-NOTES.md](docs/REVIEWER-NOTES.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

- [GUIDE.md](GUIDE.md) — beginner build and publishing walkthrough
- [PRIVACY.md](PRIVACY.md) — canonical privacy policy
- [docs/privacy/](docs/privacy/README.md) — localized privacy translations
- [docs/AMO-LISTING.md](docs/AMO-LISTING.md) — localized AMO listing copy
- [docs/TESTING.md](docs/TESTING.md) — manual browser test checklist
- [docs/REVIEWER-NOTES.md](docs/REVIEWER-NOTES.md) — notes for AMO reviewers
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module and data-flow overview
- [CHANGELOG.md](CHANGELOG.md) — release history

## License

MIT. See [LICENSE](LICENSE).

Engine names and trademarks belong to their respective owners. ReverseIMG is not affiliated with Google, Microsoft, Yandex, TinEye, or SauceNAO.
