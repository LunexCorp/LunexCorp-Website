/* LunexCorp GitHub Repository Sync & Interactive Sheet Modal */
const OWNER = encodeURIComponent(SITE_CONFIG.githubOwner);
const API = "https://api.github.com";

const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Kotlin: "#A97BFF", Pascal: "#e3f171", Delphi: "#e3f171", HTML: "#e34c26",
  CSS: "#563d7c", Java: "#b07219", Shell: "#89e051", "C#": "#178600",
  C: "#555555", "C++": "#f34b7d", Lua: "#000080"
};
const getLangColor = (lang) => LANG_COLORS[lang] || "#00f2fe";

let repos = [], readyPromise;

const fetchGH = async (path, accept = "application/vnd.github+json", isText = false) => {
  const res = await fetch(API + path, { headers: { Accept: accept } });
  if (res.status === 404) return null;
  if (res.status === 403 || res.status === 429) throw new Error("rate");
  if (!res.ok) throw new Error(res.status);
  return isText ? res.text() : res.json();
};

async function loadRepos() {
  const reposContainer = $("#repos");
  if (!reposContainer) return;

  const showMsg = (msg) => {
    reposContainer.innerHTML = `<p class="msg-box">${msg} <a href="https://github.com/${OWNER}" target="_blank" rel="noopener">Visit github.com/${esc(SITE_CONFIG.githubOwner)}</a></p>`;
  };

  try {
    for (let page = 1; ; page++) {
      const pageData = await fetchGH(`/users/${OWNER}/repos?type=owner&sort=updated&per_page=100&page=${page}`);
      if (!pageData || !Array.isArray(pageData)) break;
      repos.push(...pageData);
      if (pageData.length < 100) break;
    }
    if (!repos.length) return showMsg("No public projects discovered yet.");
    renderStats();
    renderRepos();
  } catch (err) {
    showMsg(err.message === "rate" ? "GitHub API rate limit reached. Please try again shortly." : "Unable to load repositories right now.");
  }
}

function renderStats() {
  const statsEl = $("#stats");
  if (!statsEl) return;

  const totals = repos.reduce((acc, r) => ({ stars: acc.stars + r.stargazers_count, forks: acc.forks + r.forks_count }), { stars: 0, forks: 0 });
  const languages = new Set(repos.map((r) => r.language).filter(Boolean)).size;
  const latestPush = repos.reduce((acc, r) => (r.pushed_at > acc ? r.pushed_at : acc), "");

  statsEl.innerHTML = [
    [repos.length, "Public Repositories"],
    [totals.stars, "Total Stars"],
    [totals.forks, "Total Forks"],
    [languages, "Languages Used"]
  ].map(([numVal, label]) => `
    <div class="stat-card">
      <b data-target="${numVal}">0</b>
      <span>${label}</span>
    </div>
  `).join("") + `
    <div class="stat-card">
      <b>${ago(latestPush)}</b>
      <span>Latest Commit</span>
    </div>
  `;

  $$("[data-target]").forEach((b) => {
    const target = +b.dataset.target;
    const start = performance.now();
    (function animate(t) {
      const progress = calm ? 1 : Math.min(1, (t - start) / 900);
      b.textContent = Math.round(target * progress);
      if (progress < 1) requestAnimationFrame(animate);
    })(start);
  });
}

function renderRepos() {
  const reposContainer = $("#repos");
  if (!reposContainer) return;

  const query = ($("#q")?.value || "").toLowerCase();
  const sortBy = $("#sort")?.value || "pushed";

  const isLead = (r) => /^lucif$/i.test(r.name);

  const filtered = repos.filter((r) => {
    const text = (r.name + " " + (r.description || "") + " " + (r.topics || []).join(" ")).toLowerCase();
    return text.includes(query);
  });

  filtered.sort((a, b) => {
    if (isLead(a) !== isLead(b)) return isLead(b) ? 1 : -1;
    if (sortBy === "stars") return b.stargazers_count - a.stargazers_count;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });

  if (!filtered.length) {
    reposContainer.innerHTML = `<p class="msg-box">No projects matching "${esc(query)}".</p>`;
    return;
  }

  reposContainer.innerHTML = filtered.map((r, i) => {
    const lead = isLead(r);
    return `
      <a class="repo-card ${lead ? 'lead-repo' : ''}" href="#/repo/${encodeURIComponent(r.name)}" style="--delay:${Math.min(i, 10) * 0.05}s">
        ${lead ? '<span class="lead-badge">Featured Bot Engine</span>' : ''}
        <h3>${esc(r.name)}</h3>
        <p>${esc(r.description || "No description provided.")}</p>
        
        ${(r.topics && r.topics.length) ? `
          <div class="repo-tags">
            ${r.topics.slice(0, 4).map((t) => `<span class="tag-chip">${esc(t)}</span>`).join("")}
          </div>
        ` : ''}

        <div class="repo-meta">
          ${r.language ? `<span><i class="lang-dot" style="background:${getLangColor(r.language)}"></i>${esc(r.language)}</span>` : ""}
          <span>★ ${r.stargazers_count}</span>
          <span>⑂ ${r.forks_count}</span>
          <span>Updated ${ago(r.pushed_at)}</span>
        </div>
      </a>
    `;
  }).join("");
}

$("#q")?.addEventListener("input", renderRepos);
$("#sort")?.addEventListener("change", renderRepos);

const sheet = $("#sheet");

function sanitizeHTML(rawHtml, owner, repo, branch) {
  const doc = new DOMParser().parseFromString(rawHtml, "text/html");
  doc.querySelectorAll("script,style,iframe,object,embed,form").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => /^on/i.test(attr.name) && node.removeAttribute(attr.name));
  });

  const resolveUrl = (url, baseUrl) => (/^(https?:|data:|mailto:)/i.test(url) ? url : url.startsWith("#") ? null : baseUrl + url.replace(/^\.?\//, ""));
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/`;
  const blobBase = `https://github.com/${owner}/${repo}/blob/${branch}/`;

  doc.querySelectorAll("img[src]").forEach((img) => {
    const u = resolveUrl(img.getAttribute("src"), rawBase);
    if (u) img.src = u;
  });
  doc.querySelectorAll("a[href]").forEach((a) => {
    const u = resolveUrl(a.getAttribute("href"), blobBase);
    if (u === null) a.removeAttribute("href");
    else { a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; }
  });

  return doc.body.innerHTML;
}

async function openRepoModal(name) {
  await readyPromise;
  const repo = repos.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (!repo || !sheet) return closeSheet(true);

  const owner = repo.owner.login;
  const branch = repo.default_branch;

  sheet.innerHTML = `
    <div class="sheet-topbar">
      <button class="btn btn-sm btn-glass" data-close>&larr; Back to Projects</button>
      <a class="btn btn-sm btn-primary" href="${esc(repo.html_url)}" target="_blank" rel="noopener">View on GitHub</a>
    </div>
    <div class="sheet-content">
      <div class="sheet-header">
        <h1>${esc(repo.name)}</h1>
        <p class="sheet-desc">${esc(repo.description || "No description provided.")}</p>
        <div class="repo-tags">
          <span class="tag-chip">${repo.private ? "Private" : "Public"}</span>
          ${repo.language ? `<span class="tag-chip"><i class="lang-dot" style="background:${getLangColor(repo.language)}"></i>${esc(repo.language)}</span>` : ""}
          ${(repo.topics || []).map((t) => `<span class="tag-chip">${esc(t)}</span>`).join("")}
        </div>
      </div>

      <div class="sheet-stats-grid">
        <div><b>${repo.stargazers_count}</b><span>Stars</span></div>
        <div><b>${repo.forks_count}</b><span>Forks</span></div>
        <div><b>${kb(repo.size)}</b><span>Codebase Size</span></div>
        <div><b>${ago(repo.pushed_at)}</b><span>Last Updated</span></div>
      </div>

      <div class="sheet-sections">
        <section class="sheet-main">
          <h2>README.md</h2>
          <div class="readme-body" id="rd"><p class="msg-box">Fetching README content...</p></div>
        </section>
        <aside class="sheet-sidebar">
          <h3>Recent Commits</h3>
          <div id="cm"><p class="msg-box">Loading...</p></div>
        </aside>
      </div>
    </div>
  `;

  document.documentElement.style.overflow = "hidden";
  sheet.classList.add("open");
  sheet.setAttribute("aria-hidden", "false");

  const repoPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo.name)}`;

  fetchGH(repoPath + "/readme", "application/vnd.github.html+json", true)
    .then((html) => {
      const rdEl = $("#rd", sheet);
      if (rdEl) rdEl.innerHTML = html ? sanitizeHTML(html, owner, repo.name, branch) : "<p>No README found.</p>";
    })
    .catch(() => {
      const rdEl = $("#rd", sheet);
      if (rdEl) rdEl.innerHTML = "<p>Could not load README document.</p>";
    });

  fetchGH(repoPath + "/commits?per_page=5")
    .then((commits) => {
      const cmEl = $("#cm", sheet);
      if (!cmEl) return;
      if (!commits || !commits.length) { cmEl.innerHTML = "<p>No commits found.</p>"; return; }
      cmEl.innerHTML = commits.map((c) => `
        <a class="commit-item" href="${esc(c.html_url)}" target="_blank" rel="noopener">
          <span class="commit-msg">${esc(c.commit.message.split("
")[0])}</span>
          <span class="commit-time">${ago(c.commit.author.date)}</span>
        </a>
      `).join("");
    })
    .catch(() => {
      const cmEl = $("#cm", sheet);
      if (cmEl) cmEl.innerHTML = "<p>Could not load commit history.</p>";
    });
}

function closeSheet(fromRoute = false) {
  if (!sheet) return;
  sheet.classList.remove("open");
  sheet.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";
  if (!fromRoute && /^#\/repo\//.test(location.hash)) {
    history.pushState(null, "", "#projects");
  }
}

const handleRoute = () => {
  const match = location.hash.match(/^#\/repo\/(.+)$/);
  if (match) openRepoModal(decodeURIComponent(match[1]));
  else closeSheet(true);
};

addEventListener("hashchange", handleRoute);
sheet?.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeSheet();
});
addEventListener("keydown", (e) => e.key === "Escape" && sheet?.classList.contains("open") && closeSheet());

readyPromise = loadRepos().then(handleRoute);
