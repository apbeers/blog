---
title: Markdown Features Test
date: 2026-08-30
author: abeers
category: copy-this-idea
slug: markdown-features-test
summary: Every Markdown feature this blog supports, rendered live by the browser-side parser.
---

# Every Markdown Feature, Rendered Live

This page is the reference for what `js/markdown.js` supports — and it doubles as the
proof. Nothing here is a screenshot or a description. Every example below is Markdown in
the source file for this post, parsed in your browser at load time by a dependency-free
parser that is about 700 lines of plain JavaScript.

If a feature renders correctly on this page, it works.

## Strikethrough

This is ~~deleted text~~ that should show a line through it.

## Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another done item

## Superscript and Subscript

E = mc^2^ (superscript)

H~2~O (subscript)

## Line Breaks

This line ends with two spaces  
and should break to a new line.

## HTML Escaping

Backslash escapes: \*not italicized\* and \[not a link\]

Characters like \<, \>, and \& should be escaped.

Raw HTML is escaped rather than rendered, so a post can never inject markup or script into
the page: <img src=x onerror=alert(1)> appears as text, not as a tag.

## Autolinks

<https://github.com/andrewbeers/blog>

<hello@example.com>

## Reference-Style Links and Images

This is a [reference link][github-repo] to GitHub.

And a [reference to Claude][claude-link].

URLs containing balanced parentheses work too:
[the Foo (bar) article](https://en.wikipedia.org/wiki/Foo_(bar)).

[github-repo]: https://github.com/andrewbeers/blog "GitHub Repository"
[claude-link]: https://claude.ai "Claude AI"

## Emoji Codes

Happy face :smile: and heart :heart: and fire :fire: and tada :tada:

## Definition Lists

Term 1
: This is the definition of the first term

Markdown
: A lightweight markup language for creating formatted text

## Nested Lists

Lists nest to any depth, and a list item can hold whole blocks, not just a line of text.

- Outer item 1
  - Inner item 1a
  - Inner item 1b
- Outer item 2
  - Inner item 2a
    - Deeply nested item
  - Inner item 2b

Ordered lists nest inside bullets, and keep their own numbering:

- Setup
  1. Fork the repo
  2. Edit two JSON files
  3. Push
- Done

## 4-Space Code Block

    function hello() {
      console.log("This is indented code");
      return true;
    }

## Footnotes

This is a footnote reference[^1] and another one[^2]. Footnotes are numbered by order of
first reference and collected at the bottom of the page, each with a link back.

[^1]: This is the first footnote
[^2]: This is the second footnote with more detail

## Abbreviations

The HTML specification is maintained by the W3C. Hover either one.

*[HTML]: Hyper Text Markup Language
*[W3C]: World Wide Web Consortium

## Admonitions

A blockquote that opens with a recognized label becomes a callout.

> note: This is an informational note

> warning: This is a warning

> tip: This is a helpful tip

> danger: This is a dangerous action

GitHub's alert syntax works as well:

> [!IMPORTANT]
> Written as `> [!IMPORTANT]`, for anyone pasting Markdown over from GitHub.

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Bold | ✓ | Works great |
| Italic | ✓ | Also works |
| Links | ✓ | Full support |

Columns can be aligned with colons in the delimiter row:

| Left | Center | Right |
|:-----|:------:|------:|
| a | b | 1.00 |
| cc | dd | 22.50 |
| eee | fff | 333.75 |

## Fenced Code Blocks

```javascript
const greeting = "Hello, World!";
console.log(greeting);
```

```python
def hello():
    print("Hello from Python")
```

## Blockquote

> This is a regular blockquote that demonstrates the blockquote syntax in markdown.

## Horizontal Rules

---

## Combined Features

Here's a **bold phrase** with an *italic word* and ~~strikethrough~~ all together, plus
**bold containing *italic* and `code`** to show that inline markup nests.

E = mc^2^ is Einstein's famous equation for energy.

The HTML specification defines web standards.

Visit <https://example.com> for more info.

---

That is the whole feature set. If you fork this blog, everything above is available to you
with no build step, no dependencies, and no configuration — write it in a `.md` file and
the browser renders it.
