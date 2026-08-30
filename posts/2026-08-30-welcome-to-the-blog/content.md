---
title: Welcome to the blog
date: 2026-08-30
summary: How this site works: hand-written Markdown posts, parsed into HTML entirely in the browser, no build step.
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

Every post is a folder under `posts/` with two files:

- `content.md` — frontmatter (title, date, summary, category, author) plus the article body,
  written by hand.
- `index.html` — a small boilerplate shell with real `<title>` and `<meta>` tags, so search
  engines see correct metadata even without running JavaScript.

> The article body itself — everything you're reading right now — is rendered by
> `js/markdown.js`, a small hand-rolled parser with no dependencies.

Headings like the ones above automatically populate the table of contents on the left.
