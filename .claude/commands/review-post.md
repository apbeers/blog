---
description: Editorial review of a draft post — frontmatter, structure, links/images, clarity
argument-hint: <category/slug, or path to the post's .md file>
---

You are doing an editorial review of a blog post draft in this repo. **Do not assume the person
running this command knows how the repo works** — explain anything non-obvious as you go. If you
have not already loaded it in this session, read
[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) for the full frontmatter schema and
folder conventions before starting.

Target post: $ARGUMENTS (e.g. `milestone/2026-08-30-welcome-to-the-blog`, or a direct path to the
`.md` file). If not given, ask which post to review, or infer it from files changed on the
current branch.

Every post is a single file at `posts/<category>/<slug>.md` — there is no accompanying HTML file
to check.

## What to check

Read `posts/<category>/<slug>.md`.

1. **Frontmatter validity**
   - `title`, `date` (`YYYY-MM-DD`), `summary`, `category`, `author` are all present.
   - `category` is a key that exists in [`data/categories.json`](../../data/categories.json).
   - **The frontmatter `category` must match the folder the file is actually in** (a post at
     `posts/research/foo.md` with `category: milestone` in its frontmatter is a bug — the folder
     is what `post.html` uses to find the file, so a mismatch here means the post's own metadata
     lies about its category).
   - `author` is a key that exists in [`data/authors.json`](../../data/authors.json).

2. **Manifest consistency** — compare the frontmatter against the matching entry in
   [`posts/manifest.json`](../../posts/manifest.json) (slug/title/date/summary/category/author).
   Flag any mismatch (this happens when someone edits the post after it was scaffolded without
   updating the manifest — `/publish-post` will also catch this, but it's worth fixing now).

3. **Structural sanity of the Markdown body**
   - Every `[text](link)` and `![alt](src)` target resolves — local image paths are
     root-relative (`assets/posts/<slug>/...`, since posts are viewed through `post.html` at the
     site root) and point at files that actually exist; external links look well-formed.
   - Heading levels make sense as a table of contents (the site auto-builds a TOC from `##`/`###`
     — a post that never uses `##` will have no sidebar TOC, which is fine but worth mentioning).
   - No stray unclosed Markdown syntax (unmatched `` ` ``, `**`, `[`, `` ``` ``) that would render
     incorrectly through `js/markdown.js`'s parser (it supports headings, bold/italic, inline
     code, links, images, lists, blockquotes, fenced code blocks, horizontal rules — nothing
     fancier, e.g. no tables, no footnotes).

4. **Editorial pass** — clarity, structure, tone, grammar. Posts may be hand-written or
   AI-generated. Your job is to **comment and suggest**, not to silently rewrite the author's
   voice. Point out specific sentences/paragraphs and why they're unclear or could be tightened;
   propose alternate phrasing as suggestions the author can accept or reject. Never replace large
   sections of the body wholesale without asking first.

## Output

Give the user a short punch list: blocking issues (broken frontmatter, category/folder mismatch,
broken links/images, manifest mismatches) separate from editorial suggestions (style/clarity).
Ask before making any edits yourself — apply only the fixes they approve.
