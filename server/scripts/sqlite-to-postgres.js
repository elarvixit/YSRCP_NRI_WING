// One-time copy of the old SQLite database (server/data/nri.db) into Postgres.
// Target: DATABASE_URL (e.g. Supabase, set in server/.env) or, if not set, the PGlite database on this computer.
// Usage (from the project folder):  npm run import-sqlite            (only into an empty database)
//                                   npm run import-sqlite -- --force (skip tables that already have rows)
const path = require("path");
try { process.loadEnvFile(path.join(__dirname, "..", ".env")); } catch {}
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");
const { one, all, run, close } = require("../db");

const FILE = process.env.SQLITE_FILE || path.join(__dirname, "..", "data", "nri.db");
const TABLES = ["members", "admins", "volunteers", "tickets", "ticket_events", "meet_requests", "whatsapp_requests",
  "rsvps", "task_done", "questions", "country_leaders", "social_photos"];
const force = process.argv.includes("--force");
// SQLite stored UTC as "YYYY-MM-DD HH:MM:SS"
const ts = (v) => (typeof v === "string" && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(v) ? v.replace(" ", "T") + "Z" : v);

(async () => {
  if (!fs.existsSync(FILE)) { console.log("No SQLite database found at " + FILE); return; }
  const src = new DatabaseSync(FILE, { readOnly: true });
  const srcTables = new Set(src.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => t.name));
  for (const table of TABLES) {
    if (!srcTables.has(table)) continue;
    const rows = src.prepare(`SELECT * FROM ${table}`).all();
    if (!rows.length) { console.log(`${table}: empty`); continue; }
    if ((await one(`SELECT COUNT(*) AS n FROM ${table}`)).n > 0) {
      if (!force) { console.log(`${table}: target already has rows – stopping. Use --force to skip such tables.`); process.exitCode = 1; break; }
      console.log(`${table}: skipped (target not empty)`); continue;
    }
    const pgCols = new Set((await all("SELECT column_name FROM information_schema.columns WHERE table_name = ?", table)).map((c) => c.column_name));
    const cols = Object.keys(rows[0]).filter((c) => pgCols.has(c));
    const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`;
    for (const r of rows) await run(sql, ...cols.map((c) => ts(r[c])));
    if (pgCols.has("id")) await one(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${table}))`);
    console.log(`${table}: ${rows.length} rows copied`);
  }
  src.close();
  await close();
})().catch((e) => { console.error("Import failed:", e.message); process.exit(1); });
