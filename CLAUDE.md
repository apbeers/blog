# This repo: a vanilla static blog

Full guidelines: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) — read it before making
structural changes. Summary of the non-negotiable rules:

- **No third-party libraries, no build step.** Raw HTML/CSS/JS only, hosted as-is on GitHub Pages.
- **Posts are Markdown**, parsed into HTML in the browser at load time
  (`js/markdown.js`, `js/frontmatter.js`, `js/post-render.js`). Posts may be hand-written or
  AI-generated.
- **A post is a single file**, `posts/<category>/<slug>.md` (frontmatter + body) —
  no accompanying HTML file. Every post is viewed through the one shared `post.html` at the site
  root (`post.html?category=<category>&slug=<slug>`), which sets `<title>`/meta tags and renders
  the body at runtime. `posts/manifest.json` indexes all posts for the homepage.
- Categories and authors are shared registries: `data/categories.json`, `data/authors.json`.
  Post frontmatter references them by id, and a post's category id must match the folder
  (`posts/<category>/`) it lives in.
- Slash commands for the common workflows live in `.claude/commands/`: `/new-post`,
  `/review-post`, `/publish-post`. Prefer them over ad hoc edits so the manifest/shell/sitemap
  stay in sync.
- `/publish-post` merges to `main` — always confirm with the user before pushing or merging,
  every time, regardless of prior approvals in this session.
- **Local preview always runs on port 8000.** `.claude/launch.json`'s `blog-preview` config
  attaches to an already-running server at `http://localhost:8000` rather than launching its own
  — before calling `preview_start`, make sure something is actually serving the repo on 8000
  (check, or start one yourself with `python3 serve.py` via Bash, running in the background).
  Do not change that config back to auto-launching a server on some other port — that previously
  caused the integrated browser to silently preview a different, empty server than the one anyone
  was actually looking at.
- **Serve with `serve.py`, not `python3 -m http.server`.** The stock server answers
  `If-Modified-Since` with `304 Not Modified`, so edited `.js`/`.css`/`.md` files keep rendering
  from the browser cache and you waste time debugging a stale file. `serve.py` (standard library
  only) disables caching. If you ever find yourself adding `?cb=<timestamp>` to bust a cache,
  a stock server is running — restart it with `serve.py` instead.
