/* ============================================================
   LunexCorp site: Lucif demo chat
   ============================================================ */

// Site settings: edit these values when the GitHub owner or WhatsApp number changes.
const SITE_CONFIG = {
  githubOwner: "LunexCorp",
  // Digits only, with country code (e.g. "27821234567").
  botNumber: "27000000000",
};
const DEMO_LIMIT = 5;

const waLink = (text = "#menu") => `https://wa.me/${SITE_CONFIG.botNumber}?text=${encodeURIComponent(text)}`;

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// WhatsApp-style formatting: *bold*  _italic_  ```mono```
const fmt = (s) =>
  esc(s)
    .replace(/```([\s\S]+?)```/g, "<code>$1</code>")
    .replace(/\*([^*\n]+)\*/g, "<strong>$1</strong>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");

// compact number format: 1500 -> 1.5K
const num = (n) => {
  const units = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [v, s] of units) if (Math.abs(n) >= v) return (n / v).toFixed(1).replace(/\.0$/, "") + s;
  return String(n);
};

/* ---------- state ---------- */
const freshState = () => ({
  count: 0,
  locked: false,
  busy: false,
  eco: { joined: false, balance: 0, xp: 0, level: 1, shifts: 0, maxShifts: 0, dailyClaimed: false },
});
let state = freshState();

/* ---------- elements ---------- */
const msgsEl = $("#msgs");
const form = $("#form");
const input = $("#input");
const statusEl = $("#status");
const pips = $$(".pips i");
const counterEl = $("#counter");
const chips = $$("#chips button");

/* ---------- rendering ---------- */
function scrollDown() {
  msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
}

function addUser(text) {
  const el = document.createElement("div");
  el.className = "bubble me in";
  el.innerHTML = `${esc(text)}<span class="time">${nowTime()} ✓✓</span>`;
  msgsEl.appendChild(el);
  scrollDown();
}

function addBot(msg) {
  const el = document.createElement("div");
  el.className = "bubble bot in" + (msg.cta ? " cta" : "");
  let html = fmt(msg.text || "");
  if (msg.qr) html += `<canvas width="150" height="150" aria-label="Sample QR code"></canvas>`;
  if (msg.note) html += `<span class="note">${esc(msg.note)}</span>`;
  if (msg.buttons) {
    html += `<div class="btns">${msg.buttons
      .map((b) => `<button type="button" data-cmd="${esc(b.cmd)}">${esc(b.label)}</button>`)
      .join("")}</div>`;
  }
  if (msg.cta) {
    html += `<a class="btn btn-primary" href="${waLink("#menu")}" target="_blank" rel="noopener">Open Lucif on WhatsApp</a>`;
    html += `<button type="button" class="reset" data-reset>Restart the demo</button>`;
  }
  html += `<span class="time">${nowTime()}</span>`;
  el.innerHTML = html;
  msgsEl.appendChild(el);
  if (msg.qr) drawQR($("canvas", el), msg.qr);
  scrollDown();
}

function showTyping() {
  const el = document.createElement("div");
  el.className = "typing-bubble";
  el.innerHTML = "<i></i><i></i><i></i>";
  msgsEl.appendChild(el);
  statusEl.textContent = "typing…";
  statusEl.classList.add("typing");
  scrollDown();
  return el;
}
function hideTyping(el) {
  el.remove();
  statusEl.textContent = "online";
  statusEl.classList.remove("typing");
}

async function botSays(messages) {
  for (const m of [].concat(messages)) {
    const t = showTyping();
    await sleep(reduceMotion ? 120 : rand(550, 950));
    hideTyping(t);
    addBot(m);
  }
}

/* ---------- sample QR (decorative; the real bot sends a scannable code) ---------- */
function drawQR(canvas, text) {
  const N = 25, S = 6; // modules, pixel size
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#efe3da";
  ctx.fillRect(0, 0, 150, 150);
  let h = 2166136261;
  for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const prng = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  const grid = Array.from({ length: N }, () => Array.from({ length: N }, () => prng() > 0.52));
  const finder = (ox, oy) => {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      const gx = ox + x, gy = oy + y;
      if (gx < 0 || gy < 0 || gx >= N || gy >= N) continue;
      const ring = x === 0 || x === 6 || y === 0 || y === 6;
      const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
      grid[gy][gx] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (ring || core);
    }
  };
  finder(0, 0); finder(N - 7, 0); finder(0, N - 7);
  ctx.fillStyle = "#13080c";
  grid.forEach((row, y) => row.forEach((on, x) => on && ctx.fillRect(x * S, y * S, S, S)));
}

/* ---------- commands ---------- */
const MENU = {
  utils: "*Utils*\n#ping, #menu, #qr, #translate, #transcribe, #flight, #idea, #bug, #terms",
  fun: "*Fun*\n#rr (Russian Roulette)",
  economy: "*Economy*\n#join, #leave, #work, #daily, #balance, #transfer, #shop, #inventory, #rob, #leaderboard",
  games: "*Games*\n#blind40 (2 to 6 players)\n#rr (Russian Roulette)\n_Group games need WhatsApp._",
};

const AFRIKAANS = {
  "goeie môre": "Good morning",
  "goeie more": "Good morning",
  "goeie nag": "Good night",
  "dankie": "Thank you",
  "hoe gaan dit": "How are you?",
  "lekker": "Nice / great",
  "ek is moeg": "I am tired",
  "tot siens": "Goodbye",
  "baie dankie": "Thank you very much",
};

const SHOP = [["Fishing Rod", 250], ["Padlock", 400], ["Lockpick Set", 800], ["Laptop", 1200], ["Acoustic Guitar", 2000]];

const needJoin = () => ({
  text: "You don't have an account yet. Send *#join* to open one.",
  buttons: [{ label: "#join", cmd: "#join" }],
});

const commands = {
  ping: () => ({
    msgs: [{ text: `🏓 *Pong!*\nLatency: ${rand(18, 64)} ms\nUptime: ${rand(2, 40)}d ${rand(0, 23)}h` }],
  }),

  menu: (args) => {
    const key = args[0]?.toLowerCase();
    if (key && MENU[key]) return { msgs: [{ text: MENU[key] }], count: false };
    return {
      msgs: [{
        text: "*Lucif Menu*\nPick a category.",
        buttons: [
          { label: "Utils", cmd: "#menu utils" },
          { label: "Fun", cmd: "#menu fun" },
          { label: "Economy", cmd: "#menu economy" },
          { label: "Games", cmd: "#menu games" },
        ],
      }],
    };
  },

  help: () => ({ msgs: [{ text: "Commands start with *#*. Send *#menu* to see them all.", buttons: [{ label: "#menu", cmd: "#menu" }] }] }),

  qr: (args) => {
    const text = args.join(" ");
    if (!text) return { msgs: [{ text: "Usage: *#qr <text or link>*\nExample: #qr https://github.com/LunexCorp" }], count: false };
    return { msgs: [{ text: `Here's your QR code for:\n_${text}_`, qr: text, note: "Sample picture. The real bot sends a scannable code." }] };
  },

  translate: (args) => {
    const text = args.join(" ").trim();
    if (!text) return { msgs: [{ text: "Usage: *#translate <text>*\nExample: #translate goeie môre" }], count: false };
    const hit = AFRIKAANS[text.toLowerCase()];
    if (hit) return { msgs: [{ text: `🌍 *Translation* (Afrikaans to English)\n${hit}` }] };
    return { msgs: [{ text: "🌍 The demo only knows a few phrases, like _goeie môre_, _dankie_ or _lekker_.\nThe real bot translates any text with a language model." }] };
  },

  flight: (args) => {
    const code = (args.join("").toUpperCase() || "SA201");
    return {
      msgs: [{
        text: `✈️ *${code}*\nJohannesburg (JNB) to Cape Town (CPT)\nStatus: _In air_\nDeparted: 08:05\nArrives: 10:10`,
        note: "Sample data. The real bot uses live flight information.",
      }],
    };
  },

  idea: (args) => {
    if (!args.length) return { msgs: [{ text: "Usage: *#idea <your idea>*" }], count: false };
    return { msgs: [{ text: "💡 Thanks! Your idea was added to the Lucif Dev Board." }] };
  },

  terms: () => ({
    msgs: [{
      text: "*Terms of use*\nLucif is provided as is. Abusing commands or spamming groups can get you blocked.",
      note: "Short sample. Send #terms in WhatsApp for the full text.",
    }],
  }),

  rr: () => {
    const dead = rand(1, 6) === 1;
    return {
      msgs: [{
        text: dead
          ? "🔫 You spin the chamber, pull the trigger…\n💥 *BANG.* You're out."
          : "🔫 You spin the chamber, pull the trigger…\n*click.* You live to play again.",
        buttons: [{ label: "Pull again", cmd: "#rr" }],
        note: "Solo demo. In a group, players take turns in a lobby.",
      }],
    };
  },

  /* --- economy --- */
  join: () => {
    const e = state.eco;
    if (e.joined) return { msgs: [{ text: "You already have an account. Try *#balance*." }], count: false };
    Object.assign(e, { joined: true, balance: 500, xp: 0, level: 1, shifts: 0, maxShifts: rand(10, 15) });
    return { msgs: [{ text: "🎉 *Account created!*\nStarting balance: 💰 500", buttons: [{ label: "#work", cmd: "#work" }, { label: "#daily", cmd: "#daily" }] }] };
  },

  work: () => {
    const e = state.eco;
    if (!e.joined) return { msgs: [needJoin()] };
    if (e.shifts >= e.maxShifts) return { msgs: [{ text: "😴 You've worked enough for now. Come back after the cooldown." }] };
    const pay = rand(40, 120), xp = rand(5, 15);
    e.shifts++; e.balance += pay; e.xp += xp;
    if (e.xp >= e.level * 50) { e.xp -= e.level * 50; e.level++; }
    return { msgs: [{ text: `🛠️ You finished a shift and earned 💰 *${pay}*\nShifts left: ${e.maxShifts - e.shifts}`, buttons: [{ label: "#balance", cmd: "#balance" }] }] };
  },

  daily: () => {
    const e = state.eco;
    if (!e.joined) return { msgs: [needJoin()] };
    if (e.dailyClaimed) return { msgs: [{ text: "You already claimed today's reward. Come back tomorrow." }] };
    e.dailyClaimed = true; e.balance += 250;
    return { msgs: [{ text: "🎁 Daily reward claimed: 💰 *250*" }] };
  },

  balance: () => {
    const e = state.eco;
    if (!e.joined) return { msgs: [needJoin()] };
    return { msgs: [{ text: `💳 *Your account*\nBalance: 💰 ${num(e.balance)}\nLevel: ${e.level}  (XP ${e.xp}/${e.level * 50})` }] };
  },

  shop: () => ({
    msgs: [{
      text: "🛒 *Shop*\n" + SHOP.map(([n, p]) => `${n}: 💰 ${num(p)}`).join("\n"),
      note: "Sample items. The real shop has 51.",
    }],
  }),

  inventory: () => {
    if (!state.eco.joined) return { msgs: [needJoin()] };
    return { msgs: [{ text: "🎒 *Inventory*\nEmpty. Browse the *#shop* to buy something.", buttons: [{ label: "#shop", cmd: "#shop" }] }] };
  },

  leaderboard: () => {
    const rows = [["Thando", rand(9000, 14000)], ["Pieter", rand(5000, 8800)], ["Aisha", rand(2000, 4900)]];
    if (state.eco.joined) rows.push(["You", state.eco.balance]);
    rows.sort((a, b) => b[1] - a[1]);
    const medals = ["🥇", "🥈", "🥉", "4."];
    return { msgs: [{ text: "🏆 *Leaderboard*\n" + rows.map((r, i) => `${medals[i]} ${r[0]}: 💰 ${num(r[1])}`).join("\n"), note: "Sample players." }] };
  },
};

// commands that only exist in WhatsApp
const WHATSAPP_ONLY = ["blind40", "transfer", "send", "rob", "leave", "transcribe", "bug"];

/* ---------- main flow ---------- */
function updateProgress() {
  pips.forEach((p, i) => p.classList.toggle("on", i < state.count));
  counterEl.textContent = `${state.count} of ${DEMO_LIMIT} demo commands used`;
}

function setLocked(on) {
  state.locked = on;
  input.disabled = on;
  $("#form button").disabled = on;
  chips.forEach((c) => (c.disabled = on));
  $$(".btns button", msgsEl).forEach((b) => (b.disabled = on));
  input.placeholder = on ? "Demo finished. Continue on WhatsApp" : "Type a command, like #ping";
}

async function submit(raw) {
  const text = (raw || "").trim();
  if (!text || state.busy || state.locked) return;
  state.busy = true;
  input.value = "";
  addUser(text);

  if (!text.startsWith("#")) {
    await botSays({ text: "I answer to commands that start with *#*. Try *#ping* or *#menu*." });
    state.busy = false;
    return;
  }

  const [rawName, ...args] = text.slice(1).split(/\s+/);
  const name = rawName.toLowerCase();

  if (WHATSAPP_ONLY.includes(name)) {
    await botSays({ text: `*#${name}* is only available in the WhatsApp version.`, buttons: [{ label: "#menu", cmd: "#menu" }] });
    state.busy = false;
    return;
  }
  if (!commands[name]) {
    await botSays({ text: `I don't know *#${esc(name)}*. Send *#menu* to see what I can do.`, buttons: [{ label: "#menu", cmd: "#menu" }] });
    state.busy = false;
    return;
  }

  const result = commands[name](args);
  await botSays(result.msgs);

  if (result.count !== false) {
    state.count++;
    updateProgress();
  }

  if (state.count >= DEMO_LIMIT) {
    setLocked(true);
    await sleep(reduceMotion ? 100 : 900);
    await botSays({
      cta: true,
      text: `That's your ${DEMO_LIMIT} commands. 🔥\nThe demo stops here. To keep going, with group games, the full economy and moderation, use Lucif in WhatsApp.`,
    });
    setLocked(true); // also disables buttons inside the new bubbles
  }
  state.busy = false;
  if (!state.locked) input.focus({ preventScroll: true });
}

function startDemo() {
  state = freshState();
  msgsEl.innerHTML = "";
  updateProgress();
  setLocked(false);
  state.busy = true;
  botSays({
    text: `Hey, I'm *Lucif*. 👋\nTry any command. You get ${DEMO_LIMIT} here, then I'll point you to WhatsApp.\nStart with *#ping* or *#menu*.`,
    buttons: [{ label: "#ping", cmd: "#ping" }, { label: "#menu", cmd: "#menu" }],
  }).then(() => { state.busy = false; });
}

/* ---------- events ---------- */
form.addEventListener("submit", (e) => { e.preventDefault(); submit(input.value); });

document.addEventListener("click", (e) => {
  const cmdBtn = e.target.closest("[data-cmd]");
  if (cmdBtn && !cmdBtn.disabled) { submit(cmdBtn.dataset.cmd); return; }

  const runBtn = e.target.closest("[data-run]");
  if (runBtn) {
    $("#demo").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    if (state.locked) return;
    setTimeout(() => submit(runBtn.dataset.run), reduceMotion ? 0 : 350);
    return;
  }

  if (e.target.closest("[data-reset]")) { startDemo(); return; }

  if (e.target.closest("[data-focus-demo]")) {
    e.preventDefault();
    $("#demo").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    if (!state.locked) setTimeout(() => input.focus({ preventScroll: true }), 400);
  }
});

// WhatsApp links elsewhere on the page
$$("[data-wa]").forEach((a) => { a.href = waLink("#menu"); a.target = "_blank"; a.rel = "noopener"; });
$("#year").textContent = new Date().getFullYear();

startDemo();

/* ---------- public repos, loaded live from GitHub ---------- */
async function loadRepos() {
  const box = $("#repos");
  const fallback = (msg) => {
    const owner = encodeURIComponent(SITE_CONFIG.githubOwner);
    box.innerHTML = `<p class="repos-status">${msg} <a href="https://github.com/${owner}" target="_blank" rel="noopener">Open github.com/${esc(SITE_CONFIG.githubOwner)}</a>.</p>`;
  };
  try {
    const owner = encodeURIComponent(SITE_CONFIG.githubOwner);
    const repos = [];
    let page = 1;
    while (true) {
      const res = await fetch(`https://api.github.com/users/${owner}/repos?type=owner&sort=updated&per_page=100&page=${page}`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(res.status);
      const nextPage = await res.json();
      repos.push(...nextPage);
      if (nextPage.length < 100) break;
      page++;
    }
    if (!repos.length) return fallback("No public repositories yet.");
    // Lucif first, then most recently updated
    repos.sort((a, b) => (/^lucif$/i.test(b.name) - /^lucif$/i.test(a.name)) || new Date(b.pushed_at) - new Date(a.pushed_at));
    box.innerHTML = repos.map((r, i) => `
      <a class="repo${/^lucif$/i.test(r.name) ? " lead" : ""}" href="${esc(r.html_url)}" target="_blank" rel="noopener">
        <h3>${esc(r.name)}</h3>
        <p>${esc(r.description || "No description yet.")}</p>
        <span class="meta">${r.language ? `<span>${esc(r.language)}</span>` : ""}<span>★ ${r.stargazers_count}</span></span>
      </a>`).join("");
  } catch (err) {
    fallback("Couldn't load the repositories right now.");
  }
}
loadRepos();
