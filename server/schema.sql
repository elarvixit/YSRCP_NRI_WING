-- YSRCP NRI Wing – database tables (Postgres / Supabase)
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run again: it only creates what is missing.
-- (The server also runs this automatically on its first request.)
CREATE TABLE IF NOT EXISTS members (
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
CREATE UNIQUE INDEX IF NOT EXISTS members_email_key ON members (lower(email));
CREATE INDEX IF NOT EXISTS idx_members_chapter ON members (chapter);

CREATE TABLE IF NOT EXISTS admins (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL,
  pass_hash   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'coordinator')),
  chapter     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS admins_username_key ON admins (lower(username));

CREATE TABLE IF NOT EXISTS volunteers (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  district   TEXT NOT NULL,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id              SERIAL PRIMARY KEY,
  ticket_no       TEXT NOT NULL UNIQUE,
  member_id       INTEGER REFERENCES members(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  phone           TEXT,
  country         TEXT NOT NULL,
  category        TEXT NOT NULL,
  district        TEXT NOT NULL,
  description     TEXT NOT NULL,
  urgent          INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'Received' CHECK (status IN ('Received', 'Assigned', 'In progress', 'Resolved')),
  notes           TEXT,
  volunteer_id    INTEGER REFERENCES volunteers(id) ON DELETE SET NULL,
  volunteer_token TEXT UNIQUE,
  assigned_at     TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,
  resolution      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_member ON tickets (member_id);

CREATE TABLE IF NOT EXISTS ticket_events (
  id         SERIAL PRIMARY KEY,
  ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  by_who     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket ON ticket_events (ticket_id);

CREATE TABLE IF NOT EXISTS meet_requests (
  id          SERIAL PRIMARY KEY,
  ref         TEXT NOT NULL UNIQUE,
  member_id   INTEGER REFERENCES members(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS whatsapp_requests (
  id          SERIAL PRIMARY KEY,
  chapter     TEXT NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Invited', 'Declined')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rsvps (
  member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, event_id)
);

CREATE TABLE IF NOT EXISTS task_done (
  member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  task_id     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, task_id)
);

CREATE TABLE IF NOT EXISTS questions (
  id          SERIAL PRIMARY KEY,
  member_id   INTEGER REFERENCES members(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  text        TEXT NOT NULL,
  hidden      INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- country committees: President, Vice President … (filled in by admins)
CREATE TABLE IF NOT EXISTS country_leaders (
  id         SERIAL PRIMARY KEY,
  country    TEXT NOT NULL,
  role       TEXT NOT NULL,
  name       TEXT NOT NULL,
  city       TEXT,
  photo      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- photos pulled from the wing's Facebook / Instagram (see social.js)
CREATE TABLE IF NOT EXISTS social_photos (
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
CREATE TABLE IF NOT EXISTS app_state (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Supabase: block direct access through the public API (anon / authenticated keys).
-- The website's server connects as the database owner, which is not affected.
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_done ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
