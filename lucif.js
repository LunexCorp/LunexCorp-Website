/* Lucif Interactive WhatsApp Chat Simulator */
const msgsEl = $("#msgs");
const form = $("#form");
const input = $("#input");
const statusEl = $("#status");
const pips = $$(".pips-bar i");
const chips = $$("#chips button");

let state = {
  count: 0,
  locked: false,
  busy: false
};

const freshState = () => ({ count: 0, locked: false, busy: false });

const scrollToBottom = () => {
  if (msgsEl) msgsEl.scrollTo({ top: msgsEl.scrollHeight, behavior: calm ? "auto" : "smooth" });
};

const addPill = (text, extraClass = "") => {
  if (!msgsEl) return;
  const p = document.createElement("div");
  p.className = "chat-pill " + extraClass;
  p.textContent = text;
  msgsEl.appendChild(p);
};

const createBubble = (side, htmlContent) => {
  if (!msgsEl) return;
  const bubble = document.createElement("div");
  bubble.className = `msg-bubble ${side}`;
  bubble.innerHTML = htmlContent;
  msgsEl.appendChild(bubble);
  scrollToBottom();
  return bubble;
};

const addUserMessage = (text) => {
  return createBubble("out", `${esc(text)}<span class="msg-meta">${nowTime()} <span class="ticks">✓✓</span></span>`);
};

function addBotMessage(m) {
  let html = fmt(m.text || "");
  if (m.buttons) {
    html += `<div class="msg-buttons">${m.buttons.map((b) => `<button type="button" data-cmd="${esc(b.cmd)}">${esc(b.label)}</button>`).join("")}</div>`;
  }
  if (m.cta) {
    html += `
      <div class="msg-buttons">
        <a href="${waLink('#menu')}" target="_blank" rel="noopener" class="btn-chat-cta">Chat on WhatsApp (063 154 5556)</a>
        <button type="button" data-reset>Restart Demo</button>
      </div>
    `;
  }
  html += `<span class="msg-meta">${nowTime()}</span>`;
  createBubble("in", html);
}

async function simulateBotReply(messageList) {
  for (const msg of [].concat(messageList)) {
    const typing = document.createElement("div");
    typing.className = "msg-bubble in typing-indicator";
    typing.innerHTML = "<span></span><span></span><span></span>";
    msgsEl.appendChild(typing);

    if (statusEl) {
      statusEl.textContent = "typing...";
      statusEl.classList.add("active");
    }
    scrollToBottom();

    await sleep(calm ? 100 : rand(600, 1000));

    typing.remove();
    if (statusEl) {
      statusEl.textContent = "online";
      statusEl.classList.remove("active");
    }
    addBotMessage(msg);
  }
}

const commands = {
  ping: () => ({ text: `🏓 *Pong!*
Response Latency: *${rand(14, 48)} ms*
Server Region: *Upington, ZA*` }),
  echo: (args) => (args.length ? { text: args.join(" ") } : { text: "Usage: *#echo <your message>*
Example: #echo Hello world" }),
  no: () => ({ text: ["No.", "Absolutely not.", "Denied.", "Ask again later!"][rand(0, 3)] }),
  flip: () => ({
    text: `🪙 Coin Toss: *${rand(0, 1) ? "HEADS" : "TAILS"}*`,
    buttons: [{ label: "Flip Again", cmd: "#flip" }]
  }),
  menu: () => ({
    text: "*Lucif Bot Menu*

• *#ping* - Check bot connection
• *#echo <text>* - Repeat input text
• *#flip* - Coin toss
• *#no* - Instant decision

_Full bot features card games, balance commands, and moderation inside WhatsApp._",
    buttons: [{ label: "#ping", cmd: "#ping" }, { label: "#flip", cmd: "#flip" }]
  })
};

function updatePips() {
  pips.forEach((pip, idx) => pip.classList.toggle("active", idx < state.count));
  const counterEl = $("#counter");
  if (counterEl) {
    const remaining = DEMO_LIMIT - state.count;
    counterEl.textContent = remaining > 0 ? `${remaining} free commands remaining` : "Demo limit reached";
  }
}

function setLock(locked) {
  state.locked = locked;
  if (input) {
    input.disabled = locked;
    input.placeholder = locked ? "Demo finished — Click WhatsApp button" : "Type a command like #menu...";
  }
  const sendBtn = $("#send");
  if (sendBtn) sendBtn.disabled = locked;
  chips.forEach((c) => (c.disabled = locked));
}

async function handleCommandSubmit(rawText) {
  const text = (rawText || "").trim();
  if (!text || state.busy || state.locked) return;

  state.busy = true;
  if (input) input.value = "";
  
  addUserMessage(text);
  await sleep(calm ? 0 : 300);

  const [cmdName, ...args] = text.startsWith("#") ? text.slice(1).split(/\s+/) : [""];
  const name = cmdName.toLowerCase();

  if (!text.startsWith("#")) {
    await simulateBotReply({ text: "Commands start with *#*. Try *#ping* or *#menu*." });
  } else if (!commands[name]) {
    await simulateBotReply({
      text: `Unknown command *#${name}*. Send *#menu* to see available commands.`,
      buttons: [{ label: "#menu", cmd: "#menu" }]
    });
  } else {
    const res = commands[name](args);
    await simulateBotReply(res);
    state.count++;
    updatePips();

    if (state.count >= DEMO_LIMIT) {
      await sleep(500);
      await simulateBotReply({
        cta: true,
        text: ` You have reached the demo command limit (${DEMO_LIMIT}/${DEMO_LIMIT}).

To play multiplayer card games, manage economy coins, and moderate group chats, add Lucif on WhatsApp!`
      });
      setLock(true);
    }
  }

  state.busy = false;
}

function startDemo() {
  state = freshState();
  if (!msgsEl) return;
  msgsEl.innerHTML = "";
  updatePips();
  setLock(false);

  addPill("Today");
  addPill("🔒 Messages are end-to-end encrypted. Demo mode running.", "enc");

  state.busy = true;
  simulateBotReply({
    text: `Hello! I am *Lucif* ⚡

I am connected to WhatsApp on *+27 63 154 5556*.
You get ${DEMO_LIMIT} test commands in this browser simulator. Try sending *#ping* or *#menu*.`,
    buttons: [{ label: "#ping", cmd: "#ping" }, { label: "#menu", cmd: "#menu" }]
  }).then(() => (state.busy = false));
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  handleCommandSubmit(input?.value);
});

document.addEventListener("click", (e) => {
  const cmdBtn = e.target.closest("[data-cmd]");
  if (cmdBtn && !cmdBtn.disabled) return handleCommandSubmit(cmdBtn.dataset.cmd);

  const runBtn = e.target.closest("[data-run]");
  if (runBtn) {
    $("#demo")?.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
    if (!state.locked) setTimeout(() => handleCommandSubmit(runBtn.dataset.run), 400);
    return;
  }

  if (e.target.closest("[data-reset]")) return startDemo();
});

const updateSendIcon = () => {
  const ico = $("#ico");
  if (!ico) return;
  const hasVal = Boolean(input?.value.trim());
  ico.innerHTML = hasVal
    ? '<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>'
    : '<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>';
};

input?.addEventListener("input", updateSendIcon);
updateSendIcon();
startDemo();
