# Tour Ledger

A shared expense tracker for group tours: plan a trip, log expenses, and see
who's spent what.

## ⚠️ Important: this is not the same app it was inside Claude

Inside Claude, this app used `window.storage` — a Claude-only API that made
trip and expense data **shared across everyone** using the artifact, from any
device, automatically.

That API does not exist outside Claude. So this version:

- Uses `localStorage` as a stand-in (see `src/main.jsx`), just so the app
  runs instead of crashing.
- **Each person's data is now private to their own browser.** If you and a
  friend both open the deployed URL, you will NOT see each other's trips —
  you'll each have your own separate copy.
- Data disappears if the browser's site data is cleared, or if you switch
  browsers/devices.

If you want the real shared, multi-device behavior back, `window.storage`
needs to be replaced with calls to a real backend (Firebase, Supabase, your
own API, etc.) — that's a bigger follow-up change, not included here.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview   # test the production build locally
```

The built files land in `dist/`.

## Push to GitHub

```bash
cd tour-ledger-app
git init
git add .
git commit -m "Initial commit: Tour Ledger"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(Create the empty repo on GitHub first — github.com → New repository —
without a README, so it doesn't conflict with this one.)

## Publish it (GitHub Pages)

1. Install the deploy helper:
   ```bash
   npm install --save-dev gh-pages
   ```
2. In `package.json`, add:
   ```json
   "homepage": "https://<your-username>.github.io/<your-repo>",
   "scripts": {
     "deploy": "vite build && gh-pages -d dist"
   }
   ```
3. In `vite.config.js`, uncomment and set:
   ```js
   base: "/<your-repo>/",
   ```
4. Deploy:
   ```bash
   npm run deploy
   ```
5. In your GitHub repo, go to **Settings → Pages** and confirm the source is
   set to the `gh-pages` branch. Your app will be live at the `homepage` URL
   in a minute or two.

## Mobile / "install as an app"

`index.html` and `public/manifest.json` are already set up as a basic
Progressive Web App (PWA): correct viewport meta tags, theme color, and a
manifest with icons. Once it's hosted on a real HTTPS URL (like GitHub
Pages), most phones will let people tap **"Add to Home Screen"** in their
browser to install it like an app.

This is a lightweight PWA setup, not a native iOS/Android build — there's no
App Store/Play Store listing. If you want a true native app, that's a
separate project (e.g. wrapping it with Capacitor, or a React Native
rewrite).

## Project structure

```
tour-ledger-app/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
└── src/
    ├── main.jsx        # entry point + localStorage shim
    └── TourLedger.jsx  # the app itself
```
