# SFX POS — Google Sheets as DB (free, in your GDrive)

Sheets is the cloud database. The app works offline (IndexedDB) and syncs
when online + logged in as admin. Viewers only pull.

## 0. Access control (read this first — the POS is locked by default)

Nobody can open the POS without signing in. There is exactly one privilege
model:

- **SUPERUSER (admin)** — full access: events, billing, inventory, ledger,
  settings, backup, and **user management** (create / disable / delete
  employee logins, reset passwords) under Settings → Viewer accounts.
- **Employees (viewer)** — read-only access to only the pages you tick
  (events / calendar / reservations). They cannot save, edit, delete,
  pay, push sync, or open settings.

First run shows a setup screen instead of the POS:

- `IRON_SECRET` missing → locked screen with owner steps. Set it, redeploy.
- No superuser yet → **First-run Setup**: either create the master straight
  into the Sheets Users tab (if Sheets is wired), or generate the
  `ADMIN_PASS_HASH` value in-browser and set `ADMIN_USERNAME` +
  `ADMIN_PASS_HASH` (+ `IRON_SECRET`) as env vars, redeploy, continue.
- The hash generator and bootstrap shut themselves off permanently once a
  superuser exists. The last superuser cannot be deleted.

## 1. Create the Sheet

1. In Google Drive → New → Google Sheets → name it `SFX_DB`.
2. Note the Sheet ID from the URL: `docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.
3. No need to create tabs — the app creates all 13 via **Settings → Init sheet tabs + push**.

## 2. Service account (free)

1. https://console.cloud.google.com → New project `sfx-pos` → Enable **Google Sheets API** + **Google Drive API**.
2. IAM → Service Accounts → Create → name `sfx-sync` → Create key (JSON).
3. From the JSON: `client_email` and `private_key`.
4. In your `SFX_DB` sheet: **Share → paste the service-account email → Editor**.

## 3. Env vars (local `.env.local`, hosting dashboard for deploys)

```
SFX_SHEET_ID=<from step 1>
SFX_GOOGLE_CLIENT_EMAIL=<service account email>
SFX_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SFX_DRIVE_FOLDER_ID=<optional, for Drive backups>
ADMIN_USERNAME=admin
ADMIN_PASS_HASH=<output of scripts/make-admin-hash.mjs>
IRON_SECRET=<32+ char random hex>
SFX_BILL_PREFIX=SFX-
SFX_GST_DEFAULT=18
```

Generate auth values:

```
node scripts/make-admin-hash.mjs admin "pick-a-strong-password"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Go live

1. `npm run dev` → login with admin → **Settings → Init sheet tabs + push**.
2. Check `SFX_DB` — 13 tabs filled. **Excel backup** = the same file:
   Settings → Excel (.xlsx) downloads whatever is in the Sheet right now.
   Keep a copy in your Drive folder for history.
3. Add viewers: Settings → Viewer accounts (needs Sheets configured).
   Permissions map: events → View Events, calendar → Booking Calendar,
   reservations → Reservations. Everything else is admin-only.

## 5. Deploy (free)

- **Vercel**: import repo, add env vars, deploy. Recommended for Next 16.
- **Netlify**: same, framework preset Next.js.
- **Cloudflare Pages**: only supports up to Next 15 (`@cloudflare/next-on-pages`
  peer range). To use it, downgrade: `npm i next@15 react@19 react-dom@19`.

## Sync rules

- Pull: any logged-in role, manual Refresh + on reconnect.
- Push: admin only, auto every 45s when dirty + manual.
- Last-write-wins per tab (revision stamp in `_Meta`).
- Ledger is never synced — rebuilt locally from payments/adjustments/expenses.
- JSON backup (Settings) is the offline disaster copy; restore then push.
