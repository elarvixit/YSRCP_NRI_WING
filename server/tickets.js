// Help Desk workflow shared by the public, admin and volunteer routes:
// Raise (Received) → Assign (to a district volunteer) → In progress → Resolve.
const crypto = require("crypto");
const { one, all, run } = require("./db");

const STATUSES = ["Received", "Assigned", "In progress", "Resolved"];
const TARGET_DAYS = 7;          // normal requests
const URGENT_TARGET_DAYS = 1;   // urgent / 24×7 requests

// SQL for the target date of a new ticket
const dueDate = (urgent) => `now() + interval '${urgent ? URGENT_TARGET_DAYS : TARGET_DAYS} days'`;

async function addEvent(ticketId, status, note, by) {
  await run("INSERT INTO ysr_nri_wing_ticket_events (ticket_id, status, note, by_who) VALUES (?, ?, ?, ?)", ticketId, status, note || null, by || null);
}

// change status + keep the timeline; returns the updated row
async function setStatus(ticket, status, { note, by, resolution } = {}) {
  await run("UPDATE ysr_nri_wing_tickets SET status = ?, updated_at = now() WHERE id = ?", status, ticket.id);
  if (status === "Assigned") await run("UPDATE ysr_nri_wing_tickets SET assigned_at = COALESCE(assigned_at, now()) WHERE id = ?", ticket.id);
  if (status === "Resolved") await run("UPDATE ysr_nri_wing_tickets SET resolved_at = now(), resolution = COALESCE(?, resolution) WHERE id = ?", resolution || null, ticket.id);
  else await run("UPDATE ysr_nri_wing_tickets SET resolved_at = NULL WHERE id = ?", ticket.id);
  if (status !== ticket.status || note) await addEvent(ticket.id, status, note, by);
  return one("SELECT * FROM ysr_nri_wing_tickets WHERE id = ?", ticket.id);
}

async function assign(ticket, volunteer, by) {
  const token = crypto.randomBytes(18).toString("base64url");
  await run(`UPDATE ysr_nri_wing_tickets SET volunteer_id = ?, volunteer_token = ?, updated_at = now(),
               status = CASE WHEN status = 'Received' THEN 'Assigned' ELSE status END,
               assigned_at = COALESCE(assigned_at, now()) WHERE id = ?`, volunteer.id, token, ticket.id);
  await addEvent(ticket.id, ticket.status === "Received" ? "Assigned" : ticket.status, `Assigned to ${volunteer.name} (${volunteer.district})`, by);
  return one("SELECT * FROM ysr_nri_wing_tickets WHERE id = ?", ticket.id);
}

// what the member (or anyone with the ticket number) sees – no contact details
async function publicTicket(t, { withResolution = false } = {}) {
  const v = t.volunteer_id ? await one("SELECT name, district FROM ysr_nri_wing_volunteers WHERE id = ?", t.volunteer_id) : null;
  const events = await all("SELECT status, created_at FROM ysr_nri_wing_ticket_events WHERE ticket_id = ? ORDER BY id", t.id);
  const firstAt = (s) => (events.find((e) => e.status === s) || {}).created_at || null;
  return {
    id: t.ticket_no, cat: t.category, district: t.district, urgent: !!t.urgent, status: t.status,
    created_at: t.created_at, updated_at: t.updated_at, due_at: t.due_at,
    steps: { Received: t.created_at, Assigned: t.assigned_at || firstAt("Assigned"), "In progress": firstAt("In progress"), Resolved: t.resolved_at },
    volunteer: v ? { name: v.name.split(/\s+/)[0], district: v.district } : null,
    ...(withResolution && t.status === "Resolved" ? { resolution: t.resolution || "" } : {})
  };
}

module.exports = { STATUSES, dueDate, addEvent, setStatus, assign, publicTicket };
