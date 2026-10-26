# Manual testing checklist

Automated checks:

```powershell
npm run test:all
```

`test:all` runs TypeScript, ESLint, Vitest, locale checks, the clean AMO build, and `web-ext lint`. It does **not** exercise real search-engine pages; do the manual checks below before submitting.

## Current automated/browser verification

Last verified on 26 October 2026 with **Firefox 157.0.1** and a temporary add-on installed through Selenium/geckodriver.

Passed:

- Popup loads with 5 keyword engines and 5 reverse engines.
- Keyword search opens Google Images with the encoded query.
- Recent keyword search is stored locally.
- Reverse URL search reaches the Google Lens flow.
- Google Lens file upload reaches `https://lens.google.com/v3/upload`.
- Bing file upload reaches `https://www.bing.com/images/search` with `iss=sbiupload`.
- Yandex upload mode shows the URL-only note and disables the button.
- Settings theme change persists and the popup applies it.
- Privacy page and error page render.
- The right-click menu contains the default Google Lens item plus all five reverse-engine submenu items.

Google may show an automated-traffic challenge on repeated headless searches; that is external bot protection. TinEye and SauceNAO form uploads still need a manual browser pass because Cloudflare rejected command-line checks.

## 1. Test setup

1. Build:
   ```powershell
   npm run build
   ```
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `dist/manifest.json`.
4. Open the Browser Console for extension errors:
   - `about:debugging#/runtime/this-firefox`
   - ReverseIMG → **Inspect** → **Console**.
5. Keep a test image ready: a small JPEG/PNG, a large image over 4 MB, a WebP, and an image URL.

## 2. Popup and keyword search

| Check | Expected | Pass |
| --- | --- | --- |
| Click toolbar icon | Popup opens at about 392 px wide, no console errors | ☐ |
| Two tabs: Find images / Reverse search | Tabs switch and remember state while open | ☐ |
| Search `red fox` with each of the 5 keyword engines | A results tab opens for the selected engine | ☐ |
| Search query with spaces, `&`, `#`, emoji | Query is encoded and results page opens | ☐ |
| Empty query | Inline message asks for a query; no tab opens | ☐ |
| Engine cards | Exactly one selected; default engine is selected on first open | ☐ |
| Remember last engine off | Reopening popup returns to the configured default | ☐ |
| Recent searches | New keyword search appears; clicking it repeats the search; remove works; clear works | ☐ |

## 3. Reverse search from the context menu

| Check | Expected | Pass |
| --- | --- | --- |
| Right-click a normal JPEG/PNG image | Default engine item appears, e.g. “Search image with Google Lens” | ☐ |
| Turn on full submenu | Default item plus “Search image with…” submenu with enabled engines | ☐ |
| Turn off full submenu | Only the default item appears | ☐ |
| URL image on Google Lens | Lens opens with the image URL | ☐ |
| URL image on Bing | Bing visual search opens | ☐ |
| URL image on Yandex | Yandex image search opens | ☐ |
| URL image on TinEye | TinEye opens with the URL | ☐ |
| URL image on SauceNAO | SauceNAO opens with the URL | ☐ |
| Select text, right-click | “Search selected text for images” appears and opens the default keyword engine | ☐ |
| Right-click a `data:` image | Upload handoff page opens for upload-capable engines; no-upload error for Yandex | ☐ |
| Right-click a `blob:` image | Upload handoff opens after reading the blob; no-upload error for Yandex | ☐ |
| No image `src` | Error page explains that the image could not be read | ☐ |

## 4. Reverse search from the popup

| Check | Expected | Pass |
| --- | --- | --- |
| Upload small JPEG with Google Lens | Upload page briefly shows “Sending…”, then Lens results or Lens upload page | ☐ |
| Upload small PNG with Bing | Bing results/upload page opens | ☐ |
| Upload with TinEye | TinEye opens; Cloudflare may require manual action | ☐ |
| Upload with SauceNAO | SauceNAO opens; Cloudflare may require manual action | ☐ |
| Select Yandex + upload | Inline note says Yandex cannot accept uploads; button disabled | ☐ |
| Drag and drop | Preview shows; image can be searched | ☐ |
| Paste image from clipboard | Preview shows; image can be searched | ☐ |
| Paste an image URL | URL mode works; mixed-case scheme is accepted | ☐ |
| Image URL with `ftp:` or `javascript:` | Inline validation error; search blocked | ☐ |
| Remove image | Preview clears; search button disables | ☐ |
| File over engine limit | Inline size error; no upload page | ☐ |
| Unsupported type (SVG, HEIC, PDF) | Inline file-type error | ☐ |

## 5. Settings page

| Check | Expected | Pass |
| --- | --- | --- |
| Gear icon in popup | Options page opens | ☐ |
| Disable all engines | Last enabled engine cannot be disabled; error message appears | ☐ |
| Disable the current default | Default moves to a remaining enabled engine | ☐ |
| Choose a different default | Radio moves; context menu and popup use it after reopening | ☐ |
| Move engine up/down | Order changes; first/last buttons disable correctly | ☐ |
| Theme system/light/dark | Changes immediately and survives reopen | ☐ |
| Open results in a new tab off | Keyword/reverse results use the current tab | ☐ |
| Show full submenu off | Context menu shows only the default reverse item | ☐ |
| Remember last engine off | Last-engine values are cleared | ☐ |
| Clear recent searches | Recent list becomes empty in the popup | ☐ |
| Export settings | `reverseimg-settings.json` downloads | ☐ |
| Import exported settings | Values restore; success message appears | ☐ |
| Import malformed JSON | Error message appears; settings unchanged | ☐ |
| Reset settings | Confirmation, then defaults restore | ☐ |
| Privacy link | Opens bundled privacy page | ☐ |

## 6. Localization

Use Firefox's language setting or `about:config` → `intl.locale.requested` to test each locale. Reload the temporary add-on after changing language.

| Locale | Popup | Settings | Upload/error/privacy | Pass |
| --- | --- | --- | --- | --- |
| en | ☐ | ☐ | ☐ | ☐ |
| ru | ☐ | ☐ | ☐ | ☐ |
| fr | ☐ | ☐ | ☐ | ☐ |
| es | ☐ | ☐ | ☐ | ☐ |
| zh_CN | ☐ | ☐ | ☐ | ☐ |
| de | ☐ | ☐ | ☐ | ☐ |
| pt_BR | ☐ | ☐ | ☐ | ☐ |
| hi | ☐ | ☐ | ☐ | ☐ |

Also check:

- No text is clipped in the narrow popup.
- `$1` / `$2` placeholders are replaced by real engine names and sizes, not shown literally.
- Right-click menu titles are localized.
- Chinese and Hindi text renders correctly.
- The privacy page and About section show the localized text.

## 7. Error and edge pages

| Check | Expected | Pass |
| --- | --- | --- |
| Open `error.html?code=no-image` | Friendly “No image found” page | ☐ |
| Open `error.html?code=no-upload&engine=yandex` | Explains URL-only engine; open engine/settings buttons | ☐ |
| Open `upload.html?engine=googleLens&id=missing` | “Image not found/expired” page; no crash | ☐ |
| Open `privacy.html` | Localized privacy policy page; back link works | ☐ |
| Open `options.html` directly | Settings load; no console errors | ☐ |

Use `about:debugging` → ReverseIMG → **Inspect** to get the extension base URL and append these paths.

## 8. Security and privacy checks

- [ ] No host permissions are requested.
- [ ] No remote scripts are loaded; `connect-src 'none'` is intact.
- [ ] No inline scripts or inline event handlers.
- [ ] Images and search terms only leave the browser after an explicit user action.
- [ ] Temporary IndexedDB entries disappear after a successful handoff or within 15 minutes.
- [ ] `npm run lint:ext` reports 0 errors.
- [ ] AMO data collection declaration is `searchTerms` + `websiteContent`.

## 9. Known external risks

- **Cloudflare / bot checks** — TinEye and SauceNAO may block form submissions or show a challenge. This is outside the extension's control. The URL mode and manual open buttons are the fallback.
- **Google Lens upload endpoint** — Google can change its upload form. If it breaks, update `googleLens.upload` in `src/shared/engines.ts`.
- **Bing imageBin endpoint** — Bing can change its upload flow. The URL mode is the fallback.
- **Yandex** — no local upload in 0.1.0; URL mode only.
- **Minimum Firefox version** — the extension requires Firefox 142+ so the AMO data-collection declaration is supported. Test on a current Firefox release.
- **AMO name/slug** — `reverseimg` appeared available, but AMO decides at submission.

## 10. Before uploading to AMO

```powershell
npm run test:all
npm run package
npm run lint:ext
```

Then check:

- [ ] `artifacts\reverseimg-0.1.0.zip` exists.
- [ ] `dist\manifest.json` version matches `package.json`.
- [ ] Source zip excludes `node_modules`, `dist`, and `artifacts`.
- [ ] Privacy policy URL opens logged out.
- [ ] AMO listing copy is filled in.
- [ ] Reviewer notes are pasted.
- [ ] Screenshots (optional but recommended) show the popup, right-click menu, and settings.
