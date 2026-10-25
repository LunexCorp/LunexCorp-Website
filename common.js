/* LunexCorp site: shared configuration and helpers. Edit SITE_CONFIG only; every page reads from it. */
const SITE_CONFIG = {
  githubOwner: "LunexCorp",
  flagshipRepo: "Lucif",
  /* Supplied bot number: 063 154 5556 (South Africa). Not yet confirmed as the live Lucif account. */
  bot: { display: "063 154 5556", international: "+27 63 154 5556", digits: "27631545556" },
  channelUrl: "https://whatsapp.com/channel/0029Vaoqu5Z7YScx7tMKPb2s",
};
const DEMO_LIMIT = 5;
const waLink = (text = "") => `https://wa.me/${SITE_CONFIG.bot.digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
const GITHUB_URL = `https://github.com/${encodeURIComponent(SITE_CONFIG.githubOwner)}`;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmt = (s) => esc(s).replace(/```([\s\S]+?)```/g, "<code>$1</code>").replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/_([^_\n]+)_/g, "<i>$1</i>").replace(/\n/g, "<br>");
const num = (n) => { for (const [v, s] of [[1e6, "M"], [1e3, "K"]]) if (Math.abs(n) >= v) return (n / v).toFixed(1).replace(/\.0$/, "") + s; return String(n); };
const ago = (d) => { const s = (Date.now() - new Date(d)) / 1e3, u = [[31536e3, "y"], [2592e3, "mo"], [86400, "d"], [3600, "h"], [60, "m"]]; for (const [v, l] of u) if (s >= v) return Math.floor(s / v) + l + " ago"; return "just now"; };
const day = (d) => (d ? new Date(d).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" }) : "Date unavailable");
const kb = (k) => (k >= 1024 ? (k / 1024).toFixed(1) + " MB" : k + " KB");
const bytes = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");

/* ---------- GitHub API with a small session cache (saves the 60 requests/hour anonymous limit) ---------- */
const API = "https://api.github.com", CACHE_MS = 10 * 60 * 1000;
class GHError extends Error { constructor(kind, reset) { super(kind); this.kind = kind; this.reset = reset; } }
async function gh(path, { accept = "application/vnd.github+json", text = false, ttl = CACHE_MS } = {}) {
  const key = `gh:${accept}:${path}`;
  try { const c = JSON.parse(sessionStorage.getItem(key) || "null"); if (c && Date.now() - c.t < ttl) return c.v; } catch {}
  let r;
  try { r = await fetch(API + path, { headers: { Accept: accept } }); } catch { throw new GHError("network"); }
  if (r.status === 404) return null;
  if (r.status === 403 || r.status === 429) throw new GHError("rate", +r.headers.get("x-ratelimit-reset") || 0);
  if (!r.ok) throw new GHError("http");
  const v = text ? await r.text() : await r.json();
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch {}
  return v;
}
async function ghAll(path, opts) {
  const out = [], sep = path.includes("?") ? "&" : "?";
  for (let p = 1; p < 30; p++) { const pg = await gh(`${path}${sep}per_page=100&page=${p}`, opts); if (!pg) break; out.push(...pg); if (pg.length < 100) break; }
  return out;
}
const ghProblem = (e) => e.kind === "rate"
  ? `GitHub is limiting requests from this network${e.reset ? ` until about ${new Date(e.reset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : " for a while"}.`
  : e.kind === "network" ? "Couldn't reach GitHub. Check your connection." : "GitHub returned an error.";

/* ---------- sanitising remote HTML (READMEs, release notes): allow-list of tags and attributes ---------- */
const OK_TAGS = new Set("a abbr b blockquote br code dd del details div dl dt em h1 h2 h3 h4 h5 h6 hr i img kbd li ol p picture pre q s samp small span strong sub summary sup table tbody td tfoot th thead tr u ul".split(" "));
const DROP_TAGS = new Set("script style iframe object embed form input button textarea select link meta base svg math template noscript video audio source canvas".split(" "));
function safeUrl(u, base) {
  if (!u) return null; u = u.trim();
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith("//") || u.startsWith("#")) return null;
  return base ? base + u.replace(/^\.?\//, "") : null;
}
function cleanHTML(html, base = {}) {
  const d = new DOMParser().parseFromString(html, "text/html");
  const walk = (node) => {
    for (const n of [...node.children]) {
      const t = n.tagName.toLowerCase();
      if (DROP_TAGS.has(t) || n.matches("a.anchor")) { n.remove(); continue; }
      walk(n);
      if (!OK_TAGS.has(t)) { n.replaceWith(...n.childNodes); continue; }
      for (const a of [...n.attributes]) if (!(["href", "src", "alt", "title", "colspan", "rowspan", "align", "open"].includes(a.name))) n.removeAttribute(a.name);
      if (t === "a") {
        const u = safeUrl(n.getAttribute("href"), base.blob);
        if (u) { n.setAttribute("href", u); n.target = "_blank"; n.rel = "noopener noreferrer"; } else n.removeAttribute("href");
      }
      if (t === "img") {
        const u = safeUrl(n.getAttribute("src"), base.raw);
        if (u && /^https?:/i.test(u)) { n.setAttribute("src", u); n.loading = "lazy"; n.decoding = "async"; n.referrerPolicy = "no-referrer"; } else { n.remove(); }
      }
    }
  };
  walk(d.body);
  return d.body.innerHTML;
}

/* ---------- shared page behaviour: central links, mobile menu, footer year ---------- */
$$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener noreferrer"; });
$$("[data-channel]").forEach((a) => { a.href = SITE_CONFIG.channelUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; });
$$("[data-gh]").forEach((a) => { a.href = GITHUB_URL; a.target = "_blank"; a.rel = "noopener noreferrer"; });
$$("[data-botnum]").forEach((n) => (n.textContent = SITE_CONFIG.bot.display));
$$("[data-year]").forEach((n) => (n.textContent = new Date().getFullYear()));

(() => {
  const hdr = $(".hdr"), btn = $(".nav-toggle"); if (!hdr || !btn) return;
  const set = (open, back) => { hdr.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); btn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); if (!open && back) btn.focus(); };
  btn.addEventListener("click", () => set(!hdr.classList.contains("open")));
  addEventListener("keydown", (e) => e.key === "Escape" && hdr.classList.contains("open") && set(false, true));
  document.addEventListener("click", (e) => { if (hdr.classList.contains("open") && (e.target.closest("#nav a") || !e.target.closest(".hdr"))) set(false); });
  matchMedia("(min-width: 56em)").addEventListener("change", (m) => m.matches && set(false));
})();
