---
title: Claude Blog Architecture
date: 2026-08-30
author: abeers
category: copy-this-idea
slug: claude-blog-architecture
summary: Deep dive into the design decisions behind Claude Blog: zero dependencies, no build step, browser-side markdown parsing.
---

# Claude Blog Architecture: How We Built a Zero-Dependency Blogging Platform

Claude Blog's architecture is intentionally minimal. Every design decision prioritizes simplicity, stability, and AI-friendliness over feature completeness.

## Core Design Principle

**Maximum simplicity with zero dependencies.**

This means: no npm, no pip, no gem. No build step. No external services. Just static files on GitHub Pages and a lightweight markdown parser in the browser.

## File Structure

```
posts/
  manifest.json           # Index of all posts
  [category]/
    [slug].md             # Post (markdown + frontmatter)

data/
  categories.json         # Category registry
  authors.json            # Author registry

index.html                # Homepage
post.html                 # Post template
styles/main.css           # Global styles
js/
  markdown.js             # Markdown parser
  frontmatter.js          # Frontmatter extractor
  post-render.js          # Post rendering logic
  home-render.js          # Homepage rendering logic
```

That's it. No build output directories, no compiled CSS, no bundled JavaScript.

## How the Browser Renders a Post

1. User clicks a post link: `post.html?category=tech&slug=my-post`
2. Browser fetches `posts/tech/my-post.md`
3. JavaScript extracts frontmatter (metadata) and markdown (content)
4. Markdown is parsed into HTML using our simple regex-based parser
5. Page is rendered with metadata in the header, content in the body
6. `<title>` and meta tags are set for social sharing

All of this happens in the browser. The server does nothing but serve static files.

## Why No Build Step?

Traditional static site generators require:

- Language runtime (Ruby, Go, Node)
- Build tool (Jekyll, Hugo, Gatsby)
- Configuration (config.yml, etc.)
- Deployment step (`jekyll build` → commit output → push)

Claude Blog eliminates all of this. Posts are markdown files. GitHub Pages serves them as-is. The browser does the parsing. This removes complexity at every layer.

**Trade-off:** Markdown parsing happens once per user per page. For typical blog posts (3-10KB), this is <5ms. The network round-trip is far longer.

## Why Browser-Side Markdown Parsing?

Our markdown parser is 200 lines of JavaScript. It handles:

- Bold, italic, strikethrough
- Headers (H1-H6)
- Lists (ordered and unordered)
- Code blocks with language tagging
- Links and images
- Blockquotes
- Horizontal rules

It's not CommonMark-compliant, but it's enough for blog posts. And because it's in the repo—not downloaded from npm—there's zero dependency risk.

**Why not highlight.js for syntax highlighting?** We added simple regex-based highlighting in plain JavaScript. 50 lines, does the job, no dependency.

## Query Param Routing

Post URLs use query params: `post.html?category=tech&slug=my-post`

**Why not prettier URLs like `/tech/my-post/`?** Query params are simpler:
- No server rewrites needed
- GitHub Pages serves everything as static files
- Routing logic is pure JavaScript
- Bookmarkable and shareable (social crawlers handle query params fine)

This is a deliberate trade-off for simplicity.

## Metadata as JSON

Categories and authors are JSON registries. Posts reference them by ID.

```json
// data/categories.json
[
  { "id": "tech", "label": "Technology" },
  { "id": "travel", "label": "Travel" }
]

// data/authors.json
[
  { "id": "andrew", "name": "Andrew Beers", "bio": "..." }
]
```

When rendering a post, JavaScript looks up the category and author info and displays it. This is simpler than embedding all metadata in each post file.

## The Manifest

`posts/manifest.json` is the index:

```json
[
  {
    "category": "tech",
    "slug": "my-post",
    "title": "My Post",
    "date": "2026-08-30",
    "author": "andrew"
  }
]
```

The homepage fetches this once, then renders all posts. Adding a new post means adding an entry here (and creating the `.md` file).

## GitHub Pages Hosting

We host on GitHub Pages because:

- Free, fast, trusted
- HTTPS by default
- CDN globally distributed (via Fastly)
- No vendor lock-in (your repo is yours)
- Scales to any traffic

Posts are public by default (your repo is public). If you need privacy, use a different host—the architecture stays the same.

## Security Model

**No code execution on deploy.** When you push, GitHub Pages simply serves your files. This eliminates:

- Server-side template injection
- Arbitrary code execution via plugins
- Authentication bypasses
- Plugin vulnerabilities

The markdown parser runs in the browser but only converts markdown syntax—it strips `<script>` tags and doesn't allow arbitrary HTML.

No third-party packages means no supply-chain attacks, no transitive vulnerabilities, no mysterious security updates from npm.

## Design Decisions & Trade-Offs

**Decision: Browser-side parsing**  
*Why:* Eliminates build step entirely  
*Trade-off:* Parsing happens once per user (but it's <5ms)

**Decision: Query param routing**  
*Why:* Simple, no server logic needed  
*Trade-off:* URLs are longer than `/category/slug/`

**Decision: Zero dependencies**  
*Why:* No security risk, no updates break things  
*Trade-off:* We maintain our own markdown parser (200 lines)

**Decision: AI-assisted workflow**  
*Why:* Claude is better at understanding intent than config files  
*Trade-off:* Users need Claude Code (but they're building a blog anyway)

**Decision: JSON for metadata**  
*Why:* Human-readable, editable, discoverable  
*Trade-off:* No database means no querying or filtering on the server (but we don't have a server)

## Performance

A typical page load:

- `index.html`: 3KB
- `main.css`: 8KB (minified)
- JavaScript bundles: 15KB (minified + gzipped)
- `manifest.json`: 5KB per 100 posts
- **Total:** 30-40KB

Typical post load: 3-10KB markdown → parsed and rendered in <100ms.

GitHub Pages caches aggressively, so return visitors only fetch new post files.

## Extensibility Without Dependencies

You can add features without new dependencies:

- **Search:** Parse manifest locally, filter by keyword
- **Read time:** Count words, display estimate
- **TOC:** Parse headings, generate navigation
- **Service worker:** Cache posts offline
- **RSS feed:** Generate from manifest.json

All vanilla JavaScript, no libraries.

If you need syntax highlighting, comments, or analytics, embed third-party services (Disqus, Plausible) in the post template. They're optional—the core blog works without them.

## Why This Design?

Claude Blog was built for AI-assisted content management. Traditional static generators assume manual YAML editing and command-line workflows. We designed for natural language:

- "Write a post about X" → Claude creates the file and updates the manifest
- "Add a category" → Claude updates the registry
- "Change the colors" → Claude updates CSS

This requires a simple, predictable file structure. No build step, no config files, no generated output directories. Just files you can edit, understand, and version control.

## What's Not Included

- Database
- Authentication
- Comments (use third-party service if needed)
- Search (can be added client-side)
- Analytics (can be added as optional beacon)
- CDN (GitHub Pages provides one)
- Plugins (by design—no dependencies)

These aren't limitations; they're choices. For a blog, this is enough.

## The Result

A blogging platform that:
- Works today and will work in 2035
- Costs nothing to host
- Requires no maintenance
- Plays well with Claude
- Is trivial to fork and customize
- Has no security surprises

Simple, stable, and ready for AI.
