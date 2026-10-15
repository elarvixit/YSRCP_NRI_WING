// Auto-gallery: pulls new photo posts from the wing's own Facebook Page and Instagram
// account (official Meta Graph API) and saves the images in Supabase Storage (online)
// or in server/data/gallery (on this computer), so the website gallery fills itself every day.
// Online it runs once a day from a Vercel Cron job (vercel.json → /api/cron/gallery).
//
// Settings (environment variables, or server/.env on this computer – see README):
//   FB_PAGE_ID, FB_PAGE_TOKEN   Facebook Page id + Page access token
//   IG_USER_ID                  Instagram professional account id (uses FB_PAGE_TOKEN)
//   GALLERY_KEYWORDS            optional, e.g. "NRI,meet,event" – only posts whose text matches
//   SOCIAL_SYNC_HOURS           how often to check when running on this computer (default 3)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   photo storage online (public bucket "gallery")
const fs = require("fs");
const path = require("path");
const { one, run, DATA_DIR } = require("./db");

const GRAPH = process.env.GRAPH_BASE || "https://graph.facebook.com/v21.0";
const MEDIA_DIR = process.env.GALLERY_DIR || path.join(DATA_DIR, "gallery");
const SUPA_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = "gallery";
const useStorage = () => !!(SUPA_URL && SUPA_KEY);

const cfg = () => ({
  pageId: process.env.FB_PAGE_ID || "",
  token: process.env.FB_PAGE_TOKEN || "",
  igId: process.env.IG_USER_ID || "",
  keywords: (process.env.GALLERY_KEYWORDS || "").split(",").map((k) => k.trim().toLowerCase()).filter(Boolean)
});
const isConfigured = (c) => !!(c.token && (c.pageId || c.igId));
let running = false;

// the last check is kept in the database (serverless functions don't keep memory between runs)
async function getStatus() {
  const row = await one("SELECT value FROM ysr_nri_wing_app_state WHERE key = 'gallery_sync'");
  let saved = {};
  try { saved = row ? JSON.parse(row.value) : {}; } catch {}
  return { configured: isConfigured(cfg()), running, lastRun: saved.lastRun || null, lastError: saved.lastError || null, added: saved.added || 0 };
}
async function saveStatus(st) {
  await run(`INSERT INTO ysr_nri_wing_app_state (key, value, updated_at) VALUES ('gallery_sync', ?, now())
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, JSON.stringify(st));
}

async function graph(pathAndQuery, token) {
  const url = `${GRAPH}/${pathAndQuery}${pathAndQuery.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error((data.error && data.error.message) || `Graph API error ${res.status}`);
  return data;
}

// one item per photo: { source, extId, imageUrl, caption, permalink, postedAt }
async function facebookItems(c) {
  const fields = "id,message,created_time,permalink_url,full_picture,attachments{media_type,media,subattachments{media_type,media}}";
  const { data = [] } = await graph(`${c.pageId}/posts?fields=${fields}&limit=50`, c.token);
  const out = [];
  for (const p of data) {
    const base = { source: "facebook", caption: p.message || "", permalink: p.permalink_url || "", postedAt: p.created_time };
    const att = p.attachments && p.attachments.data && p.attachments.data[0];
    const subs = att && att.subattachments ? att.subattachments.data.filter((s) => s.media_type === "photo" && s.media && s.media.image) : [];
    if (subs.length) subs.forEach((s, k) => out.push({ ...base, extId: `${p.id}_${k}`, imageUrl: s.media.image.src }));
    else if (att && att.media_type === "photo" && att.media && att.media.image) out.push({ ...base, extId: p.id, imageUrl: att.media.image.src });
    else if (p.full_picture && (!att || att.media_type === "album")) out.push({ ...base, extId: p.id, imageUrl: p.full_picture });
  }
  return out;
}

async function instagramItems(c) {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url}";
  const { data = [] } = await graph(`${c.igId}/media?fields=${fields}&limit=50`, c.token);
  const out = [];
  for (const m of data) {
    const base = { source: "instagram", caption: m.caption || "", permalink: m.permalink || "", postedAt: m.timestamp };
    if (m.media_type === "CAROUSEL_ALBUM" && m.children) {
      m.children.data.filter((ch) => ch.media_type === "IMAGE").forEach((ch, k) => out.push({ ...base, extId: `${m.id}_${k}`, imageUrl: ch.media_url }));
    } else if (m.media_type === "IMAGE") out.push({ ...base, extId: m.id, imageUrl: m.media_url });
    // videos / reels are skipped – the gallery is for photos
  }
  return out;
}

// Facebook gives "2026-10-12T10:00:00+0000" – store every date as ISO
const isoDate = (d) => { const t = d ? new Date(String(d).replace(/([+-]\d\d)(\d\d)$/, "$1:$2")) : null; return t && !isNaN(t) ? t.toISOString() : null; };

// returns what goes into social_photos.file: a Supabase public URL, or a local file name
async function saveImage(item) {
  const res = await fetch(item.imageUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`image download failed (${res.status})`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error("not an image");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 10 * 1024 * 1024) throw new Error("image too large");
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const file = `${item.source}-${item.extId.replace(/[^\w-]/g, "")}.${ext}`;
  if (useStorage()) {
    const up = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${file}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPA_KEY}`, apikey: SUPA_KEY, "Content-Type": type, "x-upsert": "true", "Cache-Control": "604800" },
      body: buf, signal: AbortSignal.timeout(30000)
    });
    if (!up.ok) throw new Error(`upload to Supabase Storage failed (${up.status}: ${(await up.text()).slice(0, 120)})`);
    return `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${file}`;
  }
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  fs.writeFileSync(path.join(MEDIA_DIR, file), buf);
  return file;
}

// create the public "gallery" bucket (no error if it already exists)
async function ensureBucket() {
  if (!useStorage()) return;
  const res = await fetch(`${SUPA_URL}/storage/v1/bucket`, {
    method: "POST", headers: { Authorization: `Bearer ${SUPA_KEY}`, apikey: SUPA_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }), signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) {
    const txt = await res.text();
    if (res.status !== 409 && !/already exists|duplicate/i.test(txt)) throw new Error(`could not create the "gallery" bucket (${res.status})`);
  }
}

async function syncSocial() {
  const c = cfg();
  if (!isConfigured(c) || running) return getStatus();
  running = true;
  let added = 0;
  const errors = [];
  try {
    await ensureBucket().catch((e) => errors.push("Storage: " + e.message));
    const items = [];
    if (c.pageId) await facebookItems(c).then((x) => items.push(...x)).catch((e) => errors.push("Facebook: " + e.message));
    if (c.igId) await instagramItems(c).then((x) => items.push(...x)).catch((e) => errors.push("Instagram: " + e.message));
    for (const it of items) {
      if (await one("SELECT 1 AS x FROM ysr_nri_wing_social_photos WHERE source = ? AND ext_id = ?", it.source, it.extId)) continue;
      const text = it.caption.toLowerCase();
      if (c.keywords.length && !c.keywords.some((k) => text.includes(k))) continue;
      try {
        const file = await saveImage(it);
        await run(`INSERT INTO ysr_nri_wing_social_photos (source, ext_id, file, caption, permalink, posted_at) VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT (source, ext_id) DO NOTHING`,
          it.source, it.extId, file, it.caption.slice(0, 1000), it.permalink, isoDate(it.postedAt));
        added++;
      } catch (e) { errors.push(`${it.source} ${it.extId}: ${e.message}`); }
    }
  } catch (e) {
    errors.push(e.message);
  } finally {
    running = false;
  }
  const lastError = errors.length ? errors.slice(0, 3).join(" · ") : null;
  await saveStatus({ lastRun: new Date().toISOString(), added, lastError });
  if (added || errors.length) console.log(`[gallery] +${added} photos${lastError ? " – " + lastError : ""}`);
  return getStatus();
}

// on this computer: check every few hours (online, Vercel Cron calls /api/cron/gallery instead)
function startSocialSync() {
  const hours = Math.max(1, Number(process.env.SOCIAL_SYNC_HOURS) || 3);
  if (!isConfigured(cfg())) { console.log("[gallery] Facebook/Instagram not set up – auto-gallery is off (see README)."); return; }
  const safe = () => syncSocial().catch((e) => console.error("[gallery]", e.message));
  setTimeout(safe, 5000);
  setInterval(safe, hours * 3600e3).unref();
}

module.exports = { syncSocial, startSocialSync, getStatus, MEDIA_DIR };
