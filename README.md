# Tour Ledger

A shared expense tracker for group tours: plan a trip, log expenses, and see
who's spent what — with everyone seeing the same data, from any device.

## How it's put together

```
tour-ledger-app/
├── src/, index.html, vite.config.js, package.json   <- frontend (Vite + React)
├── server/                                          <- backend (Express + Postgres)
│   ├── index.js
│   └── package.json
├── render.yaml          <- one-shot Render Blueprint (API + DB + static site)
└── .env.example
```

The frontend talks to the backend over HTTP for anything that needs to be
**shared** (trips, expenses, accounts). It only uses the browser's own
storage for one thing — remembering who's logged in on that particular
device — which is supposed to stay local.

## ⚠️ Before you deploy: the free database expires

Render's free PostgreSQL tier is only good for **30 days**, then a 14-day
grace period, after which the database and everything in it is deleted
unless you upgrade to a paid plan (starts around $6-7/month). Free web
services also "sleep" after 15 minutes of no traffic and take 30-60 seconds
to wake back up on the next request — the first person to open the app
after a quiet period will see a slow load, not a broken one.

None of that stops you from testing this for a trip or two. Just know that
if you want this to keep working long-term without data loss, you'll want
to upgrade the database before day 30.

---

## Option A: Deploy with the Blueprint (recommended, fewer steps)

1. Push this whole folder to your GitHub repo (commands below).
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** →
   **Blueprint**.
3. Connect your GitHub repo. Render will detect `render.yaml` and show you
   three resources to create: `tour-ledger-db`, `tour-ledger-api`,
   `tour-ledger-app`.
4. Click **Apply**. Render builds and deploys all three.

**One thing to check after it deploys:** service names on Render must be
globally unique. If `tour-ledger-api` was already taken by someone else,
Render will have given your API a different URL. If so:
   - Go to your `tour-ledger-app` static site → **Environment**.
   - Update `VITE_API_URL` to match your API's actual URL (shown on the
     `tour-ledger-api` service page).
   - Click **Manual Deploy → Deploy latest commit** on the static site so it
     rebuilds with the correct URL baked in.

## Option B: Set it up manually (if the Blueprint doesn't work for you)

**1. Create the database**
Dashboard → New → PostgreSQL → name it anything → Free plan → Create.

**2. Create the backend**
Dashboard → New → Web Service → connect your repo.
- Root Directory: `server`
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Plan: Free
- Environment → add `DATABASE_URL` → pick "Add from Database" → select the
  database you just created (use the **Internal Database URL**).
- Create. Note the URL it gives you, like `https://tour-ledger-api.onrender.com`.

**3. Create the frontend**
Dashboard → New → Static Site → connect your repo.
- Root Directory: `.` (repo root)
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment → add `VITE_API_URL` = the backend URL from step 2.
- Add a Rewrite Rule: source `/*` → destination `/index.html` (so page
  refreshes don't 404).
- Create.

---

## Push this to GitHub

```powershell
cd tour-ledger-app
git add .
git commit -m "Add backend API and Render deployment config"
git push
```

If this is a brand-new repo instead of adding to an existing one, use the
`git init` / `git remote add origin ...` steps from before first.

## Local development

**Backend:**
```bash
cd server
npm install
# create a local Postgres, or use Render's External Database URL for testing
DATABASE_URL=postgres://... npm start
```

**Frontend:**
```bash
npm install
cp .env.example .env      # then edit VITE_API_URL to point at your backend
npm run dev
```

## Mobile / "install as an app"

`index.html` and `public/manifest.json` are already set up as a basic
Progressive Web App: correct viewport meta tags, theme color, and a
manifest with icons. Once your static site is live on its Render HTTPS URL,
most phones will let people tap **"Add to Home Screen"** in their browser
to install it like an app — and because it's now backed by a real shared
database, everyone who does that will see the same trips and expenses.

This is a PWA, not a native iOS/Android build — there's no App Store/Play
Store listing. A true native app would be a separate project.

## A note on the login PINs

The account system (name + PIN) still works the same way it did before,
but it's worth knowing exactly what it is: PINs are hashed with a simple,
non-cryptographic function before being stored, as a basic gate so people
don't accidentally log expenses as each other. It is not meant to protect
sensitive information, and shouldn't be treated as secure authentication.
