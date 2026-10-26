// Public + member API used by the website.
const express = require("express");
const { one, all, run } = require("../db");
const { memberToken, optionalMember, requireMember, verifyTicket, readVerifyTicket } = require("../auth");
const U = require("../util");
const TK = require("../tickets");
const crypto = require("crypto");
const mailer = require("../mailer");

const r = express.Router();
const postLimit = U.rateLimit("post", 30, 10 * 60e3);   // 30 form posts per 10 min per IP
const loginLimit = U.rateLimit("login", 30, 10 * 60e3); // each code still allows only 5 wrong tries

const publicMember = (m) => m && {
  memberNo: m.member_no, name: m.name, email: m.email, phone: m.phone, country: m.country, city: m.city,
  profession: m.profession, district: m.district, constituency: m.constituency, chapter: m.chapter, joined: m.created_at,
  photo: m.photo || null, showPhoto: !!m.show_photo, notifyEmail: !!m.notify_email,
  emailVerified: !!m.email_verified, phoneVerified: !!m.phone_verified
};
const pointsOf = async (memberId) => {
  const done = (await all("SELECT task_id FROM ysr_nri_wing_task_done WHERE member_id = ? AND status = 'approved'", memberId)).map((x) => U.baseTask(x.task_id));
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

// what the website should show (e.g. email-code login when email sending is set up)
r.get("/config", (_req, res) => res.json({ otp: mailer.otpEnabled(), verifyEmail: true, emailReady: mailer.otpEnabled(), week: U.isoWeek() }));

/* ---------- registration: verify the email with a 6-digit code (required) ---------- */
const verifyLimit6 = U.rateLimit("verify-code", 30, 10 * 60e3);
const vHash = (ch, target, code) => crypto.createHash("sha256").update(`${ch}:${target}:${code}:${process.env.APP_SECRET || "local"}`).digest("hex");
const vTarget = (_ch, value) => U.email(value);
r.post("/verify/send", verifyLimit6, async (req, res) => {
  const ch = U.oneOf((req.body && req.body.channel) || "email", ["email"], "channel");
  if (!mailer.otpEnabled()) return res.status(503).json({ error: "Registration is paused: email verification is not set up yet. Please try again later or contact info@ysrcpnriwing.org." });
  const target = vTarget(ch, req.body.value);
  if (ch === "email" && await one("SELECT id FROM ysr_nri_wing_members WHERE lower(email) = ?", target)) {
    return res.status(409).json({ error: "This email is already registered. Please log in instead." });
  }
  const code = String(crypto.randomInt(100000, 1000000));
  await run("UPDATE ysr_nri_wing_verify_codes SET used = 1 WHERE channel = ? AND target = ? AND used = 0", ch, target);
  await run("INSERT INTO ysr_nri_wing_verify_codes (channel, target, code_hash, expires_at) VALUES (?, ?, ?, now() + interval '10 minutes')", ch, target, vHash(ch, target, code));
  const text = `Your YSRCP NRI Wing verification code is ${code}. It works for 10 minutes.`;
  {
    const sent = await mailer.send(target, `YSRCP NRI Wing verification code: ${code}`, text,
      mailer.layout("Verify your email", `<p>Your verification code is</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>It works for 10 minutes.</p>`), "verify-code");
    if (!sent) return res.status(502).json({ error: "We could not send the email right now. Please check the address or try again in a minute." });
  }
  res.json({ ok: true, message: "We sent a 6-digit code to your email.", ...(mailer.testMode() ? { testCode: code } : {}) });
});
r.post("/verify/check", verifyLimit6, async (req, res) => {
  const ch = U.oneOf((req.body && req.body.channel) || "email", ["email"], "channel");
  const target = vTarget(ch, req.body.value);
  const code = String(req.body.code || "").replace(/\D/g, "");
  const row = await one("SELECT * FROM ysr_nri_wing_verify_codes WHERE channel = ? AND target = ? AND used = 0 AND expires_at > now() ORDER BY id DESC LIMIT 1", ch, target);
  if (!row || row.attempts >= 5) return res.status(400).json({ error: "This code has expired. Please ask for a new one." });
  if (code.length !== 6 || vHash(ch, target, code) !== row.code_hash) {
    await run("UPDATE ysr_nri_wing_verify_codes SET attempts = attempts + 1 WHERE id = ?", row.id);
    return res.status(400).json({ error: "Wrong code. Please check and try again." });
  }
  await run("UPDATE ysr_nri_wing_verify_codes SET used = 1 WHERE id = ?", row.id);
  res.json({ ok: true, ticket: verifyTicket(ch, target) });
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
  if (await one("SELECT id FROM ysr_nri_wing_members WHERE lower(email) = ?", m.email)) {
    return res.status(409).json({ error: "This email is already registered. Please log in instead." });
  }
  // no membership without a verified email
  const emailOk = readVerifyTicket(b.emailTicket, "email", m.email);
  if (!emailOk) return res.status(400).json({ error: "Please verify your email with the 6-digit code before becoming a member." });
  const phoneOk = false;
  let no;
  do { no = U.memberNo(); } while (await one("SELECT id FROM ysr_nri_wing_members WHERE member_no = ?", no));
  const info = await run(`INSERT INTO ysr_nri_wing_members (member_no, name, email, phone, country, city, profession, district, constituency, chapter, consent_at, email_verified, phone_verified)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(), ?, ?) RETURNING id`,
    no, m.name, m.email, m.phone, m.country, m.city, m.profession, m.district, m.constituency, m.chapter, emailOk ? 1 : 0, phoneOk ? 1 : 0);
  const row = await one("SELECT * FROM ysr_nri_wing_members WHERE id = ?", info.lastInsertRowid);
  res.status(201).json({ token: memberToken(row.id), member: publicMember(row) });
});

r.post("/login", loginLimit, async (req, res) => {
  if (mailer.otpEnabled()) return res.status(400).json({ error: "Please log in with the code we email you." });
  const email = U.email(req.body && req.body.email);
  const no = U.text(req.body && req.body.memberNo, "Member number", { max: 30 }).toUpperCase();
  const row = await one("SELECT * FROM ysr_nri_wing_members WHERE lower(email) = ? AND member_no = ?", email, no);
  if (!row) return res.status(401).json({ error: "We couldn't find that member. Check your email and member number." });
  res.json({ token: memberToken(row.id), member: publicMember(row) });
});

// email login code: step 1 – send a 6-digit code (same answer whether or not the email is registered)
const codeHash = (email, code) => crypto.createHash("sha256").update(email + ":" + code + ":" + (process.env.APP_SECRET || "local")).digest("hex");
r.post("/login/code", loginLimit, async (req, res) => {
  if (!mailer.otpEnabled()) return res.status(400).json({ error: "Email codes are not set up – log in with your member number." });
  const email = U.email(req.body && req.body.email);
  const m = await one("SELECT name FROM ysr_nri_wing_members WHERE lower(email) = ?", email);
  let lastLoginCode = null;
  if (m) {
    const code = String(crypto.randomInt(100000, 1000000));
    lastLoginCode = code;
    await run("UPDATE ysr_nri_wing_login_codes SET used = 1 WHERE lower(email) = ? AND used = 0", email);
    await run("INSERT INTO ysr_nri_wing_login_codes (email, code_hash, expires_at) VALUES (?, ?, now() + interval '10 minutes')", email, codeHash(email, code));
    await mailer.send(email, `Your YSRCP NRI Wing login code: ${code}`,
      `Namaskaram ${m.name.split(/\s+/)[0]},\n\nYour login code is ${code}. It works for 10 minutes.\nIf you did not ask for it, you can ignore this email.`,
      mailer.layout("Your login code", `<p>Your login code is</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p><p>It works for 10 minutes. If you did not ask for it, you can ignore this email.</p>`), "login-code");
  }
  res.json({ ok: true, message: "If this email is registered, we have sent a 6-digit code.", ...(mailer.testMode() && m ? { testCode: lastLoginCode } : {}) });
});
// step 2 – check the code (max 5 tries)
r.post("/login/verify", loginLimit, async (req, res) => {
  const email = U.email(req.body && req.body.email);
  const code = String((req.body && req.body.code) || "").replace(/\D/g, "");
  const row = await one("SELECT * FROM ysr_nri_wing_login_codes WHERE lower(email) = ? AND used = 0 AND expires_at > now() ORDER BY id DESC LIMIT 1", email);
  if (!row || row.attempts >= 5) return res.status(401).json({ error: "This code has expired. Please ask for a new one." });
  if (code.length !== 6 || codeHash(email, code) !== row.code_hash) {
    await run("UPDATE ysr_nri_wing_login_codes SET attempts = attempts + 1 WHERE id = ?", row.id);
    return res.status(401).json({ error: "Wrong code. Please check the email and try again." });
  }
  await run("UPDATE ysr_nri_wing_login_codes SET used = 1 WHERE id = ?", row.id);
  const m = await one("SELECT * FROM ysr_nri_wing_members WHERE lower(email) = ?", email);
  if (!m) return res.status(401).json({ error: "Member not found." });
  res.json({ token: memberToken(m.id), member: publicMember(m) });
});

r.get("/me", requireMember, async (req, res) => {
  const row = await one("SELECT * FROM ysr_nri_wing_members WHERE id = ?", req.memberId);
  if (!row) return res.status(404).json({ error: "Member not found." });
  const [rsvps, tasks, tickets, points] = await Promise.all([
    all("SELECT event_id FROM ysr_nri_wing_rsvps WHERE member_id = ?", row.id),
    all("SELECT task_id, status, review_note, proof_url, proof_note, created_at, updated_at FROM ysr_nri_wing_task_done WHERE member_id = ?", row.id),
    all("SELECT * FROM ysr_nri_wing_tickets WHERE member_id = ? ORDER BY id DESC", row.id),
    pointsOf(row.id)
  ]);
  res.json({
    member: publicMember(row),
    rsvps: rsvps.map((x) => x.event_id),
    // tasks repeat weekly: the website shows this week's state; points add up over all weeks
    week: U.isoWeek(),
    tasks: tasks.filter((x) => x.status === "approved" && x.task_id === U.taskKey(U.baseTask(x.task_id))).map((x) => U.baseTask(x.task_id)),
    taskSubmissions: tasks.filter((x) => x.task_id === U.taskKey(U.baseTask(x.task_id)))
      .map((x) => ({ id: U.baseTask(x.task_id), status: x.status, reviewNote: x.review_note || "", proofUrl: x.proof_url || "", note: x.proof_note || "", at: x.updated_at })),
    tasksApprovedTotal: tasks.filter((x) => x.status === "approved").length,
    deletionRequest: (await one("SELECT status, created_at, review_note FROM ysr_nri_wing_deletion_requests WHERE member_id = ? ORDER BY id DESC LIMIT 1", row.id)) || null,
    tickets: await Promise.all(tickets.map((t) => TK.publicTicket(t, { withResolution: true }))),
    points
  });
});

r.patch("/me", requireMember, async (req, res) => {
  const b = req.body || {};
  if (b.chapter !== undefined) await run("UPDATE ysr_nri_wing_members SET chapter = ? WHERE id = ?", U.text(b.chapter, "Chapter", { max: 60 }), req.memberId);
  if (b.showPhoto !== undefined) await run("UPDATE ysr_nri_wing_members SET show_photo = ? WHERE id = ?", b.showPhoto ? 1 : 0, req.memberId);
  if (b.notifyEmail !== undefined) await run("UPDATE ysr_nri_wing_members SET notify_email = ? WHERE id = ?", b.notifyEmail ? 1 : 0, req.memberId);
  if (b.lang !== undefined) await run("UPDATE ysr_nri_wing_members SET lang = ? WHERE id = ?", b.lang === "te" ? "te" : "en", req.memberId);
  const m = await one("SELECT * FROM ysr_nri_wing_members WHERE id = ?", req.memberId);
  res.json({ ok: true, chapter: m.chapter, member: publicMember(m) });
});

// DPDP Act / GDPR: download everything we hold about you
r.get("/me/export", requireMember, async (req, res) => {
  const m = await one("SELECT * FROM ysr_nri_wing_members WHERE id = ?", req.memberId);
  if (!m) return res.status(404).json({ error: "Member not found." });
  const [tickets, rsvps, tasks, questions, meet, jobs] = await Promise.all([
    all("SELECT ticket_no, category, district, description, status, resolution, created_at, resolved_at FROM ysr_nri_wing_tickets WHERE member_id = ?", m.id),
    all("SELECT event_id, created_at FROM ysr_nri_wing_rsvps WHERE member_id = ?", m.id),
    all("SELECT task_id, status, proof_url, proof_note, review_note, created_at FROM ysr_nri_wing_task_done WHERE member_id = ?", m.id),
    all("SELECT text, created_at FROM ysr_nri_wing_questions WHERE member_id = ?", m.id),
    all("SELECT ref, type, purpose, status, created_at FROM ysr_nri_wing_meet_requests WHERE member_id = ?", m.id),
    all("SELECT kind, title, status, created_at FROM ysr_nri_wing_jobs WHERE member_id = ?", m.id)
  ]);
  const { id, ...profile } = m;
  res.setHeader("Content-Disposition", `attachment; filename="my-ysrcp-nri-data-${m.member_no}.json"`);
  res.json({ exportedAt: new Date().toISOString(), profile: { ...profile, photo: m.photo ? "(photo included in your member card)" : null },
    helpRequests: tickets, eventRsvps: rsvps, volunteerTasks: tasks, questions, meetingRequests: meet, jobPosts: jobs });
});

// member photo for the digital card: a square JPEG, resized in the browser
r.put("/me/photo", requireMember, async (req, res) => {
  const photo = String((req.body && req.body.photo) || "");
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo) || photo.length > 250000) {
    return res.status(400).json({ error: "Please choose a JPG or PNG photo (it is resized automatically)." });
  }
  await run("UPDATE ysr_nri_wing_members SET photo = ? WHERE id = ?", photo, req.memberId);
  res.json({ ok: true, photo });
});
r.delete("/me/photo", requireMember, async (req, res) => {
  await run("UPDATE ysr_nri_wing_members SET photo = NULL WHERE id = ?", req.memberId);
  res.json({ ok: true });
});

// DPDP Act: members can delete their data
// members can't delete themselves – they send a request and an admin approves it
r.delete("/me", requireMember, (_req, res) => res.status(403).json({ error: "Please send a deletion request – an admin will review it." }));
r.post("/me/delete-request", requireMember, async (req, res) => {
  const m = await one("SELECT id, member_no, name, email FROM ysr_nri_wing_members WHERE id = ?", req.memberId);
  if (!m) return res.status(404).json({ error: "Member not found." });
  if (await one("SELECT id FROM ysr_nri_wing_deletion_requests WHERE member_id = ? AND status = 'pending'", m.id)) {
    return res.status(409).json({ error: "You have already sent a deletion request. Our team will review it soon." });
  }
  const reason = U.text(req.body && req.body.reason, "Reason", { max: 500, required: false }) || null;
  await run("INSERT INTO ysr_nri_wing_deletion_requests (member_id, member_no, name, email, reason) VALUES (?, ?, ?, ?, ?)",
    m.id, m.member_no, m.name, m.email, reason);
  // tell the admin by email (ADMIN_ALERT_EMAIL in Vercel can change who gets it)
  const site = (process.env.SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
  const to = process.env.ADMIN_ALERT_EMAIL || "ganesh.derangula@elarvix.com";
  const lines = [`Member: ${m.name} (${m.member_no})`, `Email: ${m.email}`, `Reason: ${reason || "(none given)"}`];
  await mailer.send(to, `Account deletion request – ${m.name} (${m.member_no})`,
    lines.join("\n") + `\n\nReview it in the admin panel: ${site}/admin.html`,
    mailer.layout("New account deletion request", lines.map((l) => `<p style="margin:0 0 6px">${mailer.escHtml(l)}</p>`).join("") +
      `<p style="margin:16px 0 0"><a href="${site}/admin.html" style="background:#1652c4;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open admin panel</a></p>`,
      "Sent to the YSRCP NRI Wing admin."), "admin-deletion");
  res.status(201).json({ ok: true, message: "Request sent. An admin will review it and your account will be deleted after approval." });
});
r.delete("/me/delete-request", requireMember, async (req, res) => {
  await run("UPDATE ysr_nri_wing_deletion_requests SET status = 'cancelled' WHERE member_id = ? AND status = 'pending'", req.memberId);
  res.json({ ok: true });
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
  do { no = U.ticketNo(); } while (await one("SELECT id FROM ysr_nri_wing_tickets WHERE ticket_no = ?", no));
  const info = await run(`INSERT INTO ysr_nri_wing_tickets (ticket_no, member_id, name, phone, country, category, district, description, urgent, due_at)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ${TK.dueDate(t.urgent)}) RETURNING id`,
    no, req.memberId, t.name, t.phone, t.country, t.category, t.district, t.description, t.urgent);
  await TK.addEvent(info.lastInsertRowid, "Received", null, "website");
  res.status(201).json({ ticket: await TK.publicTicket(await one("SELECT * FROM ysr_nri_wing_tickets WHERE id = ?", info.lastInsertRowid)) });
});

// tracking shows only status – no personal details
r.get("/tickets/:no", async (req, res) => {
  const no = String(req.params.no || "").toUpperCase().replace(/^#/, "");
  const t = await one("SELECT * FROM ysr_nri_wing_tickets WHERE ticket_no = ?", no);
  if (!t) return res.status(404).json({ error: "No ticket found with that number." });
  res.json({ ticket: await TK.publicTicket(t) });
});

/* ---------- volunteer task link (sent to the assigned volunteer on WhatsApp – no login) ---------- */
const taskLimit = U.rateLimit("task", 60, 10 * 60e3);
const taskByToken = async (token) => {
  const t = /^[\w-]{20,40}$/.test(token || "") ? await one("SELECT * FROM ysr_nri_wing_tickets WHERE volunteer_token = ?", token) : null;
  return t && t.volunteer_id ? t : null;
};
r.get("/task/:token", taskLimit, async (req, res) => {
  const t = await taskByToken(req.params.token);
  if (!t) return res.status(404).json({ error: "This task link is not valid any more. Please ask the NRI Wing office for a new one." });
  const m = t.member_id ? await one("SELECT phone, email, city, country FROM ysr_nri_wing_members WHERE id = ?", t.member_id) : null;
  const v = await one("SELECT name, district FROM ysr_nri_wing_volunteers WHERE id = ?", t.volunteer_id);
  res.json({ task: {
    ...(await TK.publicTicket(t, { withResolution: true })),
    name: t.name, phone: t.phone || (m && m.phone) || "", email: (m && m.email) || "", livesIn: m ? `${m.city}, ${m.country}` : t.country,
    description: t.description, volunteerName: v ? v.name : "",
    history: await all("SELECT status, note, by_who, created_at FROM ysr_nri_wing_ticket_events WHERE ticket_id = ? ORDER BY id", t.id)
  } });
});
r.post("/task/:token", taskLimit, async (req, res) => {
  const t = await taskByToken(req.params.token);
  if (!t) return res.status(404).json({ error: "This task link is not valid any more." });
  const status = U.oneOf(req.body && req.body.status, ["In progress", "Resolved"], "status");
  const note = U.text(req.body && req.body.note, "Update", { min: status === "Resolved" ? 5 : 0, max: 800, required: status === "Resolved" }) || null;
  const v = await one("SELECT name FROM ysr_nri_wing_volunteers WHERE id = ?", t.volunteer_id);
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
  do { ref = U.meetRef(); } while (await one("SELECT id FROM ysr_nri_wing_meet_requests WHERE ref = ?", ref));
  await run(`INSERT INTO ysr_nri_wing_meet_requests (ref, member_id, name, phone, email, place, type, people, month, location, purpose) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ref, req.memberId, m.name, m.phone, m.email, m.place, m.type, m.people, m.month, m.location, m.purpose);
  res.status(201).json({ ref });
});

/* ---------- city WhatsApp group requests ---------- */
r.post("/whatsapp-requests", postLimit, async (req, res) => {
  const b = req.body || {};
  U.mustConsent(b.consent);
  await run("INSERT INTO ysr_nri_wing_whatsapp_requests (chapter, name, phone) VALUES (?, ?, ?)",
    U.text(b.chapter, "Chapter", { max: 60 }), U.text(b.name, "Name", { min: 2, max: 80 }), U.phone(b.phone));
  res.status(201).json({ ok: true });
});

/* ---------- events & volunteering ---------- */
r.post("/events/:id/rsvp", requireMember, async (req, res) => {
  const id = U.oneOf(req.params.id, U.EVENT_IDS, "event");
  const had = await one("SELECT 1 AS x FROM ysr_nri_wing_rsvps WHERE member_id = ? AND event_id = ?", req.memberId, id);
  if (had) await run("DELETE FROM ysr_nri_wing_rsvps WHERE member_id = ? AND event_id = ?", req.memberId, id);
  else await run("INSERT INTO ysr_nri_wing_rsvps (member_id, event_id) VALUES (?, ?) ON CONFLICT DO NOTHING", req.memberId, id);
  res.json({ going: !had });
});

// volunteer task: the member sends proof (link and/or screenshot) → "pending" until an admin approves
const proofLimit = U.rateLimit("proof", 20, 10 * 60e3);
r.post("/tasks/:id/submit", requireMember, proofLimit, async (req, res) => {
  const id = U.oneOf(req.params.id, Object.keys(U.TASK_POINTS), "task");
  const b = req.body || {};
  const url = U.text(b.url, "Link", { max: 500, required: false }) || null;
  if (url && !/^https?:\/\/\S+$/i.test(url)) throw new U.BadRequest("Please paste the full link, starting with https://");
  const image = b.image ? String(b.image) : null;
  if (image && (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image) || image.length > 280000)) throw new U.BadRequest("Please choose a JPG or PNG screenshot.");
  if (!url && !image) throw new U.BadRequest("Please add the link to your post or a screenshot as proof.");
  const note = U.text(b.note, "Note", { max: 500, required: false }) || null;
  const key = U.taskKey(id); // this week's entry
  const had = await one("SELECT status FROM ysr_nri_wing_task_done WHERE member_id = ? AND task_id = ?", req.memberId, key);
  if (had && had.status === "approved") return res.status(409).json({ error: "Already approved for this week – come back next week!" });
  await run(`INSERT INTO ysr_nri_wing_task_done (member_id, task_id, status, proof_url, proof_image, proof_note, created_at, updated_at)
             VALUES (?, ?, 'pending', ?, ?, ?, now(), now())
             ON CONFLICT (member_id, task_id) DO UPDATE SET status = 'pending', proof_url = EXCLUDED.proof_url, proof_image = EXCLUDED.proof_image,
               proof_note = EXCLUDED.proof_note, review_note = NULL, reviewed_by = NULL, reviewed_at = NULL, updated_at = now()`,
    req.memberId, key, url, image, note);
  res.json({ ok: true, status: "pending", week: U.isoWeek() });
});
// withdraw a submission that is still waiting
r.delete("/tasks/:id", requireMember, async (req, res) => {
  const id = U.oneOf(req.params.id, Object.keys(U.TASK_POINTS), "task");
  await run("DELETE FROM ysr_nri_wing_task_done WHERE member_id = ? AND task_id = ? AND status <> 'approved'", req.memberId, U.taskKey(id));
  res.json({ ok: true });
});
// links admins set for tasks (e.g. this week's official post)
r.get("/task-links", async (_req, res) => {
  const row = await one("SELECT value FROM ysr_nri_wing_app_state WHERE key = 'task_links'");
  let links = {};
  try { links = row ? JSON.parse(row.value) : {}; } catch {}
  res.json({ links });
});

r.get("/leaderboard", async (_req, res) => {
  const cases = Object.entries(U.TASK_POINTS).map(([k, v]) => `WHEN '${k}' THEN ${v}`).join(" ");
  const rows = await all(`SELECT m.name, m.city, ${U.REGISTER_POINTS} + COALESCE(SUM(CASE split_part(t.task_id, '@', 1) ${cases} ELSE 0 END), 0) AS pts
                          FROM ysr_nri_wing_members m LEFT JOIN ysr_nri_wing_task_done t ON t.member_id = m.id AND t.status = 'approved'
                          GROUP BY m.id ORDER BY pts DESC, m.id ASC LIMIT 10`);
  // show first name + initial only
  res.json({ leaders: rows.map((x) => { const p = x.name.split(/\s+/); return { name: p[0] + (p[1] ? " " + p[1][0] + "." : ""), city: x.city, pts: x.pts }; }) });
});

/* ---------- Live with Leaders questions ---------- */
r.get("/questions", async (_req, res) => {
  res.json({ questions: await all(`SELECT name AS "by", text AS q, created_at FROM ysr_nri_wing_questions WHERE hidden = 0 ORDER BY id DESC LIMIT 10`) });
});
r.post("/questions", postLimit, optionalMember, async (req, res) => {
  const q = U.text(req.body && req.body.text, "Question", { min: 5, max: 300 });
  let by = "NRI supporter";
  if (req.memberId) {
    const m = await one("SELECT name, city FROM ysr_nri_wing_members WHERE id = ?", req.memberId);
    if (m) by = `${m.name.split(/\s+/)[0]}, ${m.city}`;
  }
  await run("INSERT INTO ysr_nri_wing_questions (member_id, name, text) VALUES (?, ?, ?)", req.memberId, by, q);
  // the "Submit a question" task proves itself – approved automatically for logged-in members
  if (req.memberId) await run(`INSERT INTO ysr_nri_wing_task_done (member_id, task_id, status, proof_note, reviewed_by, reviewed_at)
                               VALUES (?, ?, 'approved', 'Question submitted on the website', 'website', now())
                               ON CONFLICT (member_id, task_id) DO UPDATE SET status = 'approved', reviewed_by = 'website', reviewed_at = now()`, req.memberId, U.taskKey("t5"));
  res.status(201).json({ ok: true, by });
});

/* ---------- auto-gallery (Facebook / Instagram) ---------- */
r.get("/gallery", async (_req, res) => {
  const rows = await all(`SELECT id, source, file, caption, permalink, COALESCE(posted_at, created_at) AS posted_at
                          FROM ysr_nri_wing_social_photos WHERE hidden = 0 ORDER BY 6 DESC, id ASC LIMIT 60`);
  res.json({ photos: rows.map((p) => ({ id: p.id, source: p.source, src: /^https?:/.test(p.file) ? p.file : "/media/gallery/" + p.file,
    caption: p.caption || "", permalink: p.permalink || "", postedAt: p.posted_at })) });
});

/* ---------- country committees ---------- */
r.get("/country-teams", async (_req, res) => {
  const order = `CASE role ${U.COMMITTEE_ROLES.map((x, i) => `WHEN '${x}' THEN ${i}`).join(" ")} ELSE 99 END`;
  const rows = await all(`SELECT id, country, role, name, city, photo FROM ysr_nri_wing_country_leaders ORDER BY country, ${order}, id`);
  const teams = {};
  for (const x of rows) (teams[x.country] = teams[x.country] || []).push(x);
  res.json({ roles: U.COMMITTEE_ROLES, teams });
});

/* ---------- public numbers ---------- */
/* ---------- member card QR check (no email / phone) ---------- */
const verifyLimit = U.rateLimit("verify", 60, 10 * 60e3);
r.get("/verify/:no", verifyLimit, async (req, res) => {
  const no = String(req.params.no || "").trim().toUpperCase();
  if (!/^YSRNRI-\d{4}-\d{5}$/.test(no)) return res.status(404).json({ valid: false });
  const m = await one("SELECT name, city, country, district, photo, show_photo, created_at FROM ysr_nri_wing_members WHERE member_no = ?", no);
  if (!m) return res.status(404).json({ valid: false });
  const p = m.name.trim().split(/\s+/);
  res.json({ valid: true, memberNo: no, name: p[0] + (p[1] ? " " + p[p.length - 1][0] + "." : ""), city: m.city, country: m.country,
    district: m.district || "", since: m.created_at, photo: m.show_photo ? m.photo || null : null });
});

/* ---------- Hall of Fame (admins add real volunteers) ---------- */
r.get("/hall-of-fame", async (_req, res) => {
  res.json({ people: await all("SELECT id, name, city, title, badge, note, photo FROM ysr_nri_wing_hall_of_fame ORDER BY sort, id DESC LIMIT 50") });
});

/* ---------- Telugu associations directory ---------- */
r.get("/associations", async (_req, res) => {
  res.json({ associations: await all("SELECT id, name, country, city, website, email, description FROM ysr_nri_wing_associations WHERE status = 'approved' ORDER BY country, city, name LIMIT 500") });
});
r.post("/associations", postLimit, async (req, res) => {
  const b = req.body || {};
  U.mustConsent(b.consent);
  const website = U.text(b.website, "Website", { max: 200, required: false }) || null;
  if (website && !/^https?:\/\/\S+$/i.test(website)) throw new U.BadRequest("Website must start with https://");
  await run(`INSERT INTO ysr_nri_wing_associations (name, country, city, website, email, description, submitted_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    U.text(b.name, "Association name", { min: 3, max: 120 }), U.text(b.country, "Country", { max: 60 }), U.text(b.city, "City", { max: 60 }),
    website, b.email ? U.email(b.email) : null, U.text(b.description, "About", { max: 400, required: false }) || null,
    U.text(b.submittedBy, "Your name", { max: 80, required: false }) || null);
  res.status(201).json({ ok: true, message: "Thank you – our team will check and add it." });
});

/* ---------- Jobs & skills corner ---------- */
const JOB_KINDS = ["job", "referral", "mentoring", "returnee"];
r.get("/jobs", async (_req, res) => {
  res.json({ jobs: await all(`SELECT id, kind, title, company, country, city, description, link, contact, created_at FROM ysr_nri_wing_jobs
                               WHERE status = 'approved' AND expires_at > now() ORDER BY id DESC LIMIT 200`) });
});
r.post("/jobs", requireMember, postLimit, async (req, res) => {
  const b = req.body || {};
  const link = U.text(b.link, "Link", { max: 300, required: false }) || null;
  if (link && !/^https?:\/\/\S+$/i.test(link)) throw new U.BadRequest("Link must start with https://");
  await run(`INSERT INTO ysr_nri_wing_jobs (member_id, kind, title, company, country, city, description, link, contact) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    req.memberId, U.oneOf(b.kind, JOB_KINDS, "type"), U.text(b.title, "Title", { min: 3, max: 120 }), U.text(b.company, "Company", { max: 120, required: false }) || null,
    U.text(b.country, "Country", { max: 60 }), U.text(b.city, "City", { max: 60, required: false }) || null,
    U.text(b.description, "Details", { min: 10, max: 1000 }), link, U.text(b.contact, "Contact", { min: 3, max: 120 }));
  res.status(201).json({ ok: true, message: "Thank you – it will appear after our team checks it." });
});

/* ---------- monthly newsletter ---------- */
r.post("/newsletter", postLimit, async (req, res) => {
  const b = req.body || {};
  U.mustConsent(b.consent);
  const email = U.email(b.email);
  const token = crypto.randomBytes(16).toString("hex");
  await run(`INSERT INTO ysr_nri_wing_newsletter (email, name, country, token) VALUES (?, ?, ?, ?)
             ON CONFLICT (lower(email)) DO UPDATE SET status = 'active'`, email, U.text(b.name, "Name", { max: 80, required: false }) || null,
    U.text(b.country, "Country", { max: 60, required: false }) || null, token);
  res.status(201).json({ ok: true, message: "Subscribed! You'll get our monthly newsletter." });
});
r.get("/newsletter/unsubscribe", async (req, res) => {
  const t = String(req.query.t || "");
  const info = /^[a-f0-9]{32}$/.test(t) ? await run("UPDATE ysr_nri_wing_newsletter SET status = 'unsubscribed' WHERE token = ?", t) : { changes: 0 };
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter</title>
<body style="font-family:Arial,sans-serif;display:grid;place-items:center;min-height:90vh;background:#f3f6fc"><div style="background:#fff;padding:28px;border-radius:16px;text-align:center;max-width:420px">
<h2>${info.changes ? "You are unsubscribed" : "Link not valid"}</h2><p>${info.changes ? "You will not receive the YSRCP NRI Wing newsletter any more." : "This unsubscribe link is not valid."}</p>
<a href="/">Back to the website</a></div></body>`);
});

r.get("/stats", async (_req, res) => {
  const [m, c, t] = await Promise.all([
    one("SELECT COUNT(*) AS n FROM ysr_nri_wing_members"),
    one("SELECT COUNT(DISTINCT country) AS n FROM ysr_nri_wing_members"),
    one("SELECT COUNT(*) AS n FROM ysr_nri_wing_tickets WHERE status = 'Resolved'")
  ]);
  res.json({ members: m.n, countries: c.n, ticketsResolved: t.n });
});

module.exports = r;
