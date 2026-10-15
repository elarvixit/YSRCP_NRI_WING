// Login tokens (signed with HMAC-SHA256) and admin password hashing (scrypt). No extra packages needed.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const DATA_DIR = path.join(__dirname, "data");

// Secret used to sign tokens: APP_SECRET env var (required on Vercel), or a random one saved in server/data/secret.key
function loadSecret() {
  if (process.env.APP_SECRET && process.env.APP_SECRET.length >= 32) return process.env.APP_SECRET;
  if (process.env.VERCEL) throw new Error("APP_SECRET is missing or shorter than 32 characters – add it in Vercel → Settings → Environment Variables.");
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, "secret.key");
  if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
  const s = crypto.randomBytes(48).toString("hex");
  fs.writeFileSync(file, s, { mode: 0o600 });
  return s;
}
// loaded on first use, so a missing setting gives a clear error instead of crashing the whole API
let SECRET;
const secret = () => SECRET || (SECRET = loadSecret());

const b64 = (buf) => Buffer.from(buf).toString("base64url");
const sign = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");

const MEMBER_DAYS = 90;
const ADMIN_HOURS = 12;

function createToken(payload, seconds) {
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + seconds }));
  return body + "." + sign(body);
}

function readToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = sign(body);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now() / 1000) return null;
    return data;
  } catch { return null; }
}

const memberToken = (memberId) => createToken({ sub: memberId, role: "member" }, MEMBER_DAYS * 86400);
const adminToken = (admin) => createToken({ sub: admin.id, role: admin.role, chapter: admin.chapter || null, name: admin.username }, ADMIN_HOURS * 3600);

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return "scrypt$" + salt.toString("hex") + "$" + hash.toString("hex");
}
function checkPassword(password, stored) {
  const [alg, saltHex, hashHex] = String(stored).split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  return crypto.timingSafeEqual(hash, Buffer.from(hashHex, "hex"));
}

// Express middlewares
const bearer = (req) => (req.headers.authorization || "").replace(/^Bearer\s+/i, "") || null;

function optionalMember(req, _res, next) {
  const t = readToken(bearer(req));
  req.memberId = t && t.role === "member" ? t.sub : null;
  next();
}
function requireMember(req, res, next) {
  const t = readToken(bearer(req));
  if (!t || t.role !== "member") return res.status(401).json({ error: "Please log in first." });
  req.memberId = t.sub;
  next();
}
function requireAdmin(req, res, next) {
  const t = readToken(bearer(req));
  if (!t || (t.role !== "admin" && t.role !== "coordinator")) return res.status(401).json({ error: "Admin login required." });
  req.admin = { id: t.sub, role: t.role, chapter: t.chapter, name: t.name };
  next();
}
function requireFullAdmin(req, res, next) {
  if (!req.admin || req.admin.role !== "admin") return res.status(403).json({ error: "Only admins can do this." });
  next();
}

module.exports = { memberToken, adminToken, readToken, hashPassword, checkPassword, optionalMember, requireMember, requireAdmin, requireFullAdmin };
