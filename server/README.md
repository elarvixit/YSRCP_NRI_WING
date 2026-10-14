# YSRCP NRI Wing – Backend

Node.js + Express API with a Postgres database. Deployment (GitHub → Vercel + Supabase) is
described in the main [README](../README.md).

- **Online:** Supabase Postgres (`DATABASE_URL`) and Supabase Storage for gallery photos.
- **On this computer:** if `DATABASE_URL` is empty, a built-in Postgres (PGlite) in `server/data/pglite`.

## Run on this computer

From the project folder (not `server/`):

```bash
npm install
npm start
```

- Website: http://localhost:3000
- Admin panel: http://localhost:3000/admin.html

Settings go in `server/.env` (copy `server/.env.example`).

## Add admins / city coordinators

```bash
npm run create-admin -- <username> <password>
npm run create-admin -- <username> <password> coordinator "Dallas"
```

Uses `DATABASE_URL` from `server/.env` when set (so it also works for Supabase), otherwise the
local database. Passwords must be at least 10 characters. Coordinators only see members and
WhatsApp requests of their own city; full admins see everything. On Vercel the first admin can
also be created from the `ADMIN_USERNAME` / `ADMIN_PASSWORD` settings.

## Move old data

`npm run import-sqlite` copies the old SQLite file (`server/data/nri.db`) into the database
in `DATABASE_URL` (or the local one). It only fills empty tables.

## What is stored

| Table | Filled by |
|---|---|
| members | Registration (member card, number `YSRNRI-YYYY-xxxxx`) |
| tickets | Help Desk (`HD-xxxxx`), status tracked by number |
| meet_requests | Meet Jagan Sir form (`MJ-xxxxx`) |
| whatsapp_requests | “Join city WhatsApp” form |
| rsvps / task_done | Event RSVPs and volunteer tasks (points + leaderboard) |
| questions | Live with Leaders questions (admins can hide) |

Members can delete all their data from their dashboard (“Delete my data”).
Admins can export members / tickets / requests as CSV.

## Help Desk workflow (Raise → Assign → Resolve)

1. **Raise** – an NRI fills the Help Desk form (with phone/WhatsApp). The ticket gets a
   number and a target date: 7 days, or 1 day for urgent requests.
2. **Assign** – in the admin panel → **Volunteers**, add district volunteers once. In
   **Help Desk**, choose a volunteer (same-district volunteers are listed first) → *Assign*
   → *Send task link on WhatsApp*. The volunteer opens a private page (`task.html`, no
   login) with the request details and the family's phone number.
3. **Resolve** – the volunteer presses *Working on it* / *Mark resolved* with a short note.
   Admins can also change the status (resolving asks "What was done?").

The member sees every step with dates, the volunteer's first name and the target date under
"My requests" (logged-in members also see what was done). Re-assigning a ticket creates a
new task link and the old one stops working. Tickets past their target date are flagged.

## Auto-gallery from Facebook & Instagram

Photo posts on the wing's **own** Facebook Page and Instagram account appear in the
website Gallery automatically (checked once a day online by a Vercel Cron job, every 3 hours on this computer, newest first, marked "📘 New" /
"📸 New"). Photos are saved in Supabase Storage (bucket `gallery`) online, or `data/gallery/` on this computer, so they keep working
even after Facebook's image links expire. Text-only posts and videos are skipped.
Admins can hide any photo, or press "Check for new photos now", in the admin panel →
**Gallery** tab.

It uses Meta's official Graph API, so it needs a one-time setup by a Page admin:

1. Make sure the Instagram account is a **Professional (Business/Creator)** account and
   is **linked to the Facebook Page**.
2. At https://developers.facebook.com create an app (type **Business**).
3. In **Graph API Explorer**: choose the app, click *Get User Access Token* with the
   permissions `pages_show_list`, `pages_read_engagement`, `instagram_basic`
   (and `business_management` if the Page is in a Business portfolio).
4. Make it a long-lived token (Access Token Debugger → *Extend access token*), then call
   `me/accounts` with it – copy your Page's `id` and `access_token`
   (a Page token made from a long-lived user token does not expire).
5. Call `<PAGE_ID>?fields=instagram_business_account` – copy that id.
6. Add `FB_PAGE_ID`, `FB_PAGE_TOKEN`, `IG_USER_ID` in Vercel → Settings → Environment Variables
   (or `server/.env` on this computer) and redeploy / restart. The admin panel Gallery tab shows the last check and any error.

Optional: `GALLERY_KEYWORDS=NRI,meet,event` adds only posts whose text contains one of
those words.

## Settings (environment variables)

All settings are listed with explanations in [`server/.env.example`](.env.example):
`DATABASE_URL`, `APP_SECRET`, `ADMIN_USERNAME` / `ADMIN_PASSWORD`, `SITE_URL`,
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, and the Facebook / Instagram ones.

## Notes

- If the backend is not reachable, the website still works using browser storage only.
- Form rate limits are kept in memory, so on Vercel they apply per server instance.
