/* LunexCorp home: live GitHub project directory and the on-site project sheet. */
const OWNER = encodeURIComponent(SITE_CONFIG.githubOwner);
const LC = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Kotlin: "#A97BFF", Pascal: "#e3f171", Delphi: "#e3f171", HTML: "#e34c26", CSS: "#a07bd8", Java: "#b07219", Shell: "#89e051", "C#": "#178600", Lua: "#000080" };
const lc = (l) => LC[l] || "#b58c73";
const isLead = (r) => r.name.toLowerCase() === SITE_CONFIG.flagshipRepo.toLowerCase();
const GH_ICON = '<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0a8 8 0 0 0-2.5 15.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.500 7.500 0 0 1 4 0c1.500-1 2.200-.8 2.200-.8.4 1.100.2 1.900.1 2.100.5.600.8 1.300.8 2.100 0 3.100-1.900 3.700-3.600 3.900.3.300.5.800.5 1.500v2.200c0 .2.100.5.600.4A8 8 0 0 0 8 0z"/></svg>';
let repos = [], ready;

async function loadRepos() {
  const box = $("#repos"), stats = $("#stats");
  box.setAttribute("aria-busy", "true");
  try {
    repos = (await ghAll(`/users/${OWNER}/repos?type=owner&sort=updated`)).filter((r) => !r.private);
    box.setAttribute("aria-busy", "false");
    if (!repos.length) { box.innerHTML = `<div class="state"><h3>No public projects yet</h3><p>Check back soon, or visit <a href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">github.com/${esc(SITE_CONFIG.githubOwner)}</a>.</p></div>`; return; }
    drawStats(); drawRepos();
  } catch (e) {
    box.setAttribute("aria-busy", "false"); stats.innerHTML = "";
    box.innerHTML = `<div class="state err" role="alert"><h3>The project list isn't available right now</h3><p>${esc(ghProblem(e))} The rest of the site still works.</p><div class="row"><button class="btn btn-ink" type="button" data-retry>Try again</button><a class="btn btn-clay" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">Open ${esc(SITE_CONFIG.githubOwner)} on GitHub</a></div></div>`;
  }
}

function drawStats() {
  const st = repos.reduce((a, r) => ({ s: a.s + r.stargazers_count, f: a.f + r.forks_count }), { s: 0, f: 0 });
  const langs = new Set(repos.map((r) => r.language).filter(Boolean)).size, push = repos.reduce((a, r) => (r.pushed_at > a ? r.pushed_at : a), "");
  $("#stats").innerHTML = [[repos.length, "public repositories"], [st.s, "stars"], [st.f, "forks"], [langs, "languages"]].map(([n, l]) => `<div><b data-n="${n}">${n}</b><span>${l}</span></div>`).join("") + `<div><b>${ago(push)}</b><span>last push</span></div>`;
  if (calm) return;
  $$("[data-n]").forEach((b) => { const n = +b.dataset.n, t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 800); b.textContent = Math.round(n * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); })(t0); });
}

function drawRepos() {
  const q = $("#q").value.trim().toLowerCase(), s = $("#sort").value;
  const list = repos.filter((r) => (r.name + " " + (r.description || "") + " " + (r.language || "") + " " + (r.topics || []).join(" ")).toLowerCase().includes(q));
  list.sort((a, b) => (isLead(b) - isLead(a)) || (s === "stars" ? b.stargazers_count - a.stargazers_count : s === "name" ? a.name.localeCompare(b.name) : new Date(b.pushed_at) - new Date(a.pushed_at)));
  $("#count").textContent = q ? `${list.length} of ${repos.length} projects match` : `${repos.length} public projects`;
  $("#repos").innerHTML = list.length ? list.map((r, i) => {
    const body = `<h3>${esc(r.name)}</h3><p>${esc(r.description || "No description yet.")}</p>
      ${(r.topics || []).length ? `<div class="meta2">${r.topics.slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>` : ""}
      <div class="meta2">${r.language ? `<span><i class="dot" style="background:${lc(r.language)}"></i>${esc(r.language)}</span>` : ""}<span><span aria-hidden="true">★</span> ${r.stargazers_count}<span class="sr-only"> stars</span></span><span><span aria-hidden="true">⑂</span> ${r.forks_count}<span class="sr-only"> forks</span></span>${r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? `<span>${esc(r.license.spdx_id)}</span>` : ""}<span>Updated ${ago(r.pushed_at)}</span></div>`;
    return `<a class="repo${isLead(r) ? " lead" : ""}" href="#/repo/${encodeURIComponent(r.name)}" style="--i:${Math.min(i, 12)}">${isLead(r) ? `<img src="assets/lucif-avatar.webp" alt="" width="96" height="96"><div class="lead-body">${body}</div>` : body}</a>`;
  }).join("") : `<div class="state"><h3>No projects match “${esc(q)}”</h3><p>Try a different word, or clear the search.</p><button class="btn btn-clay" type="button" data-clear>Clear search</button></div>`;
}

$("#q").addEventListener("input", drawRepos); $("#sort").addEventListener("change", drawRepos);
$("#repos").addEventListener("click", (e) => {
  if (e.target.closest("[data-retry]")) { $("#repos").innerHTML = '<div class="sk"></div><div class="sk"></div><div class="sk"></div>'; try { Object.keys(sessionStorage).filter((k) => k.startsWith("gh:")).forEach((k) => sessionStorage.removeItem(k)); } catch {} return loadRepos(); }
  if (e.target.closest("[data-clear]")) { $("#q").value = ""; drawRepos(); $("#q").focus(); return; }
  const c = e.target.closest(".repo"); if (c) setOrigin(e.clientX, e.clientY, c);
});
$("#repos").addEventListener("pointermove", (e) => { const c = e.target.closest(".repo"); if (c) { const b = c.getBoundingClientRect(); c.style.setProperty("--x", e.clientX - b.left + "px"); c.style.setProperty("--y", e.clientY - b.top + "px"); } });
function setOrigin(x, y, el) { const s = $("#sheet"), b = el.getBoundingClientRect(); s.style.setProperty("--x", (x || b.left + b.width / 2) + "px"); s.style.setProperty("--y", (y || b.top + b.height / 2) + "px"); }

/* ---------- project sheet (a real modal dialog) ---------- */
const sheet = $("#sheet"), BG = ["#main", ".hdr", ".site-foot"].map((s) => $(s)).filter(Boolean);
let lastFocus = null;
const focusables = () => $$('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])', sheet).filter((n) => n.offsetParent !== null);

async function openRepo(name) {
  await ready;
  const r = repos.find((x) => x.name.toLowerCase() === name.toLowerCase()); if (!r) return closeSheet(true);
  const o = r.owner.login, br = r.default_branch, g = (t) => $("#" + t, sheet);
  if (!sheet.classList.contains("open")) lastFocus = document.activeElement;
  const lic = r.license?.spdx_id && r.license.spdx_id !== "NOASSERTION" ? r.license.spdx_id : "None";
  sheet.innerHTML = `<div class="sbar"><button class="btn btn-clay" type="button" data-close>← All projects</button><a class="btn btn-ink" href="${esc(r.html_url)}" target="_blank" rel="noopener noreferrer">${GH_ICON} View on GitHub</a></div>
  <div class="sin"><div class="badges"><span class="tag">Public</span>${r.fork ? '<span class="tag">Fork</span>' : ""}${r.archived ? '<span class="tag">Archived</span>' : ""}${r.language ? `<span class="tag"><i class="dot" style="background:${lc(r.language)}"></i>${esc(r.language)}</span>` : ""}${(r.topics || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
  <h1 id="sheet-title">${esc(r.name)}</h1><p class="d">${esc(r.description || "No description yet.")}</p>
  <div class="row">${r.homepage ? `<a class="btn btn-clay" href="${esc(/^https?:/i.test(r.homepage) ? r.homepage : "https://" + r.homepage)}" target="_blank" rel="noopener noreferrer">Visit homepage</a>` : ""}<button class="btn btn-clay" type="button" data-copy="git clone ${esc(r.clone_url)}">Copy clone command</button><a class="btn btn-clay" href="${esc(r.html_url)}/archive/refs/heads/${encodeURIComponent(br)}.zip" rel="noopener noreferrer">Download ZIP</a></div>
  <div class="grid">${[[r.stargazers_count, "Stars"], [r.forks_count, "Forks"], [r.subscribers_count ?? r.watchers_count, "Watching"], [r.open_issues_count, "Open issues"], [kb(r.size), "Size"], [lic, "License"], [br, "Default branch"], [day(r.created_at), "Created"], [ago(r.pushed_at), "Last push"]].map(([v, l]) => `<div><b>${esc(v)}</b><span>${l}</span></div>`).join("")}</div>
  <div id="lg"></div>
  <div class="cols"><section aria-labelledby="h-rd"><h2 id="h-rd">README</h2><div class="readme" id="rd" role="status"><p class="msg">Loading README…</p></div></section>
  <div class="side"><section><h2>Latest release</h2><div id="rel" role="status"><p class="msg">Loading…</p></div></section><section><h2>Recent commits</h2><div id="cm" role="status"><p class="msg">Loading…</p></div></section><section><h2>Files</h2><div id="fl" role="status"><p class="msg">Loading…</p></div></section></div></div></div>`;
  sheet.setAttribute("aria-labelledby", "sheet-title"); sheet.removeAttribute("aria-label");
  document.documentElement.classList.add("lock"); BG.forEach((n) => n.setAttribute("inert", ""));
  sheet.scrollTo(0, 0); sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false"); $("[data-close]", sheet).focus({ preventScroll: true });

  const p = `/repos/${encodeURIComponent(o)}/${encodeURIComponent(r.name)}`, miss = (id, m) => (g(id).innerHTML = `<p class="msg">${m}</p>`), lim = (e) => esc(ghProblem(e));
  gh(p + "/languages").then((l) => { const t = Object.values(l || {}).reduce((a, b) => a + b, 0); if (!t) return (g("lg").innerHTML = ""); const e = Object.entries(l); g("lg").innerHTML = `<div class="lbar" aria-hidden="true">${e.map(([k, v]) => `<i style="width:${(v / t) * 100}%;background:${lc(k)}"></i>`).join("")}</div><div class="leg">${e.map(([k, v]) => `<span><i class="dot" style="background:${lc(k)}"></i>${esc(k)} ${((v / t) * 100).toFixed(1)}%</span>`).join("")}</div>`; }).catch(() => (g("lg").innerHTML = ""));
  gh(p + "/readme", { accept: "application/vnd.github.html+json", text: true }).then((h) => (g("rd").innerHTML = h ? cleanHTML(h, { raw: `https://raw.githubusercontent.com/${o}/${r.name}/${br}/`, blob: `https://github.com/${o}/${r.name}/blob/${br}/` }) : '<p class="msg">This project has no README yet.</p>')).catch((e) => miss("rd", lim(e)));
  gh(p + "/releases/latest").then((x) => (g("rel").innerHTML = (x ? `<a class="li" href="${esc(x.html_url)}" target="_blank" rel="noopener noreferrer"><span>${esc(x.name || x.tag_name)}</span><span>${day(x.published_at)}</span></a>` : '<p class="msg">No releases yet.</p>') + (x ? `<a class="li" href="releases.html?repo=${encodeURIComponent(r.name)}"><span>All releases of this project</span><span aria-hidden="true">→</span></a>` : ""))).catch((e) => miss("rel", lim(e)));
  gh(p + "/commits?per_page=6").then((x) => (g("cm").innerHTML = (x || []).map((c) => `<a class="li" href="${esc(c.html_url)}" target="_blank" rel="noopener noreferrer"><span>${esc(c.commit.message.split("\n")[0].slice(0, 70))}</span><span>${ago(c.commit.author.date)}</span></a>`).join("") || '<p class="msg">No commits yet.</p>')).catch((e) => miss("cm", lim(e)));
  gh(p + "/contents").then((x) => (g("fl").innerHTML = (Array.isArray(x) ? x : []).sort((a, b) => (b.type === "dir") - (a.type === "dir") || a.name.localeCompare(b.name)).map((f) => `<a class="li" href="${esc(f.html_url)}" target="_blank" rel="noopener noreferrer"><span>${f.type === "dir" ? "📁" : "📄"} ${esc(f.name)}</span><span>${f.type === "dir" ? "" : bytes(f.size)}</span></a>`).join("") || '<p class="msg">Empty repository.</p>')).catch((e) => miss("fl", lim(e)));
}
function closeSheet(fromRoute) {
  const wasOpen = sheet.classList.contains("open");
  sheet.classList.remove("open"); sheet.setAttribute("aria-hidden", "true"); document.documentElement.classList.remove("lock"); BG.forEach((n) => n.removeAttribute("inert"));
  if (!fromRoute && /^#\/repo\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search + "#projects");
  if (wasOpen && lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
}
const route = () => { const m = location.hash.match(/^#\/repo\/(.+)$/); m ? openRepo(decodeURIComponent(m[1])) : closeSheet(true); };
addEventListener("hashchange", route);
sheet.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeSheet();
  const c = e.target.closest("[data-copy]");
  if (c) navigator.clipboard?.writeText(c.dataset.copy).then(() => { c.textContent = "Copied"; setTimeout(() => (c.textContent = "Copy clone command"), 1600); }, () => { c.textContent = "Copy failed"; });
});
addEventListener("keydown", (e) => {
  if (!sheet.classList.contains("open")) return;
  if (e.key === "Escape") { e.preventDefault(); closeSheet(); }
  if (e.key === "Tab") { const f = focusables(); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && (document.activeElement === a || !sheet.contains(document.activeElement))) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});
ready = loadRepos().then(route);
