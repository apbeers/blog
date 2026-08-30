---
description: Editorial review of a draft post — frontmatter, structure, links/images, clarity
argument-hint: <slug or path to the post folder>
---

You are doing an editorial review of a blog post draft in this repo. **Do not assume the person
running this command knows how the repo works** — explain anything non-obvious as you go. If you
have not already loaded it in this session, read
[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) for the full frontmatter schema and
folder conventions before starting.

Target post: $ARGUMENTS (a slug like `2026-08-30-welcome-to-the-blog`, or a path). If not given,
ask which post to review, or infer it from files changed on the current branch.

## What to check

Read `posts/<slug>/content.md` and `posts/<slug>/index.html`.

1. **Frontmatter validity**
   - `title`, `date` (`YYYY-MM-DD`), `summary`, `category`, `author` are all present.
   - `category` is a key that exists in [`data/categories.json`](../../data/categories.json).
   - `author` is a key that exists in [`data/authors.json`](../../data/authors.json).

2. **Shell/manifest consistency** — compare `content.md`'s frontmatter against:
   - `posts/<slug>/index.html`'s `<title>`, `<meta name="description">`, OG tags, and JSON-LD.
   - The matching entry in `posts/manifest.json`.
   Flag any mismatch (this happens when someone edits `content.md` after the post was scaffolded
   without updating the shell — `/publish-post` will also catch this, but it's worth fixing now).

3. **Structural sanity of the Markdown body**
   - Every `[text](link)` and `![alt](src)` target resolves — local paths point at files that
     actually exist (especially images under `assets/posts/<slug>/`); external links look
     well-formed.
   - Heading levels make sense as a table of contents (the site auto-builds a TOC from `##`/`###`
     — a post that never uses `##` will have no sidebar TOC, which is fine but worth mentioning).
   - No stray unclosed Markdown syntax (unmatched `` ` ``, `**`, `[`, `` ``` ``) that would render
     incorrectly through `js/markdown.js`'s parser (it supports headings, bold/italic, inline
     code, links, images, lists, blockquotes, fenced code blocks, horizontal rules — nothing
     fancier, e.g. no tables, no footnotes).

4. **Editorial pass** — clarity, structure, tone, grammar. This blog's whole premise is that
   posts are genuinely human-written, not AI-drafted. Your job is to **comment and suggest**, not
   to silently rewrite the author's voice. Point out specific sentences/paragraphs and why they're
   unclear or could be tightened; propose alternate phrasing as suggestions the author can accept
   or reject. Never replace large sections of the body wholesale without asking first.

## Output

Give the user a short punch list: blocking issues (broken frontmatter, broken links/images,
shell/manifest mismatches) separate from editorial suggestions (style/clarity). Ask before making
any edits yourself — apply only the fixes they approve.
