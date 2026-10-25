# LunexCorp-Website

Static site for LunexCorp and its WhatsApp bot, Lucif. Plain HTML, CSS and JavaScript, deployed to GitHub Pages by `.github/workflows/static.yml`. No build step is needed to work on it.

| File | Purpose |
| --- | --- |
| `index.html`, `script.js` | LunexCorp home, live GitHub project directory and project sheet |
| `lucif.html`, `lucif.js` | Lucif product page and the in-browser chat demo (a local simulation) |
| `releases.html`, `releases.js` | Release archive for every public LunexCorp repository |
| `common.js` | **All configuration** (`SITE_CONFIG`), GitHub client with caching, HTML sanitiser, mobile menu |
| `style.css` | One design system: cream (LunexCorp) and black/green (Lucif) tokens |
| `data/releases.json`, `scripts/build-releases.mjs` | Saved release copy and the script that refreshes it |

## Configuration

Everything is in `SITE_CONFIG` at the top of `common.js`: the GitHub owner, the flagship repository name, the bot number and the official WhatsApp channel. Pages never hard-code these; links marked `data-wa`, `data-channel` and `data-gh` are filled in from the config.

Bot number: `063 154 5556`, stored as `27631545556` for `https://wa.me/`. **This number has not been confirmed as the live Lucif account.** Check that the link opens the right chat before announcing it.

## Releases

`releases.js` reads releases live from the GitHub API for each public repository. If the API is rate limited or unreachable it falls back to `data/releases.json` and says so on the page. The deploy workflow regenerates that file with `scripts/build-releases.mjs` (and falls back to the committed copy if that fails). Run it by hand with `node scripts/build-releases.mjs`.

At the time of writing the `Lucif` repository is not publicly visible, so only public projects (currently RADEssentials) have releases to show.

## Notes

- Social images and canonical URLs use relative paths because no production domain is configured. Add absolute `og:image` and `canonical` URLs once the domain is final.
- The demo's five commands are simulated in the browser. Nothing is sent to the real bot.
