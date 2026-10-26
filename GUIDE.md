# ReverseIMG — the very simple build and publish guide

This guide assumes you know almost nothing. That is fine. Follow it in order. Do not skip steps.

---

## 1. What you are making

You are making a **Firefox add-on** (also called an **extension**).

Its name is **ReverseIMG**.

It does two things:

1. You right-click a picture on a website. It searches the internet for that picture.
2. You click the ReverseIMG button in Firefox. You type words. It searches for pictures that match those words.

All the code is already in this folder:

```text
C:\WorkSpace\ff_extensions
```

That folder is your **workshop**. Everything happens there.

---

## 2. The words in this guide

You only need these words:

- **Folder** — a place where files live.
- **PowerShell** — the black or blue text window where you type commands.
- **Command** — a line of text you type in PowerShell, then press Enter.
- **Build** — turn the human source code into the files Firefox can load.
- **`dist`** — the folder that contains the built add-on.
- **AMO** — the official Firefox add-on website: `addons.mozilla.org`.
- **Zip** — one file that contains many files, used for uploading.
- **Temporary add-on** — an add-on Firefox forgets when it closes. Good for testing.
- **Published add-on** — an add-on on AMO that anyone can install.

---

## 3. What you need

You need:

- A Windows computer.
- Internet.
- Firefox installed.
- Node.js installed.
- This project folder.

Check Node.js:

1. Press the Windows key.
2. Type `PowerShell`.
3. Click **Windows PowerShell**.
4. Type this and press Enter:

```powershell
node --version
```

You should see something like:

```text
v22.17.1
```

Then type:

```powershell
npm --version
```

You should see something like:

```text
11.16.0
```

If you see “not recognized,” Node.js is not installed.

Install it from:

```text
https://nodejs.org/
```

Choose the **LTS** version. Install it. Then close PowerShell and open it again.

---

## 4. Go to the workshop

In PowerShell, type this and press Enter:

```powershell
cd C:\WorkSpace\ff_extensions
```

Check that you are in the right place:

```powershell
Get-ChildItem
```

You should see files like:

```text
package.json
README.md
src
public
```

If you do not see those files, you are in the wrong folder. Go back to `cd C:\WorkSpace\ff_extensions`.

---

## 5. Install the build tools

Type this and press Enter:

```powershell
npm install
```

Wait. It downloads the tools. It can take one or two minutes.

You may see warnings. Warnings are usually okay. You only need to worry if it says **error** and stops.

When it is done, you will have a folder called `node_modules`. **Do not open it. Do not edit it. Do not upload it to AMO.**

---

## 6. Build the add-on

Type this and press Enter:

```powershell
npm run build
```

Wait a few seconds. You should see text ending like:

```text
✓ built in 300ms
```

Now look inside this folder:

```text
C:\WorkSpace\ff_extensions\dist
```

You should see:

```text
manifest.json
popup.html
options.html
upload.html
error.html
privacy.html
background.js
assets
icons
_locales
```

That `dist` folder is the actual add-on.

**Important:** `dist` is generated. Do not edit files in `dist`. Edit files in `src`, `public`, or `scripts`, then build again.

---

## 7. Put it inside Firefox (temporary test)

This is how you test it. It is not publishing yet.

1. Open Firefox.
2. Click the address bar at the top.
3. Type this exactly:

```text
about:debugging#/runtime/this-firefox
```

4. Press Enter.
5. Find the button **Load Temporary Add-on…**.
6. Click it.
7. A file picker opens.
8. Go to:

```text
C:\WorkSpace\ff_extensions\dist
```

9. Select the file named:

```text
manifest.json
```

10. Click **Open**.

Firefox now has ReverseIMG loaded.

If Firefox shows an error, read it. The most common cause is that you did not run `npm run build` first, or you selected the wrong `manifest.json`.

### Pin the button

1. Click the puzzle-piece icon in the Firefox toolbar.
2. Find **ReverseIMG**.
3. Click the gear or the pin option next to it.
4. The ReverseIMG icon should now stay in the toolbar.

### Test it

Do these four tests:

**Test A — keyword search**

1. Click the ReverseIMG icon.
2. Type `red fox`.
3. Click **Search**.
4. A Firefox tab should open with image results.

**Test B — right-click reverse search**

1. Go to any website with a picture.
2. Right-click the picture.
3. Choose **Search image with Google Lens**.
4. A Google Lens tab should open.

**Test C — upload**

1. Click the ReverseIMG icon.
2. Click **Reverse search**.
3. Click the drop area, choose a JPEG or PNG.
4. Click **Search with Google Lens**.
5. Wait for the search tab.

**Test D — settings**

1. Click the ReverseIMG icon.
2. Click the gear icon in the top-right.
3. The settings page should open.
4. Turn an engine off and on.
5. Change the theme.
6. Click **Clear recent searches**.

If all four work, the add-on is alive.

**Remember:** a temporary add-on disappears when Firefox closes. That is normal. You do not need to reinstall it until you close Firefox.

---

## 8. Build the file you upload to AMO

Do not upload the `dist` folder. Do not upload the whole project. Build the special zip.

Type this and press Enter:

```powershell
npm run package
```

Wait. You should see:

```text
Your web extension is ready: artifacts\reverseimg-0.1.0.zip
```

The file is here:

```text
C:\WorkSpace\ff_extensions\artifacts\reverseimg-0.1.0.zip
```

This is the **extension package**. This is what AMO installs.

The number `0.1.0` is the version. It comes from `package.json`. The build also copies that version into the manifest.

---

## 9. Make the source-code zip (AMO will ask for it)

AMO needs to check the source code because this extension is built with Vite.

The source code is the project **before** the build, without the downloaded tools.

In PowerShell, go to the workshop:

```powershell
cd C:\WorkSpace\ff_extensions
```

Make sure the `artifacts` folder exists:

```powershell
New-Item -ItemType Directory -Force artifacts | Out-Null
```

Now make the source zip:

```powershell
tar -a -c -f artifacts\reverseimg-0.1.0-source.zip --exclude=node_modules --exclude=dist --exclude=artifacts --exclude=.tmp --exclude=.git --exclude=.env --exclude=.env.* .
```

You should now have two files:

```text
artifacts\reverseimg-0.1.0.zip
artifacts\reverseimg-0.1.0-source.zip
```

The first file is the add-on. The second file is the recipe.

If `tar` is not recognized, install 7-Zip, right-click the project folder, and use 7-Zip to make a zip. Do **not** include `node_modules`, `dist`, or `artifacts` in the source zip.

---

## 10. Make a GitHub repository (for the public links)

AMO asks for a privacy policy link and a source code link. GitHub is the easy place to put them.

1. Go to `https://github.com/shuriv`.
2. Sign in.
3. Create a new repository.
4. Name it `reverseimg`.
5. Make it public.
6. Upload this project (or push it with Git).

You need these public links later. Replace `shuriv` if your username is different:

```text
https://github.com/shuriv/reverseimg
https://github.com/shuriv/reverseimg/blob/main/PRIVACY.md
```

If your default branch is called `master` instead of `main`, use `master` in the link.

For this project, the repository is already public:

```text
https://github.com/shuriv/reverseimg
https://github.com/shuriv/reverseimg/blob/main/PRIVACY.md
```

The privacy link must open a real page. Test it in a private window. If GitHub does not show it nicely, use GitHub Pages later.

---

## 11. Make an AMO account

1. Go to:

```text
https://addons.mozilla.org/
```

2. Click **Register** or **Log in**.
3. Create an account or sign in.
4. Go to the developer area:

```text
https://addons.mozilla.org/developers/
```

5. Click **Submit a New Add-on**.

---

## 12. Submit the add-on

### 12.1 Upload

1. Choose **On this site** if you want AMO to host it. This is the normal public listing.
2. Upload:

```text
C:\WorkSpace\ff_extensions\artifacts\reverseimg-0.1.0.zip
```

3. AMO will check the file.
4. If it asks for source code, upload:

```text
C:\WorkSpace\ff_extensions\artifacts\reverseimg-0.1.0-source.zip
```

5. In the source-code notes, write:

```text
Build: npm ci && npm run build:amo
The submitted package is the contents of dist/.
Node.js 22+, npm 10+.
```

### 12.2 Name and summary

Name:

```text
ReverseIMG
```

Summary (copy this):

```text
Reverse-search any image or search by keyword with Google Lens, Bing, Yandex, TinEye and SauceNAO.
```

### 12.3 Description

Copy the English description from:

```text
docs/AMO-LISTING.md
```

AMO also lets you add translations. The same file has French, Spanish, German, Portuguese, Russian, Chinese, and Hindi text.

### 12.4 Category and tags

Category:

```text
Photos, videos, and media
```

or the closest image/search category AMO shows.

Tags:

```text
reverse image search, image search, Google Lens, Bing, Yandex, TinEye, SauceNAO, privacy
```

### 12.5 Privacy policy

Use your public GitHub link:

```text
https://github.com/shuriv/reverseimg/blob/main/PRIVACY.md
```

Test the link in a private window before you paste it. A broken privacy link will slow down review.

### 12.6 License

Choose:

```text
MIT
```

The license file is already in this project.

### 12.7 Data collection

AMO will ask what data the extension collects. Declare:

- Search terms: yes.
- Website content: yes.

Explain:

```text
Search terms and the image the user explicitly chooses are sent directly to the search engine selected by the user. The developer does not receive, store, or sell this data. There are no analytics or developer servers.
```

This matches the manifest declaration.

### 12.8 Notes for reviewers

Copy this:

```text
ReverseIMG uses no host permissions and no remote code. It opens normal search-engine URLs and posts user-chosen images through an extension page form. Uploaded images are kept in IndexedDB for at most 15 minutes for the handoff and then cleaned up. The build command is: npm ci && npm run build:amo. The submitted zip is the contents of dist/.
```

### 12.9 Submit

Click the final submit button.

AMO will review it. This can take hours or days. Watch your email and the developer dashboard.

When it is approved, your public page will look like:

```text
https://addons.mozilla.org/firefox/addon/reverseimg/
```

The `reverseimg` slug was free when this project was prepared, but AMO makes the final decision.

---

## 13. When you want to change something later

Edit files in `src`, `public`, or `scripts`.

Then run:

```powershell
npm run test:all
npm run build
```

Load the temporary add-on again and test.

To publish a new version:

1. Change the version in `package.json`. For example:

```powershell
npm version 0.1.1 --no-git-tag-version
```

2. Build and test:

```powershell
npm run test:all
npm run package
```

3. In the AMO developer dashboard, open ReverseIMG.
4. Click **Upload New Version**.
5. Upload the new `artifacts\reverseimg-0.1.1.zip`.
6. Upload a new source zip if AMO asks for it.
7. Submit for review.

Do not change the extension ID after publishing:

```text
reverseimg@users.noreply.github.com
```

Changing the ID creates a different add-on.

---

## 14. Where everything is

```text
C:\WorkSpace\ff_extensions
├─ src\                 The source code you edit
├─ public\              Manifest, icons, locale files
├─ scripts\             Build helpers and translation source
├─ tests\               Automated tests
├─ dist\                Built add-on (do not edit)
├─ artifacts\           Release zips
├─ package.json         Project name, version, commands
├─ README.md            Short project overview
├─ GUIDE.md             This file
├─ PRIVACY.md           Privacy policy
└─ LICENSE              MIT license
```

---

## 15. Command cheat sheet

```powershell
cd C:\WorkSpace\ff_extensions   # go to the workshop
npm install                     # install tools (first time only)
npm run build                   # build the test add-on
npm run start                   # build and open Firefox with web-ext
npm test                        # run tests
npm run typecheck               # check TypeScript
npm run lint                    # check code style
npm run i18n:check              # check all 8 languages
npm run package                 # make the AMO zip
npm run lint:ext                # check the built add-on
npm run test:all                # run everything
```

---

## 16. Common problems

### “npm is not recognized”

Node.js is not installed, or PowerShell was open before you installed it. Install Node.js LTS, close PowerShell, open it again.

### “manifest.json not found”

You forgot to build. Run:

```powershell
npm run build
```

Then select:

```text
C:\WorkSpace\ff_extensions\dist\manifest.json
```

### The popup is blank

1. Go to `about:debugging#/runtime/this-firefox`.
2. Find ReverseIMG.
3. Click **Inspect**.
4. Open the **Console** tab.
5. Read the red error.
6. Rebuild with `npm run build`.
7. Click **Reload** on the temporary add-on.

### The right-click menu is missing

Reload the temporary add-on. If it still does not appear, close Firefox and load it again.

### Google Lens opens but the upload does nothing

Google changes its upload page sometimes. Try the **Image URL** tab in the popup instead. If Google Lens uploads fail for everyone, update the form in `src/shared/engines.ts`.

### TinEye or SauceNAO says “Just a moment…”

That is Cloudflare. The engine is blocking automated form posts. Use the **Image URL** tab, or open the engine in a normal tab and upload there.

### My Firefox is older than version 142

ReverseIMG requires Firefox 142 or newer. This is the version that supports the data-collection permission declaration used by AMO. Update Firefox from:

```text
https://www.mozilla.org/firefox/
```

### AMO says the source code is missing

Upload the source zip from step 9. Include the build command in the reviewer notes.

### I edited `dist` and my changes disappeared

`dist` is generated. Edit `src` or `public`, then run `npm run build` again.

---

## 17. What is already finished

- Firefox MV3 extension.
- Reverse search from the right-click menu.
- Keyword image search in the popup.
- File picker, drag and drop, clipboard paste, and image URL.
- Google Lens, Bing, Yandex, TinEye, SauceNAO.
- Google Images, Bing Images, Yandex Images, DuckDuckGo, Brave Images.
- Settings page with enable/disable, default engine, order, theme, recent searches, export/import, reset.
- 8 localizations.
- Privacy page.
- Automated tests.
- AMO build and packaging.
- This guide.

Created by **matthew** — [github.com/shuriv](https://github.com/shuriv).
