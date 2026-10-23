/* ==========================================================================
   YSRCP NRI Wing – site content
   Edit this file to update chapters, events, tasks, achievements, etc.
   Figures marked SAMPLE are placeholders – replace with verified numbers.
   ========================================================================== */


/* ---------- Photos of Y.S. Jagan Mohan Reddy (freely licensed, Wikimedia Commons) ----------
   Loaded from Wikimedia. For launch, save copies in /images and change src to the local path.
   Keep the credit line – the licences require attribution. */
const C = "https://upload.wikimedia.org/wikipedia/commons/";
const PHOTOS = {
  portrait: { src: C + "a/a8/The_Chief_Minister_of_Andhra_Pradesh%2C_Shri_Y.S._Jagan_Mohan_Reddy.jpg",
    cap: "Y.S. Jagan Mohan Reddy, President, YSR Congress Party", credit: "Prime Minister's Office, Government of India · GODL-India" },
  deeksha: { src: C + "thumb/6/6d/Moving_to_JAGAN_anna_deeksha.jpg/1280px-Moving_to_JAGAN_anna_deeksha.jpg",
    cap: "Youth wing marching to Jagan Anna's deeksha for Special Category Status", credit: "Inturu Babuji Nanda · CC BY-SA 4.0" },
  insVizag: { src: C + "3/32/Andhra_Pradesh_Chief_Minister_Jagan_Mohan_Reddy_formally_dedicates_INS_Visakhapatnam_to_the_city_of_Visakhapatnam_01.jpg",
    cap: "Dedicating INS Visakhapatnam to the city of Visakhapatnam, February 2022", credit: "Indian Navy · GODL-India" },
  insVizag2: { src: C + "6/68/Andhra_Pradesh_Chief_Minister_Jagan_Mohan_Reddy_formally_dedicates_INS_Visakhapatnam_to_the_city_of_Visakhapatnam_02.jpg",
    cap: "Y.S. Jagan Mohan Reddy at the dedication of INS Visakhapatnam, February 2022", credit: "Indian Navy · GODL-India",
    crop: { size: "280% auto", pos: "97% 30%" } }, // shows only him (right side of the photo)
  polavaram: { src: C + "2/20/Polavaram_Irrigation_Project_Site_visit_by_Hon%E2%80%99ble_CM_of_Andhra_Pradesh_%28centre%29_Y_S_Jagan_Mohan_Reddy_on_14-Dec-2020.png",
    cap: "Site visit to the Polavaram Irrigation Project, 14 December 2020", credit: "APWRDC · CC BY-SA 4.0" }
};


/* ---------- Photos from the wing's current website (ysrcpnriwing.org) ----------
   For launch, copy these into website/images/ and change SITE to "images". */
const SITE = "https://www.ysrcpnriwing.org";
// public address of THIS website (used in the member-card QR code; change it when you add your own domain)
const PUBLIC_SITE = "https://ysrcpnriwing-eight.vercel.app";
const SITE_CREDIT = "YSRCP NRI Wing (ysrcpnriwing.org)";
const SITE_PHOTOS = {
  worldMap:  { src: SITE + "/Slider/msimg1.jpeg", cap: "Y.S. Jagan Mohan Reddy", credit: SITE_CREDIT },
  nriConnects: { src: SITE + "/Slider/simg1.jpeg", cap: "YSRCP NRI Connects", credit: SITE_CREDIT },
  professionals: { src: SITE + "/Slider/simg2.jpeg", cap: "Y.S. Jagan Mohan Reddy with professionals", credit: SITE_CREDIT },
  health:    { src: SITE + "/pillar-images/Healthcare.png", cap: "Y.S. Jagan Mohan Reddy – healthcare for all", credit: SITE_CREDIT },
  student:   { src: SITE + "/pillar-images/education.png", cap: "Y.S. Jagan Mohan Reddy with a student", credit: SITE_CREDIT },
  document:  { src: SITE + "/Political_Journey/2019.jpeg", cap: "Y.S. Jagan Mohan Reddy in the Legislative Assembly", credit: SITE_CREDIT },
  withPeople: { src: SITE + "/Political_Journey/5y.jpg", cap: "Y.S. Jagan Mohan Reddy walking with local people", credit: SITE_CREDIT },
  padayatra: { src: SITE + "/Political_Journey/4y.jpg", cap: "Y.S. Jagan Mohan Reddy with villagers during the padayatra", credit: SITE_CREDIT }
};

const IMG = {
  // Drop photos in /website/images and put the file names here. Empty = animated graphics are used instead.
  hero: "images/hero-banner.svg",   // fallback background if heroBg is empty
  // Home banner background: NRI world map with flight lines home to Andhra Pradesh (set false to use the photo slideshow)
  heroOrbit: true, // Home background: orbit rings, planes, city tags and waves (set false to use the world map below)
  heroNri: true,
  // Photo slideshow (used only when heroNri is false): Dr. YSR, development under Jagan sir, people being helped
  heroBg: [
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/The_Chief_Minister_of_Andhra_Pradesh_Dr._Y.S._Rajasekhar_Reddy%2C_addressing_at_the_52nd_National_Development_Council_Meeting_at_Vigyan_Bhawan%2C_New_Delhi_on_December_9%2C_2006.jpg/1920px-The_Chief_Minister_of_Andhra_Pradesh_Dr._Y.S._Rajasekhar_Reddy%2C_addressing_at_the_52nd_National_Development_Council_Meeting_at_Vigyan_Bhawan%2C_New_Delhi_on_December_9%2C_2006.jpg",
      pos: "50% 30%", cap: "Dr. Y.S. Rajasekhara Reddy at the National Development Council, 2006", credit: "Planning Commission, Government of India · GODL-India" },
    { src: SITE + "/pillar-images/510788596_1276223217205277_8615475189619476412_n.jpg", pos: "50% 30%", cap: "Y.S. Jagan Mohan Reddy beside the statue of Dr. YSR", credit: SITE_CREDIT },
    { src: SITE + "/Slider/simg4.png", pos: "50% 40%", cap: "Advantage Andhra Pradesh – Global Investors Summit 2023", credit: SITE_CREDIT },
    { src: SITE + "/pillar-images/Welfare.png", pos: "50% 25%", cap: "Welfare reaching every home", credit: SITE_CREDIT },
    { src: SITE + "/Political_Journey/4y.jpg", pos: "50% 30%", cap: "With the people during the padayatra", credit: SITE_CREDIT },
    { src: SITE + "/Slider/simg3.jpeg", pos: "30% 40%", cap: "Bringing investment and jobs to Andhra Pradesh", credit: SITE_CREDIT },
    { src: SITE + "/pillar-images/education.png", pos: "50% 30%", cap: "Education for every child", credit: SITE_CREDIT },
    { src: SITE + "/Political_Journey/1y.jpg", pos: "50% 40%", cap: "Tribute to Dr. YSR", credit: SITE_CREDIT },
    { src: SITE + "/pillar-images/Woman.png", pos: "50% 25%", cap: "Empowering women", credit: SITE_CREDIT },
    { src: SITE + "/pillar-images/Healthcare.png", pos: "50% 22%", cap: "Healthcare for all", credit: SITE_CREDIT }
  ],
  logo: "https://www.ysrcpnriwing.org/assets/nrilogo-CnaBSrOt.png", // official YSRCP NRI Wing logo (copy to images/ before launch)
  // home banner photo collage – the first photo is the large one
  // Dr. YSR – small photo taken from the top of the poster, shown as a round badge on the collage
  collageYsr: { src: SITE + "/Slider/msimg1.jpeg", size: "750% auto", pos: "20% 2.5%", label: "Dr. YSR" },
  collage: [
    { src: SITE + "/Slider/msimg1.jpeg", size: "149% auto", pos: "30% 28%" }, // cropped: corner logo and top YSR photo hidden
    { src: "images/jagan-cm-office.webp", pos: "50% 35%" },
    { src: "images/aluru-with-jagan.jpg", pos: "50% 14%" },
    { src: SITE + "/Political_Journey/2025.jpeg", pos: "50% 30%" },
    { src: SITE + "/pillar-images/education.png", pos: "50% 22%" }
  ],
  leader: { ...SITE_PHOTOS.worldMap, crop: { size: "cover", pos: "50% 0%" } }, // home banner card
  events: { src: SITE + "/Slider/simg4.png", cap: "Advantage Andhra Pradesh – Global Investors Summit", credit: SITE_CREDIT }, // wide event photo above the calendar
  gallery: []   // e.g. ["images/gallery/dallas-meet.jpg", ...] in the same order as GALLERY below
};

/* ---------- Leadership ---------- */
const ALURU_PHOTO = { src: "images/aluru-with-jagan.jpg",
  cap: "Aluru Sambasiva Reddy with Y.S. Jagan Mohan Reddy", credit: "YSRCP NRI Wing",
  crop: { size: "cover", pos: "50% 14%" },             // profile card: full photo, both leaders
  face: { size: "356% auto", pos: "80% 6%" } };       // round photo: Aluru's face
const LEADERS = [
  { name: "Y.S. Jagan Mohan Reddy", role: "President, YSR Congress Party", photo: { src: "images/jagan-cm-office.webp", cap: "Y.S. Jagan Mohan Reddy as Chief Minister", credit: "YSRCP NRI Wing", crop: { size: "cover", pos: "50% 30%" } },
    bio: "Founder and President of the YSR Congress Party and former Chief Minister of Andhra Pradesh (2019–2024).",
    tags: ["Party President", "Former Chief Minister"] },
  { name: "Aluru Sambasiva Reddy", role: "YSRCP State General Secretary & NRI Wing Global Coordinator", photo: ALURU_PHOTO,
    bio: "Indian politician, educator and a prominent YSRCP leader from Andhra Pradesh. As NRI Wing Global Coordinator he manages the party's global outreach and digital initiatives.",
    tags: ["State General Secretary", "NRI Wing Global Coordinator", "Educator"] }
];

/* ---------- YSRCP latest news (top news bar) ----------
   Update this list regularly. Newest first. Keep each headline short. */
const NEWS = [
  { date: "9 Oct 2026", text: "YSRCP flags crisis in Andhra's aqua sector over feed prices, vows to stand with aqua farmers",
    source: "Asianet Newsable", url: "https://newsable.asianetnews.com/india/ysrcp-slams-tdp-govt-for-aqua-sector-crisis-vows-to-fight-for-farmers-articleshow-3533wd4" },
  { date: "9 Oct 2026", text: "Supreme Court rejects YSRCP plea on SIR, clears way for AP local body polls",
    source: "Deccan Chronicle", url: "https://www.deccanchronicle.com/southern-states/andhra-pradesh/sc-rejects-ysrcp-plea-in-sir-clears-way-for-local-body-polls-1994362" },
  { date: "7 Oct 2026", text: "YSRCP urges State Election Commission to convene an all-party meeting before local body poll notification",
    source: "LatestLY / IANS", url: "https://latestly.com/agency-news/india-news-ysrcp-urges-sec-to-convene-all-party-meeting-on-local-body-elections-7636375.html" },
  { date: "Oct 2026", text: "YS Jagan congratulates India's compound archery team on winning gold at the Asian Games 2026",
    source: "ANI", url: "https://www.aninews.in/topic/ys-jagan-mohan-reddy/" },
  { date: "Oct 2026", text: "YS Jagan calls for reform of the Election Commission appointment process",
    source: "ANI", url: "https://www.aninews.in/topic/ys-jagan-mohan-reddy/" },
  { date: "Sep 2026", text: "YS Jagan directs Regional Coordinators to speed up preparations for local body elections",
    source: "ANI", url: "https://www.aninews.in/topic/ys-jagan-mohan-reddy/" },
  { date: "Sep 2026", text: "YS Jagan pays tribute to legendary singer SP Balasubrahmanyam on his death anniversary",
    source: "ANI", url: "https://www.aninews.in/topic/ys-jagan-mohan-reddy/" }
];

/* ---------- Meet Jagan Sir ---------- */
// Photo: Jagan sir with NRI leaders, posted by Aluru Sambasiva Reddy on X. Confirm permission and save a local copy before launch.
const MEET_PHOTO = { src: "https://pbs.twimg.com/media/G0ZzVQ0bkAAQfpi?format=jpg&name=large",
  credit: "Photo: Sambasiva Reddy Aluru (X @alurusamba)" };

/* ---------- Hero slides ---------- */
const HERO_SLIDES = [
  { kicker: { en: "YSRCP Global NRI Wing", te: "వైఎస్ఆర్‌సీపీ గ్లోబల్ ఎన్ఆర్ఐ విభాగం" },
    title: { en: "Connecting NRIs with <em>Y.S. Jagan Mohan Reddy</em>", te: "ఎన్ఆర్ఐలను <em>వై.ఎస్. జగన్ మోహన్ రెడ్డి</em>‌తో కలుపుతున్నాం" },
    text: { en: "The YSRCP NRI Wing brings Telugu people living abroad together – to stay connected with home, help families in Andhra Pradesh and support the party's work for a better state.",
            te: "విదేశాల్లో ఉన్న తెలుగు వారిని ఒక్కటి చేసే వేదిక వైఎస్ఆర్‌సీపీ ఎన్ఆర్ఐ విభాగం – ఇంటితో అనుబంధం, ఏపీలోని కుటుంబాలకు సహాయం, మెరుగైన రాష్ట్రం కోసం పార్టీకి మద్దతు." },
    points: { en: ["48 cities in 30+ countries", "24/7 help for NRIs & families", "Free membership & digital card"], te: ["30+ దేశాల్లో 48 నగరాలు", "24/7 సహాయం", "ఉచిత సభ్యత్వం & డిజిటల్ కార్డు"] },
    theme: "a" },
  {
    title: { en: "Need help back home? <em>We are here.</em>", te: "ఇంటి వద్ద సహాయం కావాలా? <em>మేమున్నాం.</em>" },
    text: { en: "From property and documents to medical emergencies, our volunteers in every district help NRI families. Raise a request online and follow it step by step until it is solved.",
            te: "ఆస్తి, పత్రాల నుంచి వైద్య అత్యవసరాల వరకు – ప్రతి జిల్లాలో మా వాలంటీర్లు ఎన్ఆర్ఐ కుటుంబాలకు సహాయం చేస్తారు. ఆన్‌లైన్‌లో అభ్యర్థన పంపి పరిష్కారం వరకు ట్రాక్ చేయండి." },
    theme: "b" },
  {
    title: { en: "Join hands with Jagan Anna – <em>serve Andhra Pradesh from anywhere</em>", te: "జగనన్నతో చేయి కలపండి – <em>ఎక్కడ ఉన్నా ఆంధ్రప్రదేశ్‌కు సేవ చేయండి</em>" },
    text: { en: "Living abroad, you can still make a difference at home. Each week we share simple volunteer tasks – spread the party's message, call families in your home constituency or join a city meet – and every task earns points, badges and a place on our Achievements wall.",
            te: "విదేశాల్లో ఉన్నా సొంత ఊరిలో మార్పు తీసుకురావచ్చు. ప్రతి వారం సులభమైన సేవా పనులు – పార్టీ సందేశాన్ని పంచుకోండి, మీ నియోజకవర్గంలోని కుటుంబాలకు ఫోన్ చేయండి లేదా చాప్టర్ మీట్‌లో పాల్గొనండి. ప్రతి పనికి పాయింట్లు, బ్యాడ్జ్‌లు." },
    points: { en: ["Help families in your home district", "Join meets in your city", "Serve from anywhere in the world"], te: ["మీ సొంత జిల్లాలో కుటుంబాలకు సహాయం", "మీ నగరంలో మీటింగ్‌లలో పాల్గొనండి", "ప్రపంచంలో ఎక్కడి నుంచైనా సేవ"] },
    theme: "c" }
];

/* ---------- Political journey (JaganAnna Mark) ----------
   Facts summarised from Wikipedia: "YSR Congress Party" and "Praja Sankalpa Yatra" (CC BY-SA). */
// one photo per year, from the wing's current website
const jp = (file, year) => ({ src: SITE + "/Political_Journey/" + file, cap: "Y.S. Jagan Mohan Reddy · " + year, credit: SITE_CREDIT });
const JOURNEY = [
  { year: 2011, title: "The birth of a people's movement", photo: jp("1y.jpg", 2011),
    points: [
      "September 2009: Chief Minister Dr. Y.S. Rajasekhara Reddy dies in a helicopter crash. The Congress leadership refuses to make his son, then Kadapa MP Y.S. Jagan Mohan Reddy, the Chief Minister.",
      "April 2010: Jagan begins the Odarpu Yatra (condolence tour) in West Godavari and Khammam districts, refusing a Congress Working Committee order to call it off.",
      "November 2010: Jagan and his mother Y.S. Vijayamma resign their Kadapa Lok Sabha and Pulivendula Assembly seats and leave the Congress – many Congress leaders loyal to Dr. YSR join them.",
      "12 March 2011: the YSR Congress Party is founded, and Jagan takes over its leadership."
    ] },
  { year: 2012, title: "The people give their verdict", photo: jp("2012.jpeg", 2012),
    points: [
      "March 2012: the party wins its first Assembly by-election, in Kovur, Nellore district.",
      "15 June 2012: by-elections are held for 18 Assembly seats – the party wins 15 of them, along with the Nellore Lok Sabha seat.",
      "24 September 2013: Jagan walks out of jail after 16 months, to a huge welcome from supporters."
    ] },
  { year: 2014, title: "A strong voice in opposition", photo: jp("2014.jpeg", 2014),
    points: [
      "In the 2014 election the party wins 70 of 294 Assembly seats with 1.35 crore votes (27.88%).",
      "It wins 9 Lok Sabha seats with nearly 1.4 crore votes (29.14%), contesting 42 seats.",
      "After the Telugu Desam Party forms the government, the YSR Congress Party becomes the main opposition."
    ] },
  { year: 2017, title: "Praja Sankalpa Yatra begins", photo: jp("4y.jpg", 2017),
    points: [
      "6 November 2017: Y.S. Jagan Mohan Reddy begins the Praja Sankalpa Yatra, a padayatra across Andhra Pradesh.",
      "By 2017, one-third of the party's 2014 MLAs had moved to the TDP – Jagan takes the party's message straight to the people instead.",
      "On the walk he presents the Navaratnalu – nine welfare promises that become the party's agenda."
    ] },
  { year: 2018, title: "3,648 km on foot", photo: jp("5y.jpg", 2018),
    points: [
      "20 June 2018: the party's Lok Sabha members resign – Y.V. Subba Reddy (Ongole), Y.S. Avinash Reddy (Kadapa), Mekapati Rajamohan Reddy (Nellore), Varaprasad Rao Velagapalli (Tirupati) and P.V. Midhun Reddy (Rajampet).",
      "October 2018: Jagan is attacked with a knife at Visakhapatnam Airport while returning from the yatra in Vizianagaram district – and goes back to the walk.",
      "The party does not contest the 2018 Telangana Assembly election.",
      "January 2019: the yatra ends at Ichchapuram after 341 days and 3,648 km – covering all 13 districts and 134 of 175 Assembly constituencies, and meeting about two crore people."
    ] },
  { year: 2019, title: "A historic mandate", photo: jp("2019.jpeg", 2019),
    points: [
      "Assembly election: 151 of 175 seats with 1.57 crore votes (49.95%) – 81 more seats than in 2014. The party sweeps Vizianagaram, Kadapa, Kurnool and Nellore districts.",
      "Lok Sabha election: 22 of Andhra Pradesh's 25 seats with 1.55 crore votes (49.89%).",
      "30 May 2019: Y.S. Jagan Mohan Reddy is sworn in as Chief Minister of Andhra Pradesh.",
      "8 June 2019: Amzath Basha Shaik Bepari, Alla Nani and Pilli Subhash Chandra Bose are among those made Deputy Chief Ministers.",
      "The Navaratnalu welfare promises made during the padayatra are put into action."
    ] },
  { year: 2021, title: "Governing for the people", photo: jp("7y.jpg", 2021),
    points: [
      "July 2020: Dharmana Krishna Das becomes Deputy Chief Minister.",
      "2 May 2021: Maddila Gurumoorthy wins the Tirupati (SC) Lok Sabha by-election for the party.",
      "April 2022: Budi Mutyala Naidu becomes Deputy Chief Minister in the cabinet reshuffle.",
      "June 2022: S. Niranjan Reddy is appointed to the Rajya Sabha."
    ] },
  { year: 2025, title: "Back among the people", photo: jp("2025.jpeg", 2025),
    points: [
      "2024 election: the party wins 11 of 175 Assembly seats with 1.33 crore votes (39.37%), and 4 Lok Sabha seats with 1.32 crore votes (39.61%).",
      "11 June 2024: Jagan resigns as Chief Minister after the NDA alliance wins the election.",
      "April 2024: Y.V. Subba Reddy, Golla Babu Rao and Meda Raghunadha Reddy join S. Niranjan Reddy in the Rajya Sabha.",
      "With the support of nearly 40% of voters, the party continues as the voice of the people and rebuilds for the next election."
    ] }
];

/* ---------- "How can we help you?" quick actions (shown in English and Telugu together) ---------- */
const QUICK = [
  { icon: "🛟", en: "I need help back home", te: "ఇంటి వద్ద సహాయం కావాలి", sub: "Family, property, documents, emergency", go: "#helpdesk", accent: "red" },
  { icon: "🌍", en: "Find my city", te: "నా నగరం కనుగొనండి", sub: "Your city's YSRCP NRI team & WhatsApp group", go: "#chapters", id: "qChapter" },
  { icon: "🪪", en: "Get my member ID card", te: "నా ఐడీ కార్డు పొందండి", sub: "Free digital card with QR code", action: "idcard" },
  { icon: "🤝", en: "Meet Jagan sir", te: "జగన్ గారిని కలవండి", sub: "Request a meeting – in person or online", go: "#meet", accent: "gold" },
  { icon: "🕌", en: "Gulf worker support", te: "గల్ఫ్ కార్మికుల సహాయం", sub: "Emergency contacts, wages, repatriation", action: "svc:gulf" },
  { icon: "🎓", en: "Student abroad", te: "విదేశాల్లో విద్యార్థులు", sub: "Admissions, safety, careers", action: "svc:student" },
  { icon: "📅", en: "Events in my time zone", te: "నా సమయంలో ఈవెంట్స్", sub: "Meets & Live with Leaders", go: "#events" },
  { icon: "🙋", en: "Volunteer from abroad", te: "విదేశం నుంచే సేవ చేయండి", sub: "Simple weekly tasks, points & badges", go: "#volunteer" }
];

/* ---------- Why join ---------- */
const WHY_JOIN = [
  { icon: "🤝", t: { en: "Direct connect with leadership", te: "నాయకత్వంతో నేరుగా అనుసంధానం" },
    d: { en: "Monthly Live with Leaders town halls – send your questions in advance.", te: "ప్రతి నెలా లైవ్ విత్ లీడర్స్ – మీ ప్రశ్నలు ముందుగానే పంపండి." } },
  { icon: "📣", t: { en: "Exclusive updates", te: "ప్రత్యేక సమాచారం" },
    d: { en: "Timely briefings and insights not available anywhere else.", te: "మరెక్కడా లభించని తాజా సమాచారం." } },
  { icon: "🚀", t: { en: "A role in the comeback", te: "తిరిగి గెలుపులో మీ పాత్ర" },
    d: { en: "Weekly volunteer tasks that turn supporters into campaigners.", te: "మద్దతుదారులను ప్రచారకులుగా మార్చే వారపు పనులు." } }
];

// photo helper for service cards: crop = CSS background-size / background-position
const ph = (p, size, pos) => ({ ...p, size, pos });

/* ---------- Services (Gulf + Village live under Services per proposal) ---------- */
const SERVICES = [
  { id: "support247", photo: ph(SITE_PHOTOS.health, "cover", "50% 22%"), wide: true, img: "images/icons/support.svg", icon: "🛟", t: { en: "24/7 Emergency Support", te: "24/7 అత్యవసర సహాయం" },
    d: { en: "Day or night, wherever you are – helplines, urgent tickets and quick guidance for emergencies abroad or back home.", te: "పగలైనా రాత్రైనా – హెల్ప్‌లైన్లు, అత్యవసర టికెట్లు, తక్షణ మార్గదర్శనం." } },
  { id: "idcard", wide: true, photo: ph(SITE_PHOTOS.worldMap, "cover", "50% 62%"), img: "images/icons/idcard.svg", icon: "🪪", t: { en: "Digital ID Card", te: "డిజిటల్ ఐడీ కార్డు" },
    d: { en: "Your free YSRCP NRI Wing member ID card with a member number and QR code – keep it on your phone and show it at events for quick check-in.", te: "మెంబర్ నంబర్, QR కోడ్‌తో ఉచిత వైఎస్ఆర్‌సీపీ ఎన్ఆర్ఐ విభాగం డిజిటల్ ఐడీ కార్డు – ఈవెంట్లలో చూపించండి." } },
  { id: "student", photo: ph(SITE_PHOTOS.student, "cover", "50% 30%"), img: "images/icons/student.svg", icon: "🎓", t: { en: "Student Support", te: "విద్యార్థి సహాయం" },
    d: { en: "Admissions, scholarships, housing and safety guidance for students abroad.", te: "విదేశాల్లో విద్యార్థులకు ప్రవేశాలు, స్కాలర్‌షిప్‌లు, వసతి మార్గదర్శనం." } },
  { id: "legal", photo: ph(SITE_PHOTOS.document, "cover", "50% 30%"), img: "images/icons/legal.svg", icon: "⚖️", t: { en: "Legal Advisor", te: "న్యాయ సలహా" },
    d: { en: "Property, documents and family matters in AP – connect with a volunteer advocate.", te: "ఏపీలో ఆస్తి, పత్రాలు, కుటుంబ విషయాలకు న్యాయ సహాయం." } },
  { id: "career", photo: ph(SITE_PHOTOS.professionals, "cover", "50% 30%"), img: "images/icons/career.svg", icon: "🧭", t: { en: "Career Coach", te: "కెరీర్ కోచ్" },
    d: { en: "Mentors in tech, health, finance and business across 30+ countries.", te: "30+ దేశాల్లో టెక్, ఆరోగ్యం, ఫైనాన్స్ రంగాల మెంటార్లు." } },
  { id: "local", photo: ph(SITE_PHOTOS.withPeople, "cover", "50% 30%"), img: "images/icons/local.svg", icon: "📍", t: { en: "Local Connector", te: "లోకల్ కనెక్టర్" },
    d: { en: "Your trusted point of contact in your home constituency.", te: "మీ సొంత నియోజకవర్గంలో నమ్మకమైన సంప్రదింపు వ్యక్తి." } },
  { id: "gulf", photo: ph(SITE_PHOTOS.nriConnects, "cover", "20% 30%"), img: "images/icons/visa.svg", icon: "🕌", t: { en: "Gulf Worker Support", te: "గల్ఫ్ కార్మికుల సహాయం" },
    d: { en: "Emergency contacts, repatriation help and welfare guidance for workers in the Gulf.", te: "గల్ఫ్ కార్మికులకు అత్యవసర సంప్రదింపులు, స్వదేశానికి తిరిగి రావడంలో సహాయం." } },
  { id: "village", photo: ph(SITE_PHOTOS.padayatra, "cover", "50% 35%"), img: "images/icons/village.svg", icon: "🏡", t: { en: "Native Village Connect", te: "సొంత ఊరు కనెక్ట్" },
    d: { en: "Adopt a project in your home village and follow it with photo updates.", te: "మీ సొంత ఊరిలో ఒక ప్రాజెక్ట్‌కు మద్దతు ఇవ్వండి, ఫోటో అప్‌డేట్‌లు పొందండి." } }
];

/* ---------- 12 pillars ---------- */
// Pillar photos come from the wing's current website (ysrcpnriwing.org/pillar-images).
// For launch, copy them into website/images/pillars/ and change PILLAR_IMG to "images/pillars/".
const PILLAR_IMG = "https://www.ysrcpnriwing.org/pillar-images/";
const PILLARS = [
  { photo: PILLAR_IMG + "Healthcare.png", pos: "50% 18%", icon: "🏥", t: "Healthcare Reforms", te: "ఆరోగ్య సంస్కరణలు", d: "Free treatment under Aarogyasri, new medical colleges and village clinics." },
  { photo: PILLAR_IMG + "education.png", pos: "50% 25%", icon: "📚", t: "Education, Skills & Youth", te: "విద్య, నైపుణ్యాలు & యువత", d: "Modern schools, skill universities and jobs-ready youth." },
  { photo: PILLAR_IMG + "STS_1159.jpeg", pos: "50% 20%", icon: "🌾", t: "Agricultural Reforms", te: "వ్యవసాయ సంస్కరణలు", d: "Income security, Rythu Bharosa Kendras, irrigation and fair prices." },
  { photo: PILLAR_IMG + "Welfare.png", pos: "50% 18%", icon: "🤲", t: "Welfare Architecture", te: "సంక్షేమ వ్యవస్థ", d: "Direct Benefit Transfer, pensions and social security without middlemen." },
  { photo: PHOTOS.polavaram.src, pos: "50% 40%", icon: "🛣️", t: "Infrastructure", te: "మౌలిక సదుపాయాలు", d: "Roads, housing for the poor, drinking water and sanitation." },
  { photo: SITE + "/Slider/simg3.jpeg", pos: "28% 40%", icon: "🏭", t: "Industry & Jobs", te: "పరిశ్రమలు & ఉద్యోగాలు", d: "Industrial parks, MSMEs and investment that creates local jobs." },
  { photo: "images/jagan-cm-office.webp", pos: "50% 35%", icon: "🏛️", t: "Governance Reforms", te: "పాలనా సంస్కరణలు", d: "Village & Ward Secretariats and transparent, doorstep delivery." },
  { photo: PILLAR_IMG + "Decentrilization.png", pos: "50% 22%", icon: "🗺️", t: "Decentralised Development", te: "వికేంద్రీకృత అభివృద్ధి", d: "Balanced growth for every region and stronger districts." },
  { photo: PILLAR_IMG + "economic_growth.jpeg", pos: "50% 20%", icon: "📈", t: "Economic Growth", te: "ఆర్థిక వృద్ధి", d: "Welfare-led growth that puts money in people's hands." },
  { photo: SITE + "/Political_Journey/5y.jpg", pos: "50% 30%", icon: "⚖️", t: "Social Justice", te: "సామాజిక న్యాయం", d: "Real power and welfare for SC, ST, BC and minority communities." },
  { photo: PHOTOS.insVizag.src, pos: "50% 30%", icon: "⚓", t: "Blue Economy", te: "నీలి ఆర్థిక వ్యవస్థ", d: "Ports, fishing harbours, aquaculture and coastal livelihoods." },
  { photo: PILLAR_IMG + "Woman.png", pos: "50% 25%", icon: "👩", t: "Women Empowerment", te: "మహిళా సాధికారత", d: "SHGs, entrepreneurship, credit and safety for every woman." }
];

/* ---------- Chapters (coordinator details to be supplied by management) ---------- */
// email: optional, e.g. email: "dallas.team@gmail.com" – if left out the site shows <city>@ysrcpnriwing.org
const CHAPTERS = [
  { region: "North America", country: "USA", iso: "us", city: "Dallas", tz: "America/Chicago", members: 1840, x: 22, y: 40 },
  { region: "North America", country: "USA", iso: "us", city: "San Francisco Bay Area", tz: "America/Los_Angeles", members: 2210, x: 15, y: 38 },
  { region: "North America", country: "USA", iso: "us", city: "New Jersey", tz: "America/New_York", members: 1960, x: 28, y: 36 },
  { region: "North America", country: "USA", iso: "us", city: "Chicago", tz: "America/Chicago", members: 1120, x: 24, y: 35 },
  { region: "North America", country: "USA", iso: "us", city: "Atlanta", tz: "America/New_York", members: 980, x: 25, y: 41 },
  { region: "North America", country: "Canada", iso: "ca", city: "Toronto", tz: "America/Toronto", members: 760, x: 27, y: 32 },
  { region: "Europe", country: "United Kingdom", iso: "gb", city: "London", tz: "Europe/London", members: 1430, x: 47, y: 29 },
  { region: "Europe", country: "Ireland", iso: "ie", city: "Dublin", tz: "Europe/Dublin", members: 420, x: 45, y: 28 },
  { region: "Europe", country: "Germany", iso: "de", city: "Frankfurt", tz: "Europe/Berlin", members: 610, x: 50, y: 30 },
  { region: "Europe", country: "Netherlands", iso: "nl", city: "Amsterdam", tz: "Europe/Amsterdam", members: 340, x: 49, y: 28 },
  { region: "Gulf", country: "UAE", iso: "ae", city: "Dubai", tz: "Asia/Dubai", members: 2650, x: 62, y: 45 },
  { region: "Gulf", country: "Qatar", iso: "qa", city: "Doha", tz: "Asia/Qatar", members: 1180, x: 61, y: 45 },
  { region: "Gulf", country: "Kuwait", iso: "kw", city: "Kuwait City", tz: "Asia/Kuwait", members: 1520, x: 60, y: 42 },
  { region: "Gulf", country: "Saudi Arabia", iso: "sa", city: "Riyadh", tz: "Asia/Riyadh", members: 1390, x: 59, y: 45 },
  { region: "Gulf", country: "Oman", iso: "om", city: "Muscat", tz: "Asia/Muscat", members: 870, x: 64, y: 47 },
  { region: "Gulf", country: "Bahrain", iso: "bh", city: "Manama", tz: "Asia/Bahrain", members: 450, x: 61, y: 44 },
  { region: "South East Asia", country: "Singapore", iso: "sg", city: "Singapore", tz: "Asia/Singapore", members: 930, x: 77, y: 56 },
  { region: "South East Asia", country: "Malaysia", iso: "my", city: "Kuala Lumpur", tz: "Asia/Kuala_Lumpur", members: 520, x: 76, y: 54 },
  { region: "East Asia", country: "Japan", iso: "jp", city: "Tokyo", tz: "Asia/Tokyo", members: 290, x: 87, y: 36 },
  { region: "Australia & NZ", country: "Australia", iso: "au", city: "Sydney", tz: "Australia/Sydney", members: 1040, x: 89, y: 77 },
  { region: "Australia & NZ", country: "Australia", iso: "au", city: "Melbourne", tz: "Australia/Melbourne", members: 880, x: 87, y: 80 },
  { region: "Australia & NZ", country: "New Zealand", iso: "nz", city: "Auckland", tz: "Pacific/Auckland", members: 310, x: 96, y: 80 },
  { region: "Africa", country: "South Africa", iso: "za", city: "Johannesburg", tz: "Africa/Johannesburg", members: 260, x: 54, y: 75 }
];

/* ---------- Chapter city coordinates (latitude, longitude) for the world map ---------- */
const CITY_COORDS = {
  "Dallas": [32.78, -96.80], "San Francisco Bay Area": [37.55, -122.0], "New Jersey": [40.06, -74.41], "Chicago": [41.88, -87.63],
  "Atlanta": [33.75, -84.39], "Toronto": [43.65, -79.38], "London": [51.51, -0.13], "Dublin": [53.35, -6.26],
  "Frankfurt": [50.11, 8.68], "Amsterdam": [52.37, 4.90], "Dubai": [25.20, 55.27], "Doha": [25.29, 51.53],
  "Kuwait City": [29.38, 47.99], "Riyadh": [24.71, 46.68], "Muscat": [23.59, 58.41], "Manama": [26.23, 50.59],
  "Singapore": [1.35, 103.82], "Kuala Lumpur": [3.14, 101.69], "Tokyo": [35.68, 139.69], "Sydney": [-33.87, 151.21],
  "Melbourne": [-37.81, 144.96], "Auckland": [-36.85, 174.76], "Johannesburg": [-26.20, 28.05]
};

/* ---------- Events (dates are relative to today so the demo always shows upcoming events) ---------- */
// istHour = start time in India Standard Time
const EVENTS = [
  { id: "ev1", day: 3,  istHour: 20.5, type: "live",   title: "Live with Leaders – Monthly Town Hall", where: "Online (YouTube + Zoom)", chapter: "Global" },
  { id: "ev2", day: 6,  istHour: 23,   type: "meet",   title: "Dallas NRI Family Meet & Dussehra Celebration", where: "Irving, Texas", chapter: "Dallas" },
  { id: "ev3", day: 9,  istHour: 22,   type: "meet",   title: "Gulf Workers Welfare Camp", where: "Dubai – Al Qusais", chapter: "Dubai" },
  { id: "ev4", day: 13, istHour: 19,   type: "online", title: "Webinar: Property & Document Help for NRIs", where: "Online (Zoom)", chapter: "Global" },
  { id: "ev5", day: 17, istHour: 15,   type: "meet",   title: "London NRI Volunteers' Meet", where: "Harrow, London", chapter: "London" },
  { id: "ev6", day: 22, istHour: 10,   type: "online", title: "Students Abroad Orientation – Safety & Careers", where: "Online", chapter: "Global" },
  { id: "ev7", day: 27, istHour: 14,   type: "meet",   title: "Sydney NRI Community Picnic", where: "Parramatta Park, Sydney", chapter: "Sydney" },
  { id: "ev8", day: 34, istHour: 20.5, type: "live",   title: "Live with Leaders – Youth & Jobs Special", where: "Online (YouTube + Zoom)", chapter: "Global" }
];

/* ---------- Real NRI event photos (Events section slider) ----------
   1. Copy your photos into website/images/events/
   2. Add one line per photo below. The slider shows them automatically.
   Use only photos the wing owns or has permission to use. */
const EVENT_PHOTOS = [
  // { src: "images/events/dallas-meet-2025.jpg", cap: "Dallas chapter family meet", place: "Irving, Texas, USA", date: "August 2025" },
  // { src: "images/events/dubai-welfare-camp.jpg", cap: "Gulf workers welfare camp", place: "Dubai, UAE", date: "March 2025" },
];

/* ---------- 24/7 support ----------
   Verify every number before launch. */
const HELPLINES = [
  { icon: "📞", name: "APNRTS 24×7 Helpline", note: "AP Non-Resident Telugu Society", tel: "+918632340678", show: "+91 863 234 0678" },
  { icon: "💬", name: "APNRTS WhatsApp", note: "Chat support", wa: "918500027678", show: "+91 85000 27678" },
  { icon: "🇮🇳", name: "Pravasi Bharatiya Sahayata Kendra", note: "MEA, toll-free from India", tel: "18001113090", show: "1800 11 3090" },
  { icon: "🚨", name: "India Emergency (family in AP)", note: "Police · Fire · Ambulance", tel: "112", show: "112" },
  { icon: "🌐", name: "MADAD – Consular help", note: "Register a grievance with Indian missions", url: "https://madad.gov.in", show: "madad.gov.in" },
  { icon: "🤝", name: "YSRCP NRI Wing", note: "Wing helpline", tel: "+919515511111", show: "+91 95155 11111" }
];
const QUICK_HELP = [
  { id: "medical", icon: "🏥", title: "Medical emergency abroad",
    steps: ["Call the local emergency number first (911 in USA/Canada, 999 in UK/UAE, 000 in Australia, 112 in Europe).", "Inform the nearest Indian Embassy or Consulate.", "Raise an urgent ticket – a volunteer in your city will call you back."] },
  { id: "passport", icon: "🛂", title: "Lost or stolen passport",
    steps: ["File a police report where it was lost and keep a copy.", "Contact the Indian Embassy/Consulate for a new passport or an Emergency Certificate.", "Register on MADAD (madad.gov.in) if you need follow-up."] },
  { id: "death", icon: "🕊️", title: "Death of a family member abroad",
    steps: ["Contact the Indian Embassy/Consulate – they guide the paperwork for repatriation.", "Call APNRTS for help with transport from the airport to the native place in AP.", "Raise an urgent ticket so the wing can support the family."] },
  { id: "family", icon: "👪", title: "Family emergency in AP",
    steps: ["For immediate danger, your family should call 112.", "Raise an urgent ticket with the home district – a local volunteer will reach out.", "Use Local Connector to reach your trusted contact in the constituency."] },
  { id: "gulf", icon: "🕌", title: "Gulf worker in trouble",
    steps: ["Unpaid wages, passport held or contract problems: contact the Indian Embassy labour wing.", "Call Pravasi Bharatiya Sahayata Kendra (1800 11 3090) or APNRTS.", "Raise an urgent ticket – the Gulf chapter coordinator will follow up."] }
];

/* ---------- Volunteer tasks ---------- */
const TASKS = [
  { id: "t1", icon: "📲", pts: 10, title: "Share this week's official post", desc: "Share the party's official post on your social media with #YSRCPNRI." },
  { id: "t2", icon: "📞", pts: 40, title: "Call five people in your home constituency", desc: "Check in with family & friends and listen to local issues." },
  { id: "t3", icon: "🎟️", pts: 30, title: "Attend a city meet", desc: "Join an online or in-person meet listed in Events." },
  { id: "t4", icon: "🙋", pts: 25, title: "Bring a new member", desc: "Invite a fellow NRI to register on this website." },
  { id: "t5", icon: "✍️", pts: 20, title: "Submit a question for Live with Leaders", desc: "Ask something your community wants answered." },
  { id: "t6", icon: "🏡", pts: 35, title: "Update your village project", desc: "Post a photo update for your Native Village Connect project." }
];

const LEADERBOARD = [ // SAMPLE
  { name: "Ravi K.", city: "Dallas", pts: 1240 },
  { name: "Lakshmi P.", city: "London", pts: 1185 },
  { name: "Suresh R.", city: "Dubai", pts: 1090 },
  { name: "Anitha M.", city: "Sydney", pts: 980 },
  { name: "Prakash V.", city: "Singapore", pts: 905 },
  { name: "Swathi N.", city: "Toronto", pts: 870 }
];

/* ---------- Achievements (NEW) ---------- */
const ACH_STATS = [ // SAMPLE – replace with verified numbers
  { n: 25000, suffix: "+", label: { en: "Registered NRI members", te: "నమోదైన ఎన్ఆర్ఐ సభ్యులు" }, icon: "👥" },
  { n: 48, suffix: "", label: { en: "Active cities", te: "చురుకైన చాప్టర్లు" }, icon: "🌍" },
  { n: 3200, suffix: "+", label: { en: "Help requests resolved", te: "పరిష్కరించిన అభ్యర్థనలు" }, icon: "🛟" },
  { n: 120000, suffix: "+", label: { en: "Volunteer hours", te: "వాలంటీర్ గంటలు" }, icon: "⏱️" },
  { n: 410, suffix: "", label: { en: "Village projects supported", te: "మద్దతు పొందిన గ్రామ ప్రాజెక్టులు" }, icon: "🏡" },
  { n: 96, suffix: "%", label: { en: "Tickets closed within 7 days", te: "7 రోజుల్లో పరిష్కారం" }, icon: "⚡" }
];

const ACH_MILESTONES = [ // SAMPLE wing milestones
  { when: "2012", photo: SITE + "/Political_Journey/2012.jpeg", pos: "50% 30%", title: "First overseas chapters", text: "Telugu families in the USA and the Gulf form the first YSRCP NRI groups." },
  { when: "2019", photo: SITE + "/Political_Journey/2019.jpeg", pos: "50% 30%", title: "Thousands fly home to vote", text: "NRIs travel back to campaign door to door in their constituencies." },
  { when: "2020", photo: PHOTOS.polavaram.src, pos: "50% 40%", title: "COVID-19 relief bridge", text: "Volunteers coordinate oxygen, medicines and repatriation help for families." },
  { when: "2023", photo: SITE + "/Slider/simg4.png", pos: "60% 40%", title: "Gulf welfare camps", text: "Regular legal and welfare camps for workers across GCC countries." },
  { when: "2025", photo: SITE + "/Political_Journey/2025.jpeg", pos: "50% 30%", title: "48 cities, one network", text: "Cities across 30+ countries connected on one platform." },
  { when: "2026", photo: SITE + "/Slider/msimg1.jpeg", pos: "50% 45%", title: "Digital NRI portal", text: "Help Desk, Volunteer Corner, Events and member cards go live." }
];

const GOV_ACH = [ // Party-reported governance milestones (2019–24). Verify before launch.
  { icon: "🏛️", n: 15000, suffix: "+", title: "Village & Ward Secretariats", bg: "images/jagan-cm-office.webp", text: "Government services delivered at the doorstep." },
  { icon: "🏥", n: 17, suffix: "", title: "New medical colleges", bg: PILLAR_IMG + "Healthcare.png", text: "Planned to take medical education to every region." },
  { icon: "⚓", n: 4, suffix: "", title: "New ports", bg: PHOTOS.insVizag.src, text: "Ramayapatnam, Machilipatnam, Mulapeta and Kakinada Gateway." },
  { icon: "🏠", n: 30, suffix: " lakh+", title: "House-site pattas", bg: PILLAR_IMG + "Welfare.png", text: "Housing sites for poor women under Navaratnalu." },
  { icon: "🏫", n: 45000, suffix: "+", title: "Schools under Nadu–Nedu", bg: PILLAR_IMG + "education.png", text: "Government schools transformed with modern facilities." },
  { icon: "🌾", n: 10000, suffix: "+", title: "Rythu Bharosa Kendras", bg: PILLAR_IMG + "STS_1159.jpeg", text: "One-stop farmer centres in every village." }
];

// Hall of Fame: real volunteers are added in the admin panel (no sample names)

const BADGES = [
  { id: "b1", icon: "🌱", name: "First Step", need: 10 },
  { id: "b2", icon: "📣", name: "Voice", need: 50 },
  { id: "b3", icon: "🤝", name: "Connector", need: 100 },
  { id: "b4", icon: "🔥", name: "On Fire", need: 150 },
  { id: "b5", icon: "🏅", name: "Champion", need: 250 },
  { id: "b6", icon: "👑", name: "Legend", need: 500 }
];

/* ---------- On Air ---------- */
const VIDEOS = [
  { title: "JaganAnna Ports | Transforming Andhra Pradesh", tag: "Development", hue: 210 },
  { title: "Uddanam Project – Safe water & kidney care", tag: "Healthcare", hue: 150 },
  { title: "Vision for Vizag", tag: "Vision", hue: 190 },
  { title: "Vision of JaganAnna Medical Colleges", tag: "Healthcare", hue: 230 },
  { title: "Press Conference at Party Central Office", tag: "Live", hue: 0 },
  { title: "Ugadi Celebrations – Panchanga Sravanam", tag: "Culture", hue: 35 }
];

/* ---------- Gallery (gradient art + captions until real photos are added) ---------- */
// Gallery: only NRI events and photos of Jagan sir & Aluru Sambasiva Reddy.
// Tiles from images/nri-meets/ are crops of the shared screenshots (size/pos pick one photo).
const G = "images/nri-meets/";
const NRI2NRI = "https://nri2nri.com/wp-content/uploads/2026/07/";
const GALLERY = [
  { src: "images/aluru-with-jagan.jpg", cap: "Aluru Sambasiva Reddy with Y.S. Jagan Mohan Reddy", credit: "YSRCP NRI Wing", cat: "Jagan sir & Samba sir" },
  { src: G + "grid-26.webp", size: "520.5% auto", pos: "98.7% 5.8%", cap: "NRI leaders greet Jagan sir with a bouquet", credit: "YSRCP NRI Wing", cat: "NRIs meet Jagan sir" },
  { src: G + "grid-28.webp", size: "415.2% auto", pos: "67.4% 4.4%", cap: "A portrait gift for Jagan sir from NRI supporters", credit: "YSRCP NRI Wing", cat: "NRIs meet Jagan sir" },
  { src: G + "grid-29.webp", size: "511.5% auto", pos: "0.0% 5.5%", cap: "Aluru Sambasiva Reddy's NRI tour – Sydney, Auckland, Singapore", credit: "YSRCP NRI Wing", cat: "NRI events" },
  { src: G + "grid-31.webp", size: "416.0% auto", pos: "66.3% 4.9%", cap: "YSRCP NRI Outreach Tour – USA", credit: "YSRCP NRI Wing", cat: "NRI events" },
  { src: G + "grid-26.webp", size: "520.5% auto", pos: "0.0% 84.9%", cap: "NRIs welcome Jagan sir", credit: "YSRCP NRI Wing", cat: "NRIs meet Jagan sir" },
  { src: G + "grid-29.webp", size: "511.5% auto", pos: "50.1% 4.9%", cap: "Meet & Greet with NRI supporters", credit: "YSRCP NRI Wing", cat: "NRI events" },
  { src: G + "grid-28.webp", size: "415.2% auto", pos: "0.7% 84.8%", cap: "NRI leaders with Jagan sir", credit: "YSRCP NRI Wing", cat: "NRIs meet Jagan sir" },
  { src: G + "grid-29.webp", size: "511.5% auto", pos: "24.5% 87.6%", cap: "Warm welcome from NRI supporters", credit: "YSRCP NRI Wing", cat: "NRI events" },
  { src: G + "grid-30.webp", size: "530.1% auto", pos: "0.0% 5.5%", cap: "NRIs meet Jagan sir", credit: "YSRCP NRI Wing", cat: "NRIs meet Jagan sir" },
  { src: G + "grid-31.webp", size: "416.0% auto", pos: "33.2% 86.6%", cap: "Meet & Greet with Aluru Sambasiva Reddy – Atlanta", credit: "YSRCP NRI Wing", cat: "NRI events" },
  { src: G + "grid-26.webp", size: "520.5% auto", pos: "98.7% 86.2%", cap: "A bouquet for Jagan sir from NRI supporters", credit: "YSRCP NRI Wing", cat: "NRIs meet Jagan sir" },
  { src: NRI2NRI + "YSRCP-NRI-Wing-Unveils-New-Website-in-Atlanta-and-Urges-Unity-to-Strengthen-the-Party-1.jpeg", cap: "YSRCP NRI Wing meet – Atlanta, July 2026", credit: "NRI2NRI.com", cat: "NRI events" },
  { src: G + "grid-28.webp", size: "415.2% auto", pos: "100.0% 84.1%", cap: "Handshake with Jagan sir", credit: "YSRCP NRI Wing", cat: "NRIs meet Jagan sir" },
  { src: G + "grid-29.webp", size: "511.5% auto", pos: "50.1% 87.5%", cap: "Meet & Greet – NRI chapter", credit: "YSRCP NRI Wing", cat: "NRI events" },
  { src: NRI2NRI + "Dallas-Texas-Hosts-Successful-YSRCP-NRI-Outreach-Event-2.jpeg", cap: "“Let's Speak for Jagananna” – Dallas, July 2026", credit: "NRI2NRI.com", cat: "NRI events" }
];

/* ---------- AP districts (for registration) ---------- */
const DISTRICTS = ["Alluri Sitharama Raju","Anakapalli","Anantapur","Annamayya","Bapatla","Chittoor","Dr. B.R. Ambedkar Konaseema","East Godavari","Eluru","Guntur","Kakinada","Krishna","Kurnool","Nandyal","NTR","Palnadu","Parvathipuram Manyam","Prakasam","Sri Potti Sriramulu Nellore","Sri Sathya Sai","Srikakulam","Tirupati","Visakhapatnam","Vizianagaram","West Godavari","YSR Kadapa"];

/* ---------- Translations ---------- */
const I18N = {
  en: {},
  te: {
    statChapters: "నగరాలు", chapterTitle: "మీ దేశం లేదా నగరాన్ని కనుగొనండి", assocTitle: "మీ దగ్గరలోని తెలుగు సంఘాలు", assocText: "దేశం, నగరం వారీగా తెలుగు సంఘాలు, సాంస్కృతిక సమూహాలు. ఏదైనా లేదా? మాకు చెప్పండి.", voterTitle: "విదేశాల నుండి ఓటరుగా నమోదు (ఫారం 6A)", voterText: "విదేశాల్లో ఉన్న భారత పౌరులు (వేరే దేశ పౌరసత్వం తీసుకోనివారు) ఏపీలోని తమ నియోజకవర్గ ఓటర్ల జాబితాలో చేరవచ్చు.", emerTitle: "అత్యవసర సంప్రదింపుల జాబితా", emerText: "ఎన్ఆర్ఐలు, వారి కుటుంబాల కోసం అధికారిక హెల్ప్‌లైన్లు. ఎన్ఆర్ఐ విభాగం ప్రభుత్వ కార్యాలయం కాదు – అధికారిక సహాయం కోసం ఈ సేవలను నేరుగా సంప్రదించండి.", jobsTitle: "ఉద్యోగాలు & నైపుణ్యాలు", jobsText: "ఎన్ఆర్ఐ సభ్యులు పంచుకునే ఉద్యోగాలు, రిఫరల్స్, మార్గదర్శనం, నైపుణ్య శిక్షణ, స్వదేశానికి తిరిగి వచ్చేవారికి సహాయం.", footerNews: "నెలవారీ వార్తాలేఖ",
    brandSub: "ప్రపంచ ఐక్యత, స్థానిక ప్రభావం",
    navHome: "హోమ్", navAbout: "మా గురించి", navChapter: "నా నగరం", navEvents: "ఈవెంట్స్",
    navHelp: "హెల్ప్ డెస్క్", navVolunteer: "వాలంటీర్", navAch: "విజయాలు", navServices: "సేవలు",
    navMark: "జగనన్న మార్క్", navMeet: "జగన్ గారిని కలవండి", navGallery: "గ్యాలరీ", login: "లాగిన్", register: "నమోదు",
    heroCta1: "సభ్యునిగా చేరండి", heroCta2: "నా నగరం కనుగొనండి",
    statMembers: "సభ్యులు", statCountries: "దేశాలు", journeyKicker: "మా రాజకీయ ప్రయాణం", journeyTitle: "ప్రజల నమ్మకం వైపు మార్గం",
    whyKicker: "మా దార్శనికత", whyTitle: "ఎందుకు చేరాలి?", whyText: "మీ మాతృభూమితో మీ అనుబంధం అమూల్యమైనది. కలిసి అనుసంధానం అవుదాం, తోడ్పడదాం, ఎదుగుదాం.",
    servicesKicker: "మా సేవలు", servicesTitle: "ఎన్ఆర్ఐల కోసం సమగ్ర సహాయం", learnMore: "మరింత తెలుసుకోండి",
    pillarsKicker: "దార్శనికత & వ్యూహం", pillarsTitle: "ప్రగతికి 12 స్తంభాలు", pillarsText: "బలమైన, అందరినీ కలుపుకొనే ఆంధ్రప్రదేశ్ కోసం పన్నెండు పునాదులు.",
    chapterKicker: "కొత్తది", chapterText: "మీ దేశం, నగరం ఎంచుకోండి – కోఆర్డినేటర్, వాట్సాప్ గ్రూప్, స్థానిక ఈవెంట్స్ ఒకే క్లిక్‌లో.",
    searchCity: "నగరం లేదా దేశం వెతకండి…", allRegions: "అన్ని ప్రాంతాలు",
    eventsKicker: "ఈవెంట్స్ క్యాలెండర్", eventsTitle: "రాబోయే ఈవెంట్స్ – మీ సమయంలో", eventsText: "అన్ని సమయాలు మీ టైమ్ జోన్‌లో చూపబడతాయి.",
    rsvp: "హాజరవుతాను", going: "✓ హాజరవుతున్నారు",
    liveTitle: "లైవ్ విత్ లీడర్స్", liveText: "నెలవారీ ఆన్‌లైన్ టౌన్ హాల్ – మీ ప్రశ్నను ముందుగానే పంపండి.", askQ: "ప్రశ్న పంపండి",
    helpKicker: "ఎన్ఆర్ఐ హెల్ప్ డెస్క్", helpTitle: "ఇంటి వద్ద సమస్యా? అభ్యర్థన పంపండి", helpText: "కుటుంబం, ఆస్తి, పత్రాలు లేదా అత్యవసర సమస్యలు – టికెట్ నంబర్‌తో ట్రాక్ చేయండి.",
    raiseTab: "అభ్యర్థన పంపండి", trackTab: "టికెట్ ట్రాక్ చేయండి", submit: "సమర్పించండి", track: "ట్రాక్",
    volKicker: "వాలంటీర్ కార్నర్", volTitle: "ఈ వారం పనులు", volText: "పనులు పూర్తి చేయండి, పాయింట్లు సంపాదించండి, నెలవారీ గుర్తింపు పొందండి.",
    myPoints: "నా పాయింట్లు", leaderboard: "లీడర్‌బోర్డ్", markDone: "పూర్తి చేశాను", done: "✓ పూర్తయింది",
    achKicker: "కొత్తది · విజయాలు", achTitle: "మనం కలిసి సాధించినవి", achText: "ప్రపంచవ్యాప్తంగా ఎన్ఆర్ఐ కుటుంబం సాధించిన మైలురాళ్లు, గుర్తింపులు.",
    tabWing: "ఎన్ఆర్ఐ విభాగం మైలురాళ్లు", tabGov: "పాలనా విజయాలు 2019–24", tabFame: "హాల్ ఆఫ్ ఫేమ్", tabBadges: "నా బ్యాడ్జ్‌లు",
    airTitle: "జగనన్న ఆన్ ఎయిర్", channelsTitle: "డిజిటల్ ఛానెల్స్", galleryTitle: "గ్యాలరీ",
    join: "చేరండి", footerServices: "ఎన్ఆర్ఐ సేవలు", footerLinks: "త్వరిత లింకులు", footerRegions: "ప్రాంతాలు",
    dashboard: "నా డాష్‌బోర్డ్", logout: "లాగ్ అవుట్", myCard: "నా సభ్యత్వ కార్డు"
  }
};




/* AP assembly constituencies by district (26 districts, 175 seats) */
const AP_CONSTITUENCIES = {
  "Srikakulam": ["Ichchapuram", "Palasa", "Tekkali", "Pathapatnam", "Srikakulam", "Amadalavalasa", "Etcherla", "Narasannapeta"],
  "Vizianagaram": ["Rajam", "Bobbili", "Cheepurupalli", "Gajapathinagaram", "Nellimarla", "Vizianagaram", "Srungavarapukota"],
  "Parvathipuram Manyam": ["Palakonda", "Kurupam", "Parvathipuram", "Salur"],
  "Alluri Sitharama Raju": ["Araku Valley", "Paderu", "Rampachodavaram"],
  "Visakhapatnam": ["Bhimili", "Visakhapatnam East", "Visakhapatnam South", "Visakhapatnam North", "Visakhapatnam West", "Gajuwaka"],
  "Anakapalli": ["Chodavaram", "Madugula", "Anakapalli", "Pendurthi", "Elamanchili", "Payakaraopet", "Narsipatnam"],
  "Kakinada": ["Tuni", "Prathipadu", "Pithapuram", "Kakinada Rural", "Peddapuram", "Kakinada City", "Jaggampeta"],
  "Dr. B.R. Ambedkar Konaseema": ["Ramachandrapuram", "Mummidivaram", "Amalapuram", "Razole", "P. Gannavaram", "Kothapeta", "Mandapeta"],
  "East Godavari": ["Anaparthy", "Rajanagaram", "Rajahmundry City", "Rajahmundry Rural", "Kovvur", "Nidadavole", "Gopalapuram"],
  "West Godavari": ["Achanta", "Palakollu", "Narasapuram", "Bhimavaram", "Undi", "Tanuku", "Tadepalligudem"],
  "Eluru": ["Unguturu", "Denduluru", "Eluru", "Polavaram", "Chintalapudi", "Nuzvid", "Kaikalur"],
  "Krishna": ["Gannavaram", "Gudivada", "Pedana", "Machilipatnam", "Avanigadda", "Pamarru", "Penamaluru"],
  "NTR": ["Tiruvuru", "Vijayawada West", "Vijayawada Central", "Vijayawada East", "Mylavaram", "Nandigama", "Jaggayyapeta"],
  "Guntur": ["Tadikonda", "Mangalagiri", "Ponnur", "Tenali", "Prathipadu (Guntur)", "Guntur West", "Guntur East"],
  "Palnadu": ["Pedakurapadu", "Chilakaluripet", "Narasaraopet", "Sattenapalle", "Vinukonda", "Gurajala", "Macherla"],
  "Bapatla": ["Vemuru", "Repalle", "Bapatla", "Parchur", "Addanki", "Chirala"],
  "Prakasam": ["Yerragondapalem", "Darsi", "Santhanuthalapadu", "Ongole", "Kondapi", "Markapuram", "Giddalur", "Kanigiri"],
  "Sri Potti Sriramulu Nellore": ["Kandukur", "Kavali", "Atmakur", "Kovur", "Nellore City", "Nellore Rural", "Udayagiri", "Sarvepalli"],
  "Tirupati": ["Gudur", "Sullurpeta", "Venkatagiri", "Chandragiri", "Tirupati", "Srikalahasti", "Satyavedu"],
  "Chittoor": ["Punganur", "Nagari", "Gangadhara Nellore", "Chittoor", "Puthalapattu", "Palamaner", "Kuppam"],
  "Annamayya": ["Rajampet", "Railway Kodur", "Rayachoti", "Thamballapalle", "Pileru", "Madanapalle"],
  "YSR Kadapa": ["Badvel", "Kadapa", "Pulivendla", "Kamalapuram", "Jammalamadugu", "Proddatur", "Mydukur"],
  "Nandyal": ["Allagadda", "Srisailam", "Nandikotkur", "Nandyal", "Banaganapalle", "Dhone"],
  "Kurnool": ["Kurnool", "Panyam", "Kodumur", "Yemmiganur", "Mantralayam", "Adoni", "Alur", "Pattikonda"],
  "Anantapur": ["Rayadurg", "Uravakonda", "Guntakal", "Tadipatri", "Singanamala", "Anantapur Urban", "Kalyandurg", "Raptadu"],
  "Sri Sathya Sai": ["Madakasira", "Hindupur", "Penukonda", "Puttaparthi", "Dharmavaram", "Kadiri"]
};

/* leaders on the digital member card – round crops (size / position as CSS background values) */
const CARD_LEADERS = [
  { name: "YS Jagan", src: "images/jagan-cm-office.webp", size: 300, x: 52.5, y: 38 }
];

/* registration: profession list, grouped (last option "Other" lets people type their own) */
const PROFESSIONS = {
  "IT & Software": ["Software engineer / developer", "Data / AI / analytics", "IT support / network / cloud", "Project / product manager (IT)", "Testing / QA", "Cyber security", "UI / UX designer"],
  "Healthcare": ["Doctor", "Nurse", "Pharmacist", "Dentist", "Lab / medical technician", "Physiotherapist", "Healthcare administration"],
  "Engineering & Technical": ["Civil engineer", "Mechanical engineer", "Electrical / electronics engineer", "Chemical / petroleum engineer", "Oil & gas technician", "Architect", "Quality / safety (HSE) officer"],
  "Business & Finance": ["Business owner / entrepreneur", "Accountant / CA", "Banking / finance", "Sales / marketing", "HR / administration", "Management / consultant", "Real estate", "Shop / trade / retail"],
  "Education & Research": ["Student", "Teacher / lecturer / professor", "Researcher / scientist", "PhD scholar"],
  "Gulf & skilled work": ["Construction worker", "Mason / carpenter", "Electrician", "Plumber", "Welder / fitter", "Driver", "Heavy equipment operator", "Mechanic / technician", "Painter", "Factory / production worker", "Warehouse / logistics", "Security guard", "Cleaner / housekeeping", "Domestic worker / housemaid", "Cook / chef", "Hotel / restaurant staff", "Salesman / shop staff", "Farm / agriculture worker"],
  "Professional services": ["Lawyer / legal", "Journalist / media", "Government / public sector", "Airline / aviation staff", "Seafarer / merchant navy", "Artist / designer", "Social worker / NGO"],
  "Other": ["Homemaker", "Retired", "Looking for work", "Self-employed"]
};

/* ---------- Form 6A: overseas voter registration (check voters.eci.gov.in for the latest rules) ---------- */
const VOTER_STEPS = [
  { t: "Check you can apply", d: "You are an Indian citizen living abroad for work, study or other reasons, you have NOT taken another country's citizenship, and you are 18 or older." },
  { t: "Open the ECI Voters' Portal", d: "Go to voters.eci.gov.in (or the Voter Helpline app) and sign up with your mobile number or email." },
  { t: "Choose Form 6A", d: "Select “Form 6A – New registration for overseas electors”." },
  { t: "Fill in your details", d: "Use the address in AP that is printed in your passport – you are added to the voter list of that constituency." },
  { t: "Upload documents", d: "A recent passport-size photo and self-attested copies of your passport pages (photo + address pages) and the page with your valid visa." },
  { t: "Submit & track", d: "Note the reference number. A Booth Level Officer may visit your AP address to verify. Track the status on the portal." }
];
const VOTER_DOCS = ["Recent passport-size photo", "Indian passport – photo & personal details page", "Passport page with your address in AP", "Page with your valid visa / residence permit", "Your mobile number or email for the portal"];

/* ---------- emergency directory (official services – links only) ---------- */
const EMERGENCY = [
  { group: "Andhra Pradesh Government", icon: "🏛️", items: [
    { name: "APNRTS 24×7 Helpline", note: "AP Non-Resident Telugu Society – help for AP NRIs & families", tel: "+918632340678", show: "+91 863 234 0678" },
    { name: "APNRTS WhatsApp", note: "Chat support", wa: "918500027678", show: "+91 85000 27678" },
    { name: "APNRTS website", note: "Services, insurance help, returnee support", url: "https://apnrts.ap.gov.in", show: "apnrts.ap.gov.in" }
  ] },
  { group: "Government of India", icon: "🇮🇳", items: [
    { name: "MADAD – consular help", note: "Register a complaint with Indian missions abroad", url: "https://madad.gov.in", show: "madad.gov.in" },
    { name: "Pravasi Bharatiya Sahayata Kendra", note: "MEA helpline for overseas Indians (toll-free from India)", tel: "18001113090", show: "1800 11 3090" },
    { name: "Indian embassies & consulates", note: "Find the mission in your country", url: "https://www.mea.gov.in/indian-missions-abroad-new.htm", show: "mea.gov.in" }
  ] },
  { group: "Workers in Gulf & ECR countries", icon: "🛂", items: [
    { name: "e-Migrate", note: "Emigration clearance, registered recruiting agents, complaints", url: "https://emigrate.gov.in", show: "emigrate.gov.in" },
    { name: "Pravasi Bharatiya Bima Yojana (PBBY)", note: "Compulsory insurance for ECR workers – check your policy on e-Migrate", url: "https://emigrate.gov.in", show: "emigrate.gov.in" }
  ] },
  { group: "If someone passes away abroad", icon: "🕊️", items: [
    { name: "Indian Embassy / Consulate", note: "Helps with documents and bringing the body home; welfare funds may help families in need", url: "https://www.mea.gov.in/indian-missions-abroad-new.htm", show: "Find your mission" },
    { name: "APNRTS", note: "Ask about help from the airport to the native place in AP", tel: "+918632340678", show: "+91 863 234 0678" },
    { name: "Raise an urgent Help Desk request", note: "Our volunteers will help the family with the steps", help: true, show: "Open Help Desk" }
  ] }
];
const LOCAL_EMERGENCY = [["USA / Canada", "911"], ["UK", "999"], ["Ireland / Germany / Netherlands", "112"], ["UAE", "999 · ambulance 998"], ["Saudi Arabia", "911"], ["Qatar", "999"], ["Kuwait", "112"], ["Oman", "9999"], ["Bahrain", "999"], ["Singapore", "999 · ambulance 995"], ["Malaysia", "999"], ["Australia", "000"], ["New Zealand", "111"], ["Japan", "110 · ambulance 119"], ["South Africa", "10111 · 112 (mobile)"], ["India", "112"]];

/* ---------- jobs & skills corner: useful official links ---------- */
const SKILL_LINKS = [
  { icon: "🎓", name: "Skill India Digital", note: "Free courses and certificates", url: "https://www.skillindiadigital.gov.in" },
  { icon: "🏗️", name: "APSSDC", note: "AP State Skill Development Corporation – training & placements", url: "https://www.apssdc.in" },
  { icon: "🛂", name: "e-Migrate", note: "Safe migration, registered agents, job demands abroad", url: "https://emigrate.gov.in" },
  { icon: "🏠", name: "APNRTS – returnee support", note: "Help for NRIs coming back to AP", url: "https://apnrts.ap.gov.in" },
  { icon: "🌍", name: "MADAD", note: "Problems with an employer abroad – contact Indian missions", url: "https://madad.gov.in" }
];
const JOB_KINDS = { job: "💼 Job opening", referral: "🤝 Referral", mentoring: "🧭 Mentoring", returnee: "🏠 Returning home" };

/* ---------- privacy: who to contact (fill in the real person before launch) ---------- */
const GRIEVANCE = { name: "Grievance Officer, YSRCP NRI Wing (to be appointed)", email: "grievance@ysrcpnriwing.org" };
