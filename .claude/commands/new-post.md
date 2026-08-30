---
description: Scaffold a new blog post (folder, content.md, index.html shell, manifest + sitemap entries)
argument-hint: [optional: a working title]
---

You are helping a contributor create a new post on this static blog. **Do not assume they know
how this repo works** — they may be a first-time contributor. Read
[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) now if you have not already loaded it in
this session; it is the full reference for everything below.

The user's argument, if given, is a rough working title: $ARGUMENTS

## What this repo needs from you

This is a static, dependency-free blog (no build step, raw HTML/CSS/JS). Posts are written by
hand in Markdown; nothing about the article's prose is ever auto-generated. Your job here is
**only scaffolding**: creating the folder, the metadata shell, and the index entries — never
writing the article body for them.

## Step 1 — gather the frontmatter fields

Ask the user (or infer from $ARGUMENTS + conversation context, confirming before proceeding) for:

- **title** — plain text.
- **summary** — one or two sentences; this becomes the homepage blurb and the page's
  `<meta name="description">`.
- **category** — must be an id already in [`data/categories.json`](../../data/categories.json).
  If none fit, ask whether to add a new one there (`{ "id": { "label": "Display Label" } }`)
  rather than forcing an existing category.
- **author** — must be an id already in [`data/authors.json`](../../data/authors.json). If the
  user isn't listed, add them first: `{ "id": { "name": "Full Name", "bio": "" } }`.
- **date** — default to today (`YYYY-MM-DD`) unless told otherwise.

Derive a **slug**: `YYYY-MM-DD-kebab-case-short-title` (lowercase, hyphens, no punctuation).
Confirm the slug doesn't already exist under `posts/`.

## Step 2 — create the post folder

```
posts/<slug>/content.md
posts/<slug>/index.html
```

**`content.md`**: start from [`templates/content-template.md`](../../templates/content-template.md).
Fill in the frontmatter with the exact values gathered above. Leave the body as a minimal
placeholder (e.g. the template's own placeholder heading) — the human author writes the real
content afterward. Do not draft article prose for them.

**`index.html`**: start from [`templates/post-template.html`](../../templates/post-template.html).
Replace every `{{PLACEHOLDER}}`:

- `{{TITLE}}`, `{{SUMMARY}}` — HTML-escape (`&`, `<`, `>`, `"`) since these land inside HTML
  attributes and text. Inside the `<script type="application/ld+json">` block, instead
  JSON-escape them (escape `"` and `\`) since that block must stay valid JSON.
- `{{SLUG}}` — the slug from Step 1.
- `{{DATE}}` — the `YYYY-MM-DD` date.
- `{{AUTHOR_NAME}}` — the author's `name` field from `data/authors.json` (not the id).

Do not change anything else in the template — the CSS/JS `<link>`/`<script>` tags, the
`data-root="../../"` attribute, and the element ids (`post-category`, `post-title`,
`post-byline`, `post-content`, `post-toc-list`) are load-bearing for `js/post-render.js`.

## Step 3 — register the post

Add an entry to [`posts/manifest.json`](../../posts/manifest.json) (it's a JSON array — append,
don't reorder existing entries):

```json
{
  "slug": "<slug>",
  "title": "<title>",
  "date": "<date>",
  "summary": "<summary>",
  "category": "<category id>",
  "author": "<author id>"
}
```

Add a `<url>` entry to [`sitemap.xml`](../../sitemap.xml) for
`https://apbeers.github.io/blog/posts/<slug>/index.html` with a `<lastmod>` of the post date.

## Step 4 — hand off

Tell the user:
- Where `content.md` is, and that they should write the article body there by hand (Markdown:
  `##`/`###` headings auto-populate the table of contents, standard link/image/list/code syntax).
- Where to put any images: `assets/posts/<slug>/`, referenced from `content.md` as
  `![alt](../../assets/posts/<slug>/file.png)`.
- That `/review-post <slug>` is available once a draft exists, and `/publish-post <slug>` once
  it's ready to merge.

Do not commit or push anything in this command — creating the files is enough; publishing is a
separate, explicitly-confirmed step (`/publish-post`).
