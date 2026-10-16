// SMS: phone verification codes when members register.
//  • Online: Twilio – set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM (a Twilio number or Messaging Service SID "MG…").
//  • On this computer: MAIL_DEV_LOG=1 prints the SMS in the server window instead of sending it.
const SID = process.env.TWILIO_ACCOUNT_SID || "";
const TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const FROM = process.env.TWILIO_FROM || "";

const configured = () => !!(SID && TOKEN && FROM);
const devLog = () => !process.env.VERCEL && process.env.MAIL_DEV_LOG === "1";
const enabled = () => configured() || devLog();

// "+91 98480 12345" → "+919848012345"
const normalize = (p) => { const d = String(p || "").replace(/[^\d+]/g, ""); return d.startsWith("+") ? "+" + d.slice(1).replace(/\D/g, "") : "+" + d.replace(/\D/g, ""); };

async function send(to, text) {
  const num = normalize(to);
  if (configured()) {
    const body = new URLSearchParams({ To: num, Body: text, ...(FROM.startsWith("MG") ? { MessagingServiceSid: FROM } : { From: FROM }) });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
      method: "POST", body, signal: AbortSignal.timeout(15000),
      headers: { Authorization: "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" }
    });
    if (!res.ok) { const err = (await res.text()).slice(0, 160); console.error("[sms]", err); throw new Error("Could not send the SMS – please check the phone number (with country code)."); }
    return true;
  }
  if (devLog()) { console.log(`\n[sms → ${num}] ${text}\n`); return true; }
  return false;
}

module.exports = { send, enabled, configured, normalize };
