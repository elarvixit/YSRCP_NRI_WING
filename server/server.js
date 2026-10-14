// YSRCP NRI Wing – run the website + API on this computer.
// Start (from the project folder):  npm install  →  npm start  →  http://localhost:3000
// Online the same API runs on Vercel (api/index.js) and the website is served from website/.
const path = require("path");
// settings from server/.env (database, Facebook / Instagram tokens …), if the file exists
try { process.loadEnvFile(path.join(__dirname, ".env")); } catch {}
const express = require("express");
const app = require("./app");
const social = require("./social");
const { getDb } = require("./db");

const PORT = Number(process.env.PORT) || 3000;
const SITE = path.join(__dirname, "..", "website");

// gallery photos saved on this computer (online they come from Supabase Storage)
app.use("/media/gallery", express.static(social.MEDIA_DIR, { maxAge: "7d", fallthrough: false }));
// website files (no caching while developing)
app.use(express.static(SITE, { extensions: ["html"], etag: false, maxAge: 0 }));

getDb()
  .then(() => {
    social.startSocialSync();
    app.listen(PORT, () => {
      console.log(`YSRCP NRI Wing server running → http://localhost:${PORT}`);
      console.log(`Admin panel → http://localhost:${PORT}/admin.html`);
      console.log(process.env.DATABASE_URL ? "Database: Postgres (DATABASE_URL)" : "Database: PGlite on this computer (server/data/pglite)");
    });
  })
  .catch((e) => { console.error("Could not open the database:", e.message); process.exit(1); });
