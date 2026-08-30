# Claude Blog – Agent Setup Guide

This document is for Claude agents helping users set up a new Claude Blog instance. It contains all the information needed to fully configure a blog from a fork.

## Quick Overview

Claude Blog is a zero-dependency static blog that runs on GitHub Pages. Posts are markdown files with YAML frontmatter. There's no build step—GitHub Pages serves files as-is, and the browser parses markdown at load time.

**User doesn't need to do anything technical. You (the agent) do all the work.**

## Setup Goals

By the end of setup, the user will have:
1. A fork of the Claude Blog repo
2. Customized blog metadata (title, description, author info)
3. At least one category and one post as examples
4. GitHub Pages deployed and live
5. A clear workflow for adding posts with Claude

## The Setup Conversation

### Phase 1: Information Gathering (5-10 minutes)

Ask the user for:

#### Blog Identity
- **Blog name**: "My Blog", "Tech Thoughts", etc.
- **Blog tagline/description**: One sentence describing what the blog is about
- **Blog URL** (if deploying to custom domain, otherwise it's `[username].github.io/blog`)

#### Author Info
- **Your name**: Full name for byline
- **Your email**: For the authors registry
- **Your bio**: 1-2 sentences about the author
- **Author ID**: Suggested: `andrew` or first name in lowercase (no spaces)

#### Content Planning
- **Initial categories**: Ask "What topics will you write about?" Suggest 3-5 categories
  - Examples: tech, travel, life, design, writing
  - For each: category name, slug (lowercase, no spaces), and description
- **First post topic**: "What should your first post be about?" (we'll create this together)

#### Design Preferences (Optional but Recommended)
- **Accent color**: Hex or name ("blue", "purple", "green")
- **Font preference**: System fonts (default), serif, or specific font
- **Dark mode preference**: Does it need dark mode? (default yes)

### Phase 2: Repository Setup

#### Step 1: Fork the Repo
Tell the user:
```
Visit: https://github.com/andrewbeers/blog
Click "Fork" in the top-right
Clone your fork locally:
  git clone https://github.com/[YOUR_USERNAME]/blog
  cd blog
```

#### Step 2: Update Metadata Files

**File: `data/authors.json`**
- Replace the example author with the user's info
- Format:
  ```json
  [
    {
      "id": "[author_id]",
      "name": "[author_name]",
      "bio": "[author_bio]",
      "email": "[author_email]"
    }
  ]
  ```

**File: `data/categories.json`**
- Replace with the user's categories
- Format:
  ```json
  [
    {
      "id": "[slug]",
      "name": "[display_name]",
      "description": "[description]"
    }
  ]
  ```

**File: `index.html`**
- Update the `<title>` to the user's blog name
- Update the `<meta name="description">` to the blog tagline
- Update the `.site-title` text to the user's blog name
- The manifest is auto-generated, so don't change it manually

**File: `package.json` (optional)**
- Update `"name"` to the blog repo name
- Update `"description"` to the blog tagline
- Update `"author"` to the user's name

### Step 3: Customize Styles (if desired)

**File: `styles/main.css`**
- If user chose a custom accent color, update the CSS variable:
  ```css
  :root {
    --accent: #6366f1; /* Change to user's color */
  }
  ```
- If user wants serif fonts, change `--serif` font-family
- Other customizations can wait—this is just the bare minimum

### Step 4: Create the First Post

Ask the user for details about their first post:
- **Topic**: What should it be about?
- **Tone**: Formal, casual, technical, conversational?
- **Length**: Short (~500 words), medium (~1000), long (1500+)?

Then:
1. Write the post in markdown (or use Claude to generate it)
2. Create the file: `posts/[category]/[slug].md`
3. Add proper frontmatter:
   ```markdown
   ---
   title: "[Post Title]"
   date: [YYYY-MM-DD]
   author: [author_id]
   category: [category_id]
   slug: [slug]
   ---

   # Content starts here...
   ```
4. Update `posts/manifest.json` to include the post:
   ```json
   {
     "category": "[category_id]",
     "slug": "[slug]",
     "title": "[Post Title]",
     "date": "[YYYY-MM-DD]",
     "author": "[author_id]"
   }
   ```

### Phase 3: Local Preview

Tell the user:
```
In one terminal, start a local server:
  python3 -m http.server 8000

Then open:
  http://localhost:8000
```

You (the agent) should:
1. Run the preview server
2. Navigate to the homepage in Claude's browser
3. Show the user a screenshot
4. Check that:
   - Blog title appears correctly
   - Categories show up
   - First post is listed
   - Clicking the post loads it correctly
   - Dark mode works (toggle in browser dev tools or settings)

Ask the user: "Does this look right? Any changes you'd like to make?"

Iterate on:
- Colors/styling
- Wording
- Layout
- Typography

### Phase 4: GitHub Pages Setup

Tell the user:
```
1. Push your changes to GitHub:
   git add .
   git commit -m "Initial blog setup"
   git push origin main

2. Go to your repo on GitHub
3. Settings → Pages
4. Under "Build and deployment":
   - Source: "Deploy from a branch"
   - Branch: "main", folder: "/ (root)"
5. Wait 1 minute for GitHub to deploy

Your blog will be live at:
  https://[username].github.io/blog/
```

You should:
1. Wait for the user to complete these steps
2. Navigate to their live URL
3. Verify the blog is live
4. Take a screenshot
5. Celebrate! 🎉

## Post-Setup Workflow

Once setup is done, the user's workflow is:

1. **Add a new post**: "Write a post about [topic]"
   - You create the file, update manifest
   - Run preview, show user
   - Ask for feedback/iterations
   - Commit and push when ready

2. **Add a category**: "Add a category for [name]"
   - Update `data/categories.json`
   - Preview to show it in the sidebar
   - Commit and push

3. **Customize design**: "Make [element] [description]"
   - Edit CSS
   - Preview live
   - Commit and push

4. **Always preview first**, then publish (push to GitHub)

## Important Constraints

### Zero Dependencies
- No npm, pip, gem, or any package manager
- All code is plain HTML/CSS/JavaScript
- If you're tempted to add a library, use vanilla JS instead
- Example: Don't suggest highlight.js for code syntax highlighting; instead, add a simple regex-based highlighter in plain JS

### Browser-Side Markdown Parsing
- Posts are `.md` files with frontmatter
- The browser parses markdown at load time
- This eliminates the build step entirely
- Our parser is simple, not a CommonMark spec implementation
  - Bold, italic, headers, lists, links, code blocks work
  - If something's not supported, we add it (in JavaScript)

### File Structure (Don't Change)
```
posts/
  manifest.json        ← Lists all posts (auto-updated when adding posts)
  [category]/
    [slug].md          ← Post file (markdown + frontmatter)

data/
  categories.json      ← Category registry
  authors.json         ← Author registry

index.html             ← Homepage (lists posts from manifest)
post.html              ← Post template (uses query params to load posts)
landing.html           ← Marketing page (leave alone for now)
developer.html         ← Technical deep-dive (leave alone)
usage.html             ← User guide (leave alone)

styles/
  main.css             ← Global styles (OK to customize)

js/
  markdown.js          ← Markdown parser
  frontmatter.js       ← Frontmatter extractor
  post-render.js       ← Post rendering logic
  home-render.js       ← Homepage rendering logic
```

## Common Customizations

### Change the accent color
Edit `styles/main.css`:
```css
:root {
  --accent: #6366f1; /* Change to user's color */
}
```

### Change the font
Edit `styles/main.css`:
```css
:root {
  --sans-serif: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --serif: "Georgia", serif;
}
```

Then update the `body` font-family.

### Add a feature (no new dependencies!)
Examples you can add in plain JavaScript:
- **Search**: Parse manifest, filter posts by keyword
- **Read time**: Count words in post, display "5 min read"
- **Social sharing**: Add Twitter/LinkedIn/etc share buttons
- **Table of contents**: Parse post headings, create auto-TOC
- **RSS feed**: Generate from manifest.json
- **Service worker**: Cache posts offline

All of these can be done in <100 lines of vanilla JavaScript.

## Troubleshooting

### "The post isn't showing on the homepage"
**Cause**: The post is in `posts/[category]/[slug].md`, but not in `posts/manifest.json`
**Fix**: Add an entry to `manifest.json` with the post's metadata

### "The preview doesn't load"
**Cause**: The local server isn't running
**Fix**: Make sure the user is running `python3 -m http.server 8000` in the blog directory

### "GitHub Pages isn't showing my changes"
**Cause**: GitHub Pages is still building (usually takes 30 seconds) or settings aren't configured correctly
**Fix**: 
- Wait a minute and refresh
- Check Settings → Pages and make sure "Deploy from a branch" is enabled for `main` branch

### "Dark mode looks weird"
**Cause**: The user added custom colors but didn't update the dark mode CSS
**Fix**: In `main.css`, find the `@media (prefers-color-scheme: dark)` block and update colors there too

## Success Criteria

A successful setup means:
- ✅ User can navigate to their blog at the GitHub Pages URL
- ✅ Homepage displays blog name, tagline, and categories
- ✅ At least one post is published and readable
- ✅ Clicking a post loads it fully
- ✅ Dark mode works
- ✅ Mobile layout is responsive
- ✅ User knows how to add new posts (by talking to you, the agent)
- ✅ User knows GitHub workflow is: edit locally → commit → push → live

## What NOT to Do

- ❌ Don't add npm/pip/gem dependencies
- ❌ Don't suggest build tools or bundlers
- ❌ Don't modify the core markdown parser unless essential
- ❌ Don't change the routing (query params are intentional)
- ❌ Don't over-engineer; simple is better
- ❌ Don't skip local preview; always show the user their blog before publishing
- ❌ Don't push to GitHub without user approval

## Remember

- **The user shouldn't need to touch the command line** (except git clone, which I showed them). You run the server, make the commits, push to GitHub.
- **They talk to you in natural language.** No markdown syntax, no file paths, no git commands. They say "Write a post about..." and you make it happen.
- **Always preview before publishing.** Show them what it looks like. Get their feedback. Iterate.
- **It's just HTML/CSS/JavaScript.** There's no magic. They can always fork, customize, and own it completely.

## Example Setup Conversation

> **User**: "I want to start a blog about AI and machine learning."
>
> **You**: "Great! Let's set it up. First, some quick questions:
> - What's your name?
> - What's your email?
> - What categories do you want? (I suggest: AI, ML, Research, Personal)
> - What should your first post be about?"
>
> **User**: "I'm Jane Doe (jane@example.com). Categories: AI, ML, Career, Life. First post: 'Why I Got Into Machine Learning'"
>
> **You**: *[Forks repo, creates directories, updates metadata files, writes first post, runs preview]*
> "Here's your blog! [screenshot] Does it look good? Any changes?"
>
> **User**: "The purple is too bright. Can you make it darker?"
>
> **You**: *[Updates CSS, refreshes preview]* "Better? [screenshot]"
>
> **User**: "Perfect!"
>
> **You**: *[Pushes to GitHub, waits for deploy, shows live URL]* "Your blog is live! You can now add posts anytime by talking to me. Just tell me what you want to write about."
