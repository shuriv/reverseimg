# Notes for AMO reviewers

## What this extension does

ReverseIMG is a Firefox MV3 extension for reverse image search and keyword image search. It has no backend. Search requests are normal browser navigations or HTML form submissions directly to the selected third-party engine.

## Build instructions

```text
Node.js 22+
npm 10+

npm ci
npm run build:amo
```

The submitted package is the contents of `dist/`. The build command is also in `README.md` and `GUIDE.md`.

## Source layout

- `src/background/index.ts` — context menus, reverse-search routing, `blob:`/`data:` image handling, temporary upload creation.
- `src/popup/` — toolbar popup: keyword search, reverse upload/URL, recent searches.
- `src/options/` — settings UI.
- `src/upload/` — extension page that builds and submits an HTML form to the chosen reverse-image engine.
- `src/error/` — user-facing error page.
- `src/privacy/` — bundled privacy policy page.
- `src/shared/` — engine registry, settings, i18n, IndexedDB, image/URL helpers.
- `public/manifest.json` — manifest.
- `public/_locales/` — generated Firefox locale files.
- `scripts/locales/` — translation source.

## Permissions

| Permission | Why |
| --- | --- |
| `menus` | Right-click image menu and selected-text menu. |
| `storage` | Settings and recent searches in the Firefox profile. |
| `activeTab` | Read the image the user explicitly right-clicked, only after the menu action. |
| `scripting` | Read `blob:` image data from the active page for uploads. |

There are **no host permissions**. The extension does not inject content scripts at startup and does not read pages in the background.

## Network and remote code

- No remote scripts, no `eval`, no `new Function`, no remote modules.
- `content_security_policy.extension_pages` sets `script-src 'self'`, `style-src 'self'`, and `connect-src 'none'`.
- `form-action` permits only the supported engine origins.
- Searches navigate to normal engine URLs.
- Uploads are submitted as ordinary HTML forms from `upload.html`.
- The `blob:` image path injects a small function with `browser.scripting.executeScript` after the user chooses a context-menu item. The function fetches the already-visible blob, converts it to base64, and returns it. It is not remote code and does not persist.

Supported endpoints:

- `https://lens.google.com/v3/upload`
- `https://www.google.com/search`
- `https://www.bing.com/images/search`
- `https://yandex.com/images/search`
- `https://tineye.com/search`
- `https://saucenao.com/search.php`
- `https://duckduckgo.com/`
- `https://search.brave.com/images`

## Data collection

The manifest declares:

```json
"data_collection_permissions": {
  "required": ["searchTerms", "websiteContent"]
}
```

- `searchTerms` — the keyword text the user submits.
- `websiteContent` — the image the user explicitly selects or right-clicks.

The data is sent directly to the chosen search engine. The developer has no server and does not receive, store, or sell it. Settings, recent searches, and temporary image handoff data stay in the Firefox profile. Temporary image entries are deleted after the upload handoff or after 15 minutes.

## How to test

1. Load `dist/manifest.json` from `about:debugging#/runtime/this-firefox`.
2. Open the popup and search a keyword. Try each keyword engine.
3. Right-click an image on a public page. Try the default item and the submenu.
4. Upload a JPEG/PNG from the popup with Google Lens and Bing.
5. Open the settings page and change theme/engine order.
6. Change the Firefox UI language and reload to check a few locales.
7. Open `privacy.html` and `error.html?code=no-image`.

Note: TinEye and SauceNAO may show Cloudflare challenges. That is a third-party anti-bot behavior, not an extension crash. The URL mode remains usable.

## Compatibility

The minimum is Firefox 142, which supports the manifest's `browser_specific_settings.gecko.data_collection_permissions` field. `npm run lint:ext` should report no errors or warnings.

## Contact

- Creator: matthew
- GitHub: https://github.com/shuriv
- Source/issues: https://github.com/shuriv/reverseimg
