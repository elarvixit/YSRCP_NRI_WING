// Admin API for the NRI Wing team (used by website/admin.html).
// Roles: "admin" sees everything; "coordinator" sees only members and WhatsApp requests of their own city.
const express = require("express");
const { one, all, run } = require("../db");
const { adminToken, checkPassword, requireAdmin, requireFullAdmin } = require("../auth");
const U = require("../util");
const TK = require("../tickets");
const social = require("../social");

const r = express.Router();
const loginLimit = U.rateLimit("admin-login", 8, 15 * 60e3);

r.post("/login", loginLimit, async (req, res) => {
  const username = U.text(req.body && req.body.username, "Username", { max: 60 });
  const password = U.text(req.body && req.body.password, "Password", { max: 200 });
  const a = await one("SELECT * FROM ysr_nri_wing_admins WHERE lower(username) = lower(?)", username);
  if (!a || !checkPassword(password, a.pass_hash)) return res.status(401).json({ error: "Wrong username or password." });
  res.json({ token: adminToken(a), admin: { username: a.username, role: a.role, chapter: a.chapter } });
});

r.use(requireAdmin);

const chapterFilter = (req) => (req.admin.role === "coordinator" ? req.admin.chapter : null);

r.get("/summary", async (req, res) => {
  const ch = chapterFilter(req);
  const count = async (sql, ...a) => (await one(sql, ...a)).n;
  const [members, ticketsOpen, ticketsUrgent, ticketsOverdue, ticketsUnassigned, meetNew, whatsappNew, byCountry] = await Promise.all([
    ch ? count("SELECT COUNT(*) AS n FROM ysr_nri_wing_members WHERE chapter = ?", ch) : count("SELECT COUNT(*) AS n FROM ysr_nri_wing_members"),
    count("SELECT COUNT(*) AS n FROM ysr_nri_wing_tickets WHERE status <> 'Resolved'"),
    count("SELECT COUNT(*) AS n FROM ysr_nri_wing_tickets WHERE urgent = 1 AND status <> 'Resolved'"),
    count("SELECT COUNT(*) AS n FROM ysr_nri_wing_tickets WHERE status <> 'Resolved' AND due_at < now()"),
    count("SELECT COUNT(*) AS n FROM ysr_nri_wing_tickets WHERE status <> 'Resolved' AND volunteer_id IS NULL"),
    count("SELECT COUNT(*) AS n FROM ysr_nri_wing_meet_requests WHERE status = 'New'"),
    ch ? count("SELECT COUNT(*) AS n FROM ysr_nri_wing_whatsapp_requests WHERE status = 'New' AND chapter = ?", ch) : count("SELECT COUNT(*) AS n FROM ysr_nri_wing_whatsapp_requests WHERE status = 'New'"),
    ch ? [] : all("SELECT country, COUNT(*) AS n FROM ysr_nri_wing_members GROUP BY country ORDER BY n DESC")
  ]);
  res.json({ me: req.admin, members, ticketsOpen, ticketsUrgent, ticketsOverdue, ticketsUnassigned, meetNew, whatsappNew, byCountry });
});

/* ---------- members ---------- */
r.get("/members", async (req, res) => {
  const q = `%${String(req.query.q || "").trim()}%`;
  const ch = chapterFilter(req);
  const rows = await all(`SELECT member_no, name, email, phone, country, city, profession, district, constituency, chapter, created_at
                          FROM ysr_nri_wing_members WHERE (name ILIKE ? OR email ILIKE ? OR city ILIKE ? OR country ILIKE ? OR member_no ILIKE ?)
                          ${ch ? "AND chapter = ?" : ""} ORDER BY id DESC LIMIT 500`, q, q, q, q, q, ...(ch ? [ch] : []));
  res.json({ members: rows });
});

/* ---------- help desk ---------- */
r.get("/tickets", requireFullAdmin, async (req, res) => {
  const st = req.query.status;
  const sql = `SELECT t.*, COALESCE(t.phone, m.phone) AS contact_phone, v.name AS volunteer_name, v.phone AS volunteer_phone,
                      (t.status <> 'Resolved' AND t.due_at < now()) AS overdue
               FROM ysr_nri_wing_tickets t LEFT JOIN ysr_nri_wing_members m ON m.id = t.member_id LEFT JOIN ysr_nri_wing_volunteers v ON v.id = t.volunteer_id`;
  const rows = st ? await all(sql + " WHERE t.status = ? ORDER BY t.urgent DESC, t.id DESC LIMIT 500", st)
                  : await all(sql + " ORDER BY (t.status = 'Resolved'), t.urgent DESC, t.id DESC LIMIT 500");
  res.json({ tickets: rows.map(({ volunteer_token, ...t }) => ({ ...t, has_task_link: !!volunteer_token })) });
});
r.get("/tickets/:no/history", requireFullAdmin, async (req, res) => {
  const t = await one("SELECT id FROM ysr_nri_wing_tickets WHERE ticket_no = ?", req.params.no);
  if (!t) return res.status(404).json({ error: "Ticket not found." });
  res.json({ history: await all("SELECT status, note, by_who, created_at FROM ysr_nri_wing_ticket_events WHERE ticket_id = ? ORDER BY id", t.id) });
});
r.patch("/tickets/:no", requireFullAdmin, async (req, res) => {
  const t = await one("SELECT * FROM ysr_nri_wing_tickets WHERE ticket_no = ?", req.params.no);
  if (!t) return res.status(404).json({ error: "Ticket not found." });
  const b = req.body || {};
  if (b.notes !== undefined) await run("UPDATE ysr_nri_wing_tickets SET notes = ? WHERE id = ?", U.text(b.notes, "Notes", { max: 1000, required: false }) || null, t.id);
  if (b.status !== undefined) {
    const status = U.oneOf(b.status, TK.STATUSES, "status");
    const resolution = U.text(b.resolution, "Resolution", { max: 800, required: false }) || null;
    await TK.setStatus(t, status, { by: "Admin " + req.admin.name, resolution, note: resolution });
  }
  res.json({ ok: true });
});
// Assign: pick a district volunteer → ticket becomes "Assigned" and gets a private task link for that volunteer
r.post("/tickets/:no/assign", requireFullAdmin, async (req, res) => {
  const t = await one("SELECT * FROM ysr_nri_wing_tickets WHERE ticket_no = ?", req.params.no);
  if (!t) return res.status(404).json({ error: "Ticket not found." });
  const v = await one("SELECT * FROM ysr_nri_wing_volunteers WHERE id = ? AND active = 1", U.id(req.body && req.body.volunteerId));
  if (!v) return res.status(400).json({ error: "Please choose an active volunteer." });
  const updated = await TK.assign(t, v, "Admin " + req.admin.name);
  const origin = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/+$/, "") : `${req.protocol}://${req.get("host")}`;
  const link = `${origin}/task.html?t=${updated.volunteer_token}`;
  const msg = `Namaskaram ${v.name.split(/\s+/)[0]} garu, YSRCP NRI Wing Help Desk has assigned you request #${t.ticket_no} (${t.category}, ${t.district}${t.urgent ? ", URGENT" : ""}). Details and updates: ${link}`;
  res.json({ ok: true, link, whatsapp: `https://wa.me/${v.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(msg)}` });
});

/* ---------- country committees (President, Vice President …) ---------- */
const leaderFields = (b) => {
  const photo = b.photo ? String(b.photo) : null;
  if (photo && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 250000)) throw new U.BadRequest("Please choose a JPG or PNG photo.");
  return { country: U.text(b.country, "Country", { max: 60 }), role: U.oneOf(b.role, U.COMMITTEE_ROLES, "position"),
    name: U.text(b.name, "Name", { min: 2, max: 80 }), city: U.text(b.city, "City", { max: 60, required: false }) || null, photo };
};
r.get("/country-teams", requireFullAdmin, async (_req, res) => {
  res.json({ roles: U.COMMITTEE_ROLES, leaders: await all("SELECT * FROM ysr_nri_wing_country_leaders ORDER BY country, id") });
});
r.post("/country-teams", requireFullAdmin, async (req, res) => {
  const f = leaderFields(req.body || {});
  const info = await run("INSERT INTO ysr_nri_wing_country_leaders (country, role, name, city, photo) VALUES (?, ?, ?, ?, ?) RETURNING id", f.country, f.role, f.name, f.city, f.photo);
  res.status(201).json({ leader: await one("SELECT * FROM ysr_nri_wing_country_leaders WHERE id = ?", info.lastInsertRowid) });
});
r.patch("/country-teams/:id", requireFullAdmin, async (req, res) => {
  const f = leaderFields(req.body || {});
  const info = await run("UPDATE ysr_nri_wing_country_leaders SET country = ?, role = ?, name = ?, city = ?, photo = COALESCE(?, photo) WHERE id = ?", f.country, f.role, f.name, f.city, f.photo, U.id(req.params.id));
  if (!info.changes) return res.status(404).json({ error: "Not found." });
  res.json({ ok: true });
});
r.delete("/country-teams/:id", requireFullAdmin, async (req, res) => {
  await run("DELETE FROM ysr_nri_wing_country_leaders WHERE id = ?", U.id(req.params.id));
  res.json({ ok: true });
});

/* ---------- volunteers (district team who handle Help Desk requests) ---------- */
r.get("/volunteers", requireFullAdmin, async (_req, res) => {
  res.json({ volunteers: await all(`SELECT v.*, (SELECT COUNT(*) FROM ysr_nri_wing_tickets t WHERE t.volunteer_id = v.id AND t.status <> 'Resolved') AS open_tasks,
                                            (SELECT COUNT(*) FROM ysr_nri_wing_tickets t WHERE t.volunteer_id = v.id AND t.status = 'Resolved') AS resolved_tasks
                                     FROM ysr_nri_wing_volunteers v ORDER BY v.active DESC, v.district, v.name`) });
});
r.post("/volunteers", requireFullAdmin, async (req, res) => {
  const b = req.body || {};
  const info = await run("INSERT INTO ysr_nri_wing_volunteers (name, phone, district) VALUES (?, ?, ?) RETURNING id",
    U.text(b.name, "Name", { min: 2, max: 80 }), U.phone(b.phone), U.text(b.district, "District", { max: 60 }));
  res.status(201).json({ volunteer: await one("SELECT * FROM ysr_nri_wing_volunteers WHERE id = ?", info.lastInsertRowid) });
});
r.patch("/volunteers/:id", requireFullAdmin, async (req, res) => {
  await run("UPDATE ysr_nri_wing_volunteers SET active = ? WHERE id = ?", req.body && req.body.active ? 1 : 0, U.id(req.params.id));
  res.json({ ok: true });
});

/* ---------- Meet Jagan Sir ---------- */
r.get("/meet-requests", requireFullAdmin, async (_req, res) => {
  res.json({ requests: await all("SELECT * FROM ysr_nri_wing_meet_requests ORDER BY (status <> 'New'), id DESC LIMIT 500") });
});
r.patch("/meet-requests/:ref", requireFullAdmin, async (req, res) => {
  const status = U.oneOf(req.body && req.body.status, ["New", "Reviewed", "Scheduled", "Declined"], "status");
  const info = await run("UPDATE ysr_nri_wing_meet_requests SET status = ? WHERE ref = ?", status, req.params.ref);
  if (!info.changes) return res.status(404).json({ error: "Request not found." });
  res.json({ ok: true });
});

/* ---------- WhatsApp group requests ---------- */
r.get("/whatsapp-requests", async (req, res) => {
  const ch = chapterFilter(req);
  res.json({ requests: ch ? await all("SELECT * FROM ysr_nri_wing_whatsapp_requests WHERE chapter = ? ORDER BY id DESC LIMIT 500", ch)
                          : await all("SELECT * FROM ysr_nri_wing_whatsapp_requests ORDER BY id DESC LIMIT 500") });
});
r.patch("/whatsapp-requests/:id", async (req, res) => {
  const status = U.oneOf(req.body && req.body.status, ["New", "Invited", "Declined"], "status");
  const ch = chapterFilter(req);
  const info = ch ? await run("UPDATE ysr_nri_wing_whatsapp_requests SET status = ? WHERE id = ? AND chapter = ?", status, U.id(req.params.id), ch)
                  : await run("UPDATE ysr_nri_wing_whatsapp_requests SET status = ? WHERE id = ?", status, U.id(req.params.id));
  if (!info.changes) return res.status(404).json({ error: "Request not found." });
  res.json({ ok: true });
});

/* ---------- Live with Leaders questions ---------- */
r.get("/questions", requireFullAdmin, async (_req, res) => res.json({ questions: await all("SELECT * FROM ysr_nri_wing_questions ORDER BY id DESC LIMIT 500") }));
r.patch("/questions/:id", requireFullAdmin, async (req, res) => {
  await run("UPDATE ysr_nri_wing_questions SET hidden = ? WHERE id = ?", req.body && req.body.hidden ? 1 : 0, U.id(req.params.id));
  res.json({ ok: true });
});

/* ---------- auto-gallery ---------- */
r.get("/gallery", requireFullAdmin, async (_req, res) => {
  const photos = await all("SELECT * FROM ysr_nri_wing_social_photos ORDER BY COALESCE(posted_at, created_at) DESC, id DESC LIMIT 300");
  res.json({ status: await social.getStatus(), photos: photos.map((p) => ({ ...p, url: /^https?:/.test(p.file) ? p.file : "/media/gallery/" + p.file })) });
});
r.patch("/gallery/:id", requireFullAdmin, async (req, res) => {
  await run("UPDATE ysr_nri_wing_social_photos SET hidden = ? WHERE id = ?", req.body && req.body.hidden ? 1 : 0, U.id(req.params.id));
  res.json({ ok: true });
});
r.post("/gallery/sync", requireFullAdmin, async (_req, res) => {
  res.json({ status: await social.syncSocial() });
});

/* ---------- CSV export ---------- */
const csv = (rows) => {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const cell = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [cols.join(","), ...rows.map((x) => cols.map((c) => cell(x[c])).join(","))].join("\n");
};
r.get("/export/:what", async (req, res) => {
  const ch = chapterFilter(req);
  const what = req.params.what;
  let rows;
  const memberCols = "id, member_no, name, email, phone, country, city, profession, district, constituency, chapter, consent_at, created_at, photo IS NOT NULL AS has_photo";
  if (what === "tickets" && !ch) rows = await all("SELECT t.id, t.ticket_no, t.name, t.phone, t.country, t.category, t.district, t.description, t.urgent, t.status, t.notes, t.resolution, t.created_at, t.assigned_at, t.due_at, t.resolved_at, v.name AS volunteer FROM ysr_nri_wing_tickets t LEFT JOIN ysr_nri_wing_volunteers v ON v.id = t.volunteer_id ORDER BY t.id");
  else if (what === "members") rows = ch ? await all(`SELECT ${memberCols} FROM ysr_nri_wing_members WHERE chapter = ? ORDER BY id`, ch) : await all(`SELECT ${memberCols} FROM ysr_nri_wing_members ORDER BY id`);
  else if (what === "meet-requests" && !ch) rows = await all("SELECT * FROM ysr_nri_wing_meet_requests ORDER BY id");
  else if (what === "whatsapp-requests") rows = ch ? await all("SELECT * FROM ysr_nri_wing_whatsapp_requests WHERE chapter = ? ORDER BY id", ch) : await all("SELECT * FROM ysr_nri_wing_whatsapp_requests ORDER BY id");
  else return res.status(404).json({ error: "Unknown export." });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${what}-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send("﻿" + csv(rows));
});

module.exports = r;
