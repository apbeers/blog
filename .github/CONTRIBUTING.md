# Contributing to this blog

This is a static blog with **no build step and no third-party libraries** — raw HTML, CSS, and
JavaScript only, hosted on GitHub Pages. Posts are Markdown files, hand-written or AI-generated; a
small amount of JavaScript in the browser parses that Markdown into HTML at page-load time. There
is no compiler, bundler, or static-site generator involved anywhere in this repo.

If you're using Claude Code, the easiest way to work in this repo is via the slash commands
described below — they work correctly even if this is the first time you've opened this repo.
If you're not using Claude Code, everything below is a plain manual process too.

## How a post is structured

Every post is a **single Markdown file** under `posts/<category>/` — no accompanying HTML file:

```
posts/milestone/2026-08-30-welcome-to-the-blog.md
```

The category is which folder the post lives in. The file starts with a frontmatter block, then
the article body:

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

- **title** — plain text, shown as the page `<title>` (once the post loads) and the homepage
  list title.
- **date** — `YYYY-MM-DD`.
- **summary** — plain text, one or two sentences. Shown on the homepage and used as the
  `<meta name="description">` for search engines.
- **category** — must be one of the ids in [`data/categories.json`](../data/categories.json), and
  must match the folder the file is actually in (`posts/<category>/`). Add a new category there
  first if you need one.
- **author** — must be an id in [`data/authors.json`](../data/authors.json). Add yourself there
  first if you're a new contributor (`{ "id": { "name": "...", "bio": "..." } }`).

**Quote any frontmatter value that contains a colon** (e.g.
`summary: "How this works: an explanation."`). GitHub's file preview parses this block as real
YAML, where an unquoted `key: value` colon inside a value is read as a nested mapping and breaks
rendering with a "mapping values are not allowed in this context" error. The site's own parser
(`js/frontmatter.js`) also strips surrounding quotes, so quoting is safe and has no effect on the
rendered page — just required whenever a value itself contains `: `.

### The shared `post.html` page

There is one `post.html` at the site root that every post is viewed through:
`post.html?category=<category>&slug=<slug>`. It reads the category/slug from the URL, fetches
`posts/<category>/<slug>.md`, and renders the byline, article body, and table of contents — and
also sets the page's `<title>`, `<meta description>`, Open Graph tags, and JSON-LD from the
post's frontmatter, all at runtime (see `js/post-render.js`). You never create or edit an HTML
file per post — `post.html` itself is shared infrastructure, not something to copy.

### The homepage list (`posts/manifest.json`)

GitHub Pages has no way for the homepage's JavaScript to discover post files on its own, so
`posts/manifest.json` is a small index the homepage reads: one entry per post with its slug,
category, and other frontmatter fields duplicated in. `/new-post` adds the entry for you;
`/publish-post` verifies it matches the post's frontmatter before merging.

### Images

Put per-post images under `assets/posts/<slug>/` and reference them from the post with normal
Markdown image syntax, root-relative since `post.html` lives at the site root:
`![Alt text](assets/posts/<slug>/diagram.png)`.

## Adding a post

Use `/new-post` in Claude Code, or do it by hand:

1. Pick a slug: `YYYY-MM-DD-short-title`.
2. `mkdir -p posts/<category>` (if it doesn't exist yet) and copy
   `templates/post-template.md` to `posts/<category>/<slug>.md`; fill in the frontmatter and
   write the body.
3. Add an entry to `posts/manifest.json`.
4. Add a `<url>` entry to `sitemap.xml` for
   `post.html?category=<category>&slug=<slug>`.

Then use `/review-post` for an editorial pass, and `/publish-post` when it's ready to merge.

## Style

Posts can be written by hand or drafted with AI assistance — either is fine. `/review-post` will
comment on clarity and structure but will not rewrite the body wholesale without asking first,
regardless of how the draft originated.

## Dark mode

The site follows the visitor's OS/browser color scheme by default. The toggle button in the
header (`js/theme-toggle.js`) lets them override it explicitly; the choice is stored as a
first-party `theme` cookie (not localStorage) and re-applied before first paint by
`js/theme-init.js`. All colors live in `css/variables.css` as custom properties — a new page or
component only needs to use `var(--color-...)` tokens to get dark mode for free, never a
hardcoded color.

## Local preview

**Always preview through a local HTTP server — never by double-clicking `index.html`.** Every
page loads its content with `fetch()` (JSON manifests, a post's `content.md`, the header/footer
partials), and browsers refuse `fetch()` on pages opened directly from disk (`file://...`) as a
cross-origin security rule, regardless of anything in this repo's code. Opening a page that way
shows a banner explaining this and a "could not load" message instead of the real content — that
banner only appears under `file://` and is never visible on the deployed site (GitHub Pages
always serves over `https://`).

Any static file server works, e.g. from the repo root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

**Port 8000 specifically matters if you're using Claude Code's integrated browser preview.**
[`.claude/launch.json`](../.claude/launch.json)'s `blog-preview` config is set to *attach* to an
already-running server at `http://localhost:8000` rather than launch its own — so start the
server above yourself first, then ask Claude to preview it. If nothing is listening on 8000 yet,
the preview will fail to attach rather than silently opening some other port. Don't change that
config to launch its own process on a different port again — a previous version did exactly that
(auto-launching on 8123), which meant the integrated browser was quietly previewing a different
server than the one anyone was actually looking at.

## A note on search/AI-agent indexing

Because content is rendered client-side rather than pre-built,
crawlers that execute JavaScript (Google's indexer does) will see the full rendered article, real
title, and description — `js/post-render.js` sets all of that at runtime. Crawlers that fetch
HTML only and never run JavaScript will only see `post.html`'s generic default title/description,
not anything specific to the post being viewed. This is the tradeoff of every post being a single
Markdown file with no per-post HTML: it's simpler to author and maintain, at the cost of
metadata visibility to non-JS crawlers. `sitemap.xml` still lists every post's URL, so it can
still be discovered and crawled — just not with rich per-post metadata for crawlers that skip
JavaScript.

## GitHub Pages setup

This repo is served via GitHub Pages, "Deploy from a branch" (`main`, `/root`) — no GitHub Actions
build workflow is used or needed. The root `.nojekyll` file disables GitHub's default Jekyll
processing, which is required so raw files (in particular, files/folders and the `.md` files) are
served as-is instead of being run through Jekyll.
