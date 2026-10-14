# YSRCP NRI Wing – Website

Open `index.html` in a browser (or serve the folder, e.g. `npx http-server .`).

## Structure
- `index.html` – page layout
- `css/style.css` – design, animations, hover effects, responsive rules
- `js/data.js` – **all content**: slides, journey, services, pillars, chapters, events, tasks, achievements, Telugu text
- `js/main.js` – interactions

## Features
- Same sections as ysrcpnriwing.org: hero, political journey (JaganAnna Mark), why join, services, 12 pillars, JaganAnna on Air, digital channels, gallery, footer
- From the proposal: better registration, digital member card with QR (downloadable), My Dashboard,
  My Chapter (map + search + region filter), Events calendar in the visitor's time zone with RSVP,
  Live with Leaders (countdown + question submission), NRI Help Desk (ticket number + tracking),
  Volunteer Corner (points, badges, leaderboard), Gulf Worker Support and Native Village Connect (under Services),
  Telugu / English switch
- New: **Achievements**: animated counters, wing milestones, governance 2019–24, Hall of Fame, badges unlocked by volunteer points

## Before going live
1. Replace the SAMPLE figures in `js/data.js` (achievement stats, leaderboard, Hall of Fame, chapter member counts) with verified numbers, and check the governance figures, and verify every phone number in `HELPLINES` (24/7 panel) in `js/data.js` and the APNRTS number in `index.html`. Make sure someone actually answers the 24/7 priority line before advertising it.
2. Add chapter coordinator names and WhatsApp links when management shares them.
3. Add real photos: put them in `images/` and set `IMG.hero` (16:9 banner, subject on the right), `IMG.events` (wide event photo) and `IMG.gallery` in `js/data.js`. Service icons live in `images/icons/`.
4. Data is stored only in the visitor's browser (localStorage) for this demo. Connect registration, login, help desk,
   RSVPs and tasks to a backend (see the `TODO backend` comments in `js/main.js`).
5. Have the legal team review the registration form and privacy notice (DPDP Act 2023, GDPR, FCRA: no donations).
6. Pillar photos are loaded from the current site (ysrcpnriwing.org/pillar-images). Before launch, copy those 12 files into
   `images/pillars/` and set `PILLAR_IMG = "images/pillars/"` in `js/data.js`. Confirm the wing has the rights to use them.
7. Banner and service photos (`SITE_PHOTOS` in `js/data.js`) also load from ysrcpnriwing.org. Copy them into `images/`
   and change `SITE` before launch, the same way as the pillar photos.
8. The official logo (`IMG.logo`) and collage photos (`IMG.collage`) also load from ysrcpnriwing.org – copy them into `images/` before launch.
