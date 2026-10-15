// Public + member API used by the website.
const express = require("express");
const { one, all, run } = require("../db");
const { memberToken, optionalMember, requireMember } = require("../auth");
const U = require("../util");
const TK = require("../tickets");

const r = express.Router();
const postLimit = U.rateLimit("post", 30, 10 * 60e3);   // 30 form posts per 10 min per IP
const loginLimit = U.rateLimit("login", 10, 10 * 60e3);

const publicMember = (m) => m && {
  memberNo: m.member_no, name: m.name, email: m.email, phone: m.phone, country: m.country, city: m.city,
  profession: m.profession, district: m.district, constituency: m.constituency, chapter: m.chapter, joined: m.created_at,
  photo: m.photo || null
};
const pointsOf = async (memberId) => {
  const done = (await all("SELECT task_id FROM task_done WHERE member_id = ?", memberId)).map((x) => x.task_id);
  return U.REGISTER_POINTS + done.reduce((s, t) => s + (U.TASK_POINTS[t] || 0), 0);
};

// health check – also reports which settings are missing (names only, never values)
r.get("/health", async (_req, res) => {
  const missing = [];
  if (process.env.VERCEL) {
    if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
    if (!process.env.APP_SECRET || process.env.APP_SECRET.length < 32) missing.push("APP_SECRET (at least 32 characters)");
  }
  if (missing.length) return res.status(500).json({ ok: false, problem: "Missing settings in Vercel: " + missing.join(", ") });
  try {
    await one("SELECT 1 AS ok");
  } catch (e) {
    const code = e.code ? ` (code ${e.code})` : "";
    const hint = /password authentication failed/i.test(e.message) ? "wrong database password in DATABASE_URL"
      : /ENOTFOUND|getaddrinfo/i.test(e.message) ? "database address in DATABASE_URL not found – check the host name"
      : /Tenant or user not found/i.test(e.message) ? "DATABASE_URL user/project not found – copy the Transaction pooler URI again"
      : /timeout|ETIMEDOUT|ECONNREFUSED/i.test(e.message) ? "could not reach the database – use the Transaction pooler URI (port 6543)"
      : "database connection failed";
    return res.status(500).json({ ok: false, problem: hint + code });
  }
  res.json({ ok: true, database: "connected", time: new Date().toISOString() });
});

/* ---------- members ---------- */
r.post("/members", postLimit, async (req, res) => {
  const b = req.body || {};
  U.mustConsent(b.consent);
  const m = {
    name: U.text(b.name, "Full name", { min: 2, max: 80 }),
    email: U.email(b.email),
    phone: U.phone(b.phone),
    country: U.text(b.country, "Country", { max: 60 }),
    city: U.text(b.city, "City", { max: 60 }),
    profession: U.text(b.profession, "Profession", { max: 80 }),
    district: U.text(b.district, "Home district", { max: 60 }),
    constituency: U.text(b.constituency, "Constituency", { max: 80 }),
    chapter: U.text(b.chapter, "Chapter", { max: 60, required: false }) || null
  };
  if (await one("SELECT id FROM members WHERE lower(email) = ?", m.email)) {
    return res.status(409).json({ error: "This email is already registered. Please log in with your member number." });
  }
  let no;
  do { no = U.memberNo(); } while (await one("SELECT id FROM members WHERE member_no = ?", no));
  const info = await run(`INSERT INTO members (member_no, name, email, phone, country, city, profession, district, constituency, chapter, consent_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now()) RETURNING id`,
    no, m.name, m.email, m.phone, m.country, m.city, m.profession, m.district, m.constituency, m.chapter);
  const row = await one("SELECT * FROM members WHERE id = ?", info.lastInsertRowid);
  res.status(201).json({ token: memberToken(row.id), member: publicMember(row) });
});

r.post("/login", loginLimit, async (req, res) => {
  const email = U.email(req.body && req.body.email);
  const no = U.text(req.body && req.body.memberNo, "Member number", { max: 30 }).toUpperCase();
  const row = await one("SELECT * FROM members WHERE lower(email) = ? AND member_no = ?", email, no);
  if (!row) return res.status(401).json({ error: "We couldn't find that member. Check your email and member number." });
  res.json({ token: memberToken(row.id), member: publicMember(row) });
});

r.get("/me", requireMember, async (req, res) => {
  const row = await one("SELECT * FROM members WHERE id = ?", req.memberId);
  if (!row) return res.status(404).json({ error: "Member not found." });
  const [rsvps, tasks, tickets, points] = await Promise.all([
    all("SELECT event_id FROM rsvps WHERE member_id = ?", row.id),
    all("SELECT task_id FROM task_done WHERE member_id = ?", row.id),
    all("SELECT * FROM tickets WHERE member_id = ? ORDER BY id DESC", row.id),
    pointsOf(row.id)
  ]);
  res.json({
    member: publicMember(row),
    rsvps: rsvps.map((x) => x.event_id),
    tasks: tasks.map((x) => x.task_id),
    tickets: await Promise.all(tickets.map((t) => TK.publicTicket(t, { withResolution: true }))),
    points
  });
});

r.patch("/me", requireMember, async (req, res) => {
  const chapter = U.text(req.body && req.body.chapter, "Chapter", { max: 60 });
  await run("UPDATE members SET chapter = ? WHERE id = ?", chapter, req.memberId);
  res.json({ ok: true, chapter });
});

// member photo for the digital card: a square JPEG, resized in the browser
r.put("/me/photo", requireMember, async (req, res) => {
  const photo = String((req.body && req.body.photo) || "");
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 250000) {
    return res.status(400).json({ error: "Please choose a JPG or PNG photo (it is resized automatically)." });
  }
  await run("UPDATE members SET photo = ? WHERE id = ?", photo, req.memberId);
  res.json({ ok: true, photo });
});
r.delete("/me/photo", requireMember, async (req, res) => {
  await run("UPDATE members SET photo = NULL WHERE id = ?", req.memberId);
  res.json({ ok: true });
});

// DPDP Act: members can delete their data
r.delete("/me", requireMember, async (req, res) => {
  await run("DELETE FROM members WHERE id = ?", req.memberId);
  res.json({ ok: true, message: "Your data has been deleted." });
});

/* ---------- help desk ---------- */
r.post("/tickets", postLimit, optionalMember, async (req, res) => {
  const b = req.body || {};
  U.mustConsent(b.consent);
  const t = {
    name: U.text(b.name, "Name", { min: 2, max: 80 }),
    phone: U.phone(b.phone),
    country: U.text(b.country, "Country", { max: 60 }),
    category: U.oneOf(b.category, U.TICKET_CATEGORIES, "category"),
    district: U.text(b.district, "Home district", { max: 60 }),
    description: U.text(b.description, "Description", { min: 5, max: 800 }),
    urgent: b.urgent === true || b.urgent === "on" || b.urgent === "true" ? 1 : 0
  };
  let no;
  do { no = U.ticketNo(); } while (await one("SELECT id FROM tickets WHERE ticket_no = ?", no));
  const info = await run(`INSERT INTO tickets (ticket_no, member_id, name, phone, country, category, district, description, urgent, due_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${TK.dueDate(t.urgent)}) RETURNING id`,
    no, req.memberId, t.name, t.phone, t.country, t.category, t.district, t.description, t.urgent);
  await TK.addEvent(info.lastInsertRowid, "Received", null, "website");
  res.status(201).json({ ticket: await TK.publicTicket(await one("SELECT * FROM tickets WHERE id = ?", info.lastInsertRowid)) });
});

// tracking shows only status – no personal details
r.get("/tickets/:no", async (req, res) => {
  const no = String(req.params.no || "").toUpperCase().replace(/^#/, "");
  const t = await one("SELECT * FROM tickets WHERE ticket_no = ?", no);
  if (!t) return res.status(404).json({ error: "No ticket found with that number." });
  res.json({ ticket: await TK.publicTicket(t) });
});

/* ---------- volunteer task link (sent to the assigned volunteer on WhatsApp – no login) ---------- */
const taskLimit = U.rateLimit("task", 60, 10 * 60e3);
const taskByToken = async (token) => {
  const t = /^[\w-]{20,40}$/.test(token || "") ? await one("SELECT * FROM tickets WHERE volunteer_token = ?", token) : null;
  return t && t.volunteer_id ? t : null;
};
r.get("/task/:token", taskLimit, async (req, res) => {
  const t = await taskByToken(req.params.token);
  if (!t) return res.status(404).json({ error: "This task link is not valid any more. Please ask the NRI Wing office for a new one." });
  const m = t.member_id ? await one("SELECT phone, email, city, country FROM members WHERE id = ?", t.member_id) : null;
  const v = await one("SELECT name, district FROM volunteers WHERE id = ?", t.volunteer_id);
  res.json({ task: {
    ...(await TK.publicTicket(t, { withResolution: true })),
    name: t.name, phone: t.phone || (m && m.phone) || "", email: (m && m.email) || "", livesIn: m ? `${m.city}, ${m.country}` : t.country,
    description: t.description, volunteerName: v ? v.name : "",
    history: await all("SELECT status, note, by_who, created_at FROM ticket_events WHERE ticket_id = ? ORDER BY id", t.id)
  } });
});
r.post("/task/:token", taskLimit, async (req, res) => {
  const t = await taskByToken(req.params.token);
  if (!t) return res.status(404).json({ error: "This task link is not valid any more." });
  const status = U.oneOf(req.body && req.body.status, ["In progress", "Resolved"], "status");
  const note = U.text(req.body && req.body.note, "Update", { min: status === "Resolved" ? 5 : 0, max: 800, required: status === "Resolved" }) || null;
  const v = await one("SELECT name FROM volunteers WHERE id = ?", t.volunteer_id);
  const updated = await TK.setStatus(t, status, { note, by: "Volunteer " + (v ? v.name : ""), resolution: status === "Resolved" ? note : null });
  res.json({ ok: true, status: updated.status });
});

/* ---------- Meet Jagan Sir ---------- */
r.post("/meet-requests", postLimit, optionalMember, async (req, res) => {
  const b = req.body || {};
  U.mustConsent(b.consent);
  const m = {
    name: U.text(b.name, "Full name", { min: 2, max: 80 }),
    phone: U.phone(b.phone),
    email: U.email(b.email),
    place: U.text(b.place, "Country & city", { max: 80 }),
    type: U.oneOf(b.type, U.MEET_TYPES, "meeting type"),
    people: Math.max(1, Math.min(50, parseInt(b.people, 10) || 1)),
    month: U.text(b.month, "Preferred month", { max: 7, required: false }),
    location: U.oneOf(b.where, U.MEET_PLACES, "place"),
    purpose: U.text(b.purpose, "Purpose", { min: 5, max: 500 })
  };
  let ref;
  do { ref = U.meetRef(); } while (await one("SELECT id FROM meet_requests WHERE ref = ?", ref));
  await run(`INSERT INTO meet_requests (ref, member_id, name, phone, email, place, type, people, month, location, purpose) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ref, req.memberId, m.name, m.phone, m.email, m.place, m.type, m.people, m.month, m.location, m.purpose);
  res.status(201).json({ ref });
});

/* ---------- city WhatsApp group requests ---------- */
r.post("/whatsapp-requests", postLimit, async (req, res) => {
  const b = req.body || {};
  U.mustConsent(b.consent);
  await run("INSERT INTO whatsapp_requests (chapter, name, phone) VALUES (?, ?, ?)",
    U.text(b.chapter, "Chapter", { max: 60 }), U.text(b.name, "Name", { min: 2, max: 80 }), U.phone(b.phone));
  res.status(201).json({ ok: true });
});

/* ---------- events & volunteering ---------- */
r.post("/events/:id/rsvp", requireMember, async (req, res) => {
  const id = U.oneOf(req.params.id, U.EVENT_IDS, "event");
  const had = await one("SELECT 1 AS x FROM rsvps WHERE member_id = ? AND event_id = ?", req.memberId, id);
  if (had) await run("DELETE FROM rsvps WHERE member_id = ? AND event_id = ?", req.memberId, id);
  else await run("INSERT INTO rsvps (member_id, event_id) VALUES (?, ?) ON CONFLICT DO NOTHING", req.memberId, id);
  res.json({ going: !had });
});

r.post("/tasks/:id/toggle", requireMember, async (req, res) => {
  const id = U.oneOf(req.params.id, Object.keys(U.TASK_POINTS), "task");
  const had = await one("SELECT 1 AS x FROM task_done WHERE member_id = ? AND task_id = ?", req.memberId, id);
  if (had) await run("DELETE FROM task_done WHERE member_id = ? AND task_id = ?", req.memberId, id);
  else await run("INSERT INTO task_done (member_id, task_id) VALUES (?, ?) ON CONFLICT DO NOTHING", req.memberId, id);
  res.json({ done: !had, points: await pointsOf(req.memberId) });
});

r.get("/leaderboard", async (_req, res) => {
  const cases = Object.entries(U.TASK_POINTS).map(([k, v]) => `WHEN '${k}' THEN ${v}`).join(" ");
  const rows = await all(`SELECT m.name, m.city, ${U.REGISTER_POINTS} + COALESCE(SUM(CASE t.task_id ${cases} ELSE 0 END), 0) AS pts
                          FROM members m LEFT JOIN task_done t ON t.member_id = m.id
                          GROUP BY m.id ORDER BY pts DESC, m.id ASC LIMIT 10`);
  // show first name + initial only
  res.json({ leaders: rows.map((x) => { const p = x.name.split(/\s+/); return { name: p[0] + (p[1] ? " " + p[1][0] + "." : ""), city: x.city, pts: x.pts }; }) });
});

/* ---------- Live with Leaders questions ---------- */
r.get("/questions", async (_req, res) => {
  res.json({ questions: await all(`SELECT name AS "by", text AS q, created_at FROM questions WHERE hidden = 0 ORDER BY id DESC LIMIT 10`) });
});
r.post("/questions", postLimit, optionalMember, async (req, res) => {
  const q = U.text(req.body && req.body.text, "Question", { min: 5, max: 300 });
  let by = "NRI supporter";
  if (req.memberId) {
    const m = await one("SELECT name, city FROM members WHERE id = ?", req.memberId);
    if (m) by = `${m.name.split(/\s+/)[0]}, ${m.city}`;
  }
  await run("INSERT INTO questions (member_id, name, text) VALUES (?, ?, ?)", req.memberId, by, q);
  res.status(201).json({ ok: true, by });
});

/* ---------- auto-gallery (Facebook / Instagram) ---------- */
r.get("/gallery", async (_req, res) => {
  const rows = await all(`SELECT id, source, file, caption, permalink, COALESCE(posted_at, created_at) AS posted_at
                          FROM social_photos WHERE hidden = 0 ORDER BY 6 DESC, id ASC LIMIT 60`);
  res.json({ photos: rows.map((p) => ({ id: p.id, source: p.source, src: /^https?:/.test(p.file) ? p.file : "/media/gallery/" + p.file,
    caption: p.caption || "", permalink: p.permalink || "", postedAt: p.posted_at })) });
});

/* ---------- country committees ---------- */
r.get("/country-teams", async (_req, res) => {
  const order = `CASE role ${U.COMMITTEE_ROLES.map((x, i) => `WHEN '${x}' THEN ${i}`).join(" ")} ELSE 99 END`;
  const rows = await all(`SELECT id, country, role, name, city, photo FROM country_leaders ORDER BY country, ${order}, id`);
  const teams = {};
  for (const x of rows) (teams[x.country] = teams[x.country] || []).push(x);
  res.json({ roles: U.COMMITTEE_ROLES, teams });
});

/* ---------- public numbers ---------- */
r.get("/stats", async (_req, res) => {
  const [m, c, t] = await Promise.all([
    one("SELECT COUNT(*) AS n FROM members"),
    one("SELECT COUNT(DISTINCT country) AS n FROM members"),
    one("SELECT COUNT(*) AS n FROM tickets WHERE status = 'Resolved'")
  ]);
  res.json({ members: m.n, countries: c.n, ticketsResolved: t.n });
});

module.exports = r;
