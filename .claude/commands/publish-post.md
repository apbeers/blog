---
description: Verify a post is consistent and ready, then publish it by merging into main
argument-hint: <category/slug, or path to the post's .md file>
---

You are publishing a blog post in this repo. **Do not assume the person running this command
knows how the repo works.** If you have not already loaded it in this session, read
[.github/CONTRIBUTING.md](../../.github/CONTRIBUTING.md) first for the full schema/conventions.

Target post: $ARGUMENTS (e.g. `milestone/2026-08-30-welcome-to-the-blog`). If not given, infer it
from files changed on the current branch, or ask.

Every post is a single file at `posts/<category>/<slug>.md` — there is no accompanying HTML file.
This command has two phases: **verify**, then **publish**. Never skip straight to publishing.

## Phase 1 — verify

1. Confirm `posts/<category>/<slug>.md` exists.
2. Re-check everything `/review-post` checks: valid frontmatter (`title`, `date`, `summary`,
   `category` present in [`data/categories.json`](../../data/categories.json) **and matching the
   folder the file is actually in**, `author` present in
   [`data/authors.json`](../../data/authors.json)).
3. Confirm `posts/manifest.json` has a matching entry (slug/title/date/summary/category/author
   all in sync with the post's frontmatter). Fix or add it if missing/stale — this file is
   plumbing maintained by tooling, so updating it is safe to do without asking.
4. Confirm [`sitemap.xml`](../../sitemap.xml) has a `<url>` entry for
   `https://apbeers.github.io/blog/post.html?category=<category>&slug=<slug>` with the correct
   `<lastmod>`. Add or fix it if missing/stale.
5. Spot-check that any local image references in the post resolve to real files under
   `assets/posts/<slug>/`.
6. Report what you found and what you fixed. If there are unresolved problems (missing required
   frontmatter, a category/author id that doesn't exist anywhere, a category/folder mismatch),
   **stop here** and ask the user to resolve them before continuing — do not publish an
   inconsistent post.

## Phase 2 — publish

Publishing means getting this post onto `main`, which is the branch GitHub Pages serves from.
This is a shared-state, hard-to-reverse action — **always ask the user to explicitly confirm
before pushing or merging, every single time**, even if they've approved a previous publish in
this same conversation. Do not use `--force` anything, and do not skip git hooks.

1. Run `git status` and `git branch --show-current` to see where things stand.
2. If there are uncommitted changes to the post/manifest/sitemap from Phase 1's fixes, stage
   **only the relevant files** (the post's `.md` file, `posts/manifest.json`, `sitemap.xml` —
   never an unrelated `git add -A`) and prepare a commit message describing the new/updated post.
3. Tell the user exactly what will happen next and ask them to confirm before doing it:
   - **If already on `main`**: commit, then `git push`.
   - **If on a feature/topic branch**: ask whether they want a pull request opened (via `gh pr
     create`) for review, or a direct merge to `main`. Do whichever they choose, but confirm the
     specific action (PR vs. direct merge) before running it either way.
4. Only after explicit confirmation, run the commit/push/merge commands.
5. After publishing, remind the user that GitHub Pages may take a minute or two to redeploy, and
   give them the live URL:
   `https://apbeers.github.io/blog/post.html?category=<category>&slug=<slug>`.

If the user says no, or hesitates, or asks a question instead of confirming — do not proceed with
any push or merge. Stop and answer the question, or wait.
