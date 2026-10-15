// Database: Postgres.
//  • Online (Vercel)  → Supabase Postgres, set DATABASE_URL (Supabase → Connect → "Transaction pooler").
//  • On this computer → if DATABASE_URL is not set, PGlite (Postgres in a folder: server/data/pglite).
// The same SQL runs on both. Query helpers use "?" placeholders: one(), all(), run().
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
// every table is named ysr_nri_wing_<table>, so it can share a Supabase project with other apps
const TABLE_PREFIX = "ysr_nri_wing_";
const TABLES = ["members", "admins", "volunteers", "tickets", "ticket_events", "meet_requests", "whatsapp_requests",
  "rsvps", "task_done", "questions", "country_leaders", "social_photos", "app_state"];
const ON_VERCEL = !!process.env.VERCEL;

// timestamps → "YYYY-MM-DD HH:MM:SS" in UTC (the format the website and admin panel expect)
function fmtTs(v) {
  if (v == null) return v;
  let s = String(v).trim().replace(" ", "T");
  if (/[+-]\d\d$/.test(s)) s += ":00";                         // "+05" → "+05:00"
  else if (!/(Z|[+-]\d\d:?\d\d)$/.test(s)) s += "Z";             // no zone → UTC
  const d = new Date(s);
  return isNaN(d) ? String(v) : d.toISOString().slice(0, 19).replace("T", " ");
}
const PARSERS = { 20: (v) => parseInt(v, 10), 1700: (v) => parseFloat(v), 1114: fmtTs, 1184: fmtTs };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS ysr_nri_wing_members (
  id            SERIAL PRIMARY KEY,
  member_no     TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT NOT NULL,
  country       TEXT NOT NULL,
  city          TEXT NOT NULL,
  profession    TEXT,
  district      TEXT,
  constituency  TEXT,
  chapter       TEXT,
  photo         TEXT,
  consent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ysr_nri_wing_members_email_key ON ysr_nri_wing_members (lower(email));
CREATE INDEX IF NOT EXISTS ysr_nri_wing_idx_members_chapter ON ysr_nri_wing_members (chapter);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_admins (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL,
  pass_hash   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'coordinator')),
  chapter     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ysr_nri_wing_admins_username_key ON ysr_nri_wing_admins (lower(username));

CREATE TABLE IF NOT EXISTS ysr_nri_wing_volunteers (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  district   TEXT NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_tickets (
  id              SERIAL PRIMARY KEY,
  ticket_no       TEXT NOT NULL UNIQUE,
  member_id       INTEGER REFERENCES ysr_nri_wing_members(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  country         TEXT NOT NULL,
  category        TEXT NOT NULL,
  district        TEXT NOT NULL,
  description     TEXT NOT NULL,
  urgent          INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'Received' CHECK (status IN ('Received', 'Assigned', 'In progress', 'Resolved')),
  notes           TEXT,
  volunteer_id    INTEGER REFERENCES ysr_nri_wing_volunteers(id) ON DELETE SET NULL,
  volunteer_token TEXT UNIQUE,
  assigned_at     TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,
  resolution      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ysr_nri_wing_idx_tickets_status ON ysr_nri_wing_tickets (status);
CREATE INDEX IF NOT EXISTS ysr_nri_wing_idx_tickets_member ON ysr_nri_wing_tickets (member_id);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_ticket_events (
  id         SERIAL PRIMARY KEY,
  ticket_id  INTEGER NOT NULL REFERENCES ysr_nri_wing_tickets(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  by_who     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ysr_nri_wing_idx_ticket_events_ticket ON ysr_nri_wing_ticket_events (ticket_id);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_meet_requests (
  id          SERIAL PRIMARY KEY,
  ref         TEXT NOT NULL UNIQUE,
  member_id   INTEGER REFERENCES ysr_nri_wing_members(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT NOT NULL,
  place       TEXT NOT NULL,
  type        TEXT NOT NULL,
  people      INTEGER NOT NULL DEFAULT 1,
  month       TEXT,
  location    TEXT,
  purpose     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewed', 'Scheduled', 'Declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_whatsapp_requests (
  id          SERIAL PRIMARY KEY,
  chapter     TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Invited', 'Declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_rsvps (
  member_id   INTEGER NOT NULL REFERENCES ysr_nri_wing_members(id) ON DELETE CASCADE,
  event_id    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, event_id)
);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_task_done (
  member_id   INTEGER NOT NULL REFERENCES ysr_nri_wing_members(id) ON DELETE CASCADE,
  task_id     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, task_id)
);

CREATE TABLE IF NOT EXISTS ysr_nri_wing_questions (
  id          SERIAL PRIMARY KEY,
  member_id   INTEGER REFERENCES ysr_nri_wing_members(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  text        TEXT NOT NULL,
  hidden      INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- country committees: President, Vice President … (filled in by admins)
CREATE TABLE IF NOT EXISTS ysr_nri_wing_country_leaders (
  id         SERIAL PRIMARY KEY,
  country    TEXT NOT NULL,
  role       TEXT NOT NULL,
  name       TEXT NOT NULL,
  city       TEXT,
  photo      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- photos pulled from the wing's Facebook / Instagram (see social.js)
CREATE TABLE IF NOT EXISTS ysr_nri_wing_social_photos (
  id         SERIAL PRIMARY KEY,
  source     TEXT NOT NULL,            -- facebook | instagram
  ext_id     TEXT NOT NULL,
  file       TEXT NOT NULL,            -- Supabase Storage URL, or a file name in data/gallery/ on this computer
  caption    TEXT,
  permalink  TEXT,
  posted_at  TIMESTAMPTZ,
  hidden     INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, ext_id)
);

-- small key/value store (e.g. last gallery check)
CREATE TABLE IF NOT EXISTS ysr_nri_wing_app_state (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase: block direct access through the public API (anon / authenticated keys).
-- The website's server connects as the database owner, which is not affected.
ALTER TABLE ysr_nri_wing_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_meet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_whatsapp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_task_done ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_country_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_social_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ysr_nri_wing_app_state ENABLE ROW LEVEL SECURITY;
`;

/* ---------- driver: pg (Supabase) or PGlite (local) ---------- */
async function connect() {
  if (process.env.DATABASE_URL) {
    const { Pool, types } = require("pg");
    for (const [oid, fn] of Object.entries(PARSERS)) types.setTypeParser(Number(oid), fn);
    const url = process.env.DATABASE_URL;
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    const pool = new Pool({ connectionString: url, max: ON_VERCEL ? 3 : 10, ssl: local ? false : { rejectUnauthorized: false } });
    pool.on("error", (e) => console.error("[db]", e.message));
    return {
      exec: (sql) => pool.query(sql),
      query: async (sql, params) => { const r = await pool.query(sql, params); return { rows: r.rows, changes: r.rowCount || 0 }; },
      close: () => pool.end()
    };
  }
  if (ON_VERCEL) throw new Error("DATABASE_URL is not set – add your Supabase connection string in Vercel → Settings → Environment Variables.");
  const fs = require("fs");
  const dir = process.env.PGLITE_DIR || path.join(DATA_DIR, "pglite");
  fs.mkdirSync(dir, { recursive: true });
  const mod = "@electric-sql/pglite"; // loaded only on this computer (not bundled for Vercel)
  const { PGlite } = await import(mod);
  const db = new PGlite(dir, { parsers: PARSERS });
  await db.waitReady;
  // this computer only: tables from before the ysr_nri_wing_ prefix are renamed (keeps the local data)
  const { rows: old } = await db.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  const have = new Set(old.map((r) => r.tablename));
  for (const t of TABLES) {
    if (have.has(t) && !have.has(TABLE_PREFIX + t)) await db.exec(`ALTER TABLE ${t} RENAME TO ${TABLE_PREFIX}${t}`);
  }
  return {
    exec: (sql) => db.exec(sql),
    query: async (sql, params) => { const r = await db.query(sql, params); return { rows: r.rows, changes: r.affectedRows || 0 }; },
    close: () => db.close()
  };
}

let ready;
function getDb() {
  if (!ready) {
    ready = (async () => {
      const d = await connect();
      await d.exec(SCHEMA);
      await bootstrapAdmin(d);
      return d;
    })();
    ready.catch(() => { ready = null; }); // try again on the next request
  }
  return ready;
}

// first admin from ADMIN_USERNAME / ADMIN_PASSWORD (only when there is no admin yet)
async function bootstrapAdmin(d) {
  const u = process.env.ADMIN_USERNAME, p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return;
  const { rows } = await d.query("SELECT COUNT(*) AS n FROM ysr_nri_wing_admins");
  if (rows[0].n > 0) return;
  if (p.length < 10) { console.error("[db] ADMIN_PASSWORD must be at least 10 characters – first admin not created."); return; }
  const { hashPassword } = require("./auth");
  await d.query("INSERT INTO ysr_nri_wing_admins (username, pass_hash, role) VALUES ($1, $2, 'admin')", [u, hashPassword(p)]);
  console.log(`[db] first admin "${u}" created from ADMIN_USERNAME / ADMIN_PASSWORD.`);
}

// "?" → "$1, $2 …" (no "?" is used inside SQL text in this project)
const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => "$" + ++i); };

async function query(sql, args) { const d = await getDb(); return d.query(toPg(sql), args); }
const one = async (sql, ...args) => (await query(sql, args)).rows[0];
const all = async (sql, ...args) => (await query(sql, args)).rows;
// run(): { changes, lastInsertRowid } – add "RETURNING id" to an INSERT to get lastInsertRowid
const run = async (sql, ...args) => { const r = await query(sql, args); return { changes: r.changes, lastInsertRowid: r.rows[0] && r.rows[0].id }; };
const close = async () => { if (ready) { const d = await ready; await d.close(); ready = null; } };

module.exports = { one, all, run, close, getDb, fmtTs, DATA_DIR, TABLE_PREFIX, TABLES };
