/* ==========================================================================
   YSRCP NRI Wing – interactions
   Front-end demo: data is kept in the browser (localStorage). Connect the
   marked functions to a real backend before launch.
   ========================================================================== */
(() => {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem("nri_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem("nri_" + k, JSON.stringify(v)); } catch {} }
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lang = "en"; // English only
  const L = (o) => (o && typeof o === "object" ? o[lang] || o.en : o);
  const t = (key, fallback) => (I18N[lang] && I18N[lang][key]) || fallback;

  const state = {
    user: store.get("user", null),
    rsvps: store.get("rsvps", []),
    tasks: store.get("tasks", []),          // approved tasks (count for points)
    taskSubs: {},                            // online: { t1: { status: pending|approved|rejected, reviewNote, proofUrl, note } }
    taskLinks: {},                           // links admins set, e.g. this week's official post
    tickets: store.get("tickets", []),
    questions: store.get("questions", [])
  };
  const save = (k) => store.set(k, state[k]);

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function confetti(n = 80) {
    if (reduceMotion) return;
    const colors = ["#0f9d58", "#22c56f", "#1652c4", "#2f7bff", "#f5b800", "#ffffff"];
    for (let i = 0; i < n; i++) {
      const c = document.createElement("i");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
      c.style.animationDelay = Math.random() * 0.4 + "s";
      c.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  /* ---------- counters ---------- */
  const fmt = (n) => Math.round(n).toLocaleString("en-IN");
  function countUp(el) {
    const to = +el.dataset.to, suffix = el.dataset.suffix || "";
    if (reduceMotion) { el.textContent = fmt(to) + suffix; return; }
    const dur = 1800, start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 4))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      $$(".count", e.target).forEach((c) => { if (!c.dataset.done) { c.dataset.done = 1; countUp(c); } });
      if (e.target.classList.contains("count") && !e.target.dataset.done) { e.target.dataset.done = 1; countUp(e.target); }
      io.unobserve(e.target);
    });
  }, { threshold: 0.01, rootMargin: "0px 0px -30px 0px" });
  const observe = (root = document) => $$(".reveal, .reveal-l, .stagger, .count", root).forEach((el) => io.observe(el));
  const stagger = (el) => { [...el.children].forEach((c, i) => c.style.setProperty("--i", i)); el.classList.add("stagger"); io.observe(el); };

  /* ---------- language ---------- */
  function applyLang() {
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach((el) => {
      if (!el.dataset.en) el.dataset.en = el.textContent;
      el.textContent = lang === "en" ? el.dataset.en : t(el.dataset.i18n, el.dataset.en);
    });
    $$("[data-i18n-ph]").forEach((el) => {
      if (!el.dataset.enPh) el.dataset.enPh = el.placeholder;
      el.placeholder = lang === "en" ? el.dataset.enPh : t(el.dataset.i18nPh, el.dataset.enPh);
    });
    renderHero(heroIdx);
    renderWhy(); renderServices(); renderPillars(); renderAchStats(); renderEvents(); renderTasks(); renderRegionChips();
  }


  /* ---------- header, progress, nav ---------- */
  const header = $("#header"), progress = $("#scrollProgress"), toTop = $("#toTop");
  window.addEventListener("scroll", () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle("scrolled", y > 10);
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    toTop.classList.toggle("show", y > 700);
  }, { passive: true });
  toTop.addEventListener("click", () => scrollTo({ top: 0 }));

  const navLinks = $("#navLinks"), navToggle = $("#navToggle");
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", open);
  });
  navLinks.addEventListener("click", (e) => {
    const dd = e.target.closest(".dropdown-btn");
    if (dd) { dd.parentElement.classList.toggle("open"); return; }
    if (e.target.closest("a")) { navLinks.classList.remove("open"); navToggle.classList.remove("open"); }
  });

  const sectionIds = ["home", "about", "chapters", "events", "helpdesk", "volunteer", "achievements", "mark", "gallery", "meet"];
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      $$(".nav-links > a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sectionIds.forEach((id) => { const s = document.getElementById(id); if (s) navIO.observe(s); });

  /* ---------- cursor glow + spotlight + ripple + magnetic ---------- */
  const glow = $("#cursorGlow");
  document.addEventListener("pointermove", (e) => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
    const sp = e.target.closest(".svc, .stat-card");
    if (sp) {
      const r = sp.getBoundingClientRect();
      sp.style.setProperty("--mx", e.clientX - r.left + "px");
      sp.style.setProperty("--my", e.clientY - r.top + "px");
    }
  }, { passive: true });

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".btn");
    if (!b || reduceMotion) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(span);
    setTimeout(() => span.remove(), 600);
  });

  function tilt(el, max = 10) {
    if (reduceMotion || matchMedia("(hover: none)").matches) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-4px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  }
  $$(".magnetic").forEach((m) => {
    m.addEventListener("pointermove", (e) => {
      const r = m.getBoundingClientRect();
      m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    m.addEventListener("pointerleave", () => { m.style.transform = ""; });
  });

  /* ---------- YSRCP latest news: continuous scrolling line ---------- */
  (function newsBar() {
    const track = $("#newsTrack"); if (!track || !NEWS.length) return;
    const items = NEWS.map((it) => `<a class="nb-item" href="${esc(it.url)}" target="_blank" rel="noopener"><span class="nb-date">${esc(it.date)}</span><span class="nb-text">${esc(it.text)}</span><span class="nb-src">${esc(it.source)}</span></a><span class="nb-sep" aria-hidden="true">◆</span>`).join("");
    track.innerHTML = items + items; // doubled for a seamless loop
    // constant reading speed (~70px/s) whatever the number of headlines
    const setSpeed = () => track.style.setProperty("--dur", Math.max(30, track.scrollWidth / 2 / 70) + "s");
    setSpeed(); addEventListener("load", setSpeed);
  })();

  /* ---------- official logo ---------- */
  if (IMG.logo) {
    $$(".brand-mark, .pre-logo").forEach((el) => {
      const img = new Image();
      img.alt = "YSRCP NRI Wing logo";
      img.onload = () => { el.classList.add("has-logo"); el.replaceChildren(img); };
      img.src = IMG.logo;
    });
  }

  /* ---------- hero ---------- */
  const hero = $("#home"), heroCopy = $("#heroCopy"), heroDots = $("#heroDots");
  let heroIdx = 0, heroTimer;
  heroDots.innerHTML = HERO_SLIDES.map((_, i) => `<button aria-label="Slide ${i + 1}"></button>`).join("");
  $$("button", heroDots).forEach((b, i) => b.addEventListener("click", () => renderHero(i)));

  function splitWords(html) {
    // wrap each word (keeping <em> tags) in animated spans
    let i = 0;
    return html.replace(/(<em>)?([^<\s]+)(<\/em>)?/g, (m, a, w, b) => `${a || ""}<span class="w" style="animation-delay:${(i++ * 0.06).toFixed(2)}s">${w}</span>${b || ""}`);
  }
  function renderHero(i) {
    heroIdx = i;
    const s = HERO_SLIDES[i];
    hero.dataset.theme = s.theme;
    heroCopy.innerHTML = `
      ${s.kicker ? `<span class="hero-kicker fade">${esc(L(s.kicker))}</span>` : ""}
      <h1 class="fade" style="animation-delay:.1s">${L(s.title)}</h1>
      <p class="sub fade" style="animation-delay:.3s">${esc(L(s.text))}</p>
      ${s.points ? `<ul class="hero-points fade" style="animation-delay:.5s">${L(s.points).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      <div class="hero-ctas fade" style="animation-delay:.7s">
        <button class="btn btn-light btn-lg" data-open="register">${esc(t("heroCta1", "Become a member"))} →</button>
      </div>`;
    $$("button", heroDots).forEach((b, j) => { b.classList.remove("active"); if (j === i) { void b.offsetWidth; b.classList.add("active"); } });
    clearTimeout(heroTimer);
    heroTimer = setTimeout(() => renderHero((heroIdx + 1) % HERO_SLIDES.length), 6000);
  }
  hero.addEventListener("pointerenter", () => clearTimeout(heroTimer));
  hero.addEventListener("pointerleave", () => { heroTimer = setTimeout(() => renderHero((heroIdx + 1) % HERO_SLIDES.length), 3000); });

  // particle network
  (function particles() {
    const cv = $("#heroCanvas"), ctx = cv.getContext("2d");
    let w, h, pts = [], mouse = { x: -999, y: -999 };
    const resize = () => {
      w = cv.width = hero.offsetWidth * devicePixelRatio;
      h = cv.height = hero.offsetHeight * devicePixelRatio;
      const n = Math.min(90, Math.floor((hero.offsetWidth * hero.offsetHeight) / 14000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 }));
    };
    resize();
    addEventListener("resize", resize);
    hero.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mouse = { x: (e.clientX - r.left) * devicePixelRatio, y: (e.clientY - r.top) * devicePixelRatio }; });
    hero.addEventListener("pointerleave", () => (mouse = { x: -999, y: -999 }));
    const D = 130 * devicePixelRatio;
    let visible = true;
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);
    function frame() {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const p of pts) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (dm < D) { p.x += (p.x - mouse.x) / dm; p.y += (p.y - mouse.y) / dm; }
          ctx.fillStyle = "rgba(200,225,255,.7)";
          ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * devicePixelRatio, 0, 7); ctx.fill();
        }
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < D) { ctx.strokeStyle = `rgba(140,230,190,${(1 - d / D) * 0.35})`; ctx.lineWidth = devicePixelRatio; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
      }
      if (!reduceMotion) requestAnimationFrame(frame);
    }
    frame();
  })();

  // optional photos
  if (IMG.heroOrbit) {
    hero.classList.add("has-photo", "has-orbit");
    const box = $("#heroPhoto");
    const TAGS = [["us", "Dallas"], ["gb", "London"], ["ae", "Dubai"], ["sg", "Singapore"], ["au", "Sydney"], ["ca", "Toronto"], ["qa", "Doha"]];
    const ANG = [-62, -26, 10, 46, 82, 118, 152, 186];
    box.innerHTML = `
      <div class="ho-glow"></div>
      <div class="ho-orbit" id="hoOrbit">
        <i class="ring r1"></i><i class="ring r2"></i><i class="ring r3"></i>
        <span class="plane-arm a1"><b>✈</b></span><span class="plane-arm a2"><b>✈</b></span><span class="plane-arm a3"><b>✈</b></span>
        ${TAGS.map(([iso, city], i) => `<span class="ho-tag" style="--a:${ANG[i]}deg;--d:${(i * 0.7).toFixed(1)}s"><span><img src="https://flagcdn.com/w40/${iso}.png" alt="">${city}</span></span>`).join("")}
      </div>
      <svg class="ho-waves" viewBox="0 0 2880 160" preserveAspectRatio="none" aria-hidden="true">
        <path class="w1" d="M0 80 C240 30 480 130 720 80 S1200 30 1440 80 S1920 130 2160 80 S2640 30 2880 80 V160 H0Z"/>
        <path class="w2" d="M0 100 C240 60 480 140 720 100 S1200 60 1440 100 S1920 140 2160 100 S2640 60 2880 100 V160 H0Z"/>
        <path class="w3" d="M0 120 C240 95 480 150 720 120 S1200 95 1440 120 S1920 150 2160 120 S2640 95 2880 120 V160 H0Z"/>
      </svg>`;
    // centre the orbit on the photo collage (or top-right on small screens)
    const placeOrbit = () => {
      const o = $("#hoOrbit"), v = $(".hero-visual"), hr = hero.getBoundingClientRect();
      const vr = v && v.offsetParent ? v.getBoundingClientRect() : null;
      const cx = vr ? vr.left - hr.left + vr.width / 2 : hr.width * 0.82;
      const cy = vr ? vr.top - hr.top + vr.height / 2 : hr.height * 0.28;
      const r = vr ? Math.max(vr.width, vr.height) / 2 + 46 : Math.min(hr.width, hr.height) * 0.42;
      o.style.setProperty("--cx", cx + "px"); o.style.setProperty("--cy", cy + "px"); o.style.setProperty("--r", r + "px");
    };
    placeOrbit();
    addEventListener("resize", placeOrbit);
    addEventListener("load", placeOrbit);
  } else if (IMG.heroNri && typeof jsVectorMap !== "undefined") {
    // NRI background: "wherever you live, home is Andhra Pradesh"
    hero.classList.add("has-photo", "has-nri-bg");
    const box = $("#heroPhoto");
    box.innerHTML = '<div id="heroMap" class="hero-map"></div><img class="hero-skyline" src="images/skyline.svg" alt="">';
    const HOME = "Andhra Pradesh";
    const cities = ["Dallas", "San Francisco Bay Area", "New Jersey", "Chicago", "Toronto", "London", "Frankfurt", "Dubai", "Doha", "Kuwait City", "Muscat", "Singapore", "Kuala Lumpur", "Tokyo", "Sydney", "Melbourne", "Auckland", "Johannesburg"];
    try {
      new jsVectorMap({
        selector: "#heroMap",
        map: "world",
        zoomButtons: false,
        zoomOnScroll: false,
        backgroundColor: "transparent",
        selectedRegions: ["IN"],
        regionStyle: {
          initial: { fill: "#1d3d7a", stroke: "#0a1f4d", strokeWidth: 0.5, fillOpacity: 1 },
          hover: { fillOpacity: 1 },
          selected: { fill: "#0f9d58" }
        },
        markers: [
          ...cities.map((c) => ({ name: c, coords: CITY_COORDS[c] })),
          { name: HOME, coords: [16.3, 80.6], style: { fill: "#ffd84d", stroke: "#fff", strokeWidth: 3, r: 9 } }
        ],
        markerStyle: { initial: { fill: "#5cf5a3", stroke: "#ffffff", strokeWidth: 1.5, r: 4 } },
        lines: cities.map((c) => ({ from: c, to: HOME })),
        lineStyle: { stroke: "#ffd84d", strokeWidth: 1.4, strokeDasharray: "6 5", strokeLinecap: "round", animation: true }
      });
      const markHome = () => { const h = box.querySelector(`#heroMap circle[data-index="${cities.length}"]`); if (h) h.classList.add("home-dot"); else setTimeout(markHome, 300); };
      markHome();
    } catch (err) { console.warn("hero map", err); }
    const cap = document.createElement("p");
    cap.className = "hb-cap";
    cap.textContent = "🏠 Wherever you live, home is Andhra Pradesh";
    $(".hero-bottom").appendChild(cap);
  } else if (IMG.heroBg && IMG.heroBg.length) {
    // crossfading photo slideshow behind the home banner
    hero.classList.add("has-photo", "has-bgshow");
    const box = $("#heroPhoto");
    box.innerHTML = IMG.heroBg.map((p, i) => `<span class="hb-slide${i ? "" : " on"}" style="background-image:url(&quot;${esc(p.src)}&quot;);background-position:${p.pos || "center"}"></span>`).join("");
    const cap = document.createElement("p");
    cap.className = "hb-cap";
    $(".hero-bottom").appendChild(cap);
    let hb = 0;
    const showBg = (i) => {
      hb = i % IMG.heroBg.length;
      $$(".hb-slide", box).forEach((s, k) => s.classList.toggle("on", k === hb));
      cap.textContent = "📷 " + IMG.heroBg[hb].cap;
    };
    showBg(0);
    setInterval(() => { if (!document.hidden) showBg(hb + 1); }, 5500);
  } else if (IMG.hero) {
    hero.classList.add("has-photo");
    $("#heroPhoto").style.backgroundImage = `url("${IMG.hero}")`;
  }
  if (IMG.collage && IMG.collage.length >= 4) {
    hero.classList.add("has-leader", "has-collage");
    const c = IMG.collage;
    const tile = (p, cls, i) => `<div class="cl-tile ${cls}" style="--d:${i * 0.12}s"><span style="background-image:url(&quot;${esc(p.src)}&quot;);background-position:${p.pos || "center"}${p.size ? ";background-size:" + p.size : ""}"></span></div>`;
    $(".hero-visual").insertAdjacentHTML("afterbegin", `<div class="collage" role="img" aria-label="Photos of Y.S. Jagan Mohan Reddy">
      ${tile(c[0], "cl-main", 0)}${tile(c[1], "cl-a", 1)}${tile(c[2], "cl-b", 2)}${tile(c[3], "cl-c", 3)}${c[4] ? tile(c[4], "cl-round", 4) : ""}${IMG.collageYsr ? `<div class="cl-tile cl-ysr" style="--d:.6s" title="${esc(IMG.collageYsr.label)}"><span style="background-image:url(&quot;${esc(IMG.collageYsr.src)}&quot;);background-size:${IMG.collageYsr.size};background-position:${IMG.collageYsr.pos}"></span></div>` : ""}
      <div class="cl-tag">${IMG.logo ? `<img src="${esc(IMG.logo)}" alt="">` : ""}<div><b>Y.S. Jagan Mohan Reddy</b><span>President, YSR Congress Party</span></div></div>
    </div>`);
    $(".hero-visual").removeAttribute("aria-hidden");
  } else if (IMG.leader) {
    hero.classList.add("has-leader");
    $(".hero-visual").insertAdjacentHTML("afterbegin", `<div class="leader-frame"><div class="leader-card"><div class="leader-img" role="img" aria-label="Y.S. Jagan Mohan Reddy" style="background-image:url(&quot;${esc(IMG.leader.src || IMG.leader)}&quot;);background-size:${IMG.leader.crop ? IMG.leader.crop.size : "cover"};background-position:${IMG.leader.crop ? IMG.leader.crop.pos : "center top"}"></div><div class="leader-tag"><b>Y.S. Jagan Mohan Reddy</b><span>President, YSR Congress Party</span></div></div></div>`);
    $(".hero-visual").removeAttribute("aria-hidden");
  }
  if (EVENT_PHOTOS.length) {
    const fig = $("#eventsPhoto");
    fig.classList.add("ev-slider");
    fig.innerHTML = EVENT_PHOTOS.map((p, i) => `<div class="ev-slide${i ? "" : " on"}"><img src="${esc(p.src)}" alt="${esc(p.cap)}" loading="${i ? "lazy" : "eager"}"><figcaption><b>${esc(p.cap)}</b><span>📍 ${esc(p.place || "")}${p.date ? " · " + esc(p.date) : ""}</span></figcaption></div>`).join("") +
      (EVENT_PHOTOS.length > 1 ? `<button class="ev-nav prev" aria-label="Previous photo">‹</button><button class="ev-nav next" aria-label="Next photo">›</button><div class="ev-dots">${EVENT_PHOTOS.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : "");
    fig.hidden = false;
    let ev = 0, evTimer;
    const go = (n) => {
      ev = (n + EVENT_PHOTOS.length) % EVENT_PHOTOS.length;
      $$(".ev-slide", fig).forEach((s, i) => s.classList.toggle("on", i === ev));
      $$(".ev-dots i", fig).forEach((s, i) => s.classList.toggle("on", i === ev));
      clearTimeout(evTimer); evTimer = setTimeout(() => go(ev + 1), 5000);
    };
    fig.addEventListener("click", (e) => { if (e.target.closest(".prev")) go(ev - 1); if (e.target.closest(".next")) go(ev + 1); });
    if (EVENT_PHOTOS.length > 1) go(0);
  } else if (IMG.events) {
    const fig = $("#eventsPhoto");
    const ev = IMG.events.src ? IMG.events : { src: IMG.events, cap: "YSRCP NRI Wing Global Meet" };
    fig.innerHTML = `<img src="${esc(ev.src)}" alt="${esc(ev.cap)}" loading="lazy"><figcaption>🌍 ${esc(ev.cap)}${ev.credit ? `<small>Photo: ${esc(ev.credit)}</small>` : ""}</figcaption>`;
    fig.hidden = false;
  }

  // leader photo in the Live with Leaders card
  $("#liveLeader").innerHTML = `<span class="ll-photo" role="img" aria-label="Y.S. Jagan Mohan Reddy"></span><div><b>Y.S. Jagan Mohan Reddy</b><small>President, YSRCP · monthly town hall</small></div>`;

  /* ---------- leadership ---------- */
  const photoStyle = (p) => `background-image:url(&quot;${esc(p.src)}&quot;);background-size:${p.crop ? p.crop.size : "cover"};background-position:${p.crop ? p.crop.pos : "center top"}`;
  $("#leaderGrid").innerHTML = LEADERS.map((l, i) => `
    <article class="leader" style="--i:${i}">
      <div class="leader-pic"><span class="leader-ph" style="${photoStyle(l.photo)}" role="img" aria-label="${esc(l.name)}"></span><small class="leader-credit">Photo: ${esc(l.photo.credit)}</small></div>
      <div class="leader-info">
        <h3>${esc(l.name)}</h3>
        <p class="leader-role">${esc(l.role)}</p>
        <p>${esc(l.bio)}</p>
        <div class="leader-tags">${l.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>
      </div>
    </article>`).join("");
  stagger($("#leaderGrid"));
  const coord = LEADERS[1];
  $("#coordStrip").innerHTML = `<span class="coord-ph" style="${photoStyle({ ...coord.photo, crop: coord.photo.face || coord.photo.crop })}" role="img" aria-label="${esc(coord.name)}"></span>
    <div><small>NRI Wing Global Coordinator</small><b>${esc(coord.name)}</b><span>Managing the party's global outreach and digital initiatives</span></div>
    <a class="btn btn-light btn-sm" href="#leadership">Meet our leaders →</a>`;

  /* ---------- journey ---------- */
  const rail = $("#yearRail");
  rail.innerHTML = JOURNEY.map((j, i) => `<button role="tab" data-i="${i}">${j.year}</button>`).join("");
  function showYear(i) {
    const j = JOURNEY[i];
    $$("button", rail).forEach((b, k) => b.classList.toggle("active", k === i));
    const y = $("#jYear");
    y.textContent = j.year; y.classList.remove("swap"); void y.offsetWidth; y.classList.add("swap");
    const art = $("#journeyArt"), ph = $("#jPhoto");
    art.classList.toggle("has-photo", !!j.photo);
    ph.style.backgroundImage = j.photo ? `url("${j.photo.src}")` : "";
    ph.classList.remove("swap"); void ph.offsetWidth; ph.classList.add("swap");
    $("#jCap").innerHTML = j.photo ? `${esc(j.photo.cap)}<small>Photo: ${esc(j.photo.credit)}</small>` : "";
    $("#journeyBody").innerHTML = `<h3>${j.year}: ${esc(j.title)}</h3><ul>${j.points.map((p, k) => `<li style="animation-delay:${k * 0.1}s">${esc(p)}</li>`).join("")}</ul><p class="j-src">Source: <a href="https://en.wikipedia.org/wiki/YSR_Congress_Party" target="_blank" rel="noopener">Wikipedia – YSR Congress Party</a>${j.year === 2017 || j.year === 2018 ? ' · <a href="https://en.wikipedia.org/wiki/Praja_Sankalpa_Yatra" target="_blank" rel="noopener">Praja Sankalpa Yatra</a>' : ""}</p>`;
  }
  // each year stays 2 minutes (time to read); pauses on hover or when the section is off screen
  const YEAR_MS = 120000, jProg = $("#jProg"), jLeft = $("#jLeft"), jCard = $(".journey-card");
  let jIdx = 0, jElapsed = 0, jHover = false, jSeen = false;
  const fmtLeft = (ms) => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const jReset = () => { jElapsed = 0; jProg.style.width = "0%"; jLeft.textContent = fmtLeft(YEAR_MS); };
  rail.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { jIdx = +b.dataset.i; showYear(jIdx); jReset(); } });
  jCard.addEventListener("pointerenter", () => { jHover = true; jCard.classList.add("paused"); });
  jCard.addEventListener("pointerleave", () => { jHover = false; jCard.classList.remove("paused"); });
  new IntersectionObserver(([en]) => (jSeen = en.isIntersecting), { threshold: 0.3 }).observe(jCard);
  setInterval(() => {
    if (document.hidden || jHover || !jSeen) return;
    jElapsed += 1000;
    if (jElapsed >= YEAR_MS) { jIdx = (jIdx + 1) % JOURNEY.length; showYear(jIdx); jReset(); return; }
    jProg.style.width = (jElapsed / YEAR_MS * 100) + "%";
    jLeft.textContent = fmtLeft(YEAR_MS - jElapsed);
  }, 1000);
  jReset();
  showYear(0);

  /* ---------- why / services / pillars ---------- */
  function renderWhy() {
    const el = $("#whyList");
    el.innerHTML = WHY_JOIN.map((w) => `<div class="why-item"><span class="ic">${w.icon}</span><div><h4>${esc(L(w.t))}</h4><p>${esc(L(w.d))}</p></div></div>`).join("");
    stagger(el);
  }
  const svcPhoto = (s, cls) => (s.photo ? `<span class="${cls}" style="background-image:url(&quot;${esc(s.photo.src)}&quot;);background-size:${s.photo.size};background-position:${s.photo.pos}" role="img" aria-label="Y.S. Jagan Mohan Reddy"></span>` : "");
  const svcIcon = (s) => (s.img ? `<img src="${esc(s.img)}" alt="" width="64" height="64">` : s.icon);
  function renderServices() {
    const el = $("#serviceGrid");
    el.innerHTML = SERVICES.map((s) => `<button class="svc${s.wide ? " svc-wide" : ""}" data-svc-id="${s.id}">${svcPhoto(s, "svc-photo")}<span class="ic">${svcIcon(s)}</span><h4>${esc(L(s.t))}</h4><p>${esc(L(s.d))}</p><span class="more">${esc(t("learnMore", "Learn more"))}</span></button>`).join("");
    stagger(el);
  }
  $("#serviceGrid").addEventListener("click", (e) => { const b = e.target.closest(".svc"); if (!b) return; if (b.dataset.svcId === "support247") open247(); else if (b.dataset.svcId === "idcard") openIdCard(); else openService(b.dataset.svcId); });
  function openIdCard() { state.user ? showCard() : openRegister(); }
  $$("[data-svc]").forEach((a) => a.addEventListener("click", () => {
    setTimeout(() => { const s = $(`.svc[data-svc-id="${a.dataset.svc}"]`); if (s) { s.classList.remove("flash"); void s.offsetWidth; s.classList.add("flash"); } }, 500);
  }));

  const SERVICE_DETAIL = {
    student: ["Pre-departure checklist and university shortlisting help", "Senior-student buddies in your city", "Emergency contacts and safety guidance"],
    legal: ["Property, land and inheritance questions in AP", "Help with certificates and documents", "Referral to a volunteer advocate in your district"],
    career: ["1:1 mentoring with senior NRIs", "Resume reviews and mock interviews", "Visa and job-search guidance"],
    local: ["A trusted contact in your home constituency", "Help for elderly parents back home", "Updates on local development work"],
    gulf: ["Indian Embassy and APNRTS emergency contacts", "Help with repatriation and mortal remains", "Guidance on wages, contracts and welfare schemes", "Focused on welfare and support only"],
    village: ["Pick your native village", "Support a school, library, water or health project", "Follow progress with photo updates", "No money is collected on this website"]
  };
  function openService(id) {
    const s = SERVICES.find((x) => x.id === id);
    openModal(`${s.photo ? `<figure class="svc-modal-photo">${svcPhoto(s, "smp-img")}<figcaption>${esc(s.photo.cap)}<small>Photo: ${esc(s.photo.credit)}</small></figcaption></figure>` : ""}<div class="svc-modal-ic">${svcIcon(s)}</div><h3 id="modalTitle">${esc(L(s.t))}</h3><p>${esc(L(s.d))}</p>
      <ul>${SERVICE_DETAIL[id].map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
      <div class="dash-actions"><a class="btn btn-primary" href="#helpdesk" data-close data-cat="${id}">Request this service →</a><button class="btn btn-ghost" data-open="register">Register first</button></div>`);
  }

  function renderPillars() {
    const el = $("#pillarGrid");
    el.innerHTML = PILLARS.map((p, i) => `
      <div class="pillar" tabindex="0">
        <div class="pillar-inner">
          <div class="pillar-face pillar-front${p.photo ? " has-photo" : ""}">${p.photo ? `<span class="p-photo" style="background-image:url(&quot;${esc(p.photo)}&quot;);background-position:${p.pos || "center 15%"}" role="img" aria-label="Y.S. Jagan Mohan Reddy"></span>` : ""}<span class="num">${String(i + 1).padStart(2, "0")}</span><span class="ic">${p.icon}</span><div><h4>${esc(lang === "te" ? p.te : p.t)}</h4><small>Hover to explore</small></div></div>
          <div class="pillar-face pillar-back">${p.photo ? `<span class="p-photo" style="background-image:url(&quot;${esc(p.photo)}&quot;);background-position:${p.pos || "center 15%"}"></span>` : ""}<span class="p-ic">${p.icon}</span><span>${esc(p.t.toUpperCase())}</span><p>${esc(p.d)}</p></div>
        </div>
      </div>`).join("");
    stagger(el);
  }
  $("#pillarGrid").addEventListener("click", (e) => { const p = e.target.closest(".pillar"); if (p) p.classList.toggle("flipped"); });

  /* ---------- chapters ---------- */
  let region = "all", query = "";
  const regions = ["all", ...new Set(CHAPTERS.map((c) => c.region))];
  function renderRegionChips() {
    $("#regionChips").innerHTML = regions.map((r) => `<button class="chip ${r === region ? "active" : ""}" data-r="${esc(r)}">${r === "all" ? esc(t("allRegions", "All regions")) : esc(r)}</button>`).join("");
  }
  $("#regionChips").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { region = b.dataset.r; renderRegionChips(); renderChapters(); } });
  $("#chapterSearch").addEventListener("input", (e) => { query = e.target.value.trim().toLowerCase(); renderChapters(); });
  $$("[data-region]").forEach((a) => a.addEventListener("click", () => { region = a.dataset.region; renderRegionChips(); renderChapters(); }));

  const flag = (c, w = 40) => `<img class="flag-img" src="https://flagcdn.com/w${w}/${c.iso}.png" alt="${esc(c.country)} flag" width="${w === 40 ? 32 : 18}" loading="lazy">`;
  const localTime = (tz) => { try { return new Date().toLocaleTimeString([], { timeZone: tz, hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
  function filteredChapters() {
    return CHAPTERS.map((c, i) => ({ ...c, i })).filter((c) => (region === "all" || c.region === region) && (!query || (c.city + " " + c.country).toLowerCase().includes(query)));
  }
  // city team email – set "email" on a city in data.js, otherwise <city>@ysrcpnriwing.org
  const cityEmail = (c) => c.email || c.city.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "") + "@ysrcpnriwing.org";
  function renderChapters() {
    const list = filteredChapters();
    $("#chapterGrid").innerHTML = list.length ? list.map((c, k) => `
      <article class="chapter" data-ch="${c.i}" style="--i:${k}">
        <div class="top"><span class="flag">${flag(c)}</span><div><h4>${esc(c.city)}</h4><small>${esc(c.country)} · ${esc(c.region)}</small></div></div>
        <div class="meta"><span>👥 ${c.members.toLocaleString("en-IN")} members</span><span>🕒 ${localTime(c.tz)}</span></div>
        <a class="ch-email" href="mailto:${esc(cityEmail(c))}" title="Email the ${esc(c.city)} team">✉️ <span>${esc(cityEmail(c))}</span></a>
        <div class="acts"><button class="btn btn-wa" data-wa="${c.i}">WhatsApp</button><button class="btn btn-glass" data-chp="${c.i}">City page</button></div>
      </article>`).join("") : `<p class="empty">No city team yet – <a href="#" data-open="register" style="color:#5cf5a3">register</a> and we'll help you start one!</p>`;
  }
  /* ---------- world map + country-wise members ---------- */
  const byCountry = {};
  CHAPTERS.forEach((c) => {
    const k = c.iso.toUpperCase();
    (byCountry[k] = byCountry[k] || { code: k, iso: c.iso, country: c.country, members: 0, cities: [] });
    byCountry[k].members += c.members;
    byCountry[k].cities.push(c.city);
  });
  const countries = Object.values(byCountry).sort((a, b) => b.members - a.members);
  const fmtN = (n) => n.toLocaleString("en-IN");
  function showCountry(name) {
    query = name.toLowerCase(); region = "all";
    $("#chapterSearch").value = name;
    renderRegionChips(); renderChapters();
    $$("#countryList tr").forEach((tr) => tr.classList.toggle("on", tr.dataset.country === name));
    if (committeeTeams) { committeeCountry = name; renderCommittee(); }
    goTo("chapters");
    setTimeout(() => $("#chapterGrid").scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }
  /* ---------- country committees: President, Vice President … (names added by admins) ---------- */
  const CORE_ROLES = ["President", "Vice President", "General Secretary", "Secretary", "Treasurer"];
  let committeeTeams = {}, committeeCountry = countries[0] && countries[0].country;
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  function leaderCard(l, role, size) {
    if (!l) return `<div class="cm-card cm-${size} cm-tba"><span class="cm-ava">?</span><span class="cm-role">${esc(role)}</span><b>To be announced</b><small>Position open</small></div>`;
    return `<div class="cm-card cm-${size}">
      <span class="cm-ava">${l.photo ? `<img src="${l.photo}" alt="${esc(l.name)}">` : esc(initials(l.name))}</span>
      <span class="cm-role">${esc(l.role)}</span><b>${esc(l.name)}</b>${l.city ? `<small>📍 ${esc(l.city)}</small>` : ""}</div>`;
  }
  function renderCommittee() {
    const c = countries.find((x) => x.country === committeeCountry) || countries[0];
    if (!c) return;
    const team = committeeTeams[c.country] || [];
    const of = (role) => team.filter((l) => l.role === role);
    const president = of("President")[0];
    const vps = of("Vice President");
    const officers = ["General Secretary", "Secretary", "Treasurer"].flatMap((r) => (of(r).length ? of(r).map((l) => [l, r]) : [[null, r]]));
    const others = team.filter((l) => !CORE_ROLES.includes(l.role));
    const cities = CHAPTERS.filter((x) => x.country === c.country);
    $("#cmCountries").innerHTML = countries.map((x) => `<button class="cm-chip${x.country === c.country ? " on" : ""}" data-cm="${esc(x.country)}">${flag(x, 40)}<span>${esc(x.country)}</span>${(committeeTeams[x.country] || []).length ? `<i>${committeeTeams[x.country].length}</i>` : ""}</button>`).join("");
    $("#cmPanel").innerHTML = `
      <div class="cm-title">${flag(c, 80)}<div><h4>YSRCP NRI Wing – ${esc(c.country)}</h4><small>${fmtN(c.members)} members · ${cities.length} ${cities.length === 1 ? "city" : "cities"}: ${cities.map((x) => esc(x.city)).join(", ")}</small></div></div>
      <div class="cm-tree">
        <div class="cm-level">${leaderCard(president, "President", "lg")}</div>
        <div class="cm-level">${(vps.length ? vps : [null]).map((l) => leaderCard(l, "Vice President", "md")).join("")}</div>
        <div class="cm-level cm-grid">${officers.map(([l, r]) => leaderCard(l, r, "sm")).join("")}</div>
        ${others.length ? `<h5 class="cm-sub">Coordinators &amp; executive members</h5><div class="cm-level cm-grid">${others.map((l) => leaderCard(l, l.role, "sm")).join("")}</div>` : ""}
      </div>
      <p class="cm-foot">Want to serve the NRI Wing in ${esc(c.country)}? Write to <a href="mailto:${esc(cities[0] ? cityEmail(cities[0]) : "info@ysrcpnriwing.org")}">${esc(cities[0] ? cityEmail(cities[0]) : "info@ysrcpnriwing.org")}</a></p>`;
    stagger($("#cmPanel"));
  }
  $("#cmCountries").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cm]"); if (!b) return;
    committeeCountry = b.dataset.cm; renderCommittee();
  });
  async function loadCommittees() {
    try { committeeTeams = (await API.get("/country-teams")).teams || {}; renderCommittee(); } catch {}
  }
  renderCommittee();
  (function countryList() {
    const total = countries.reduce((s, c) => s + c.members, 0), max = countries[0].members;
    $("#totalMembers").textContent = fmtN(total);
    $("#totalCountries").textContent = `in ${countries.length} countries · ${CHAPTERS.length} cities`;
    $("#countryList").innerHTML = countries.map((c, i) => `<tr data-country="${esc(c.country)}" tabindex="0">
      <td class="ct-rank">${i + 1}</td>
      <td class="ct-country">${flag(c, 40)}<b>${esc(c.country)}</b></td>
      <td class="ct-cities">${c.cities.map(esc).join(", ")}</td>
      <td class="ct-num"><b>${fmtN(c.members)}</b></td>
      <td class="ct-share"><span class="ct-bar"><i style="width:${(c.members / max * 100).toFixed(1)}%"></i></span><small>${(c.members / total * 100).toFixed(1)}%</small></td>
    </tr>`).join("");
    $("#countryList").addEventListener("click", (e) => { const tr = e.target.closest("tr"); if (tr) showCountry(tr.dataset.country); });
    $("#countryList").addEventListener("keydown", (e) => { const tr = e.target.closest("tr"); if (tr && e.key === "Enter") showCountry(tr.dataset.country); });
  })();
  // drawn the first time the My City page is opened (a hidden map gets no size)
  let worldMapDone = false;
  function initWorldMap() {
    if (worldMapDone) return;
    worldMapDone = true;
    const el = $("#worldJvm");
    if (!el || typeof jsVectorMap === "undefined") { if (el) el.innerHTML = '<p class="map-fallback">Map could not load – check your internet connection.</p>'; return; }
    const values = {}; countries.forEach((c) => (values[c.code] = c.members));
    const map = new jsVectorMap({
      selector: "#worldJvm",
      map: "world",
      zoomButtons: true,
      zoomOnScroll: false,
      backgroundColor: "transparent",
      regionStyle: {
        initial: { fill: "#24406f", stroke: "#0b1d44", strokeWidth: 0.6, fillOpacity: 1 },
        hover: { fillOpacity: 1, fill: "#f5b800", cursor: "pointer" }
      },
      visualizeData: { scale: ["#7ce7a9", "#0a7a43"], values },
      markers: CHAPTERS.map((c) => ({ name: c.city + ", " + c.country, coords: CITY_COORDS[c.city] })),
      markerStyle: {
        initial: { fill: "#ffd84d", stroke: "#ffffff", strokeWidth: 2, r: 5 },
        hover: { fill: "#ffffff", stroke: "#f5b800", cursor: "pointer" }
      },
      onRegionTooltipShow(event, tooltip, code) {
        const c = byCountry[code];
        const name = c ? c.country : tooltip.text();
        tooltip.text(c
          ? `<b>${esc(name)}</b><br>👥 ${fmtN(c.members)} NRI members<br>📍 ${esc(c.cities.join(", "))}`
          : `<b>${esc(name)}</b><br><small>No city team yet</small>`, true);
      },
      onMarkerTooltipShow(event, tooltip, index) {
        const c = CHAPTERS[index];
        tooltip.text(`<b>${esc(c.city)}</b> · ${esc(c.country)}<br>👥 ${fmtN(c.members)} members`, true);
      },
      onRegionClick(event, code) { const c = byCountry[code]; if (c) showCountry(c.country); },
      onMarkerClick(event, index) {
        const card = $(`.chapter[data-ch="${index}"]`);
        if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); card.classList.add("hl"); setTimeout(() => card.classList.remove("hl"), 1800); }
      }
    });
    addEventListener("resize", () => { if (el.offsetParent && map.updateSize) map.updateSize(); });
  }
  $("#chapterGrid").addEventListener("click", (e) => {
    const wa = e.target.closest("[data-wa]"), cp = e.target.closest("[data-chp]");
    if (wa) {
      const c = CHAPTERS[wa.dataset.wa];
      openModal(`<h3 id="modalTitle">Join ${esc(c.city)} WhatsApp group</h3>
        <p>To keep our groups safe, the coordinator verifies every new member before sharing the invite link.</p>
        <form class="stack" data-form="wa"><input type="hidden" name="chapter" value="${esc(c.city)}"><label>Name<input name="name" required></label><label>WhatsApp number<input name="phone" required type="tel" placeholder="+1 555 123 4567"></label>
        <label class="check"><input type="checkbox" required> I agree to be contacted by the ${esc(c.city)} coordinator.</label>
        <button class="btn btn-wa btn-block">Request invite</button></form>`);
    }
    if (cp) {
      const c = CHAPTERS[cp.dataset.chp];
      const evs = upcomingEvents().filter((ev) => ev.chapter === c.city || ev.chapter === "Global").slice(0, 3);
      openModal(`<div class="flag big-flag">${flag(c, 80)}</div><h3 id="modalTitle">${esc(c.city)} NRI team</h3>
        <div class="dash-grid">
          <div class="dash-tile"><h5>Coordinator</h5><b>To be announced</b><br><small class="muted">Details shared by the central NRI team</small></div>
          <div class="dash-tile"><h5>Members</h5><span class="big">${c.members.toLocaleString("en-IN")}</span></div>
          <div class="dash-tile"><h5>Local time</h5><span class="big">${localTime(c.tz)}</span></div>
          <div class="dash-tile"><h5>Region</h5><b>${esc(c.region)}</b></div>
          <div class="dash-tile" style="grid-column:1/-1"><h5>Email</h5><a href="mailto:${esc(cityEmail(c))}" style="color:var(--blue);font-weight:700;word-break:break-all">✉️ ${esc(cityEmail(c))}</a></div>
        </div>
        <h4 style="margin-top:18px">Upcoming events</h4>
        <ul>${evs.map((ev) => `<li><b>${esc(ev.title)}</b> – ${fmtDate(ev.date)}</li>`).join("")}</ul>
        <div class="dash-actions"><button class="btn btn-primary" data-set-chapter="${cp.dataset.chp}">Make this my city</button></div>`);
    }
  });

  /* ---------- "How can we help you?" + nearest chapter ---------- */
  // guess the visitor's country from their time zone (no location permission needed)
  const myChapter = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return CHAPTERS.find((c) => c.tz === tz) || null;
    } catch { return null; }
  })();
  $("#quickGrid").innerHTML = QUICK.map((q) => `
    <button class="quick-tile${q.accent ? " q-" + q.accent : ""}" type="button" data-go="${q.go || ""}" data-action="${q.action || ""}">
      <span class="q-ic">${q.icon}</span>
      <span class="q-txt"><b>${esc(q.en)}</b><small>${q.id === "qChapter" && myChapter ? "Nearest to you: " + esc(myChapter.city) + ", " + esc(myChapter.country) : esc(q.sub)}</small></span>
    </button>`).join("");
  stagger($("#quickGrid"));
  $("#quickGrid").addEventListener("click", (e) => {
    const b = e.target.closest(".quick-tile"); if (!b) return;
    const a = b.dataset.action;
    if (a === "idcard") return openIdCard();
    if (a && a.startsWith("svc:")) return openService(a.slice(4));
    if (b.dataset.go === "#chapters" && myChapter) { showCountry(myChapter.country); return; }
    if (b.dataset.go) location.hash = b.dataset.go;
  });



  /* ---------- events ---------- */
  const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  $("#tzLabel").textContent = "🌐 " + userTZ;
  function upcomingEvents() {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    return EVENTS.map((ev) => {
      // istHour is IST (UTC+5:30)
      const ms = today.getTime() + ev.day * 864e5 + (ev.istHour - 5.5) * 36e5;
      return { ...ev, date: new Date(ms) };
    });
  }
  const fmtDate = (d) => d.toLocaleString(lang === "te" ? "te-IN" : undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  let evFilter = "all";
  function renderEvents() {
    const list = upcomingEvents().filter((e) => evFilter === "all" || e.type === evFilter);
    const tagName = { live: "LIVE", meet: "IN PERSON", online: "ONLINE" };
    $("#eventList").innerHTML = list.map((ev, i) => {
      const going = state.rsvps.includes(ev.id);
      return `<article class="event" style="--i:${i}">
        <div class="ev-date"><b>${ev.date.getDate()}</b><span>${ev.date.toLocaleString("en", { month: "short" })}</span></div>
        <div class="ev-info"><h4>${esc(ev.title)}</h4><p><span class="ev-tag ${ev.type}">${tagName[ev.type]}</span>🕒 ${ev.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} your time · 📍 ${esc(ev.where)}</p></div>
        <button class="btn btn-ghost btn-sm rsvp ${going ? "going" : ""}" data-rsvp="${ev.id}">${going ? esc(t("going", "✓ Going")) : esc(t("rsvp", "RSVP"))}</button>
      </article>`;
    }).join("");
  }
  $("#eventFilters").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    evFilter = b.dataset.f;
    $$(".chip", $("#eventFilters")).forEach((c) => c.classList.toggle("active", c === b));
    renderEvents();
  });
  $("#eventList").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-rsvp]"); if (!b) return;
    const id = b.dataset.rsvp;
    if (API.online) {
      if (!state.user) { toast("Please register or log in to RSVP"); openRegister(); return; }
      try {
        const r = await API.post(`/events/${id}/rsvp`);
        state.rsvps = r.going ? [...new Set([...state.rsvps, id])] : state.rsvps.filter((x) => x !== id);
        toast(r.going ? "🎉 You're going! We'll send a reminder." : "RSVP cancelled");
      } catch (err) { toast(err.message); return; }
    } else {
      const i = state.rsvps.indexOf(id);
      if (i >= 0) { state.rsvps.splice(i, 1); toast("RSVP cancelled"); }
      else { state.rsvps.push(id); toast("🎉 You're going! We'll send a reminder."); }
    }
    save("rsvps"); renderEvents();
  });

  // countdown to next Live with Leaders
  function tick() {
    const next = upcomingEvents().filter((e) => e.type === "live" && e.date > new Date()).sort((a, b) => a.date - b.date)[0];
    if (!next) return;
    let s = Math.max(0, Math.floor((next.date - new Date()) / 1000));
    const parts = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
    $$("#countdown b").forEach((b, i) => { const v = String(parts[i]).padStart(2, "0"); if (b.textContent !== v) b.textContent = v; });
  }
  tick(); setInterval(tick, 1000);

  let remoteQuestions = null; // from the backend when online
  function renderQuestions() {
    const sample = [{ q: "How can NRIs support farmers in our home districts?", by: "Anil, Chicago" }, { q: "Will there be a session for students abroad?", by: "Divya, Melbourne" }];
    const list = remoteQuestions && remoteQuestions.length ? remoteQuestions : [...state.questions.slice().reverse(), ...sample];
    $("#qFeed").innerHTML = list.slice(0, 6).map((x) => `<div>${esc(x.q)}<small>— ${esc(x.by)}</small></div>`).join("");
  }
  async function loadQuestions() {
    try { remoteQuestions = (await API.get("/questions")).questions; renderQuestions(); } catch {}
  }
  $("#questionForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ta = $("textarea", e.target);
    const q = ta.value.trim();
    if (API.online) {
      try { await API.post("/questions", { text: q }); await loadQuestions(); }
      catch (err) { toast(err.message); return; }
    } else {
      state.questions.push({ q, by: state.user ? `${state.user.name.split(" ")[0]}, ${state.user.city}` : "You" });
      save("questions"); renderQuestions();
    }
    ta.value = "";
    if (API.online) { if (state.user) syncMe().then(loadLeaderboard); } else completeTask("t5", true);
    toast("✅ Question submitted for the next town hall");
  });

  /* ---------- help desk ---------- */
  $("#helpDistrict").innerHTML += DISTRICTS.map((d) => `<option>${esc(d)}</option>`).join("");
  $$(".help-card .tab").forEach((tb) => tb.addEventListener("click", () => switchHelpTab(tb.dataset.tab)));
  function switchHelpTab(name) {
    $$(".help-card .tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === name));
    $$(".help-card .tab-pane").forEach((p) => p.classList.toggle("active", p.dataset.pane === name));
  }
  const STATUSES = ["Received", "Assigned", "In progress", "Resolved"];
  function ticketStage(tk) {
    if (tk.status) return Math.max(0, STATUSES.indexOf(tk.status));
    if (tk.demo) return 3;
    const mins = (Date.now() - tk.created) / 60000; // demo progression
    return mins > 60 * 24 * 3 ? 3 : mins > 30 ? 2 : mins > 1 ? 1 : 0;
  }
  // server dates are UTC ("2026-10-14 05:50:25") → member's local date
  const tkDate = (d, time) => { if (!d) return ""; const x = new Date(d.includes("T") ? d : d.replace(" ", "T") + "Z"); return isNaN(x) ? "" : x.toLocaleString([], time ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }); };
  function ticketHTML(tk) {
    const st = ticketStage(tk), steps = tk.steps || {};
    const due = tk.due_at && st < 3 ? new Date(tk.due_at.replace(" ", "T") + "Z") : null;
    const late = due && due < new Date();
    const info = [
      tk.volunteer ? `👤 Volunteer: <b>${esc(tk.volunteer.name)}</b> (${esc(tk.volunteer.district)})` : st < 3 && tk.steps ? "👤 Finding a volunteer in your district…" : "",
      due ? `<span class="${late ? "tk-late" : ""}">🎯 Target: <b>${tkDate(tk.due_at)}</b>${late ? " – we are on it" : ""}</span>` : ""
    ].filter(Boolean);
    return `<div class="ticket">
      <div class="ticket-head"><div><b>#${esc(tk.id)}</b><br><small class="muted">${esc(tk.cat)} · ${esc(tk.district)}</small></div><span>${tk.urgent ? "<span class=\"pill pill-urgent\">🚨 Urgent · 24/7</span> " : ""}<span class="pill">${STATUSES[st]}</span></span></div>
      <div class="status-line"><span class="fill" style="width:0" data-w="${(st / 3) * 100}"></span>
        ${STATUSES.map((s, i) => `<div class="${i <= st ? "on" : ""}"><i>${i <= st ? "✓" : i + 1}</i>${s}${i <= st && steps[s] ? `<small class="tk-when">${tkDate(steps[s], true)}</small>` : ""}</div>`).join("")}
      </div>
      ${info.length ? `<div class="tk-info">${info.join("")}</div>` : ""}
      ${tk.resolution ? `<div class="tk-resolution"><b>✅ What was done</b><br>${esc(tk.resolution)}</div>` : ""}</div>`;
  }
  // fresh status from the server (logged-in members get everything via /me; others by ticket number)
  async function refreshTickets() {
    if (!API.online) return;
    if (API.getToken()) return syncMe();
    if (!state.tickets.length) return;
    const fresh = await Promise.all(state.tickets.map((tk) => API.get("/tickets/" + encodeURIComponent(tk.id)).then((r) => r.ticket).catch(() => tk)));
    state.tickets = fresh; save("tickets"); renderMyTickets();
  }
  const animateFills = (root) => requestAnimationFrame(() => $$(".fill", root).forEach((f) => (f.style.width = `calc((100% - 28px) * ${f.dataset.w / 100})`)));
  function renderMyTickets() {
    const el = $("#myTickets");
    el.innerHTML = state.tickets.length ? `<h4 style="margin:22px 0 0">My requests</h4>` + state.tickets.slice().reverse().map(ticketHTML).join("") : "";
    animateFills(el);
  }
  $("#helpForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    let tk;
    if (API.online) {
      try {
        tk = (await API.post("/tickets", { name: f.get("name"), phone: f.get("phone"), country: f.get("country"), category: f.get("cat"), district: f.get("district"), description: f.get("desc"), urgent: !!f.get("urgent"), consent: true })).ticket;
      } catch (err) { toast(err.message); return; }
    } else {
      tk = { id: "HD-" + Math.floor(1000 + Math.random() * 9000), cat: f.get("cat"), district: f.get("district"), urgent: !!f.get("urgent"), created: Date.now() };
    }
    state.tickets.push(tk); save("tickets");
    e.target.reset();
    switchHelpTab("track");
    $("#trackResult").innerHTML = `<p style="margin-top:14px">✅ Request received. Your ticket number is <b>#${tk.id}</b>. Keep it to track progress.${tk.urgent ? " <br>🚨 Marked <b>urgent</b> – it goes to the 24/7 priority line." : ""}</p>`;
    renderMyTickets();
    confetti(40);
  });
  $("#trackForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = $("#trackInput").value.trim().toUpperCase().replace(/^#/, "");
    let tk = null;
    if (API.online) {
      try { tk = (await API.get("/tickets/" + encodeURIComponent(id))).ticket; } catch {}
    } else {
      tk = state.tickets.find((x) => x.id === id) || (id === "HD-4821" ? { id, cat: "Documents & certificates", district: "Guntur", demo: true } : null);
    }
    $("#trackResult").innerHTML = tk ? ticketHTML(tk) : `<p style="margin-top:14px;color:#c21">No ticket found with that number. Please check and try again.</p>`;
    animateFills($("#trackResult"));
  });

  /* ---------- 24/7 support ---------- */
  const fab = $("#fab247"), panel = $("#panel247"), pBody = $("#p247Body");
  const contactHref = (h) => (h.tel ? "tel:" + h.tel : h.wa ? "https://wa.me/" + h.wa : h.url);
  function render247Home() {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    pBody.innerHTML = `
      <p class="p247-open">🟢 It's <b>${now}</b> where you are – support is open right now.</p>
      <button class="btn btn-primary btn-block" data-urgent247>🚨 Raise an urgent request</button>
      <h5>What do you need help with?</h5>
      <div class="qh-grid">${QUICK_HELP.map((q) => `<button class="qh" data-qh="${q.id}"><span>${q.icon}</span>${esc(q.title)}</button>`).join("")}</div>
      <h5>Helplines</h5>
      <ul class="hl-list">${HELPLINES.map((h) => `<li><a href="${esc(contactHref(h))}" ${h.tel ? "" : 'target="_blank" rel="noopener"'}><span class="hl-ic">${h.icon}</span><span><b>${esc(h.name)}</b><small>${esc(h.note)}</small></span><em>${esc(h.show)}</em></a></li>`).join("")}</ul>`;
  }
  function render247Topic(id) {
    const q = QUICK_HELP.find((x) => x.id === id);
    pBody.innerHTML = `
      <button class="p247-back" data-back247>← Back</button>
      <h4>${q.icon} ${esc(q.title)}</h4>
      <ol class="qh-steps">${q.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <button class="btn btn-primary btn-block" data-urgent247>🚨 Raise an urgent request</button>`;
  }
  function open247() {
    render247Home();
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("open"));
    fab.setAttribute("aria-expanded", "true");
  }
  function close247() {
    panel.classList.remove("open");
    fab.setAttribute("aria-expanded", "false");
    setTimeout(() => (panel.hidden = true), 300);
  }
  fab.addEventListener("click", () => (panel.hidden ? open247() : close247()));
  panel.addEventListener("click", (e) => {
    if (e.target.closest("[data-close247]")) close247();
    const q = e.target.closest("[data-qh]"); if (q) render247Topic(q.dataset.qh);
    if (e.target.closest("[data-back247]")) render247Home();
    if (e.target.closest("[data-urgent247]")) {
      close247();
      const form = $("#helpForm");
      form.elements.cat.value = "Emergency abroad (24/7)";
      form.elements.urgent.checked = true;
      switchHelpTab("raise");
      goTo("helpdesk");
      setTimeout(() => form.elements.name.focus({ preventScroll: true }), 700);
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) close247(); });
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-open247]"); if (a) { e.preventDefault(); open247(); } });

  /* ---------- Meet Jagan Sir ---------- */
  // 50 approved photos (js/meet-wall-data.js) in moving rows; loaded only when the section comes near the screen
  (function meetWall() {
    const wallEl = $("#meetWall");
    const photos = [...MEET_WALL_USER, ...MEET_WALL_EXTRA];
    if (!wallEl || !photos.length) return;
    // spread photos from different screenshots across the rows
    const mixed = photos.map((p, i) => ({ p, k: (i * 37) % photos.length })).sort((a, b) => a.k - b.k).map((x) => x.p);
    const per = Math.ceil(mixed.length / 4);
    const tileHTML = (p) => `<span class="mw-tile" style="background-image:url(&quot;${esc(p.src)}&quot;);background-size:${p.size};background-position:${p.pos}"></span>`;
    const build = () => {
      // enough 170px rows to cover the section (more rows on tall/narrow screens), cycling through all photos
      const rows = Math.max(4, Math.ceil((wallEl.offsetHeight * 1.2) / 180));
      wallEl.innerHTML = Array.from({ length: rows }, (_, r) => {
        const tiles = Array.from({ length: per }, (_, k) => tileHTML(mixed[(r * per + k) % mixed.length])).join("");
        return `<div class="mw-row ${r % 2 ? "rev" : ""}" style="--speed:${70 + r * 12}s"><div class="mw-track">${tiles}${tiles}</div></div>`;
      }).join("");
    };
    const io2 = new IntersectionObserver(([e]) => { if (e.isIntersecting) { build(); io2.disconnect(); } }, { rootMargin: "600px 0px" });
    io2.observe(wallEl);
  })();
  const meetForm = $("#meetForm");
  // fill in the logged-in member's details (also after logging in later – called when the page opens)
  function prefillMeet() {
    const u = state.user, el = meetForm.elements; if (!u) return;
    if (!el.name.value) el.name.value = u.name || "";
    if (!el.email.value) el.email.value = u.email || "";
    if (!el.phone.value) el.phone.value = u.phone || "";
    if (!el.place.value) el.place.value = [u.city, u.country].filter(Boolean).join(", ");
  }
  prefillMeet();
  meetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(meetForm));
    let ref;
    if (API.online) {
      try { ref = (await API.post("/meet-requests", { ...f, consent: true })).ref; }
      catch (err) { toast(err.message); return; }
    } else {
      ref = "MJ-" + Math.floor(1000 + Math.random() * 9000);
      const list = store.get("meetRequests", []);
      list.push({ ref, ...f, created: Date.now() });
      store.set("meetRequests", list);
    }
    meetForm.hidden = true;
    const done = $("#meetDone");
    done.innerHTML = `<div class="md-icon">✓</div><h4>Request received</h4>
      <p>Your reference number is <b>#${esc(ref)}</b>. The NRI Wing Global Coordinator's office will review it and contact you on WhatsApp or email if a meeting can be arranged.</p>
      <p class="muted">${esc(f.type)} · ${esc(f.where)} · ${esc(f.people)} ${f.people === "1" ? "person" : "people"}</p>
      <button class="btn btn-ghost btn-sm" type="button" id="meetAgain">Send another request</button>`;
    done.hidden = false;
    $("#meetAgain").addEventListener("click", () => { meetForm.reset(); meetForm.hidden = false; done.hidden = true; });
    confetti(60);
    toast("✅ Meeting request #" + ref + " sent");
  });

  /* ---------- volunteer ---------- */
  const points = () => (API.online && state.user && typeof state.serverPoints === "number") ? state.serverPoints
    : state.tasks.reduce((s, id) => s + (TASKS.find((x) => x.id === id)?.pts || 0), 0) + (state.user ? 10 : 0);
  // online: done = approved by an admin after the member sends proof; offline: self-marked
  const taskState = (id) => (state.tasks.includes(id) ? "approved" : (state.taskSubs[id] && state.taskSubs[id].status) || "none");
  function renderTasks() {
    const el = $("#taskGrid");
    el.innerHTML = TASKS.map((tk) => {
      const st = taskState(tk.id), sub = state.taskSubs[tk.id] || {}, link = state.taskLinks[tk.id];
      const btn = !API.online
        ? `<button class="btn btn-ghost btn-sm" data-task="${tk.id}">${st === "approved" ? esc(t("done", "✓ Done")) : esc(t("markDone", "Mark done"))}</button>`
        : st === "approved" ? `<span class="task-state ok">✓ Approved</span>`
        : st === "pending" ? `<button class="btn btn-ghost btn-sm" data-task="${tk.id}">⏳ Pending review</button>`
        : st === "rejected" ? `<button class="btn btn-ghost btn-sm" data-task="${tk.id}">↻ Send again</button>`
        : `<button class="btn btn-ghost btn-sm" data-task="${tk.id}">📎 Submit proof</button>`;
      return `<article class="task ${st === "approved" ? "done" : ""} ${st === "pending" ? "pending" : ""} ${st === "rejected" ? "rejected" : ""}"><span class="ic">${tk.icon}</span><h4>${esc(tk.title)}</h4><p>${esc(tk.desc)}</p>
        ${link ? `<a class="task-link" href="${esc(link)}" target="_blank" rel="noopener">🔗 Open ${tk.id === "t1" ? "this week's post" : "link"} ↗</a>` : ""}
        ${st === "rejected" && sub.reviewNote ? `<p class="task-note">❌ Not approved: ${esc(sub.reviewNote)}</p>` : ""}
        ${st === "pending" ? `<p class="task-note wait">Our team will check your proof soon. Points are added after approval.</p>` : ""}
        <div class="foot"><span class="pts">+${tk.pts} pts</span>${btn}</div></article>`;
    }).join("");
    stagger(el);
    renderPoints();
  }
  // proof form: link to the shared post and/or a screenshot
  function openProofForm(id) {
    const tk = TASKS.find((x) => x.id === id), sub = state.taskSubs[id] || {}, link = state.taskLinks[id];
    const hint = {
      t1: "Paste the link to YOUR shared post (Facebook / Instagram / X / WhatsApp status screenshot).",
      t2: "Write whom you called (village / constituency) and add a screenshot of your call list if you like.",
      t3: "Add a photo or screenshot from the meet you attended.",
      t4: "Write the name / member number of the person who registered.",
      t6: "Add a photo of your village project update."
    }[id] || "Add a link or screenshot as proof.";
    openModal(`<h3 id="modalTitle">${tk.icon} ${esc(tk.title)}</h3>
      <p>${esc(hint)} Our team checks every proof – <b>+${tk.pts} points</b> are added after approval.</p>
      ${link ? `<p><a class="task-link" href="${esc(link)}" target="_blank" rel="noopener">🔗 Open this week's official post ↗</a></p>` : ""}
      ${sub.status === "rejected" && sub.reviewNote ? `<p class="task-note">❌ Last time: ${esc(sub.reviewNote)}</p>` : ""}
      <form id="proofForm" class="stack">
        <label>Link to your post <small class="muted">(https://…)</small><input name="url" type="url" maxlength="500" placeholder="https://www.facebook.com/…" value="${esc(sub.proofUrl || "")}"></label>
        <div class="proof-shot"><button type="button" class="photo-pick proof-pick" data-proof-shot aria-label="Add screenshot"><span>🖼️</span></button>
          <div><b>Screenshot</b> <small class="muted">(optional if you added a link)</small><br><small class="muted">A photo or screen capture of your post / activity.</small></div></div>
        <label>Note <small class="muted">(optional)</small><textarea name="note" rows="2" maxlength="500" placeholder="e.g. Shared in 3 WhatsApp groups and on Facebook">${esc(sub.note || "")}</textarea></label>
        <div class="row2">${sub.status === "pending" ? `<button type="button" class="btn btn-ghost" data-withdraw="${id}">Withdraw</button>` : `<span></span>`}<button class="btn btn-primary">Send for review</button></div>
      </form>`);
    const form = $("#proofForm");
    let shot = null;
    form.addEventListener("click", async (e) => {
      if (e.target.closest("[data-proof-shot]")) {
        const img = await pickScreenshot(); if (!img) return;
        shot = img; $("[data-proof-shot]", form).innerHTML = `<img src="${img}" alt="Screenshot">`;
      }
      const w = e.target.closest("[data-withdraw]");
      if (w) {
        try { await API.del("/tasks/" + w.dataset.withdraw); } catch (err) { toast(err.message); return; }
        delete state.taskSubs[id]; renderTasks(); closeModal(); toast("Submission withdrawn");
      }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      if (!f.url.trim() && !shot) { toast("Please add the link to your post or a screenshot"); return; }
      const btn = $("button:not([type])", form); btn.disabled = true;
      try { await API.post(`/tasks/${id}/submit`, { url: f.url.trim(), note: f.note, image: shot }); }
      catch (err) { toast(err.message); btn.disabled = false; return; }
      state.taskSubs[id] = { status: "pending", proofUrl: f.url.trim(), note: f.note, reviewNote: "" };
      renderTasks(); closeModal(); toast("📨 Sent for review – points are added after approval");
    });
  }
  // screenshot → max 1080px wide JPEG (about 100–200 KB)
  function pickScreenshot() {
    return new Promise(async (resolve) => {
      const file = await choosePhotoSource({ facing: "environment", title: "Add a photo or screenshot" });
      {
        if (!file || !String(file.type).startsWith("image/")) return resolve(null);
        const url = URL.createObjectURL(file), img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height, q = 0.72;
          const max = 1080; if (w > max) { h = Math.round(h * max / w); w = max; }
          const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
          let data = c.toDataURL("image/jpeg", q);
          while (data.length > 270000 && q > 0.35) { q -= 0.12; data = c.toDataURL("image/jpeg", q); }
          URL.revokeObjectURL(url);
          if (data.length > 270000) { toast("That screenshot is too large – please crop it"); return resolve(null); }
          resolve(data);
        };
        img.onerror = () => { URL.revokeObjectURL(url); toast("Sorry, that image could not be opened"); resolve(null); };
        img.src = url;
      }
    });
  }
  async function loadTaskLinks() {
    try { state.taskLinks = (await API.get("/task-links")).links || {}; renderTasks(); } catch {}
  }
  function renderPoints(bump) {
    const p = points();
    $("#myPoints").textContent = p;
    const next = BADGES.find((b) => b.need > p);
    const prevNeed = [...BADGES].reverse().find((b) => b.need <= p)?.need || 0;
    const pct = next ? (p - prevNeed) / (next.need - prevNeed) : 1;
    $(".ring-fg").style.strokeDashoffset = 326.7 * (1 - pct);
    $("#nextBadge").innerHTML = next ? `<b>${next.need - p}</b> pts to unlock ${next.icon} <b>${next.name}</b>` : "👑 All badges unlocked!";
    if (bump) { const r = $("#pointsRing"); r.classList.remove("bump"); void r.offsetWidth; r.classList.add("bump"); }
    const me = state.user ? { name: state.user.name.split(" ")[0] + " (you)", city: state.user.city, pts: p, me: true } : null;
    const board = remoteLeaders && remoteLeaders.length
      ? remoteLeaders.slice(0, 7)
      : [...LEADERBOARD, ...(me && p > 0 ? [me] : [])].sort((a, b) => b.pts - a.pts).slice(0, 7);
    $("#leaderboard").innerHTML = board.map((x, i) => `<li class="${x.me ? "me" : ""}"><span class="rk">${i + 1}</span><div><b>${esc(x.name)}</b><small>${esc(x.city)}</small></div><span class="pts">${x.pts}</span></li>`).join("");
    renderBadges();
  }
  let remoteLeaders = null; // real leaderboard from the backend
  async function loadLeaderboard() {
    try { remoteLeaders = (await API.get("/leaderboard")).leaders; renderPoints(); } catch {}
  }
  async function completeTask(id, silent) {
    if (state.tasks.includes(id)) return;
    if (API.online) return; // online, points come from approved proof (see openProofForm)
    const before = BADGES.filter((b) => b.need <= points()).length;
    state.tasks.push(id); save("tasks");
    if (API.online) loadLeaderboard();
    renderTasks(); renderPoints(true);
    const after = BADGES.filter((b) => b.need <= points()).length;
    if (after > before) { const b = BADGES[after - 1]; confetti(); toast(`🏅 Badge unlocked: ${b.icon} ${b.name}!`); }
    else if (!silent) toast(`+${TASKS.find((x) => x.id === id).pts} points! Keep going 💪`);
  }
  $("#taskGrid").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-task]"); if (!b) return;
    const id = b.dataset.task;
    if (API.online) {
      if (!state.user) { toast("Please register or log in to do volunteer tasks"); openRegister(); return; }
      openProofForm(id); return;
    }
    if (state.tasks.includes(id)) { state.tasks = state.tasks.filter((x) => x !== id); save("tasks"); renderTasks(); return; }
    completeTask(id);
  });

  /* ---------- achievements ---------- */
  function renderAchStats() {
    const el = $("#achStats");
    el.innerHTML = ACH_STATS.map((s) => `<div class="stat-card"><span class="shine"></span><span class="ic">${s.icon}</span><b class="count" data-to="${s.n}" data-suffix="${s.suffix}">0</b><span>${esc(L(s.label))}</span></div>`).join("");
    stagger(el); observe(el); $$(".stat-card", el).forEach((c) => tilt(c, 12));
  }
  $("#milestones").innerHTML = ACH_MILESTONES.map((m, i) => `<div class="milestone${m.photo ? " has-bg" : ""}" style="--i:${i}">${m.photo ? `<span class="ms-bg" style="background-image:url(&quot;${esc(m.photo)}&quot;);background-position:${m.pos || "center"}" role="img" aria-label="Y.S. Jagan Mohan Reddy, ${m.when}"></span>` : ""}<span class="when">${m.when}</span><h4>${esc(m.title)}</h4><p>${esc(m.text)}</p></div>`).join("");
  $("#govGrid").innerHTML = GOV_ACH.map((g, i) => `<div class="gov${g.bg ? " has-bg" : ""}" style="--i:${i}">${g.bg ? `<span class="gov-bg" style="background-image:url(&quot;${esc(g.bg)}&quot;)"></span>` : ""}<span class="ic">${g.icon}</span><div><b class="count" data-to="${g.n}" data-suffix="${g.suffix}">0</b><h4>${esc(g.title)}</h4><p>${esc(g.text)}</p></div></div>`).join("");
  function renderBadges() {
    const p = points();
    $("#badgeGrid").innerHTML = BADGES.map((b) => `<div class="badge ${p >= b.need ? "on" : ""}"><span class="ic">${b.icon}</span><h5>${b.name}</h5><small>${p >= b.need ? "Unlocked ✓" : b.need + " pts"}</small></div>`).join("") +
      `<p class="badge-cta">You have <b>${p}</b> points. <a href="#volunteer" style="color:var(--gold)">Complete volunteer tasks</a> to unlock more badges.</p>`;
  }
  $("#achTabs").addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    $$("#achTabs .tab").forEach((x) => x.classList.toggle("active", x === b));
    $$(".ach-panel").forEach((p) => {
      const on = p.dataset.panel === b.dataset.ach;
      p.classList.toggle("active", on);
      if (on) $$(".count", p).forEach((c) => { if (!c.dataset.done) { c.dataset.done = 1; countUp(c); } });
      // replay entry animations
      if (on) $$(".milestone, .gov, .fame", p).forEach((c) => { c.style.animation = "none"; void c.offsetWidth; c.style.animation = ""; });
    });
  });

  /* ---------- on air / gallery ---------- */
  $("#videoRail").innerHTML = VIDEOS.map((v) => `
    <article class="video" data-q="${esc(v.title)}">
      <div class="thumb" style="background:linear-gradient(135deg,hsl(${v.hue} 70% 35%),hsl(${(v.hue + 60) % 360} 70% 45%))"><span class="tag">${esc(v.tag)}</span><span class="play">▶</span></div>
      <div class="cap"><h4>${esc(v.title)}</h4><small>YSRCP Official</small></div>
    </article>`).join("");
  $("#videoRail").addEventListener("click", (e) => {
    const v = e.target.closest(".video"); if (!v) return;
    open("https://www.youtube.com/@YSRCPOfficial/search?query=" + encodeURIComponent(v.dataset.q), "_blank", "noopener");
  });

  const gHues = [215, 150, 200, 35, 260, 170, 225, 0];
  const galleryArt = (g, i) => { const src = g.src || IMG.gallery[g._i ?? i]; if (!src) return g.icon; return g.size ? `<span class="g-crop" role="img" aria-label="${esc(g.cap)}" style="background-image:url(&quot;${esc(src)}&quot;);background-size:${g.size};background-position:${g.pos}"></span>` : `<img src="${esc(src)}" alt="${esc(g.cap)}" loading="lazy">`; };
  const galleryBg = (i) => `linear-gradient(135deg,hsl(${gHues[i % 8]} 65% 38%),hsl(${(gHues[i % 8] + 50) % 360} 70% 50%))`;
  // newest Facebook / Instagram photos (from the backend) first, then the fixed photos
  let galleryList = GALLERY.map((g, i) => ({ ...g, _i: i }));
  const SOCIAL = { facebook: { icon: "📘", name: "Facebook" }, instagram: { icon: "📸", name: "Instagram" } };
  function renderGallery() {
    $("#galleryGrid").innerHTML = galleryList.map((g, i) => `<button class="g-item${g.social ? " g-social" : ""}" data-g="${i}"><span class="g-art" style="background:${galleryBg(i)}">${galleryArt(g, i)}${g.social ? `<span class="g-badge">${SOCIAL[g.social].icon} ${g.fresh ? "New" : SOCIAL[g.social].name}</span>` : ""}</span><span class="g-cap"><b>${esc(g.cap)}</b><small>${esc(g.cat)}</small></span></button>`).join("");
    stagger($("#galleryGrid"));
  }
  renderGallery();
  async function loadSocialGallery() {
    try {
      const { photos } = await API.get("/gallery");
      if (!photos.length) return;
      const short = (t) => { const line = (t || "").split("\n").find((l) => l.trim()) || ""; return line.length > 90 ? line.slice(0, 88).trim() + "…" : line; };
      const social = photos.map((p) => {
        const when = new Date(p.postedAt.replace(" ", "T") + (p.postedAt.length === 19 ? "Z" : ""));
        return { src: p.src, social: p.source, link: p.permalink, cap: short(p.caption) || "YSRCP NRI Wing event", full: p.caption,
          credit: "YSRCP NRI Wing · " + SOCIAL[p.source].name, fresh: Date.now() - when < 3 * 864e5,
          cat: `${SOCIAL[p.source].name} · ${isNaN(when) ? "" : when.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` };
      });
      galleryList = [...social, ...GALLERY.map((g, i) => ({ ...g, _i: i }))];
      renderGallery();
    } catch {}
  }
  function openLightbox(i) {
    const g = galleryList[i], n = galleryList.length;
    openModal(`<div class="lightbox-art" style="background:${galleryBg(i)}">${galleryArt(g, i)}</div>
      ${g.full && g.full !== g.cap ? `<p class="lightbox-text">${esc(g.full)}</p>` : ""}
      <div class="lightbox-nav"><button class="btn btn-ghost btn-sm" data-lb="${(i - 1 + n) % n}">← Prev</button><div style="text-align:center"><b id="modalTitle">${esc(g.cap)}</b><br><small class="muted">${g.credit ? "Photo: " + esc(g.credit) + " · " : ""}${i + 1} / ${n}</small>${g.link ? `<br><a href="${esc(g.link)}" target="_blank" rel="noopener" class="lightbox-link">View on ${SOCIAL[g.social].name} ↗</a>` : ""}</div><button class="btn btn-ghost btn-sm" data-lb="${(i + 1) % n}">Next →</button></div>`, true);
  }
  $("#galleryGrid").addEventListener("click", (e) => { const g = e.target.closest(".g-item"); if (g) openLightbox(+g.dataset.g); });

  /* ---------- modal ---------- */
  const modal = $("#modal"), modalBox = $(".modal-box", modal), modalContent = $("#modalContent");
  let lastFocus;
  function openModal(html, wide) {
    lastFocus = document.activeElement;
    modalContent.innerHTML = html;
    modalBox.classList.toggle("wide", !!wide);
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => ($("input, select, textarea, button:not(.modal-x)", modalContent) || modalBox).focus?.(), 50);
  }
  function closeModal() {
    modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    if (modal.classList.contains("open") && $("[data-lb]", modalContent)) {
      if (e.key === "ArrowRight") $$("[data-lb]", modalContent)[1].click();
      if (e.key === "ArrowLeft") $$("[data-lb]", modalContent)[0].click();
    }
  });

  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close]");
    if (close && close.closest("#modal")) {
      if (close.dataset.cat) {
        const map = { gulf: "Gulf worker – repatriation", legal: "Property / land", local: "Family welfare", student: "Other", career: "Other", village: "Other" };
        $('#helpForm [name="cat"]').value = map[close.dataset.cat] || "";
        switchHelpTab("raise");
      }
      closeModal();
    }
    const op = e.target.closest("[data-open]");
    if (op) { e.preventDefault(); op.dataset.open === "login" ? openLogin() : openRegister(); }
    const lb = e.target.closest("[data-lb]");
    if (lb) openLightbox(+lb.dataset.lb);
    const txt = e.target.closest("[data-modal-text]");
    if (txt) { e.preventDefault(); openModal(txt.dataset.modalText === "credits" ? creditsHTML() : LEGAL[txt.dataset.modalText]); }
    const setCh = e.target.closest("[data-set-chapter]");
    if (setCh) {
      if (!state.user) { toast("Please register first"); openRegister(); return; }
      const city = CHAPTERS[setCh.dataset.setChapter].city;
      if (API.online) API.patch("/me", { chapter: city }).catch((err) => toast(err.message));
      state.user.chapter = city; store.set("user", state.user);
      closeModal(); toast(`📍 ${state.user.chapter} is now your city`); renderAuth();
    }
    if (e.target.closest("[data-dashboard]")) openDashboard();
    if (e.target.closest("[data-card]")) showCard();
    if (e.target.closest("[data-idcard]")) { e.preventDefault(); openIdCard(); }
    if (e.target.closest("[data-download]")) downloadCard();
    if (e.target.closest("[data-photo]")) changePhoto();
    if (e.target.closest("[data-logout]")) logout("Logged out");
    if (e.target.closest("[data-delete-me]")) deleteMyData();
    if (e.target.closest("[data-cancel-delete]")) cancelDeletion();
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.dataset.form !== "wa") return;
    e.preventDefault();
    if (API.online) {
      const f = Object.fromEntries(new FormData(e.target));
      try { await API.post("/whatsapp-requests", { ...f, consent: true }); } catch (err) { toast(err.message); return; }
    }
    closeModal(); toast("✅ Request sent – the coordinator will share the invite link");
  });

  const creditsHTML = () => `<h3 id="modalTitle">Photo credits</h3><p>Leader photos are freely licensed images from Wikimedia Commons. Pillar, banner and service photos are from the YSRCP NRI Wing website.</p><ul>${[...Object.values(PHOTOS), ALURU_PHOTO, ...Object.values(SITE_PHOTOS), ...JOURNEY.map((j) => j.photo), ...(IMG.heroBg || [])].map((p) => `<li><b>${esc(p.cap)}</b><br><small class="muted">${esc(p.credit)}</small></li>`).join("")}</ul><p class="muted" style="font-size:.85rem">GODL-India: Government Open Data License – India. CC BY-SA 4.0: Creative Commons Attribution-ShareAlike 4.0.</p>`;
  const LEGAL = {
    conduct: `<h3 id="modalTitle">Code of conduct</h3>
      <p>Members of the YSRCP NRI Wing represent our community abroad. By joining you agree to:</p>
      <ul class="legal-list"><li><b>Respect everyone</b> – no abuse, hate speech, threats or personal attacks, online or offline.</li>
      <li><b>Follow the laws of your country of residence.</b> The NRI Wing does not take part in, campaign in or fund elections of other countries.</li>
      <li><b>No money collection</b> in the party's name. The party does not accept foreign contributions (FCRA 2010).</li>
      <li><b>Share only verified information</b> – no fake news, morphed images or misleading posts.</li>
      <li><b>Protect privacy</b> – never share other members' or help-desk families' personal details.</li>
      <li><b>Gulf &amp; ECR pages</b> are only for welfare and support.</li></ul>
      <p>Breaking these rules can lead to removal from the NRI Wing. Report misuse to <a href="mailto:info@ysrcpnriwing.org">info@ysrcpnriwing.org</a>.</p>`,
    privacy: `<h3 id="modalTitle">Privacy notice</h3>
      <p>We collect only what is needed to connect you with your city team, run the Help Desk and volunteering, with your clear consent – in line with India's Digital Personal Data Protection Act 2023 (and GDPR / UK GDPR for members in Europe).</p>
      <ul class="legal-list"><li><b>What:</b> name, contact details, country/city, home district, profession, optional photo, your requests and tasks.</li>
      <li><b>Who sees it:</b> NRI Wing admins; city coordinators see only their city's members; help-desk details only go to the assigned volunteer.</li>
      <li><b>Your QR card:</b> shows only your first name, initial, city and home district. Your photo is shown only if you switch it on in My Dashboard.</li>
      <li><b>Your rights:</b> download your data, correct it, stop emails, or ask us to delete everything – from My Dashboard, any time (an admin confirms the deletion).</li>
      <li><b>No selling, no foreign donations:</b> we never sell data and do not accept foreign contributions (FCRA 2010).</li></ul>
      <p><b>Grievance contact:</b> ${esc(GRIEVANCE.name)} – <a href="mailto:${esc(GRIEVANCE.email)}">${esc(GRIEVANCE.email)}</a></p>`,
    terms: `<h3 id="modalTitle">Terms of use</h3><p>This website is for information, community and volunteering. It does not collect donations or foreign contributions (FCRA 2010). Content on Gulf pages is limited to welfare and support.</p>`
  };

  /* ---------- auth: register / login / card / dashboard ---------- */
  function openRegister() {
    if (state.user) { openDashboard(); return; }
        openModal(`
      <h3 id="modalTitle">Become a member</h3>
      <div class="form-steps"><i class="on"></i><i></i></div>
      <form id="regForm" class="stack">
        <div class="stack" data-step="1">
          <label>Full name<input name="name" required autocomplete="name"></label>
          <div class="otp-email"><label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
            <button type="button" class="btn btn-primary btn-sm" data-otp-send>Send OTP</button></div>
          <div class="otp-box" data-otp-box hidden>
            <small class="muted" data-otp-to></small>
            <div class="otp-email"><label>Enter OTP<input name="emailCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit OTP" class="code-input"></label>
              <button type="button" class="btn btn-primary btn-sm" data-otp-check>Verify</button></div>
            <p class="test-code" data-testcode hidden></p>
            <small class="muted">Didn't get it? Check Spam, or <button type="button" class="link-btn" data-otp-send>send again</button>.</small>
          </div>
          <p class="v-ok" data-otp-ok hidden>✅ Email verified</p>
          <label>Phone / WhatsApp<input name="phone" type="tel" required autocomplete="tel"></label>
          <div class="row2"><label>Country<select name="country" required><option value="">Choose country…</option>${Object.entries(WORLD_GEO).map(([code, g]) => `<option value="${code}">${esc(g.n)}</option>`).join("")}</select></label>
          <label>City<select name="city" required disabled><option value="">Choose country first</option></select></label></div>
          <label data-other-city hidden>Your city<input name="cityOther" maxlength="60" placeholder="Type your city"></label>
          <button type="button" class="btn btn-primary btn-block" data-next>Continue →</button>
        </div>
        <div class="stack" data-step="2" hidden>
          <div class="reg-photo"><button type="button" class="photo-pick" data-reg-photo aria-label="Add your photo"><span>📷</span></button><div><b>Your photo</b> <small class="muted">(optional)</small><br><small class="muted">Shown on your digital member card.</small></div></div>
          <label>Profession<select name="profession" required><option value="">Choose your work…</option>${Object.entries(PROFESSIONS).map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((p) => `<option>${esc(p)}</option>`).join("")}</optgroup>`).join("")}<option value="__other">Other – type my work</option></select></label>
          <label data-other-prof hidden>Your work<input name="professionOther" maxlength="80" placeholder="Type your profession"></label>
          <div class="row2"><label>Home district (AP)<select name="district" required><option value="">Choose…</option>${DISTRICTS.map((d) => `<option>${esc(d)}</option>`).join("")}</select></label>
          <label>Assembly constituency<select name="constituency" required disabled><option value="">Choose district first</option></select></label></div>
          <label class="check"><input type="checkbox" required> <span>I am an Indian citizen / person of Indian origin, I agree to the <a href="#" data-modal-text="conduct" style="color:var(--blue)">code of conduct</a> and consent to the <a href="#" data-modal-text="privacy" style="color:var(--blue)">privacy notice</a> (DPDP Act 2023).</span></label>
          <div class="row2"><button type="button" class="btn btn-ghost" data-back>← Back</button><button class="btn btn-primary">Create my member card</button></div>
        </div>
      </form>
      <p class="switch-link">Already a member? <a data-open="login">Login</a></p>`);
    const form = $("#regForm");
    // country → its cities; "Other city" (or a country without a city list) shows a text box
    const cSel = form.elements.country, citySel = form.elements.city;
    const showOther = () => {
      const g = WORLD_GEO[cSel.value];
      const typed = !!g && (!g.c.length || citySel.value === "__other");
      $("[data-other-city]", form).hidden = !typed; form.elements.cityOther.required = typed;
    };
    cSel.addEventListener("change", () => {
      const g = WORLD_GEO[cSel.value];
      citySel.disabled = !g || !g.c.length;
      citySel.required = !citySel.disabled;
      citySel.innerHTML = g && g.c.length
        ? `<option value="">Choose city…</option>${g.c.map((c) => `<option>${esc(c)}</option>`).join("")}<option value="__other">Other city</option>`
        : `<option value="">${g ? "Type your city below" : "Choose country first"}</option>`;
      const ph = form.elements.phone;
      if (g && g.p && (!ph.value || /^\+\d*\s?$/.test(ph.value))) ph.value = g.p + " ";
      showOther();
    });
    citySel.addEventListener("change", showOther);
    // profession: "Other" shows a text box
    form.elements.profession.addEventListener("change", (e) => {
      const other = e.target.value === "__other";
      $("[data-other-prof]", form).hidden = !other; form.elements.professionOther.required = other;
      if (other) form.elements.professionOther.focus();
    });
    // district → its assembly constituencies
    const acSel = form.elements.constituency;
    form.elements.district.addEventListener("change", (e) => {
      const list = AP_CONSTITUENCIES[e.target.value] || [];
      acSel.disabled = !list.length;
      acSel.innerHTML = list.length
        ? `<option value="">Choose constituency…</option>${list.map((c) => `<option>${esc(c)}</option>`).join("")}`
        : `<option value="">Choose district first</option>`;
    });
    let regPhoto = null;
    // verified email / phone (ticket from the server, tied to the exact value)
    const verified = {};
    const valueOf = (ch) => form.elements[ch].value.trim();
    const emailOk = () => !API.online || (verified.email && verified.email.value === valueOf("email"));
    const otpUi = () => {
      const ok = API.online && emailOk();
      $("[data-otp-ok]", form).hidden = !ok; $(".otp-email [data-otp-send]", form).hidden = ok;
      if (ok) $("[data-otp-box]", form).hidden = true;
    };
    // changing the email after verifying needs a new OTP
    form.elements.email.addEventListener("input", otpUi);
    async function sendCode(ch) {
      const inp = form.elements[ch];
      if (!inp.checkValidity()) { inp.reportValidity(); return false; }
      const btns = $$("[data-otp-send]", form); btns.forEach((b) => (b.disabled = true));
      try {
        const r = await API.post("/verify/send", { channel: ch, value: valueOf(ch) }); toast("📨 " + r.message);
        $("[data-otp-box]", form).hidden = false;
        $("[data-otp-to]", form).textContent = "OTP sent to " + valueOf(ch) + " – valid for 10 minutes.";
        // test mode on this computer only: show the code on screen
        const tc = $("[data-testcode]", form); tc.hidden = !r.testCode; if (r.testCode) tc.innerHTML = `🧪 Test mode (this computer only): your OTP is <b>${esc(r.testCode)}</b>`;
        form.elements.emailCode.value = ""; form.elements.emailCode.focus();
        $(".otp-email [data-otp-send]", form).textContent = "Resend";
        return true;
      }
      catch (err) { toast(err.message); return false; }
      finally { btns.forEach((b) => (b.disabled = false)); }
    }
    async function checkCode() {
      const code = form.elements.emailCode.value.replace(/\D/g, "");
      if (code.length !== 6) { toast("Please enter the 6-digit OTP from your email"); form.elements.emailCode.focus(); return; }
      try {
        const r = await API.post("/verify/check", { channel: "email", value: valueOf("email"), code });
        verified.email = { value: valueOf("email"), ticket: r.ticket };
        toast("✅ Email verified"); otpUi();
      } catch (err) { toast(err.message); }
    }
    form.elements.emailCode.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); checkCode(); } });
    form.addEventListener("click", async (e) => {
      if (e.target.closest("[data-reg-photo]")) {
        const ph = await pickPhoto(); if (!ph) return;
        regPhoto = ph; $("[data-reg-photo]", form).innerHTML = `<img src="${ph}" alt="Your photo">`;
      }
      const showStep = (name) => { $$("[data-step]", form).forEach((el) => (el.hidden = el.dataset.step !== name)); $$(".form-steps i")[1].classList.toggle("on", name === "2"); };
      if (e.target.closest("[data-next]")) {
        const s1 = $('[data-step="1"]', form);
        const bad = $$("input, select", s1).find((i) => !i.disabled && !i.checkValidity());
        if (bad) { bad.reportValidity(); return; }
        // the email must be verified with the OTP before going on
        if (!emailOk()) {
          toast("Please verify your email with the OTP first");
          if ($("[data-otp-box]", form).hidden) $(".otp-email [data-otp-send]", form).focus(); else form.elements.emailCode.focus();
          return;
        }
        showStep("2");
      }
      if (e.target.closest("[data-otp-send]")) sendCode("email");
      if (e.target.closest("[data-otp-check]")) checkCode();
      if (e.target.closest("[data-back]")) showStep("1");
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const iso = f.country.toLowerCase();
      f.country = WORLD_GEO[f.country] ? WORLD_GEO[f.country].n : f.country;
      if (!f.city || f.city === "__other") f.city = (f.cityOther || "").trim();
      delete f.cityOther;
      if (f.profession === "__other") f.profession = (f.professionOther || "").trim();
      delete f.professionOther;
      const near = CHAPTERS.find((c) => c.iso === iso && c.city.toLowerCase() === f.city.toLowerCase()) || CHAPTERS.find((c) => c.iso === iso);
      if (API.online) {
        const btn = $("button:not([type])", form); if (btn) btn.disabled = true;
        try {
          delete f.emailCode;
          const r = await API.post("/members", { ...f, chapter: near ? near.city : "", consent: true, emailTicket: verified.email && verified.email.ticket });
          API.setToken(r.token);
          state.user = memberFromApi(r.member);
        } catch (err) { toast(err.message); if (btn) btn.disabled = false; return; }
      } else {
        state.user = { ...f, no: "YSRNRI-" + new Date().getFullYear() + "-" + String(Math.floor(10000 + Math.random() * 89999)), joined: Date.now(), chapter: near ? near.city : "" };
      }
      if (regPhoto) await savePhoto(regPhoto);
      store.set("user", state.user);
      renderAuth(); renderPoints(true);
      confetti(120);
      showCard(true);
    });
  }

  function openLogin() {
    if (API.online && siteConfig.otp) return openCodeLogin();
    openModal(`<h3 id="modalTitle">Welcome back</h3><p class="muted">Login with your email and member number.</p>
      <form id="loginForm" class="stack"><label>Email<input name="email" type="email" required autocomplete="email"></label>
      <label>Member number<input name="no" required placeholder="YSRNRI-2026-12345"></label>
      <button class="btn btn-primary btn-block">Login</button></form>
      <p class="switch-link">New here? <a data-open="register">Register</a></p>`);
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target));
      if (API.online) {
        try {
          const r = await API.post("/login", { email: f.email, memberNo: f.no });
          API.setToken(r.token);
          state.user = memberFromApi(r.member); store.set("user", state.user);
          await syncMe();
          openDashboard(); toast("👋 Welcome back, " + state.user.name.split(" ")[0]);
        } catch (err) { toast(err.message); }
        return;
      }
      const saved = store.get("lastUser", null);
      if (saved && saved.email.toLowerCase() === f.email.toLowerCase() && saved.no === f.no.trim().toUpperCase()) {
        state.user = saved; store.set("user", saved); renderAuth(); renderPoints(); openDashboard(); toast("👋 Welcome back, " + saved.name.split(" ")[0]);
      } else toast("We couldn't find that member. Please check the details or register.");
    });
  }

  // safer login: we email a 6-digit code
  function openCodeLogin() {
    openModal(`<h3 id="modalTitle">Welcome back</h3><p class="muted">Enter your email – we will send you a 6-digit login code.</p>
      <form id="codeForm1" class="stack"><label>Email<input name="email" type="email" required autocomplete="email"></label>
      <button class="btn btn-primary btn-block">Send me a code</button></form>
      <form id="codeForm2" class="stack" hidden><p class="test-code" data-testcode hidden></p><label>6-digit code<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7" required placeholder="123456" class="code-input"></label>
      <button class="btn btn-primary btn-block">Login</button><button type="button" class="btn btn-ghost btn-block" data-code-again>Send a new code</button></form>
      <p class="switch-link">New here? <a data-open="register">Register</a></p>`);
    const f1 = $("#codeForm1"), f2 = $("#codeForm2");
    let email = "";
    const send = async () => {
      try {
        const r = await API.post("/login/code", { email }); toast("📧 " + r.message); f1.hidden = true; f2.hidden = false; f2.elements.code.focus();
        const tc = $("[data-testcode]", f2); tc.hidden = !r.testCode; if (r.testCode) tc.innerHTML = `🧪 Test mode (this computer only): your code is <b>${esc(r.testCode)}</b>`;
      }
      catch (err) { toast(err.message); }
    };
    f1.addEventListener("submit", (e) => { e.preventDefault(); email = f1.elements.email.value.trim(); send(); });
    f2.addEventListener("click", (e) => { if (e.target.closest("[data-code-again]")) send(); });
    f2.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const r = await API.post("/login/verify", { email, code: f2.elements.code.value });
        API.setToken(r.token); state.user = memberFromApi(r.member); store.set("user", state.user);
        await syncMe(); openDashboard(); toast("👋 Welcome back, " + state.user.name.split(" ")[0]);
      } catch (err) { toast(err.message); }
    });
  }

  function qrDataURL(text) {
    try { const q = qrcode(0, "M"); q.addData(text); q.make(); return q.createDataURL(4, 0); } catch { return ""; }
  }
  // QR → verify page on the live site (on this computer too, so phones can open it)
  const cardPayload = (u) => `${/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? PUBLIC_SITE : location.origin}/verify.html?m=${encodeURIComponent(u.no)}`;

  /* member photo: square crop, 320px JPEG (about 30 KB) */
  /* ---------- photo source: camera or folder ---------- */
  // returns a File/Blob (or null): shows "Take a photo" / "Choose from folder" first
  function choosePhotoSource({ facing = "user", title = "Add a photo" } = {}) {
    return new Promise((resolve) => {
      const sheet = document.createElement("div");
      sheet.className = "photo-sheet";
      sheet.innerHTML = `<div class="ps-box" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <h4>${esc(title)}</h4>
        <div class="ps-choose">
          <button type="button" class="ps-opt" data-ps="camera"><span>📷</span><b>Take a photo</b><small>Use your camera</small></button>
          <button type="button" class="ps-opt" data-ps="folder"><span>🖼️</span><b>Choose from folder</b><small>Gallery / files</small></button>
        </div>
        <div class="ps-cam" hidden><video playsinline autoplay muted></video>
          <div class="ps-cam-acts"><button type="button" class="btn btn-ghost btn-sm" data-ps="flip">🔄 Switch camera</button><button type="button" class="btn btn-primary" data-ps="shot">📸 Capture</button></div></div>
        <button type="button" class="ps-cancel" data-ps="cancel">Cancel</button></div>`;
      document.body.appendChild(sheet);
      requestAnimationFrame(() => sheet.classList.add("open"));
      let stream = null, mode = facing, done = false;
      const video = $("video", sheet);
      const stop = () => { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; };
      const finish = (file) => { if (done) return; done = true; stop(); sheet.classList.remove("open"); setTimeout(() => sheet.remove(), 250); resolve(file || null); };
      const fileInput = (capture) => {
        const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
        if (capture) inp.setAttribute("capture", mode); // phones open the camera directly
        inp.onchange = () => finish(inp.files && inp.files[0]);
        inp.click();
      };
      async function startCamera() {
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) return fileInput(true);
        try {
          stop();
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
          video.srcObject = stream;
          $(".ps-choose", sheet).hidden = true; $(".ps-cam", sheet).hidden = false;
        } catch {
          toast("Camera not available – opening the phone camera / files instead");
          fileInput(true);
        }
      }
      sheet.addEventListener("click", (e) => {
        const b = e.target.closest("[data-ps]");
        if (!b) { if (e.target === sheet) finish(null); return; }
        const a = b.dataset.ps;
        if (a === "cancel") finish(null);
        if (a === "folder") fileInput(false);
        if (a === "camera") startCamera();
        if (a === "flip") { mode = mode === "user" ? "environment" : "user"; startCamera(); }
        if (a === "shot" && video.videoWidth) {
          const c = document.createElement("canvas"); c.width = video.videoWidth; c.height = video.videoHeight;
          const x = c.getContext("2d");
          if (mode === "user") { x.translate(c.width, 0); x.scale(-1, 1); } // selfie looks like a mirror
          x.drawImage(video, 0, 0);
          c.toBlob((blob) => finish(blob && new File([blob], "camera.jpg", { type: "image/jpeg" })), "image/jpeg", 0.92);
        }
      });
      document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { document.removeEventListener("keydown", esc); finish(null); } });
    });
  }
  // File → square 320px JPEG data URL
  const fileToSquare = (file, S = 320) => new Promise((resolve) => {
    if (!file || !String(file.type).startsWith("image/")) { if (file) toast("Please choose a photo"); return resolve(null); }
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height), c = document.createElement("canvas"); c.width = c.height = S;
      c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
      URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast("Sorry, that photo could not be opened"); resolve(null); };
    img.src = url;
  });

  async function pickPhoto() {
    const file = await choosePhotoSource({ title: "Your photo for the member card" });
    return file ? fileToSquare(file) : null;
  }
  async function savePhoto(photo) {
    if (API.online && API.getToken()) {
      try { await API.put("/me/photo", { photo }); } catch (err) { toast(err.message); return false; }
    }
    state.user.photo = photo; store.set("user", state.user); renderAuth();
    return true;
  }
  async function changePhoto() {
    if (!state.user) return;
    const ph = await pickPhoto(); if (!ph) return;
    if (await savePhoto(ph)) { toast("📷 Photo added to your member card"); showCard(); }
  }
  const avatarHTML = (u) => u.photo ? `<span class="avatar"><img src="${u.photo}" alt=""></span>` : `<span class="avatar">${esc(u.name[0])}</span>`;

  function showCard(fresh) {
    const u = state.user; if (!u) return;
    const qr = qrDataURL(cardPayload(u));
    openModal(`
      <h3 id="modalTitle">${fresh ? "🎉 Welcome to the family, " + esc(u.name.split(" ")[0]) + "!" : esc(t("myCard", "My member card"))}</h3>
      ${fresh ? `<p>Your digital member card is ready. Show it at events for quick check-in.</p>` : ""}
      <div class="member-card" id="memberCard">
        <div class="mc-brand"><span>Y</span>YSRCP NRI Wing</div>
        <span class="mc-type">MEMBER</span>
        <div class="mc-leaders">${CARD_LEADERS.map((l) => `<figure><i style="background:url('${l.src}') ${l.x}% ${l.y}% / ${l.size}% auto no-repeat" role="img" aria-label="${esc(l.name)}"></i><figcaption>${esc(l.name)}</figcaption></figure>`).join("")}</div>
        <button type="button" class="mc-photo" data-photo title="${u.photo ? "Change photo" : "Add photo"}">${u.photo ? `<img src="${u.photo}" alt="${esc(u.name)}">` : `<span>📷<small>Add photo</small></span>`}</button>
        <div class="mc-who"><b>${esc(u.name)}</b><small>${esc(u.city)}, ${esc(u.country)} · ${esc(u.district)}</small><div class="mc-no">${esc(u.no)}</div></div>
        <div class="mc-qr">${qr ? `<img src="${qr}" alt="Member QR code">` : ""}</div>
      </div>
      <div class="dash-actions"><button class="btn btn-primary" data-download>⬇ Download card</button><button class="btn btn-ghost" data-photo>📷 ${u.photo ? "Change photo" : "Add photo"}</button><button class="btn btn-ghost" data-dashboard>Go to My Dashboard →</button></div>`);
    tilt($("#memberCard"), 14);
  }

  function downloadCard() {
    const u = state.user; if (!u) return;
    const W = 1012, H = 638, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b3a8c"); g.addColorStop(0.5, "#1652c4"); g.addColorStop(1, "#0f9d58");
    const rr = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    rr(0, 0, W, H, 40); x.fillStyle = g; x.fill();
    x.fillStyle = "rgba(255,255,255,.08)"; x.beginPath(); x.arc(W - 80, 60, 220, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.font = "800 40px Outfit, sans-serif"; x.fillText("YSRCP NRI Wing", 60, 100);
    x.font = "500 24px Outfit, sans-serif"; x.fillStyle = "rgba(255,255,255,.85)"; x.fillText("Global Unity, Local Impact", 60, 138);
    x.fillStyle = "#fff"; x.font = "700 56px Outfit, sans-serif"; x.fillText(u.name, 60, 420);
    x.font = "400 28px Outfit, sans-serif"; x.fillStyle = "rgba(255,255,255,.85)"; x.fillText(`${u.city}, ${u.country} · ${u.district}`, 60, 466);
    x.font = "600 32px monospace"; x.fillStyle = "#fff"; x.fillText(u.no, 60, 540);
    const load = (src, cors) => new Promise((r) => { const i = new Image(); if (cors) i.crossOrigin = "anonymous"; i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
    Promise.all([u.photo ? load(u.photo) : null, load(qrDataURL(cardPayload(u))), ...CARD_LEADERS.map((l) => load(l.src, true))]).then(([ph, qr, ...leaders]) => {
      if (ph) {
        x.save(); rr(60, 190, 150, 150, 22); x.clip(); x.drawImage(ph, 60, 190, 150, 150); x.restore();
        rr(60, 190, 150, 150, 22); x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 6; x.stroke();
      }
      // leaders: same crop as the card's CSS background (size % of the circle, position %)
      leaders.forEach((im, k) => {
        if (!im) return;
        const l = CARD_LEADERS[k], R = 62, cx = W - 170 - (CARD_LEADERS.length - 1 - k) * 145, cy = 190;
        const bw = l.size / 100, bh = bw * im.naturalHeight / im.naturalWidth;
        const sx = (l.x / 100) * (bw - 1) / bw * im.naturalWidth, sy = (l.y / 100) * (bh - 1) / bh * im.naturalHeight;
        x.save(); rr(cx - R, cy - R, 2 * R, 2 * R, 18); x.clip();
        x.drawImage(im, sx, sy, im.naturalWidth / bw, im.naturalHeight / bh, cx - R, cy - R, 2 * R, 2 * R); x.restore();
        rr(cx - R, cy - R, 2 * R, 2 * R, 18); x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 5; x.stroke();
        x.fillStyle = "#fff"; x.font = "600 22px Outfit, sans-serif"; x.textAlign = "center"; x.fillText(l.name, cx, cy + R + 32); x.textAlign = "left";
      });
      if (qr) { rr(W - 280, H - 280, 220, 220, 20); x.fillStyle = "#fff"; x.fill(); x.imageSmoothingEnabled = false; x.drawImage(qr, W - 266, H - 266, 192, 192); }
      let href;
      try { href = c.toDataURL("image/png"); } catch { toast("Sorry, the card could not be saved. Please try again."); return; }
      const a = document.createElement("a"); a.download = `${u.no}.png`; a.href = href; a.click();
    });
  }

  function openDashboard() {
    const u = state.user; if (!u) { openRegister(); return; }
    const evs = upcomingEvents().filter((e) => state.rsvps.includes(e.id));
    const done = TASKS.filter((x) => state.tasks.includes(x.id));
    openModal(`
      <div class="dash-head">${avatarHTML(u)}<div><h3 id="modalTitle" style="margin:0">${esc(t("dashboard", "My Dashboard"))}</h3><small class="muted">${esc(u.name)} · ${esc(u.no)}</small></div></div>
      <div class="dash-grid">
        <div class="dash-tile"><h5>📍 My city</h5>${u.chapter ? `<b>${esc(u.chapter)}</b>` : `<a href="#chapters" data-close style="color:var(--blue)">Choose a city →</a>`}</div>
        <div class="dash-tile"><h5>⭐ My points</h5><span class="big">${points()}</span></div>
        <div class="dash-tile"><h5>📅 My events</h5>${evs.length ? `<ul>${evs.map((e) => `<li>${esc(e.title)}</li>`).join("")}</ul>` : `<a href="#events" data-close style="color:var(--blue)">RSVP to an event →</a>`}</div>
        <div class="dash-tile"><h5>✅ My tasks</h5>${done.length ? `<ul>${done.map((d) => `<li>${esc(d.title)}</li>`).join("")}</ul>` : `<a href="#volunteer" data-close style="color:var(--blue)">Start a task →</a>`}${Object.values(state.taskSubs).filter((s) => s.status === "pending").length ? `<small class="muted">⏳ ${Object.values(state.taskSubs).filter((s) => s.status === "pending").length} waiting for review</small>` : ""}</div>
        <div class="dash-tile" style="grid-column:1/-1"><h5>🛟 My help requests</h5>${state.tickets.length ? state.tickets.map((tk) => `<span class="pill" style="margin-right:6px">#${esc(tk.id)} · ${STATUSES[ticketStage(tk)]}</span>`).join("") : `<a href="#helpdesk" data-close style="color:var(--blue)">Raise a request →</a>`}</div>
      </div>
      ${state.deletionRequest && state.deletionRequest.status === "pending" ? `<div class="del-banner">⏳ <b>Account deletion requested</b> on ${tkDate(state.deletionRequest.created_at)} – waiting for admin approval.</div>` : ""}
      ${state.deletionRequest && state.deletionRequest.status === "rejected" ? `<div class="del-banner no">❌ Deletion request not approved${state.deletionRequest.review_note ? ": " + esc(state.deletionRequest.review_note) : ""}</div>` : ""}
      ${API.online ? `<div class="dash-tile prefs" style="grid-column:1/-1"><h5>🔒 Privacy &amp; notifications</h5>
        <label class="check"><input type="checkbox" data-pref-photo ${u.showPhoto ? "checked" : ""}> <span>Show my photo when someone scans my member card QR</span></label>
        <label class="check"><input type="checkbox" data-pref-email ${u.notifyEmail !== false ? "checked" : ""}> <span>Email me about my help requests and volunteer tasks</span></label>
        <a href="#" data-export-me>⬇ Download my data</a></div>` : ""}
      <div class="dash-actions"><button class="btn btn-ghost" data-photo-frame>📸 Photo with Jagan Anna</button></div>
      <div class="dash-actions"><button class="btn btn-primary" data-card>🪪 ${esc(t("myCard", "My member card"))}</button><button class="btn btn-ghost" data-logout>${esc(t("logout", "Logout"))}</button>${API.online ? (state.deletionRequest && state.deletionRequest.status === "pending"
        ? `<button class="btn btn-ghost" data-cancel-delete>Cancel deletion request</button>`
        : `<button class="btn btn-ghost btn-danger" data-delete-me>Request account deletion</button>`) : ""}</div>`, true);
  }

  const memberFromApi = (m) => ({ showPhoto: !!m.showPhoto, notifyEmail: m.notifyEmail !== false, name: m.name, email: m.email, phone: m.phone, country: m.country, city: m.city, profession: m.profession, district: m.district, constituency: m.constituency, chapter: m.chapter || "", no: m.memberNo, joined: m.joined, photo: m.photo || null });
  // load the logged-in member's data from the backend
  async function syncMe() {
    if (!API.online || !API.getToken()) return;
    try {
      const r = await API.get("/me");
      state.user = memberFromApi(r.member);
      state.rsvps = r.rsvps; state.tasks = r.tasks;
      state.taskSubs = Object.fromEntries((r.taskSubmissions || []).map((x) => [x.id, x]));
      state.serverPoints = r.points;
      state.deletionRequest = r.deletionRequest || null;
      state.tickets = r.tickets.map((x) => ({ ...x, urgent: !!x.urgent }));
      store.set("user", state.user); save("rsvps"); save("tasks"); save("tickets");
      renderAuth(); renderEvents(); renderTasks(); renderMyTickets();
    } catch (err) { if (err.status === 401 || err.status === 404) logout(); }
  }
  function logout(message) {
    API.setToken(null);
    state.user = null; store.set("user", null);
    if (API.online) { state.rsvps = []; state.tasks = []; state.taskSubs = {}; state.tickets = []; save("rsvps"); save("tasks"); save("tickets"); renderEvents(); renderTasks(); renderMyTickets(); }
    closeModal(); renderAuth(); renderPoints();
    if (message) toast(message);
  }
  // members can't delete their account themselves – an admin approves the request
  function deleteMyData() {
    openModal(`<h3 id="modalTitle">Request account deletion</h3>
      <p>Your request goes to the NRI Wing admins. After they approve it, your membership and personal data are deleted and you will get an email.</p>
      <form id="delForm" class="stack"><label>Reason <small class="muted">(optional)</small><textarea name="reason" rows="3" maxlength="500" placeholder="Tell us why you want to leave – it helps us improve"></textarea></label>
      <div class="row2"><button type="button" class="btn btn-ghost" data-dashboard>← Back</button><button class="btn btn-danger">Send deletion request</button></div></form>`);
    $("#delForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      try { const r = await API.post("/me/delete-request", { reason: e.target.elements.reason.value }); toast(r.message); await syncMe(); openDashboard(); }
      catch (err) { toast(err.message); }
    });
  }
  async function cancelDeletion() {
    try { await API.del("/me/delete-request"); toast("Deletion request cancelled"); await syncMe(); openDashboard(); } catch (err) { toast(err.message); }
  }

  function renderAuth() {
    const a = $("#authArea"), u = state.user;
    if (u) store.set("lastUser", u);
    $(".mobile-auth").style.display = u ? "none" : "";
    a.innerHTML = u
      ? `<button class="avatar-btn" data-dashboard>${avatarHTML(u)}<span>${esc(u.name.split(" ")[0])}</span></button>`
      : `<button class="btn btn-ghost btn-sm" data-open="login" data-i18n="login">Login</button><button class="btn btn-primary btn-sm" data-open="register" data-i18n="register">Register</button>`;
    if (!u && lang === "te") { $$("[data-i18n]", a).forEach((el) => { el.dataset.en = el.textContent; el.textContent = t(el.dataset.i18n, el.textContent); }); }
  }

  /* ---------- backend connection ---------- */
  // email-code login is used when the server can send emails
  let siteConfig = { otp: false };
  async function loadConfig() { try { siteConfig = await API.get("/config"); } catch {} }
  API.ready.then((online) => {
    document.body.dataset.backend = online ? "online" : "offline";
    if (!online) return;
    if (state.user && !API.getToken()) logout(); // old browser-only login → please log in again
    syncMe().then(() => { if (!API.getToken()) refreshTickets(); }); loadQuestions(); loadLeaderboard(); loadSocialGallery(); loadCommittees(); loadTaskLinks(); loadAssociations(); loadJobs(); loadFame(); loadConfig();
  });

  /* ======================================================================
     New features: voter help, emergency directory, associations, jobs,
     newsletter, Hall of Fame, photo frame, privacy, language, app install
     ====================================================================== */

  /* ---------- Form 6A guide ---------- */
  $("#voterSteps").innerHTML = VOTER_STEPS.map((st, i) => `<div class="v-step" style="--i:${i}"><b>${i + 1}</b><div><h4>${esc(st.t)}</h4><p>${esc(st.d)}</p></div></div>`).join("");
  $("#voterDocs").innerHTML = VOTER_DOCS.map((d) => `<li>✓ ${esc(d)}</li>`).join("");
  stagger($("#voterSteps"));
  // open the Help Desk form with the right category
  function openHelpWith(cat, urgent) {
    goTo("helpdesk");
    switchHelpTab("raise");
    const f = $("#helpForm");
    f.elements.cat.value = cat;
    if (urgent) f.elements.urgent.checked = true;
    setTimeout(() => { f.scrollIntoView({ behavior: "smooth", block: "center" }); f.elements.desc.focus({ preventScroll: true }); }, 400);
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-voter-help]")) { e.preventDefault(); openHelpWith("Voter registration (Form 6A)"); toast("Tell us where you are stuck – a volunteer will help with Form 6A"); }
    if (e.target.closest("[data-emer-help]")) { e.preventDefault(); openHelpWith("Emergency abroad (24/7)", true); }
  });

  /* ---------- emergency directory ---------- */
  const emerHref = (it) => (it.tel ? "tel:" + it.tel : it.wa ? "https://wa.me/" + it.wa : it.url || "#");
  $("#emerGrid").innerHTML = EMERGENCY.map((g, i) => `<div class="emer-card" style="--i:${i}"><h4>${g.icon} ${esc(g.group)}</h4><ul>${g.items.map((it) =>
    `<li>${it.help ? `<a href="#" data-emer-help>` : `<a href="${esc(emerHref(it))}" ${it.tel ? "" : 'target="_blank" rel="noopener"'}>`}<b>${esc(it.name)}</b><small>${esc(it.note)}</small><em>${esc(it.show)}</em></a></li>`).join("")}</ul></div>`).join("");
  stagger($("#emerGrid"));
  $("#emerLocal").innerHTML = LOCAL_EMERGENCY.map(([c, n]) => `<span><b>${esc(c)}</b> ${esc(n)}</span>`).join("");

  /* ---------- Telugu associations directory ---------- */
  let associations = [];
  function renderAssociations() {
    const q = ($("#assocSearch").value || "").trim().toLowerCase();
    const list = associations.filter((a) => !q || `${a.name} ${a.country} ${a.city}`.toLowerCase().includes(q));
    $("#assocList").innerHTML = list.length ? list.map((a, i) => `<article class="assoc" style="--i:${i}"><span class="assoc-ic">🤝</span><div><h4>${esc(a.name)}</h4><small>📍 ${esc(a.city)}, ${esc(a.country)}</small>
      ${a.description ? `<p>${esc(a.description)}</p>` : ""}<div class="assoc-links">${a.website ? `<a href="${esc(a.website)}" target="_blank" rel="noopener">🌐 Website</a>` : ""}${a.email ? `<a href="mailto:${esc(a.email)}">✉️ Email</a>` : ""}</div></div></article>`).join("")
      : `<p class="empty">${associations.length ? "No association found for this search." : "The directory is being built – suggest a Telugu association in your city!"}</p>`;
    stagger($("#assocList"));
  }
  $("#assocSearch").addEventListener("input", renderAssociations);
  async function loadAssociations() { try { associations = (await API.get("/associations")).associations; } catch {} renderAssociations(); }
  renderAssociations();
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-suggest-assoc]")) return;
    if (!API.online) { toast("Please try again when you are online"); return; }
    openModal(`<h3 id="modalTitle">🤝 Suggest an association</h3><p class="muted">Our team checks every suggestion before it is shown.</p>
      <form id="assocForm" class="stack">
        <label>Association name<input name="name" required maxlength="120" placeholder="e.g. Telugu Association of Dallas"></label>
        <div class="row2"><label>Country<input name="country" required maxlength="60"></label><label>City<input name="city" required maxlength="60"></label></div>
        <div class="row2"><label>Website <small class="muted">(optional)</small><input name="website" type="url" placeholder="https://"></label><label>Email <small class="muted">(optional)</small><input name="email" type="email"></label></div>
        <label>About <small class="muted">(optional)</small><textarea name="description" rows="2" maxlength="400"></textarea></label>
        <label>Your name <small class="muted">(optional)</small><input name="submittedBy" maxlength="80" value="${esc(state.user ? state.user.name : "")}"></label>
        <label class="check"><input type="checkbox" name="consent" required> <span>The details above are public information about the association.</span></label>
        <button class="btn btn-primary btn-block">Send suggestion</button></form>`);
    $("#assocForm").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try { const r = await API.post("/associations", { ...Object.fromEntries(new FormData(ev.target)), consent: true }); closeModal(); toast("✅ " + r.message); }
      catch (err) { toast(err.message); }
    });
  });

  /* ---------- jobs & skills corner ---------- */
  let jobs = [], jobKind = "all";
  function renderJobs() {
    $("#jobChips").innerHTML = [["all", "All"], ...Object.entries(JOB_KINDS)].map(([k, l]) => `<button class="chip ${jobKind === k ? "active" : ""}" data-job-kind="${k}">${esc(l)}</button>`).join("");
    const list = jobs.filter((j) => jobKind === "all" || j.kind === jobKind);
    const contactHref = (c) => (/^\S+@\S+\.\S+$/.test(c) ? "mailto:" + c : /^[+\d][\d\s()-]{6,}$/.test(c) ? "https://wa.me/" + c.replace(/[^\d]/g, "") : null);
    $("#jobList").innerHTML = list.length ? list.map((j, i) => `<article class="job" style="--i:${i}"><span class="job-kind">${esc(JOB_KINDS[j.kind] || j.kind)}</span>
      <h4>${esc(j.title)}</h4><small>${j.company ? esc(j.company) + " · " : ""}📍 ${esc([j.city, j.country].filter(Boolean).join(", "))}</small>
      <p>${esc(j.description)}</p><div class="job-foot">${j.link ? `<a href="${esc(j.link)}" target="_blank" rel="noopener nofollow">Details ↗</a>` : ""}
      ${contactHref(j.contact) ? `<a href="${esc(contactHref(j.contact))}" target="_blank" rel="noopener">Contact: ${esc(j.contact)}</a>` : `<span>Contact: ${esc(j.contact)}</span>`}</div></article>`).join("")
      : `<p class="empty">No posts yet in this section. Members can share openings, referrals and mentoring offers here.</p>`;
    stagger($("#jobList"));
  }
  $("#skillLinks").innerHTML = SKILL_LINKS.map((l, i) => `<a class="res" style="--i:${i}" href="${esc(l.url)}" target="_blank" rel="noopener"><span>${l.icon}</span><div><b>${esc(l.name)}</b><small>${esc(l.note)}</small></div><em>↗</em></a>`).join("");
  stagger($("#skillLinks"));
  $("#jobChips").addEventListener("click", (e) => { const c = e.target.closest("[data-job-kind]"); if (c) { jobKind = c.dataset.jobKind; renderJobs(); } });
  async function loadJobs() { try { jobs = (await API.get("/jobs")).jobs; } catch {} renderJobs(); }
  renderJobs();
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-post-job]")) return;
    if (!API.online) { toast("Please try again when you are online"); return; }
    if (!state.user) { toast("Please register or log in to share a job"); openRegister(); return; }
    openModal(`<h3 id="modalTitle">💼 Share a job, referral or offer</h3><p class="muted">Posts are checked by our team and shown for 60 days. Never ask for money.</p>
      <form id="jobForm" class="stack">
        <label>Type<select name="kind" required>${Object.entries(JOB_KINDS).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join("")}</select></label>
        <label>Title<input name="title" required maxlength="120" placeholder="e.g. Electricians needed – Dubai"></label>
        <div class="row2"><label>Company <small class="muted">(optional)</small><input name="company" maxlength="120"></label><label>Country<input name="country" required maxlength="60" value="${esc(state.user.country || "")}"></label></div>
        <label>City <small class="muted">(optional)</small><input name="city" maxlength="60" value="${esc(state.user.city || "")}"></label>
        <label>Details<textarea name="description" rows="3" required minlength="10" maxlength="1000" placeholder="Role, experience needed, salary range, how to apply…"></textarea></label>
        <div class="row2"><label>Link <small class="muted">(optional)</small><input name="link" type="url" placeholder="https://"></label><label>Contact (email / WhatsApp)<input name="contact" required maxlength="120" value="${esc(state.user.email || "")}"></label></div>
        <button class="btn btn-primary btn-block">Send for review</button></form>`);
    $("#jobForm").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try { const r = await API.post("/jobs", Object.fromEntries(new FormData(ev.target))); closeModal(); toast("✅ " + r.message); }
      catch (err) { toast(err.message); }
    });
  });

  /* ---------- newsletter ---------- */
  $("#newsForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!API.online) { toast("Please try again when you are online"); return; }
    try { const r = await API.post("/newsletter", { email: e.target.elements.email.value, name: state.user ? state.user.name : "", country: state.user ? state.user.country : "", consent: true }); e.target.reset(); toast("📰 " + r.message); }
    catch (err) { toast(err.message); }
  });

  /* ---------- Hall of Fame: real volunteers added by admins (no sample names) ---------- */
  async function loadFame() {
    let people = [];
    try { people = API.online ? (await API.get("/hall-of-fame")).people : []; } catch {}
    $("#fameTrack").innerHTML = people.length ? people.map((f, i) => `<div class="fame" style="--i:${i}"><div class="av" data-badge="${esc(f.badge || "🏆")}">${f.photo ? `<img src="${f.photo}" alt="">` : esc(f.name[0])}</div><span class="title">${esc(f.title)}</span><h4>${esc(f.name)}</h4><small>${esc(f.city || "")}</small><p>${esc(f.note || "")}</p></div>`).join("")
      : `<p class="empty light">Our first Hall of Fame volunteers will be announced soon. Do your weekly tasks – you could be next! 🏆</p>`;
  }
  loadFame();

  /* ---------- "Photo with Jagan Anna" frame ---------- */
  function openPhotoFrame() {
    openModal(`<h3 id="modalTitle">📸 Photo with Jagan Anna</h3><p class="muted">Add your photo – we place it next to Jagan Anna with the YSRCP NRI Wing frame. Your photo stays on your phone; nothing is uploaded.</p>
      <canvas id="frameCanvas" width="1080" height="1080" class="frame-canvas"></canvas>
      <div class="dash-actions"><button class="btn btn-ghost" data-frame-pick>📷 Add my photo</button><button class="btn btn-primary" data-frame-save disabled>⬇ Download</button><button class="btn btn-ghost" data-frame-share hidden>📤 Share</button></div>`);
    const c = $("#frameCanvas"), x = c.getContext("2d");
    let mine = null;
    const jagan = new Image(); jagan.src = "images/jagan-cm-office.webp";
    const cover = (img, dx, dy, dw, dh, fx = 0.5, fy = 0.35) => { // draw like CSS object-fit: cover
      const r = Math.max(dw / img.width, dh / img.height), sw = dw / r, sh = dh / r;
      x.drawImage(img, (img.width - sw) * fx, (img.height - sh) * fy, sw, sh, dx, dy, dw, dh);
    };
    const round = (X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
    function draw() {
      const g = x.createLinearGradient(0, 0, 1080, 1080); g.addColorStop(0, "#0b3a8c"); g.addColorStop(0.55, "#1652c4"); g.addColorStop(1, "#0f9d58");
      x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);
      x.fillStyle = "rgba(255,255,255,.07)"; x.beginPath(); x.arc(980, 120, 300, 0, 7); x.fill();
      x.fillStyle = "#fff"; x.font = "800 64px Outfit, sans-serif"; x.textAlign = "center"; x.fillText("YSRCP NRI Wing", 540, 120);
      x.font = "500 34px Outfit, sans-serif"; x.fillStyle = "rgba(255,255,255,.85)"; x.fillText("Global Unity, Local Impact", 540, 170);
      [[90, mine], [570, jagan]].forEach(([X, img], k) => {
        x.save(); round(X, 250, 420, 520, 36); x.fillStyle = "rgba(255,255,255,.15)"; x.fill(); x.clip();
        if (img && img.complete && img.naturalWidth) cover(img, X, 250, 420, 520, k ? 0.52 : 0.5, k ? 0.38 : 0.3);
        else { x.fillStyle = "rgba(255,255,255,.8)"; x.font = "600 40px Outfit, sans-serif"; x.fillText("Your photo", X + 210, 520); }
        x.restore(); round(X, 250, 420, 520, 36); x.strokeStyle = "#fff"; x.lineWidth = 8; x.stroke();
      });
      x.fillStyle = "#fff"; x.font = "700 40px Outfit, sans-serif";
      x.fillText(state.user ? state.user.name : "Proud NRI supporter", 300, 830); x.fillText("Y.S. Jagan Mohan Reddy", 780, 830);
      x.font = "500 30px Outfit, sans-serif"; x.fillStyle = "rgba(255,255,255,.85)";
      x.fillText(state.user ? `${state.user.city}, ${state.user.country}` : "", 300, 875); x.fillText("President, YSR Congress Party", 780, 875);
      x.font = "700 38px Outfit, sans-serif"; x.fillStyle = "#f5b800"; x.fillText("#YSRCPNRI  ·  Together for Andhra Pradesh", 540, 990);
      x.textAlign = "left";
    }
    jagan.onload = draw; draw();
    const modalEl = $("#modalContent");
    modalEl.addEventListener("click", async (e) => {
      if (e.target.closest("[data-frame-pick]")) {
        const f = await choosePhotoSource({ title: "Your photo for the frame" });
        if (!f || !String(f.type).startsWith("image/")) return;
        const url = URL.createObjectURL(f), img = new Image();
        img.onload = () => { mine = img; draw(); $("[data-frame-save]", modalEl).disabled = false; $("[data-frame-share]", modalEl).hidden = !(navigator.canShare); };
        img.src = url;
      }
      if (e.target.closest("[data-frame-save]")) {
        const a = document.createElement("a"); a.download = "photo-with-jagan-anna.png"; a.href = c.toDataURL("image/png"); a.click();
      }
      if (e.target.closest("[data-frame-share]")) {
        c.toBlob(async (blob) => {
          const file = new File([blob], "photo-with-jagan-anna.png", { type: "image/png" });
          try { if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text: "With Jagan Anna! #YSRCPNRI" }); else toast("Sharing is not supported here – please download instead"); } catch {}
        });
      }
    });
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-photo-frame]")) { e.preventDefault(); openPhotoFrame(); } });

  /* ---------- privacy settings in My Dashboard ---------- */
  async function savePrivacy(patch) {
    try { const r = await API.patch("/me", patch); Object.assign(state.user, { showPhoto: r.member.showPhoto, notifyEmail: r.member.notifyEmail }); store.set("user", state.user); toast("Saved"); }
    catch (err) { toast(err.message); }
  }
  async function downloadMyData() {
    try {
      const res = await fetch("/api/me/export", { headers: { Authorization: "Bearer " + API.getToken() } });
      if (!res.ok) throw new Error("Could not download – please log in again.");
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a"); a.href = url; a.download = `my-ysrcp-nri-data-${state.user.no}.json`; a.click(); URL.revokeObjectURL(url);
    } catch (err) { toast(err.message); }
  }
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-pref-photo]")) savePrivacy({ showPhoto: e.target.checked });
    if (e.target.matches("[data-pref-email]")) savePrivacy({ notifyEmail: e.target.checked });
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-export-me]")) { e.preventDefault(); downloadMyData(); } });

  /* ---------- install as an app (PWA) ---------- */
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; $("#installBtn").hidden = false; });
  $("#installBtn").addEventListener("click", async () => {
    if (!installEvt) return;
    installEvt.prompt(); await installEvt.userChoice.catch(() => {}); installEvt = null; $("#installBtn").hidden = true;
  });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  /* ---------- pages (instead of one long page) ---------- */
  // each page = the sections it shows; any other #id opens the page that contains it
  const PAGES = {
    home: ["home", "start", "ctaBand"],
    about: ["about", "leadership", "channels"],
    chapters: ["chapters", "associations"],
    events: ["events", "onair"],
    helpdesk: ["helpdesk", "voter", "emergency"],
    jobs: ["jobs"],
    volunteer: ["volunteer"],
    achievements: ["achievements"],
    mark: ["mark", "pillars"],
    gallery: ["gallery"],
    meet: ["meet"]
  };
  const ALL_SECTIONS = $$("main > section");
  const pageOf = (id) => {
    if (PAGES[id]) return id;
    const el = id && document.getElementById(id);
    const sec = el && el.closest("main > section");
    if (sec) for (const [p, list] of Object.entries(PAGES)) if (list.includes(sec.id)) return p;
    return "home";
  };
  let currentPage = null;
  function goTo(id, scrollTarget) {
    const page = pageOf(id);
    if (page !== currentPage) {
      ALL_SECTIONS.forEach((s) => (s.hidden = !PAGES[page].includes(s.id)));
      currentPage = page;
      document.body.dataset.page = page;
      const titles = { home: "", about: "About", chapters: "My City", events: "Events", helpdesk: "Help Desk", volunteer: "Volunteer", achievements: "Achievements", mark: "JaganAnna Mark", gallery: "Gallery", meet: "Meet Jagan Sir", jobs: "Jobs & Skills" };
      document.title = (titles[page] ? titles[page] + " | " : "") + "YSRCP NRI Wing | Global Unity, Local Impact";
      if (page === "chapters") setTimeout(initWorldMap, 0);
      if (page === "meet") prefillMeet();
      if (page === "helpdesk") {
        refreshTickets();
        const hf = $("#helpForm").elements, u = state.user;
        if (u) for (const k of ["name", "phone", "country"]) if (!hf[k].value && u[k]) hf[k].value = u[k];
      }
      window.dispatchEvent(new Event("resize")); // let maps resize after being shown
      $$("main > section:not([hidden]) .reveal, main > section:not([hidden]) .stagger").forEach((el) => io.observe(el));
    }
    // highlight the menu item for this page
    $$(".nav-links > a").forEach((a) => a.classList.toggle("active", pageOf((a.getAttribute("href") || "").slice(1)) === page));
    const target = scrollTarget && document.getElementById(scrollTarget);
    const atTop = !target || PAGES[scrollTarget] || PAGES[page][0] === scrollTarget;
    if (!atTop) {
      setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  const route = () => { const id = decodeURIComponent(location.hash.slice(1)) || "home"; goTo(id, id); };
  addEventListener("hashchange", route);
  route();

  /* ---------- init ---------- */
  $("#yr").textContent = new Date().getFullYear();
  renderAuth();
  renderRegionChips(); renderChapters();
  renderQuestions(); renderMyTickets();
  applyLang();
  observe();
  addEventListener("load", () => setTimeout(() => $("#preloader").classList.add("done"), 300));
  setTimeout(() => $("#preloader").classList.add("done"), 2500); // fallback
})();
