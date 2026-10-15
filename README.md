# YSRCP NRI Wing – website + backend

- `website/` – the public website (static HTML/CSS/JS), the admin panel (`admin.html`) and the volunteer task page (`task.html`)
- `server/` – the API (Node.js + Express + Postgres) – details in [server/README.md](server/README.md)
- `api/index.js` – runs the API as a Vercel serverless function
- `vercel.json` – Vercel settings (website folder, `/api` routing, daily gallery job)

## Run on this computer

```bash
npm install
npm start
```

Website http://localhost:3000 · admin panel http://localhost:3000/admin.html.
Without a `DATABASE_URL` it uses a built-in local Postgres in `server/data/pglite`.

## Deploy: GitHub → Vercel + Supabase

### 1. Supabase (database + photo storage)

1. Create a project at https://supabase.com (choose a region close to India, e.g. Mumbai).
2. **Project → Connect → Transaction pooler** → copy the URI (port `6543`) and put your database
   password into it. This is `DATABASE_URL`.
3. **Project Settings → API** → copy the **Project URL** (`SUPABASE_URL`) and the
   **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`). Keep the service key secret.

**Tables:** run [server/schema.sql](server/schema.sql) in Supabase → SQL Editor. Every table is named
`ysr_nri_wing_<table>` (e.g. `ysr_nri_wing_members`, `ysr_nri_wing_tickets`), so the project can be shared with other
apps. (The server also creates them automatically on its first request.) If an older version created tables without
the prefix, [server/cleanup-old-tables.sql](server/cleanup-old-tables.sql) removes them – only the empty YSRCP ones. The public `gallery` storage bucket is
created automatically by the first gallery check.

### 2. Vercel (hosting)

1. At https://vercel.com → **Add New → Project** → import this GitHub repository.
2. Framework preset: **Other**. Leave build/output settings as they are (they come from `vercel.json`).
3. **Settings → Environment Variables** – add:

| Name | Value |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler URI |
| `APP_SECRET` | long random text, at least 32 characters |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | first admin login (password at least 10 characters) |
| `SITE_URL` | your site address, e.g. `https://ysrcp-nri-wing.vercel.app` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | from Supabase → API |
| `CRON_SECRET` | long random text (protects the daily gallery job) |
| `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `IG_USER_ID` | optional – auto-gallery from Facebook / Instagram |

4. **Deploy**. Open `https://<your-site>/api/health` – it should show `{"ok":true,…}`.
5. Log in at `https://<your-site>/admin.html` with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
   You can then remove `ADMIN_PASSWORD` from Vercel (the admin stays in the database).

Every push to the `main` branch on GitHub deploys a new version automatically.

### Moving existing data (optional)

Put the Supabase `DATABASE_URL` in `server/.env` on the computer that has the old
`server/data/nri.db`, then run `npm run import-sqlite`.
