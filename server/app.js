// YSRCP NRI Wing – the API (Express). Used by server.js on this computer and by api/index.js on Vercel.
const express = require("express");
const { BadRequest } = require("./util");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // correct client IPs behind Vercel / a hosting proxy

// security headers
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});
app.use("/api", (_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });

// photos (member card, committee) may be bigger than other forms
const smallJson = express.json({ limit: "20kb" }), photoJson = express.json({ limit: "300kb" });
app.use((req, res, next) => (req.path === "/api/me/photo" || req.path.startsWith("/api/admin/country-teams") ? photoJson : smallJson)(req, res, next));

// daily gallery check – called by Vercel Cron (vercel.json), which sends "Authorization: Bearer <CRON_SECRET>"
app.get("/api/cron/gallery", async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: "Not allowed." });
  res.json({ status: await require("./social").syncSocial() });
});

app.use("/api/admin", require("./routes/admin"));
app.use("/api", require("./routes/public"));
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// errors → JSON
app.use((err, _req, res, _next) => {
  if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid request." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request is too large." });
  if (err.code === "22P02" || err.code === "22003") return res.status(400).json({ error: "Invalid request." });      // bad number / id
  if (err.code === "23505") return res.status(409).json({ error: "This already exists. Please try again." });        // unique
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

module.exports = app;
