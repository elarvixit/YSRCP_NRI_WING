// Input checks, IDs and a simple rate limiter.
const crypto = require("crypto");

// Keep in sync with TASKS and EVENTS in website/js/data.js
const TASK_POINTS = { t1: 10, t2: 40, t3: 30, t4: 25, t5: 20, t6: 35 };
const TASK_TITLES = {
  t1: "Share this week's official post", t2: "Call five people in your home constituency", t3: "Attend a city meet",
  t4: "Bring a new member", t5: "Submit a question for Live with Leaders", t6: "Update your village project"
};
const EVENT_IDS = ["ev1", "ev2", "ev3", "ev4", "ev5", "ev6", "ev7", "ev8"];
const REGISTER_POINTS = 10;

const TICKET_CATEGORIES = ["Family welfare", "Property / land", "Documents & certificates", "Medical emergency", "Emergency abroad (24/7)", "Gulf worker – repatriation", "Other"];
const MEET_TYPES = ["City / group meeting", "Individual meeting", "Family visit", "Online (video) meeting"];
const MEET_PLACES = ["Tadepalli party office", "Online", "During a visit to my region"];

class BadRequest extends Error {}

// text(value, label, {min, max, required})
function text(v, label, { min = 1, max = 200, required = true } = {}) {
  const s = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  if (!s) { if (required) throw new BadRequest(`${label} is required.`); return ""; }
  if (s.length < min) throw new BadRequest(`${label} is too short.`);
  if (s.length > max) throw new BadRequest(`${label} is too long (max ${max} characters).`);
  return s;
}
function email(v) {
  const s = text(v, "Email", { max: 120 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) throw new BadRequest("Please enter a valid email.");
  return s;
}
function phone(v) {
  const s = text(v, "Phone", { min: 6, max: 25 });
  if (!/^[+\d][\d\s()-]{5,24}$/.test(s)) throw new BadRequest("Please enter a valid phone number.");
  return s;
}
function oneOf(v, list, label) {
  if (!list.includes(v)) throw new BadRequest(`Please choose a valid ${label}.`);
  return v;
}
// numeric id from a URL / body value
function id(v) {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequest("Invalid id.");
  return n;
}
function mustConsent(v) {
  if (v !== true && v !== "true" && v !== "on") throw new BadRequest("Please accept the privacy consent.");
}

// readable IDs
const digits = (n) => String(crypto.randomInt(10 ** (n - 1), 10 ** n));
const memberNo = () => `YSRNRI-${new Date().getFullYear()}-${digits(5)}`;
// country committee positions, highest first (also used for ordering on the website)
const COMMITTEE_ROLES = ["President", "Vice President", "General Secretary", "Secretary", "Treasurer", "Women Wing Coordinator", "Youth Wing Coordinator", "Social Media Coordinator", "Executive Member"];
const ticketNo = () => `HD-${digits(5)}`;
const meetRef = () => `MJ-${digits(5)}`;

// in-memory rate limit: max hits per window per IP+key
const hits = new Map();
function rateLimit(key, max, windowMs) {
  return (req, res, next) => {
    const id = key + ":" + (req.ip || "?");
    const now = Date.now();
    const list = (hits.get(id) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) return res.status(429).json({ error: "Too many requests – please try again in a few minutes." });
    list.push(now);
    hits.set(id, list);
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();

module.exports = { COMMITTEE_ROLES, TASK_POINTS, TASK_TITLES, EVENT_IDS, REGISTER_POINTS, TICKET_CATEGORIES, MEET_TYPES, MEET_PLACES, BadRequest, text, email, phone, oneOf, id, mustConsent, memberNo, ticketNo, meetRef, rateLimit };
