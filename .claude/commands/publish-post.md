---
description: Verify a post is consistent and ready, then publish it by merging into main
argument-hint: <slug or path to the post folder>
---

You are publishing a blog post in this repo. **Do not assume the person running this command
knows how the repo works.** If you have not already loaded it in this session, read
[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) first for the full schema/conventions.

Target post: $ARGUMENTS (a slug like `2026-08-30-welcome-to-the-blog`). If not given, infer it
from files changed on the current branch, or ask.

This command has two phases: **verify**, then **publish**. Never skip straight to publishing.

## Phase 1 — verify

1. Confirm `posts/<slug>/content.md` and `posts/<slug>/index.html` both exist.
2. Re-check everything `/review-post` checks: valid frontmatter (`title`, `date`, `summary`,
   `category` present in [`data/categories.json`](../../data/categories.json), `author` present
   in [`data/authors.json`](../../data/authors.json)), and that `index.html`'s `<title>`,
   `<meta name="description">`, OG tags, and JSON-LD match `content.md`'s current frontmatter. If
   they've drifted (e.g. the title was edited after scaffolding), fix `index.html` to match —
   this file is boilerplate maintained by tooling, so updating it is safe to do without asking.
3. Confirm `posts/manifest.json` has a matching entry (slug/title/date/summary/category/author
   all in sync with `content.md`). Fix or add it if missing/stale.
4. Confirm [`sitemap.xml`](../../sitemap.xml) has a `<url>` entry for
   `https://apbeers.github.io/blog/posts/<slug>/index.html` with the correct `<lastmod>`. Add or
   fix it if missing/stale.
5. Spot-check that any local image references in `content.md` resolve to real files under
   `assets/posts/<slug>/`.
6. Report what you found and what you fixed. If there are unresolved problems (missing required
   frontmatter, a category/author id that doesn't exist anywhere), **stop here** and ask the user
   to resolve them before continuing — do not publish an inconsistent post.

## Phase 2 — publish

Publishing means getting this post onto `main`, which is the branch GitHub Pages serves from.
This is a shared-state, hard-to-reverse action — **always ask the user to explicitly confirm
before pushing or merging, every single time**, even if they've approved a previous publish in
this same conversation. Do not use `--force` anything, and do not skip git hooks.

1. Run `git status` and `git branch --show-current` to see where things stand.
2. If there are uncommitted changes to the post/manifest/sitemap from Phase 1's fixes, stage
   **only the relevant files** (the post's folder, `posts/manifest.json`, `sitemap.xml` — never
   an unrelated `git add -A`) and prepare a commit message describing the new/updated post.
3. Tell the user exactly what will happen next and ask them to confirm before doing it:
   - **If already on `main`**: commit, then `git push`.
   - **If on a feature/topic branch**: ask whether they want a pull request opened (via `gh pr
     create`) for review, or a direct merge to `main`. Do whichever they choose, but confirm the
     specific action (PR vs. direct merge) before running it either way.
4. Only after explicit confirmation, run the commit/push/merge commands.
5. After publishing, remind the user that GitHub Pages may take a minute or two to redeploy, and
   give them the live URL: `https://apbeers.github.io/blog/posts/<slug>/index.html`.

If the user says no, or hesitates, or asks a question instead of confirming — do not proceed with
any push or merge. Stop and answer the question, or wait.
