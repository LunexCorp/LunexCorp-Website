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
  let h = fmt(m.text || "");
  if (m.note) h += `<span class="foot">${esc(m.note)}</span>`;
  h += `<span class="meta">${nowTime()}</span>`;
  if (m.buttons) h += `<div class="rows">${m.buttons.map((b) => `<button type="button" data-cmd="${esc(b.cmd)}">${esc(b.label)}</button>`).join("")}</div>`;
  if (m.cta) h += `<div class="rows"><a href="${waLink("#menu")}" target="_blank" rel="noopener noreferrer">${LINK}Chat with Lucif on WhatsApp</a><a href="${SITE_CONFIG.channelUrl}" target="_blank" rel="noopener noreferrer">${LINK}Follow Lucif Updates</a><button type="button" data-reset>Restart the demo</button></div>`;
  bubble("in", h);
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

const pickOne = (a) => a[rand(0, a.length - 1)];
const commands = {
  ping: () => ({ msgs: [{ text: `🏓 *Pong!*\nLatency: ${rand(18, 64)} ms` }] }),
  echo: (a) => (a.length ? { msgs: [{ text: a.join(" ") }] } : { msgs: [{ text: "Usage: *#echo <text>*\nExample: #echo hello" }], count: false }),
  no: () => ({ msgs: [{ text: pickOne(["No.", "Nope.", "Absolutely not.", "Ask again later. Still no."]) }] }),
  flip: () => ({ msgs: [{ text: `🪙 *${rand(0, 1) ? "Heads" : "Tails"}*`, buttons: [{ label: "Flip again", cmd: "#flip" }] }] }),
  menu: () => ({ msgs: [{ text: "*Lucif Menu*\n#ping\n#echo <text>\n#no\n#flip\n#menu\n_The full bot has many more, including games and an economy._", buttons: [{ label: "#ping", cmd: "#ping" }, { label: "#echo hello", cmd: "#echo hello" }, { label: "#flip", cmd: "#flip" }] }] }),
};
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
startDemo();

/* ---------- motion: gentle mask tilt on fine pointers only, pipeline lights up on scroll ---------- */
if (!calm && matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const mk = $("#mask"), bg = $(".hero-bg"); let raf = 0, ev;
  addEventListener("pointermove", (e) => { ev = e; raf ||= requestAnimationFrame(() => { raf = 0; const w = innerWidth, h = innerHeight;
    mk.style.setProperty("--ry", ((ev.clientX / w - 0.5) * 14).toFixed(1) + "deg"); mk.style.setProperty("--rx", ((0.5 - ev.clientY / h) * 10).toFixed(1) + "deg");
    bg.style.setProperty("--mx", (ev.clientX / w * 100).toFixed(0) + "%"); bg.style.setProperty("--my", (ev.clientY / h * 100).toFixed(0) + "%"); }); }, { passive: true });
}
new IntersectionObserver((es, o) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("go"); o.unobserve(en.target); } }), { threshold: 0.25 }).observe($("#pipe"));
