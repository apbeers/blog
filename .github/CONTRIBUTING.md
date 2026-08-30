# Contributing to this blog

This is a static blog with **no build step and no third-party libraries** — raw HTML, CSS, and
JavaScript only, hosted on GitHub Pages. Posts are written by hand in Markdown; a small amount of
JavaScript in the browser parses that Markdown into HTML at page-load time. There is no compiler,
bundler, or static-site generator involved anywhere in this repo.

If you're using Claude Code, the easiest way to work in this repo is via the slash commands
described below — they work correctly even if this is the first time you've opened this repo.
If you're not using Claude Code, everything below is a plain manual process too.

## How a post is structured

Every post lives in its own folder under `posts/`:

```
posts/2026-08-30-welcome-to-the-blog/
  content.md      <- the actual article: frontmatter + hand-written Markdown body
  index.html      <- a small boilerplate shell (do not hand-edit the prose here)
```

`content.md` starts with a frontmatter block, then the article body:

```
---
title: Welcome to the blog
date: 2026-08-30
summary: A one- or two-sentence summary shown on the homepage and in search results.
category: milestone
author: abeers
---

The article body goes here, written in Markdown.
```

- **title** — plain text, shown as the page `<title>` and the homepage list title.
- **date** — `YYYY-MM-DD`.
- **summary** — plain text, one or two sentences. Shown on the homepage and used as the
  `<meta name="description">` for search engines.
- **category** — must be one of the ids in [`data/categories.json`](../data/categories.json).
  Add a new category there first if you need one.
- **author** — must be an id in [`data/authors.json`](../data/authors.json). Add yourself there
  first if you're a new contributor (`{ "id": { "name": "...", "bio": "..." } }`).

### The `index.html` shell

`index.html` next to `content.md` is boilerplate: it has real `<title>`/`<meta description>`/
Open Graph tags/JSON-LD copied from the frontmatter above, so search engines and other crawlers
that don't execute JavaScript still see the correct title, summary, author, and date for the post.
The actual body text is never in this file — it's always rendered client-side from `content.md`
by `js/post-render.js`. Copy it from [`templates/post-template.html`](../templates/post-template.html)
(the `/new-post` command does this for you) and fill in the `{{PLACEHOLDER}}` values. If you edit
the title/summary/date/category/author in `content.md` after the post is created, update the
matching values in `index.html` too (`/publish-post` checks this for you).

### The homepage list (`posts/manifest.json`)

GitHub Pages has no way for the homepage's JavaScript to discover post folders on its own, so
`posts/manifest.json` is a small index the homepage reads: one entry per post with its slug and
frontmatter fields duplicated in. `/new-post` adds the entry for you; `/publish-post` verifies it
matches the post's `content.md` before merging.

### Images

Put per-post images under `assets/posts/<slug>/` and reference them from `content.md` with normal
Markdown image syntax: `![Alt text](../../assets/posts/<slug>/diagram.png)`.

## Adding a post

Use `/new-post` in Claude Code, or do it by hand:

1. Pick a slug: `YYYY-MM-DD-short-title`.
2. `mkdir posts/<slug>` and copy `templates/content-template.md` to `posts/<slug>/content.md`;
   fill in the frontmatter and write the body.
3. Copy `templates/post-template.html` to `posts/<slug>/index.html`; fill in the
   `{{PLACEHOLDER}}` values from the frontmatter (escape any `"` inside the JSON-LD block).
4. Add an entry to `posts/manifest.json`.
5. Add `<url>` entries to `sitemap.xml` for the new post.

Then use `/review-post` for an editorial pass, and `/publish-post` when it's ready to merge.

## Style

Write posts yourself. This blog exists specifically so that the writing is human — the tooling
here handles folder scaffolding and metadata, never the prose. `/review-post` will comment on
clarity and structure but will not rewrite your voice wholesale without asking first.

## Dark mode

The site follows the visitor's OS/browser color scheme by default. The toggle button in the
header (`js/theme-toggle.js`) lets them override it explicitly; the choice is stored as a
first-party `theme` cookie (not localStorage) and re-applied before first paint by
`js/theme-init.js`. All colors live in `css/variables.css` as custom properties — a new page or
component only needs to use `var(--color-...)` tokens to get dark mode for free, never a
hardcoded color.

## Local preview

Any static file server works, e.g. from the repo root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## A note on search/AI-agent indexing

Because content is intentionally hand-written and rendered client-side rather than pre-built,
crawlers that execute JavaScript (Google's indexer does) will see the full rendered article.
Crawlers that fetch HTML only and never run JavaScript will still see a correct title, summary,
author, date, and canonical URL for every post (from the `index.html` shell described above), but
not the rendered article body. This is a deliberate tradeoff for keeping the site build-free and
dependency-free — not an oversight.

## GitHub Pages setup

This repo is served via GitHub Pages, "Deploy from a branch" (`main`, `/root`) — no GitHub Actions
build workflow is used or needed. The root `.nojekyll` file disables GitHub's default Jekyll
processing, which is required so raw files (in particular, files/folders and the `.md` files) are
served as-is instead of being run through Jekyll.
