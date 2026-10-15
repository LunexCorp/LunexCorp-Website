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


const yr=$("#year");if(yr)yr.textContent=new Date().getFullYear();
