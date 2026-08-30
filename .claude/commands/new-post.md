---
description: Scaffold a new blog post (a single Markdown file, plus manifest + sitemap entries)
argument-hint: [optional: a working title]
---

You are helping a contributor create a new post on this static blog. **Do not assume they know
how this repo works** — they may be a first-time contributor. Read
[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) now if you have not already loaded it in
this session; it is the full reference for everything below.

The user's argument, if given, is a rough working title: $ARGUMENTS

## What this repo needs from you

This is a static, dependency-free blog (no build step, raw HTML/CSS/JS). Posts are written by
hand in Markdown; nothing about the article's prose is ever auto-generated. **A post is a single
Markdown file — there is no accompanying HTML file.** Your job here is only scaffolding: creating
that file and the index entries — never writing the article body for them.

## Step 1 — gather the frontmatter fields

Ask the user (or infer from $ARGUMENTS + conversation context, confirming before proceeding) for:

- **title** — plain text.
- **summary** — one or two sentences; this becomes the homepage blurb and (once the post loads)
  the page's `<meta name="description">`.
- **category** — must be an id already in [`data/categories.json`](../../data/categories.json).
  If none fit, ask whether to add a new one there (`{ "id": { "label": "Display Label" } }`)
  rather than forcing an existing category. **This id is also the folder the post lives in**
  (`posts/<category>/`), so get it right before creating the file.
- **author** — must be an id already in [`data/authors.json`](../../data/authors.json). If the
  user isn't listed, add them first: `{ "id": { "name": "Full Name", "bio": "" } }`.
- **date** — default to today (`YYYY-MM-DD`) unless told otherwise.

Derive a **slug**: `YYYY-MM-DD-kebab-case-short-title` (lowercase, hyphens, no punctuation).
Confirm `posts/<category>/<slug>.md` doesn't already exist.

If **title** or **summary** contains a colon (`: `), wrap that value in double quotes when you
write the frontmatter in Step 2. GitHub's file preview parses frontmatter as YAML, and an
unquoted colon inside a value breaks it with a "mapping values are not allowed" error; the site's
own parser strips quotes safely either way.

## Step 2 — create the post file

Create `posts/<category>/<slug>.md` (make the category folder if it doesn't exist yet), starting
from [`templates/post-template.md`](../../templates/post-template.md). Fill in the frontmatter
with the exact values gathered above. Leave the body as a minimal placeholder (e.g. the
template's own placeholder heading) — the human author writes the real content afterward. Do not
draft article prose for them.

That's the entire post. There is no HTML file to create or fill in — every post is viewed
through the single shared `post.html` page (`post.html?category=<category>&slug=<slug>`), which
reads `posts/<category>/<slug>.md` and its frontmatter at runtime.

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
`https://apbeers.github.io/blog/post.html?category=<category>&slug=<slug>` with a `<lastmod>` of
the post date.

## Step 4 — hand off

Tell the user:
- Where the new `.md` file is, and that they should write the article body there by hand
  (Markdown: `##`/`###` headings auto-populate the table of contents, standard
  link/image/list/code syntax).
- Where to put any images: `assets/posts/<slug>/`, referenced from the post as
  `![alt](assets/posts/<slug>/file.png)` (root-relative, since `post.html` lives at the site root).
- That `/review-post <category>/<slug>` is available once a draft exists, and
  `/publish-post <category>/<slug>` once it's ready to merge.

Do not commit or push anything in this command — creating the file is enough; publishing is a
separate, explicitly-confirmed step (`/publish-post`).
