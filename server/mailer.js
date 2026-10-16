// Email: login codes, Help Desk / task updates, newsletter.
//  • Online: Resend (https://resend.com) – set RESEND_API_KEY and MAIL_FROM (e.g. "YSRCP NRI Wing <noreply@your-domain>").
//  • On this computer without a key: emails are printed in the server window (MAIL_DEV_LOG=1 also turns on login codes).
const { run } = require("./db");

const KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.MAIL_FROM || "";
const DEV_LOG = !process.env.VERCEL && (process.env.MAIL_DEV_LOG === "1" || !KEY);

const configured = () => !!(KEY && FROM);
// login codes need a working way to deliver them
const otpEnabled = () => configured() || (!process.env.VERCEL && process.env.MAIL_DEV_LOG === "1");

const escHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const layout = (title, bodyHtml, footer = "") => `<!doctype html><html><body style="margin:0;background:#f3f6fc;font-family:Arial,sans-serif;color:#0f1b33">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:linear-gradient(135deg,#0b3a8c,#1652c4 60%,#0f9d58);color:#fff;border-radius:16px 16px 0 0;padding:18px 22px;font-weight:bold">YSRCP NRI Wing</div>
<div style="background:#fff;border-radius:0 0 16px 16px;padding:22px">
<h2 style="margin:0 0 12px;font-size:20px">${escHtml(title)}</h2>${bodyHtml}</div>
<p style="font-size:12px;color:#6b7896;text-align:center;margin-top:16px">${footer || "You receive this because you are a member of the YSRCP NRI Wing."}</p></div></body></html>`;

// send one email; never throws (a failed email must not break a request)
async function send(to, subject, text, html, kind = "general") {
  if (!to) return false;
  let status = "sent", error = null;
  try {
    if (configured()) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: [to], subject, text, html: html || undefined }), signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) { status = "failed"; error = `${res.status} ${(await res.text()).slice(0, 160)}`; }
    } else if (DEV_LOG) {
      console.log(`\n[email → ${to}] ${subject}\n${text}\n`);
      status = "logged";
    } else {
      status = "skipped";
    }
  } catch (e) { status = "failed"; error = e.message; }
  // log without the message body (login codes are never stored)
  try { await run("INSERT INTO ysr_nri_wing_email_log (kind, to_email, subject, status, error) VALUES (?, ?, ?, ?, ?)", kind, to, subject.slice(0, 200), status, error); } catch {}
  if (status === "failed") console.error("[email]", error);
  return status === "sent" || status === "logged";
}

module.exports = { send, layout, escHtml, configured, otpEnabled };
