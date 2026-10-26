# ReverseIMG Privacy Policy

**Last updated: 26 October 2026**

ReverseIMG is a Firefox extension created by **matthew** ([github.com/shuriv](https://github.com/shuriv)). This policy explains what the extension does with data. The English version on this page is the canonical version. Localized translations are available in [`docs/privacy/`](docs/privacy/README.md).

## 1. Short version

- ReverseIMG has **no developer servers**, no accounts, no analytics, no advertising, and no tracking.
- Your settings and recent keyword searches stay in your Firefox profile.
- When you start a search, the image or search terms are sent **directly to the search engine you choose**.
- The developer does not receive, store, or sell your search content.
- Temporary image data is kept in the browser for at most **15 minutes** for the upload handoff.

## 2. What ReverseIMG collects

The developer collects **nothing**. ReverseIMG does not operate a backend and does not include analytics, telemetry, crash reporting, advertising SDKs, or account systems.

## 3. What stays on your device

ReverseIMG uses Firefox local storage and IndexedDB inside your Firefox profile:

- **Settings** — enabled engines, engine order, default engine, theme, and behavior preferences.
- **Recent searches** — keyword searches you choose to keep. You can clear them at any time from the popup or settings page.
- **Temporary images** — when you reverse-search a `blob:` or `data:` image, or use a local upload, the image data is stored briefly in IndexedDB so the upload page can submit it. Entries are deleted after the handoff or after 15 minutes, whichever comes first.

This data is not transmitted to the developer. You can remove local data by clearing the extension's storage in Firefox or by uninstalling ReverseIMG.

## 4. What is sent to third parties

When you start a search, ReverseIMG opens a normal search-engine page or submits an HTML form directly from the extension page to the selected engine. The data sent depends on what you choose:

- **Keyword search** — the text you type is sent to the selected image search engine.
- **Image URL search** — the image URL is sent to the selected reverse image engine.
- **Image upload** — the image file (or a base64 representation for Bing) is sent to the selected engine.

The engines currently supported are Google Lens, Google Images, Bing, Bing Images, Yandex, Yandex Images, TinEye, SauceNAO, DuckDuckGo, and Brave Images. Each engine has its own privacy policy and may log requests, set cookies, or require a CAPTCHA. ReverseIMG does not control those services. Review their policies before searching sensitive images or terms.

## 5. Permissions

ReverseIMG requests only:

- `menus` — to add the right-click image menu and selected-text search item.
- `storage` — to save settings and recent searches in your profile.
- `activeTab` — to read the image you explicitly right-clicked, only after you choose a menu item.
- `scripting` — to read `blob:` image data from the active page for uploads.

ReverseIMG does **not** request host permissions and does not read pages in the background.

## 6. AMO data collection declaration

The add-on manifest declares the following data collection categories for Mozilla Add-ons:

- `searchTerms`
- `websiteContent`

These categories reflect data that is sent to the search engine you choose. The developer does not receive or retain it. Mozilla's data collection disclosure is separate from this policy.

## 7. Data retention and deletion

- Recent searches remain until you clear them or uninstall the extension.
- Temporary image entries are removed after the upload handoff or after 15 minutes.
- Settings remain until you reset them or uninstall the extension.
- The developer has no server-side data to delete.

## 8. Children

ReverseIMG is a general-purpose search utility and is not directed at children. It does not knowingly collect personal information from anyone.

## 9. Changes

If this policy changes, the updated version will be published in the project repository and the extension's privacy page. The date at the top will be updated. Material changes may also be noted in the release notes.

## 10. Contact

Questions, privacy requests, or security reports:

- GitHub: [github.com/shuriv](https://github.com/shuriv)
- Project issues: create an issue in the public ReverseIMG repository.

## 11. Scope

This policy applies to the ReverseIMG Firefox extension and its bundled pages. It does not apply to the websites of Google, Microsoft, Yandex, TinEye, SauceNAO, DuckDuckGo, Brave, Mozilla, GitHub, or any other third party.
