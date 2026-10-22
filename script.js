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
