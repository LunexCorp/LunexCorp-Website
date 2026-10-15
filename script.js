/* LunexCorp site. Edit SITE_CONFIG when the GitHub owner or WhatsApp number changes. */
const SITE_CONFIG = { githubOwner: "LunexCorp", botNumber: "27000000000" /* digits only, with country code */ };
const DEMO_LIMIT = 5;
const waLink = (t = "#menu") => `https://wa.me/${SITE_CONFIG.botNumber}?text=${encodeURIComponent(t)}`;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmt = (s) => esc(s).replace(/```([\s\S]+?)```/g, "<code>$1</code>").replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/_([^_\n]+)_/g, "<i>$1</i>").replace(/\n/g, "<br>");
const num = (n) => { for (const [v, s] of [[1e6, "M"], [1e3, "K"]]) if (Math.abs(n) >= v) return (n / v).toFixed(1).replace(/\.0$/, "") + s; return String(n); };
const ago = (d) => { const s = (Date.now() - new Date(d)) / 1e3, u = [[31536e3, "y"], [2592e3, "mo"], [86400, "d"], [3600, "h"], [60, "m"]]; for (const [v, l] of u) if (s >= v) return Math.floor(s / v) + l + " ago"; return "just now"; };
const day = (d) => new Date(d).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
const kb = (k) => (k >= 1024 ? (k / 1024).toFixed(1) + " MB" : k + " KB");

/* ---------- WhatsApp-style demo ---------- */
const MIC = "M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.900V21h2v-3.100A7 7 0 0 0 19 11z", SEND = "M3 20l18-8L3 4v6l12 2-12 2z";
const TICK = (c) => `<svg class="tk ${c}" viewBox="0 0 16 11"><path d="M1 6l3 3L10 2"/><path class="b" d="M6 9l1 1 7-8"/></svg>`;
const LINK = '<svg viewBox="0 0 24 24"><path d="M14 3v2h3.600l-9.800 9.800 1.400 1.400L19 6.400V10h2V3zM5 5v14h14v-6h-2v4H7V7h4V5z"/></svg>';
const msgsEl = $("#msgs"), form = $("#form"), input = $("#input"), statusEl = $("#status"), pips = $$(".pips i"), chips = $$("#chips button");
let state, last;
const fresh = () => ({ count: 0, locked: false, busy: false, eco: { joined: false, balance: 0, xp: 0, level: 1, shifts: 0, max: 0, daily: false } });
const down = () => msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: calm ? "auto" : "smooth" });
const pill = (t, c = "") => { const p = document.createElement("div"); p.className = "pill " + c; p.textContent = t; msgsEl.appendChild(p); };
const bubble = (side, html) => { const el = document.createElement("div"); el.className = `m ${side}` + (last !== side ? " tail" : ""); last = side; el.innerHTML = html; msgsEl.appendChild(el); down(); return el; };
const addUser = (t) => bubble("out", `${esc(t)}<span class="meta">${nowTime()}${TICK("")}</span>`);
const setTick = (el, c) => { const t = $(".tk", el); if (t) t.setAttribute("class", "tk " + c); };

function addBot(m) {
  let h = m.qr ? `<canvas width="150" height="150" aria-label="Sample QR code"></canvas>` : "";
  h += fmt(m.text || "");
  if (m.note) h += `<span class="foot">${esc(m.note)}</span>`;
  h += `<span class="meta">${nowTime()}</span>`;
  if (m.buttons) h += `<div class="rows">${m.buttons.map((b) => `<button type="button" data-cmd="${esc(b.cmd)}">${esc(b.label)}</button>`).join("")}</div>`;
  if (m.cta) h += `<div class="rows"><a class="btn-row" style="display:contents" href="${waLink()}" target="_blank" rel="noopener"><button type="button">${LINK}Open Lucif on WhatsApp</button></a><button type="button" data-reset>Restart the demo</button></div>`;
  const el = bubble("in", h);
  if (m.qr) drawQR($("canvas", el), m.qr);
}

async function botSays(list, userEl) {
  for (const m of [].concat(list)) {
    if (userEl) { setTick(userEl, "rd"); userEl = null; }
    const t = document.createElement("div"); t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>"; msgsEl.appendChild(t);
    statusEl.textContent = "typing…"; statusEl.className = "t"; down();
    await sleep(calm ? 100 : rand(600, 1000));
    t.remove(); statusEl.textContent = "online"; statusEl.className = "";
    addBot(m);
  }
}

function drawQR(c, text) {
  const N = 25, S = 6, x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, 150, 150);
  let h = 2166136261; for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const p = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  const g = Array.from({ length: N }, () => Array.from({ length: N }, () => p() > 0.52));
  [[0, 0], [N - 7, 0], [0, N - 7]].forEach(([ox, oy]) => { for (let y = -1; y <= 7; y++) for (let k = -1; k <= 7; k++) { const gx = ox + k, gy = oy + y; if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue; g[gy][gx] = k >= 0 && k <= 6 && y >= 0 && y <= 6 && (k % 6 === 0 || y % 6 === 0 || (k >= 2 && k <= 4 && y >= 2 && y <= 4)); } });
  x.fillStyle = "#000"; g.forEach((r, y) => r.forEach((on, k) => on && x.fillRect(k * S, y * S, S, S)));
}

const MENU = { utils: "*Utils*\n#ping, #menu, #qr, #translate, #transcribe, #flight, #idea, #bug, #terms", fun: "*Fun*\n#rr (Russian Roulette)", economy: "*Economy*\n#join, #leave, #work, #daily, #balance, #transfer, #shop, #inventory, #rob, #leaderboard", games: "*Games*\n#blind40 (2 to 6 players)\n#rr (Russian Roulette)\n_Group games need WhatsApp._" };
const AFR = { "goeie môre": "Good morning", "goeie more": "Good morning", "goeie nag": "Good night", dankie: "Thank you", "hoe gaan dit": "How are you?", lekker: "Nice / great", "ek is moeg": "I am tired", "tot siens": "Goodbye", "baie dankie": "Thank you very much" };
const SHOP = [["Fishing Rod", 250], ["Padlock", 400], ["Lockpick Set", 800], ["Laptop", 1200], ["Acoustic Guitar", 2000]];
const needJoin = () => ({ text: "You don't have an account yet. Send *#join* to open one.", buttons: [{ label: "#join", cmd: "#join" }] });
const commands = {
  ping: () => ({ msgs: [{ text: `🏓 *Pong!*\nLatency: ${rand(18, 64)} ms\nUptime: ${rand(2, 40)}d ${rand(0, 23)}h` }] }),
  menu: (a) => { const k = a[0]?.toLowerCase(); if (k && MENU[k]) return { msgs: [{ text: MENU[k] }], count: false }; return { msgs: [{ text: "*Lucif Menu*\nPick a category.", buttons: [["Utils", "utils"], ["Fun", "fun"], ["Economy", "economy"], ["Games", "games"]].map(([l, c]) => ({ label: l, cmd: "#menu " + c })) }] }; },
  help: () => ({ msgs: [{ text: "Commands start with *#*. Send *#menu* to see them all.", buttons: [{ label: "#menu", cmd: "#menu" }] }] }),
  qr: (a) => { const t = a.join(" "); return t ? { msgs: [{ text: `Here's your QR code for:\n_${t}_`, qr: t, note: "Sample picture. The real bot sends a scannable code." }] } : { msgs: [{ text: "Usage: *#qr <text or link>*" }], count: false }; },
  translate: (a) => { const t = a.join(" ").trim(); if (!t) return { msgs: [{ text: "Usage: *#translate <text>*\nExample: #translate goeie môre" }], count: false }; const h = AFR[t.toLowerCase()]; return { msgs: [{ text: h ? `🌍 *Translation* (Afrikaans to English)\n${h}` : "🌍 The demo only knows a few phrases, like _goeie môre_, _dankie_ or _lekker_.\nThe real bot translates any text with a language model." }] }; },
  flight: (a) => ({ msgs: [{ text: `✈️ *${a.join("").toUpperCase() || "SA201"}*\nJohannesburg (JNB) to Cape Town (CPT)\nStatus: _In air_\nDeparted: 08:05\nArrives: 10:10`, note: "Sample data. The real bot uses live flight information." }] }),
  idea: (a) => (a.length ? { msgs: [{ text: "💡 Thanks! Your idea was added to the Lucif Dev Board." }] } : { msgs: [{ text: "Usage: *#idea <your idea>*" }], count: false }),
  terms: () => ({ msgs: [{ text: "*Terms of use*\nLucif is provided as is. Abusing commands or spamming groups can get you blocked.", note: "Short sample. Send #terms in WhatsApp for the full text." }] }),
  rr: () => ({ msgs: [{ text: rand(1, 6) === 1 ? "🔫 You spin the chamber, pull the trigger…\n💥 *BANG.* You're out." : "🔫 You spin the chamber, pull the trigger…\n*click.* You live to play again.", buttons: [{ label: "Pull again", cmd: "#rr" }], note: "Solo demo. In a group, players take turns in a lobby." }] }),
  join: () => { const e = state.eco; if (e.joined) return { msgs: [{ text: "You already have an account. Try *#balance*." }], count: false }; Object.assign(e, { joined: true, balance: 500, max: rand(10, 15) }); return { msgs: [{ text: "🎉 *Account created!*\nStarting balance: 💰 500", buttons: [{ label: "#work", cmd: "#work" }, { label: "#daily", cmd: "#daily" }] }] }; },
  work: () => { const e = state.eco; if (!e.joined) return { msgs: [needJoin()] }; if (e.shifts >= e.max) return { msgs: [{ text: "😴 You've worked enough for now. Come back after the cooldown." }] }; const pay = rand(40, 120); e.shifts++; e.balance += pay; e.xp += rand(5, 15); if (e.xp >= e.level * 50) { e.xp -= e.level * 50; e.level++; } return { msgs: [{ text: `🛠️ You finished a shift and earned 💰 *${pay}*\nShifts left: ${e.max - e.shifts}`, buttons: [{ label: "#balance", cmd: "#balance" }] }] }; },
  daily: () => { const e = state.eco; if (!e.joined) return { msgs: [needJoin()] }; if (e.daily) return { msgs: [{ text: "You already claimed today's reward. Come back tomorrow." }] }; e.daily = true; e.balance += 250; return { msgs: [{ text: "🎁 Daily reward claimed: 💰 *250*" }] }; },
  balance: () => { const e = state.eco; return e.joined ? { msgs: [{ text: `💳 *Your account*\nBalance: 💰 ${num(e.balance)}\nLevel: ${e.level}  (XP ${e.xp}/${e.level * 50})` }] } : { msgs: [needJoin()] }; },
  shop: () => ({ msgs: [{ text: "🛒 *Shop*\n" + SHOP.map(([n, p]) => `${n}: 💰 ${num(p)}`).join("\n"), note: "Sample items. The real shop has 51." }] }),
  inventory: () => (state.eco.joined ? { msgs: [{ text: "🎒 *Inventory*\nEmpty. Browse the *#shop* to buy something.", buttons: [{ label: "#shop", cmd: "#shop" }] }] } : { msgs: [needJoin()] }),
  leaderboard: () => { const r = [["Thando", rand(9000, 14000)], ["Pieter", rand(5000, 8800)], ["Aisha", rand(2000, 4900)]]; if (state.eco.joined) r.push(["You", state.eco.balance]); r.sort((a, b) => b[1] - a[1]); return { msgs: [{ text: "🏆 *Leaderboard*\n" + r.map((x, i) => `${["🥇", "🥈", "🥉", "4."][i]} ${x[0]}: 💰 ${num(x[1])}`).join("\n"), note: "Sample players." }] }; },
};
const WA_ONLY = ["blind40", "transfer", "send", "rob", "leave", "transcribe", "bug"];

function progress() {
  pips.forEach((p, i) => p.classList.toggle("on", i < state.count));
  const n = DEMO_LIMIT - state.count; $("#counter").textContent = n ? `${n} free command${n > 1 ? "s" : ""} left` : "Demo finished";
}
function lock(on) { state.locked = on; input.disabled = on; $("#send").disabled = on; chips.forEach((c) => (c.disabled = on)); $$(".rows button[data-cmd]", msgsEl).forEach((b) => (b.disabled = on)); input.placeholder = on ? "Continue on WhatsApp" : "Message"; }

async function submit(raw) {
  const text = (raw || "").trim(); if (!text || state.busy || state.locked) return;
  state.busy = true; input.value = ""; icon();
  const u = addUser(text); await sleep(calm ? 0 : 350); setTick(u, "dv");
  const [rn, ...args] = text.startsWith("#") ? text.slice(1).split(/\s+/) : [""]; const name = rn.toLowerCase();
  if (!text.startsWith("#")) await botSays({ text: "I answer to commands that start with *#*. Try *#ping* or *#menu*." }, u);
  else if (WA_ONLY.includes(name)) await botSays({ text: `*#${name}* is only available in the WhatsApp version.`, buttons: [{ label: "#menu", cmd: "#menu" }] }, u);
  else if (!commands[name]) await botSays({ text: `I don't know *#${name}*. Send *#menu* to see what I can do.`, buttons: [{ label: "#menu", cmd: "#menu" }] }, u);
  else {
    const r = commands[name](args); await botSays(r.msgs, u);
    if (r.count !== false) { state.count++; progress(); }
    if (state.count >= DEMO_LIMIT) { await sleep(calm ? 50 : 800); await botSays({ cta: true, text: `That's your ${DEMO_LIMIT} commands. 🔥\nThe demo stops here. For group games, the full economy and moderation, use Lucif in WhatsApp.` }); lock(true); }
  }
  state.busy = false; if (!state.locked && matchMedia("(hover:hover)").matches) input.focus({ preventScroll: true });
}
function startDemo() {
  state = fresh(); last = null; msgsEl.innerHTML = ""; progress(); lock(false);
  pill("Today"); pill("🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.", "enc");
  state.busy = true;
  botSays({ text: `Hey, I'm *Lucif*. 👋\nTry any command. You get ${DEMO_LIMIT} here, then I'll point you to WhatsApp.\nStart with *#ping* or *#menu*.`, buttons: [{ label: "#ping", cmd: "#ping" }, { label: "#menu", cmd: "#menu" }] }).then(() => (state.busy = false));
}
const icon = () => $("#ico").innerHTML = `<path d="${input.value ? SEND : MIC}"/>`;
input.addEventListener("input", icon); icon();
form.addEventListener("submit", (e) => { e.preventDefault(); submit(input.value); });
const toDemo = () => $("#demo").scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-cmd]"); if (c && !c.disabled) return submit(c.dataset.cmd);
  const r = e.target.closest("[data-run]"); if (r) { toDemo(); if (!state.locked) setTimeout(() => submit(r.dataset.run), calm ? 0 : 450); return; }
  if (e.target.closest("[data-reset]")) return startDemo();
  if (e.target.closest("[data-focus]")) { e.preventDefault(); toDemo(); }
});
$$("[data-wa]").forEach((a) => { a.href = waLink(); a.target = "_blank"; a.rel = "noopener"; });
$("#year").textContent = new Date().getFullYear();
startDemo();

/* ---------- motion: mask tilt, cursor glow, theme per section, reveals ---------- */
if (!calm) addEventListener("pointermove", (e) => {
  const mk = $("#mask"), w = innerWidth, h = innerHeight;
  mk.style.setProperty("--ry", ((e.clientX / w - 0.5) * 22).toFixed(1) + "deg"); mk.style.setProperty("--rx", ((0.5 - e.clientY / h) * 16).toFixed(1) + "deg");
  const bg = $(".hero-bg"); bg.style.setProperty("--mx", (e.clientX / w * 100).toFixed(0) + "%"); bg.style.setProperty("--my", (e.clientY / h * 100).toFixed(0) + "%");
}, { passive: true });
const themeIO = new IntersectionObserver((es) => es.forEach((en) => en.isIntersecting && (document.body.dataset.t = en.target.dataset.t)), { rootMargin: "-5% 0px -92% 0px" });
$$("[data-t]:not(body)").forEach((s) => themeIO.observe(s));
new IntersectionObserver((es, o) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("go", "seen"); o.unobserve(en.target); } }), { threshold: 0.25 }).observe($("#pipe"));
new IntersectionObserver((es, o) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("seen"); o.unobserve(en.target); } }), { threshold: 0.15 }).observe($("#projects"));

/* ---------- GitHub: live repo list + on-site detail sheet ---------- */
const OWNER = encodeURIComponent(SITE_CONFIG.githubOwner), API = "https://api.github.com";
const LC = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Kotlin: "#A97BFF", Pascal: "#e3f171", Delphi: "#e3f171", HTML: "#e34c26", CSS: "#a07bd8", Java: "#b07219", Shell: "#89e051", "C#": "#178600", Lua: "#000080" };
const lc = (l) => LC[l] || "#b58c73";
const isLead = (r) => /^lucif$/i.test(r.name);
let repos = [], ready;
const gh = async (path, accept = "application/vnd.github+json", text) => {
  const r = await fetch(API + path, { headers: { Accept: accept } });
  if (r.status === 404) return null; if (r.status === 403 || r.status === 429) throw new Error("rate"); if (!r.ok) throw new Error(r.status);
  return text ? r.text() : r.json();
};
const GH_ICON = '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.500 15.600c.4.100.5-.2.500-.4v-1.500c-2.200.5-2.700-1-2.700-1-.4-.9-.9-1.200-.9-1.200-.7-.5.100-.5.100-.5.800.1 1.200.8 1.200.8.700 1.200 1.900.9 2.300.7.100-.5.300-.9.500-1.100-1.800-.2-3.600-.9-3.600-4 0-.9.300-1.600.8-2.100-.1-.2-.4-1 .1-2.100 0 0 .7-.2 2.200.8a7.500 7.500 0 0 1 4 0c1.500-1 2.200-.8 2.200-.8.400 1.100.2 1.900.1 2.100.5.600.8 1.300.8 2.100 0 3.100-1.900 3.700-3.600 3.900.3.300.5.800.5 1.500v2.200c0 .2.100.5.600.4A8 8 0 0 0 8 0z"/></svg>';

async function loadRepos() {
  const box = $("#repos"), bail = (m) => (box.innerHTML = `<p class="msg">${m} <a href="https://github.com/${OWNER}" target="_blank" rel="noopener">Open github.com/${esc(SITE_CONFIG.githubOwner)}</a>.</p>`);
  try {
    for (let p = 1; ; p++) { const pg = await gh(`/users/${OWNER}/repos?type=owner&sort=updated&per_page=100&page=${p}`); repos.push(...pg); if (pg.length < 100) break; }
    if (!repos.length) return bail("No public repositories yet.");
    stats(); drawRepos();
  } catch (e) { bail(e.message === "rate" ? "GitHub is limiting requests from this network for a while." : "Couldn't load the repositories right now."); }
}
function stats() {
  const st = repos.reduce((a, r) => ({ s: a.s + r.stargazers_count, f: a.f + r.forks_count }), { s: 0, f: 0 });
  const langs = new Set(repos.map((r) => r.language).filter(Boolean)).size, push = repos.reduce((a, r) => (r.pushed_at > a ? r.pushed_at : a), "");
  $("#stats").innerHTML = [[repos.length, "public repositories"], [st.s, "stars"], [st.f, "forks"], [langs, "languages"]].map(([n, l]) => `<div><b data-n="${n}">0</b><span>${l}</span></div>`).join("") + `<div><b>${ago(push)}</b><span>last push</span></div>`;
  $$("[data-n]").forEach((b) => { const n = +b.dataset.n, t0 = performance.now(); (function f(t) { const k = calm ? 1 : Math.min(1, (t - t0) / 900); b.textContent = Math.round(n * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); })(t0); });
}
function drawRepos() {
  const q = $("#q").value.toLowerCase(), s = $("#sort").value;
  const list = repos.filter((r) => (r.name + " " + (r.description || "") + " " + (r.topics || []).join(" ")).toLowerCase().includes(q));
  list.sort((a, b) => (isLead(b) - isLead(a)) || (s === "stars" ? b.stargazers_count - a.stargazers_count : s === "name" ? a.name.localeCompare(b.name) : new Date(b.pushed_at) - new Date(a.pushed_at)));
  $("#repos").innerHTML = list.length ? list.map((r, i) => {
    const body = `<h3>${esc(r.name)}</h3><p>${esc(r.description || "No description yet.")}</p>
      ${(r.topics || []).length ? `<div class="meta2">${r.topics.slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
      <div class="meta2">${r.language ? `<span><i class="dot" style="background:${lc(r.language)}"></i>${esc(r.language)}</span>` : ""}<span>★ ${r.stargazers_count}</span><span>⑂ ${r.forks_count}</span>${r.license ? `<span>${esc(r.license.spdx_id)}</span>` : ""}<span>Updated ${ago(r.pushed_at)}</span></div>`;
    return `<a class="repo${isLead(r) ? " lead" : ""}" href="#/repo/${encodeURIComponent(r.name)}" style="--i:${Math.min(i, 12)}">${isLead(r) ? `<img src="assets/lucif-avatar.webp" alt=""><div style="display:grid;gap:10px">${body}</div>` : body}</a>`;
  }).join("") : `<p class="msg">No projects match "${esc(q)}".</p>`;
}
$("#q").addEventListener("input", drawRepos); $("#sort").addEventListener("change", drawRepos);
$("#repos").addEventListener("pointermove", (e) => { const c = e.target.closest(".repo"); if (c) { const b = c.getBoundingClientRect(); c.style.setProperty("--x", e.clientX - b.left + "px"); c.style.setProperty("--y", e.clientY - b.top + "px"); } });
$("#repos").addEventListener("click", (e) => { if (e.target.closest(".repo")) { const s = $("#sheet"); s.style.setProperty("--x", e.clientX + "px"); s.style.setProperty("--y", e.clientY + "px"); } });

const sheet = $("#sheet");
function cleanHTML(html, o, r, br) {
  const d = new DOMParser().parseFromString(html, "text/html");
  d.querySelectorAll("script,style,iframe,object,embed,form,a.anchor").forEach((n) => n.remove());
  d.querySelectorAll("*").forEach((n) => [...n.attributes].forEach((a) => /^on/i.test(a.name) && n.removeAttribute(a.name)));
  const abs = (u, b) => (/^(https?:|data:|mailto:)/i.test(u) ? u : u.startsWith("#") ? null : b + u.replace(/^\.?\//, ""));
  const raw = `https://raw.githubusercontent.com/${o}/${r}/${br}/`, blob = `https://github.com/${o}/${r}/blob/${br}/`;
  d.querySelectorAll("img[src]").forEach((i) => { const u = abs(i.getAttribute("src"), raw); if (u) i.src = u; i.loading = "lazy"; });
  d.querySelectorAll("a[href]").forEach((a) => { const u = abs(a.getAttribute("href"), blob); if (u === null) a.removeAttribute("href"); else { a.href = u; a.target = "_blank"; a.rel = "noopener"; } });
  return d.body.innerHTML;
}
async function openRepo(name) {
  await ready; const r = repos.find((x) => x.name.toLowerCase() === name.toLowerCase()); if (!r) return closeSheet(true);
  const o = r.owner.login, br = r.default_branch, g = (t) => $("#" + t, sheet);
  sheet.innerHTML = `<div class="sbar"><button class="btn btn-clay" data-close>← All projects</button><a class="btn btn-ink" href="${esc(r.html_url)}" target="_blank" rel="noopener">${GH_ICON} View on GitHub</a></div>
  <div class="sin"><div class="badges"><span class="tag">${r.private ? "Private" : "Public"}</span>${r.fork ? '<span class="tag">Fork</span>' : ""}${r.archived ? '<span class="tag">Archived</span>' : ""}${r.language ? `<span class="tag"><i class="dot" style="background:${lc(r.language)}"></i>${esc(r.language)}</span>` : ""}${(r.topics || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
  <h1>${esc(r.name)}</h1><p class="d">${esc(r.description || "No description yet.")}</p>
  <div class="row">${r.homepage ? `<a class="btn btn-clay" href="${esc(/^https?:/.test(r.homepage) ? r.homepage : "https://" + r.homepage)}" target="_blank" rel="noopener">Visit homepage</a>` : ""}<button class="btn btn-clay" data-copy="git clone ${esc(r.clone_url)}">Copy clone command</button><a class="btn btn-clay" href="${esc(r.html_url)}/archive/refs/heads/${esc(br)}.zip">Download ZIP</a></div>
  <div class="grid">${[[r.stargazers_count, "Stars"], [r.forks_count, "Forks"], [r.subscribers_count ?? r.watchers_count, "Watching"], [r.open_issues_count, "Open issues"], [kb(r.size), "Size"], [r.license ? r.license.spdx_id : "None", "License"], [br, "Default branch"], [day(r.created_at), "Created"], [ago(r.pushed_at), "Last push"]].map(([v, l]) => `<div><b>${esc(v)}</b><span>${l}</span></div>`).join("")}</div>
  <div id="lg"></div>
  <div class="cols"><section><h2>README</h2><div class="readme" id="rd"><p class="msg">Loading README…</p></div></section>
  <div class="side"><section><h2>Latest release</h2><div id="rel"><p class="msg">Loading…</p></div></section><section><h2>Recent commits</h2><div id="cm"><p class="msg">Loading…</p></div></section><section><h2>Files</h2><div id="fl"><p class="msg">Loading…</p></div></section></div></div></div>`;
  document.documentElement.style.overflow = "hidden"; sheet.scrollTo(0, 0); sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false"); $("[data-close]", sheet).focus({ preventScroll: true });
  const p = `/repos/${encodeURIComponent(o)}/${encodeURIComponent(r.name)}`, miss = (id, m) => (g(id).innerHTML = `<p class="msg">${m}</p>`), lim = (e) => (e.message === "rate" ? "GitHub rate limit reached. Try again in a bit." : "Couldn't load this.");
  gh(p + "/languages").then((l) => { const t = Object.values(l || {}).reduce((a, b) => a + b, 0); if (!t) return (g("lg").innerHTML = ""); const e = Object.entries(l); g("lg").innerHTML = `<div class="lbar">${e.map(([k, v]) => `<i style="width:${(v / t) * 100}%;background:${lc(k)}"></i>`).join("")}</div><div class="leg">${e.map(([k, v]) => `<span><i class="dot" style="background:${lc(k)}"></i>${esc(k)} ${((v / t) * 100).toFixed(1)}%</span>`).join("")}</div>`; }).catch(() => (g("lg").innerHTML = ""));
  gh(p + "/readme", "application/vnd.github.html+json", 1).then((h) => (g("rd").innerHTML = h ? cleanHTML(h, o, r.name, br) : '<p class="msg">This project has no README yet.</p>')).catch((e) => miss("rd", lim(e)));
  gh(p + "/releases/latest").then((x) => (g("rel").innerHTML = x ? `<a class="li" href="${esc(x.html_url)}" target="_blank" rel="noopener"><span>${esc(x.name || x.tag_name)}</span><span>${day(x.published_at)}</span></a>` : '<p class="msg">No releases yet.</p>')).catch((e) => miss("rel", lim(e)));
  gh(p + "/commits?per_page=6").then((x) => (g("cm").innerHTML = (x || []).map((c) => `<a class="li" href="${esc(c.html_url)}" target="_blank" rel="noopener"><span>${esc(c.commit.message.split("\n")[0].slice(0, 70))}</span><span>${ago(c.commit.author.date)}</span></a>`).join("") || '<p class="msg">No commits yet.</p>')).catch((e) => miss("cm", lim(e)));
  gh(p + "/contents").then((x) => (g("fl").innerHTML = (x || []).sort((a, b) => (b.type === "dir") - (a.type === "dir") || a.name.localeCompare(b.name)).map((f) => `<a class="li" href="${esc(f.html_url)}" target="_blank" rel="noopener"><span>${f.type === "dir" ? "📁" : "📄"} ${esc(f.name)}</span><span>${f.type === "dir" ? "" : kb(Math.max(1, Math.round(f.size / 1024)))}</span></a>`).join("") || '<p class="msg">Empty repository.</p>')).catch((e) => miss("fl", lim(e)));
}
function closeSheet(fromRoute) { sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true"); document.documentElement.style.overflow = ""; if (!fromRoute && /^#\/repo\//.test(location.hash)) history.pushState(null, "", "#projects"); }
const route = () => { const m = location.hash.match(/^#\/repo\/(.+)$/); m ? openRepo(decodeURIComponent(m[1])) : closeSheet(true); };
addEventListener("hashchange", route);
sheet.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) { closeSheet(); $("#projects").scrollIntoView(); }
  const c = e.target.closest("[data-copy]"); if (c) navigator.clipboard?.writeText(c.dataset.copy).then(() => { c.textContent = "Copied"; setTimeout(() => (c.textContent = "Copy clone command"), 1600); });
});
addEventListener("keydown", (e) => e.key === "Escape" && sheet.classList.contains("open") && closeSheet());
ready = loadRepos().then(route);
