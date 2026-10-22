/* LunexCorp site configuration and global helper utilities */
const SITE_CONFIG = { 
  githubOwner: "LunexCorp", 
  botNumber: "27631545556", 
  formattedPhone: "+27 63 154 5556"
};
const DEMO_LIMIT = 5;

const waLink = (text = "#menu") => `https://wa.me/${SITE_CONFIG.botNumber}?text=${encodeURIComponent(text)}`;
const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const esc = (str) => String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const fmt = (str) => esc(str)
  .replace(/```([\s\S]+?)```/g, "<pre><code>$1</code></pre>")
  .replace(/\*([^*
]+)\*/g, "<b>$1</b>")
  .replace(/_([^_
]+)_/g, "<i>$1</i>")
  .replace(/~([^~
]+)~/g, "<del>$1</del>")
  .replace(/
/g, "<br>");

const num = (n) => {
  for (const [val, suffix] of [[1e6, "M"], [1e3, "K"]]) {
    if (Math.abs(n) >= val) return (n / val).toFixed(1).replace(/\.0$/, "") + suffix;
  }
  return String(n);
};

const ago = (dateStr) => {
  const seconds = (Date.now() - new Date(dateStr)) / 1000;
  const units = [[31536000, "y"], [2592000, "mo"], [86400, "d"], [3600, "h"], [60, "m"]];
  for (const [val, label] of units) {
    if (seconds >= val) return Math.floor(seconds / val) + label + " ago";
  }
  return "just now";
};

const day = (dateStr) => new Date(dateStr).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
const kb = (kbytes) => (kbytes >= 1024 ? (kbytes / 1024).toFixed(1) + " MB" : kbytes + " KB");

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  
  $$("[data-wa]").forEach((el) => {
    el.href = waLink(el.dataset.waText || "#menu");
    el.target = "_blank";
    el.rel = "noopener noreferrer";
  });
});
