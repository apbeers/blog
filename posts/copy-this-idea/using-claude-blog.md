---
title: How to Use Claude Blog
date: 2026-08-30
author: abeers
category: copy-this-idea
slug: using-claude-blog
summary: Complete guide to using Claude Blog: write posts, manage categories, customize design—all through conversation with Claude.
---

# How to Use Claude Blog: AI-Assisted Content Creation

Claude Blog is designed around a single workflow: **tell Claude what you want, and Claude makes it happen.**

## The Workflow

### 1. Open Your Blog in Claude Code

Open your blog's directory. This gives Claude access to your files and lets it run the preview server.

### 2. Describe What You Want

Talk to Claude in natural language:

- "Write a post about my first iOS app"
- "Add a category for machine learning"
- "Make the accent color teal"
- "Fix the typo in my last post"

Claude understands your intent.

### 3. Preview & Iterate

Claude runs a local server and shows you the changes live. If something's not right, ask:

- "Make it more technical"
- "The colors clash. Use blue instead"
- "Fix the grammar here"

Feedback is cheap. Iterate until it's perfect.

### 4. Publish

When you're happy, Claude commits and pushes to GitHub. Within 30 seconds, your blog is live.

**You never edit files or run git commands. Claude handles everything.**

## Creating Posts

### Tell Claude to Write It

```
"Write a post about [topic]. It should cover [main points]. Keep it [tone]."
```

Example: "Write a post about my first iOS app. Cover the tools I used, what I learned, and what I'd do differently next time. Keep it conversational and include code snippets."

Claude will:
1. Ask what category to put it in (or suggest one)
2. Create the markdown file with proper frontmatter
3. Add it to your manifest
4. Show you a live preview

### Or Write It Yourself

Write your post in whatever editor you like, then tell Claude:

```
"I've written a draft. Here it is: [paste text]. Please format it as a Claude Blog post in the [category] category."
```

Claude will:
1. Add proper frontmatter (title, date, author, category)
2. Format the markdown correctly
3. Create the file and update the manifest

### Post Format

Your posts are markdown with YAML frontmatter:

```markdown
---
title: How I Built My First iOS App
date: 2026-08-30
author: andrew
category: tech
slug: first-ios-app
---

# Content starts here...

Use **bold**, *italic*, and `code`.

## Subsections work

- Lists work
- Code blocks work with language tags:

```python
def hello():
    print("world")
```

[Links work](https://example.com)

> Blockquotes work too
```

**Fields:**
- `title` — The post heading
- `date` — Publication date (YYYY-MM-DD)
- `author` — Your author ID from `data/authors.json`
- `category` — Category ID from `data/categories.json`
- `slug` — URL-friendly name (no spaces, lowercase)

### Writing Tips

- Any length is fine (500-3000 words is typical for blogs)
- Code blocks support syntax highlighting: `` ```python ``, `` ```javascript ``, etc.
- Images go in a `media/` folder and link normally
- Use standard markdown syntax
- Claude can fix grammar and formatting

## Managing Categories

### Add a New Category

```
"Add a category for [name]. Use the slug [slug]. Description: [description]."
```

Example: "Add a category for machine learning. Use the slug 'ml'. Description: 'Posts about ML models, training, and applications.'"

Claude updates `data/categories.json` and you can start writing posts in that category.

### View Your Categories

Categories live in `data/categories.json`:

```json
[
  { "id": "tech", "label": "Technology" },
  { "id": "travel", "label": "Travel" }
]
```

### Edit a Category

```
"Update the [category] description to [new description]."
```

Done.

## Managing Authors

### Add an Author

```
"Add an author named [name]. Use the ID [id]. Bio: [bio]. Email: [email (optional)]."
```

Example: "Add an author named Jane Doe. Use the ID 'jane'. Bio: 'Software engineer and open-source advocate.'"

Claude updates `data/authors.json`.

### Edit Author Info

```
"Update my bio to [new bio]."
```

Done.

## Customizing Design

### Change Colors

```
"Change the accent color to [color]. Keep [other elements] the same."
```

Example: "Change the accent color to teal. Keep the typography the same."

Claude edits `styles/main.css` and you see the change instantly in the preview.

### Typography

```
"Use [font] for headings. Keep body text as-is."
```

Example: "Use Georgia for headings."

### Layout & Spacing

```
"[Make/adjust] the [element]. It should [desired outcome]."
```

Examples:
- "Make the post cards wider on desktop"
- "Add more space between posts"
- "Make the sidebar narrower"

### Dark Mode

```
"In dark mode, make the [element] [change]."
```

Dark mode is built-in. Claude can adjust colors for dark mode separately.

### Add a Feature

```
"Add [feature]. It should [behavior]."
```

Examples:
- "Add a 'Share on Twitter' button to each post"
- "Add a search box that filters posts"
- "Show a read time estimate on each post"

All features are vanilla JavaScript—no new dependencies.

## Publishing

### How It Works

1. You tell Claude to add a post or make a change
2. Claude commits the changes locally
3. Claude asks: "Ready to publish? I'll push to GitHub"
4. You say "Yes"
5. Claude pushes to `main`
6. GitHub Pages auto-deploys
7. Your blog is live in 30 seconds

### Always Preview First

Before publishing, check:
- Does the new post look right?
- Are there typos?
- Is the formatting correct?
- Does it work on mobile?

Tell Claude to fix anything before publishing.

### Undo a Publish

Published something wrong? Tell Claude:

```
"Revert the last commit."
```

Claude will undo it. (Only works if you catch it quickly—GitHub Pages is fast.)

You own the GitHub repo, so you can always view git history and revert manually.

## Troubleshooting

### A Post Doesn't Appear

**Cause:** It's not in the manifest.

**Fix:** "Add my recent post to the manifest."

### Preview Doesn't Load

**Cause:** Server needs restart.

**Fix:** "Restart the preview server."

### Typo in a Published Post

**Fix:** "Fix the typo in [post name]. Change [old] to [new]."

### Something Looks Wrong

**Fix:** "The [element] looks wrong. It should be [description]. Can you fix it?"

Claude will iterate with you.

### Bulk Import from Another Platform

Paste the content into Claude:

```
"Convert these posts to Claude Blog format and add them. The category is [category]."
```

Claude creates the files and updates the manifest.

### Can't Describe the Problem

Take a screenshot and describe vaguely:

```
"The homepage feels cramped. Make it more spacious."
"The colors clash. Use warmer tones."
```

Claude is good at understanding vague feedback.

## Key Principles

- **Talk to Claude.** Describe what you want.
- **Preview first.** Always check before publishing.
- **Iterate freely.** Feedback is cheap. Ask for changes.
- **It's just files.** Your GitHub repo is yours. You can always edit manually or revert.
- **No magic.** It's HTML, CSS, and JavaScript. Nothing proprietary.

## You're In Control

- Your content is markdown files in your GitHub repo
- Your GitHub Pages deployment is free and open
- You can fork the repo and customize it however you want
- You can switch hosting anytime
- You own your data

Use Claude to make it frictionless, but you're never locked in.
