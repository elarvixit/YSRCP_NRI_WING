// Create or update an admin login for the admin panel.
// Usage (from the project folder):
//   npm run create-admin -- <username> <password>                       → full admin
//   npm run create-admin -- <username> <password> coordinator <City>    → city coordinator (e.g. Dallas)
// Uses DATABASE_URL (Supabase) if set – e.g. in server/.env – otherwise the database on this computer.
const path = require("path");
try { process.loadEnvFile(path.join(__dirname, ".env")); } catch {}
const { one, run, close } = require("./db");
const { hashPassword } = require("./auth");

(async () => {
  const [username, password, role = "admin", chapter = null] = process.argv.slice(2);
  if (!username || !password) { console.log("Usage: npm run create-admin -- <username> <password> [admin|coordinator] [City]"); process.exit(1); }
  if (password.length < 10) { console.log("Please use a password of at least 10 characters."); process.exit(1); }
  if (!["admin", "coordinator"].includes(role)) { console.log('Role must be "admin" or "coordinator".'); process.exit(1); }
  if (role === "coordinator" && !chapter) { console.log("Coordinators need a city, e.g. Dallas."); process.exit(1); }
  const hash = hashPassword(password);
  if (await one("SELECT id FROM ysr_nri_wing_admins WHERE lower(username) = lower(?)", username)) {
    await run("UPDATE ysr_nri_wing_admins SET pass_hash = ?, role = ?, chapter = ? WHERE lower(username) = lower(?)", hash, role, chapter, username);
    console.log(`Updated ${role} "${username}".`);
  } else {
    await run("INSERT INTO ysr_nri_wing_admins (username, pass_hash, role, chapter) VALUES (?, ?, ?, ?)", username, hash, role, chapter);
    console.log(`Created ${role} "${username}"${chapter ? " for " + chapter : ""}.`);
  }
  await close();
})().catch((e) => { console.error(e.message); process.exit(1); });
