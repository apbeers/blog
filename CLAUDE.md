# This repo: a vanilla static blog

Full guidelines: [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) — read it before making
structural changes. Summary of the non-negotiable rules:

- **No third-party libraries, no build step.** Raw HTML/CSS/JS only, hosted as-is on GitHub Pages.
- **Posts are hand-written Markdown**, parsed into HTML in the browser at load time
  (`js/markdown.js`, `js/frontmatter.js`, `js/post-render.js`). Never auto-generate or rewrite
  the body of a post.
- **A post is a single file**, `posts/<category>/<slug>.md` (frontmatter + hand-written body) —
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
