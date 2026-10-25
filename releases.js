/* Release archive: live GitHub releases for every public LunexCorp repo, with a labelled snapshot fallback (data/releases.json). */
const PAGE = 15, OWN = encodeURIComponent(SITE_CONFIG.githubOwner);
let all = [], shown = PAGE, snapshotAt = null;
const list = $("#list"), more = $("#more"), q = $("#rq"), kind = $("#rkind"), repoSel = $("#rrepo"), sortSel = $("#rsort");

/* One normal shape for live API data and for the snapshot. */
const norm = (repo, x) => ({
  repo, tag: x.tag_name || "", name: x.name || x.tag_name || "Untitled release", url: x.html_url, date: x.published_at || x.created_at || null,
  pre: !!x.prerelease, html: x.body_html || "",
  assets: (x.assets || []).map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url, downloads: a.download_count })),
});
const plain = (h) => { const d = document.createElement("div"); d.innerHTML = cleanHTML(h); return d.textContent.replace(/\s+/g, " ").trim(); };
const rid = (r) => `${r.repo}-${r.tag}`.replace(/[^\w-]+/g, "_");

async function fetchLive() {
  const repos = (await ghAll(`/users/${OWN}/repos?type=owner`)).filter((r) => !r.private);
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < repos.length) {
      const r = repos[i++];
      const rel = await ghAll(`/repos/${OWN}/${encodeURIComponent(r.name)}/releases`, { accept: "application/vnd.github.html+json" });
      rel.filter((x) => !x.draft).forEach((x) => out.push(norm(r.name, x)));
    }
  }));
  return { out, repos: repos.map((r) => r.name) };
}
async function fetchSnapshot() {
  const r = await fetch("data/releases.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("no snapshot");
  const j = await r.json(); snapshotAt = j.generatedAt;
  return { out: j.releases.map((x) => ({ ...x, html: x.html || "", assets: x.assets || [] })), repos: j.repos || [] };
}

async function init() {
  let data, live = true, why = "";
  try { data = await fetchLive(); } catch (e) {
    live = false; why = ghProblem(e);
    try { data = await fetchSnapshot(); } catch { data = null; }
  }
  list.setAttribute("aria-busy", "false");
  if (!data) {
    $("#source").textContent = ""; list.innerHTML = `<li class="state err" role="alert"><h3>Releases can't be loaded right now</h3><p>${esc(why)} No saved copy was available either.</p><div class="row"><button class="btn btn-g" type="button" id="retry">Try again</button><a class="btn btn-line" data-gh href="#">Open GitHub</a></div></li>`;
    $("#retry").onclick = () => location.reload(); $$("[data-gh]", list).forEach((a) => { a.href = GITHUB_URL; a.target = "_blank"; a.rel = "noopener noreferrer"; }); return;
  }
  all = data.out.map((r) => ({ ...r, ts: r.date ? Date.parse(r.date) : 0, text: (r.name + " " + r.tag + " " + r.repo + " " + plain(r.html)).toLowerCase() }));
  $("#source").innerHTML = live
    ? `Live from GitHub. ${all.length} release${all.length === 1 ? "" : "s"} across ${new Set(all.map((r) => r.repo)).size} public project${new Set(all.map((r) => r.repo)).size === 1 ? "" : "s"}.`
    : `<strong>Saved copy, not live.</strong> ${esc(why)} Showing releases saved on ${esc(day(snapshotAt))}; newer ones may exist on GitHub.`;
  if (all.some((r) => r.repo.toLowerCase() === SITE_CONFIG.flagshipRepo.toLowerCase())) $("#lucif-note").hidden = true;
  [...new Set(all.map((r) => r.repo))].sort((a, b) => a.localeCompare(b)).forEach((n) => repoSel.add(new Option(n, n)));
  const p = new URLSearchParams(location.search);
  if (p.get("q")) q.value = p.get("q"); if (p.get("repo") && [...repoSel.options].some((o) => o.value === p.get("repo"))) repoSel.value = p.get("repo");
  if (["stable", "pre"].includes(p.get("type"))) kind.value = p.get("type");
  render(); const h = decodeURIComponent(location.hash.slice(1)); if (h) { const el = document.getElementById("r-" + h); if (el) { openRel(el, true); el.scrollIntoView(); } }
}

function view() {
  const t = q.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const l = all.filter((r) => (kind.value === "all" || (kind.value === "pre") === r.pre) && (repoSel.value === "all" || r.repo === repoSel.value) && t.every((w) => r.text.includes(w)));
  l.sort((a, b) => (sortSel.value === "new" ? b.ts - a.ts : a.ts - b.ts)); return l;
}
const badge = (r) => (r.pre ? '<span class="tag pre">⚠ Pre-release</span>' : '<span class="tag stable">✓ Stable</span>');
function card(r, i, big) {
  const id = "r-" + rid(r), notes = r.html ? cleanHTML(r.html) : "";
  return `<li class="rel${big ? " big" : ""}" id="${id}"><div class="rel-meta"><time datetime="${esc(r.date || "")}">${esc(day(r.date))}</time><a class="proj" href="releases.html?repo=${encodeURIComponent(r.repo)}">${esc(r.repo)}</a></div>
  <div class="rel-main"><div class="rel-title"><h3>${esc(r.name)}</h3>${badge(r)}${big ? '<span class="tag latest">Latest</span>' : ""}</div>
  <p class="tagline"><code>${esc(r.tag)}</code></p>
  ${notes ? `<div class="notes${big ? " peek" : ""}" id="${id}-n" ${big ? "" : "hidden"}>${notes}</div><button class="linkbtn tog" type="button" aria-expanded="${big ? "false" : "false"}" aria-controls="${id}-n" data-tog>${big ? "Read full notes" : "Show release notes"}</button>` : '<p class="msg">This release has no written notes.</p>'}
  <div class="rel-act"><a class="btn btn-line sm" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">View on GitHub</a></div>
  ${r.assets.length ? `<ul class="assets" aria-label="Downloads for ${esc(r.name)}">${r.assets.map((a) => `<li><a href="${esc(a.url)}" rel="noopener noreferrer"><span>${esc(a.name)}</span><small>${bytes(a.size)}${a.downloads != null ? ` · ${num(a.downloads)} downloads` : ""}</small></a></li>`).join("")}</ul>` : '<p class="msg small">No downloadable files are attached to this release.</p>'}
  </div></li>`;
}
function render() {
  const l = view(), latest = all.filter((r) => !r.pre).sort((a, b) => b.ts - a.ts)[0];
  $("#latest").innerHTML = latest ? `<h2 class="sr-only">Latest stable release</h2><ol class="timeline featured">${card(latest, 0, true)}</ol>` : "";
  const part = l.slice(0, shown);
  list.innerHTML = part.length ? part.map((r, i) => card(r, i)).join("") : `<li class="state"><h3>No releases match</h3><p>Try fewer words, or reset the filters.</p><button class="btn btn-line" type="button" id="reset">Reset filters</button></li>`;
  $("#rcount").textContent = `Showing ${part.length} of ${l.length} release${l.length === 1 ? "" : "s"}${l.length !== all.length ? ` (${all.length} in total)` : ""}`;
  more.hidden = l.length <= shown; if (!more.hidden) more.textContent = `Show ${Math.min(PAGE, l.length - shown)} more`;
  const p = new URLSearchParams(); if (q.value.trim()) p.set("q", q.value.trim()); if (repoSel.value !== "all") p.set("repo", repoSel.value); if (kind.value !== "all") p.set("type", kind.value);
  history.replaceState(null, "", location.pathname + (String(p) ? "?" + p : "") + location.hash);
}
function openRel(li, open) { const b = $("[data-tog]", li), n = $(".notes", li); if (!b || !n) return; const o = open ?? b.getAttribute("aria-expanded") !== "true"; b.setAttribute("aria-expanded", o); n.hidden = false; n.classList.toggle("peek", !o); if (!n.closest(".big")) n.hidden = !o; b.textContent = o ? "Hide release notes" : n.closest(".big") ? "Read full notes" : "Show release notes"; }
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-tog]"); if (t) return openRel(t.closest(".rel"));
  if (e.target.id === "reset") { q.value = ""; kind.value = repoSel.value = "all"; shown = PAGE; render(); }
});
more.addEventListener("click", () => { shown += PAGE; const n = list.children.length; render(); list.children[n]?.querySelector("h3")?.setAttribute("tabindex", "-1"); list.children[n]?.querySelector("h3")?.focus(); });
$("#ctl").addEventListener("submit", (e) => e.preventDefault());
let tm; q.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { shown = PAGE; render(); }, 120); });
[kind, repoSel, sortSel].forEach((s) => s.addEventListener("change", () => { shown = PAGE; render(); }));
init();
