---
title: Welcome to the blog
date: 2026-08-30
summary: "How this site works: hand-written Markdown posts, parsed into HTML entirely in the browser, no build step."
category: milestone
author: abeers
---

This site is a plain HTML, CSS, and JavaScript blog with **no third-party libraries and no build
step**. Every post is written by hand as a Markdown file, and the browser itself parses that
Markdown into HTML at page-load time.

## Why no build step

A lot of blogs today are quietly templated or AI-drafted end to end. The goal here is the
opposite: writing stays manual, and the small amount of tooling that *does* exist only handles
plumbing — folder scaffolding, metadata, and publishing — never the words themselves.

## What a post looks like

Every post is a single Markdown file under `posts/<category>/`, e.g.
`posts/milestone/2026-08-30-welcome-to-the-blog.md` — this file. It starts with a frontmatter
block (title, date, summary, category, author), then the article body, written by hand. There's
no HTML file alongside it.

> The article body itself — everything you're reading right now — is rendered by
> `js/markdown.js`, a small hand-rolled parser with no dependencies, into the shared `post.html`
> page that every post is viewed through.

Headings like the ones above automatically populate the table of contents on the left.
