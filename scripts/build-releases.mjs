/* Builds data/releases.json: a saved copy of every public release, used by releases.html when GitHub's API is unavailable.
   Run by the deploy workflow (with GITHUB_TOKEN) or by hand: node scripts/build-releases.mjs */
import { readFile, writeFile, mkdir } from "node:fs/promises";

const OWNER = process.env.RELEASES_OWNER || "LunexCorp";
const headers = { Accept: "application/vnd.github.html+json", "User-Agent": "lunexcorp-website", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };

async function pages(path) {
  const out = [];
  for (let p = 1; p < 30; p++) {
    const r = await fetch(`https://api.github.com${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${p}`, { headers });
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    const pg = await r.json(); out.push(...pg); if (pg.length < 100) break;
  }
  return out;
}

try {
  const repos = (await pages(`/users/${OWNER}/repos?type=owner`)).filter((r) => !r.private);
  const releases = [];
  for (const r of repos) for (const x of await pages(`/repos/${OWNER}/${r.name}/releases`)) {
    if (x.draft) continue;
    releases.push({ repo: r.name, tag: x.tag_name, name: x.name || x.tag_name, url: x.html_url, date: x.published_at || x.created_at, pre: !!x.prerelease, html: x.body_html || "",
      assets: (x.assets || []).map((a) => ({ name: a.name, size: a.size, url: a.browser_download_url, downloads: a.download_count })) });
  }
  releases.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  await mkdir("data", { recursive: true });
  await writeFile("data/releases.json", JSON.stringify({ generatedAt: new Date().toISOString(), owner: OWNER, repos: repos.map((r) => r.name), releases }, null, 1) + "\n");
  console.log(`Saved ${releases.length} releases from ${repos.length} repositories.`);
} catch (e) {
  console.warn(`Could not refresh data/releases.json (${e.message}). Keeping the existing copy.`);
  try { await readFile("data/releases.json"); } catch { process.exitCode = 1; }
}
