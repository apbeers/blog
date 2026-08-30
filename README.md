# blog

A static blog: raw HTML/CSS/JS, no third-party libraries, no build step. Posts are written by
hand as Markdown and parsed into HTML entirely in the browser. Hosted on GitHub Pages.

See [.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for the full guide to writing and
publishing a post, the frontmatter schema, and how the site fits together.

## Local preview

**Don't just double-click `index.html`.** This site loads its content with `fetch()`
(Markdown files, JSON manifests), and browsers block `fetch()` on pages opened straight from
disk (`file://...`) as a security rule — you'll see a "Could not load posts" message and
cross-origin errors in the console. Serve the folder over HTTP instead, from the repo root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. (Any static file server works — this is just the one every
Mac already has.)

## Adding a post

In Claude Code: `/new-post`, then `/review-post`, then `/publish-post`. See
[.github/CONTRIBUTING.md](.github/CONTRIBUTING.md) for the manual steps.
