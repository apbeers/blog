# Stormtrooper design guide

This site's visual style is called **stormtrooper**: stark black, white, and grey with crisp,
high-contrast hierarchy. These are the rules to follow so a new feature still looks like it
belongs.
Read this before adding UI. The companion doc is [CONTRIBUTING.md](CONTRIBUTING.md), which covers
structure and workflow rather than appearance.

Everything here is already in the CSS — this file explains *which* value to reach for and *why*,
not new values to introduce.

## The one rule that matters most

**Never write a raw color. Always use a `var(--color-…)` token.**

Dark mode works by redefining those tokens in `css/variables.css`. A component built from tokens
gets dark mode for free and can never drift; a component with `#fff` or `rgb(20,20,20)` baked in
is broken in one theme and nobody notices until a screenshot. This is the single most common way
to make this site look wrong.

If you genuinely need a new color, add it as a token in **all three** places in
`css/variables.css` — `:root`, the `prefers-color-scheme: dark` media query, and
`:root[data-theme="dark"]` — then use the token. Never in just one.

## Color tokens

Surfaces and text:

| Token | Light | Dark | Use for |
|---|---|---|---|
| `--color-bg` | `#ffffff` | `#0d0d0e` | Page background |
| `--color-text` | `#0d0d0d` | `#f2f2f3` | Body text, headings, active states |
| `--color-text-muted` | `#6e6e80` | `#9a9aa5` | Secondary text, labels, inactive controls, hover-away state |
| `--color-border` | `#e5e5e5` | `#2a2a2e` | Hairlines, row dividers, table cells |
| `--color-border-strong` | `#d4d4d4` | `#3a3a3f` | A border that needs to read as emphasis |
| `--color-accent` | `#0d0d0d` | `#f2f2f3` | Deliberate emphasis; currently tracks text |
| `--color-link` | `#0d0d0d` | `#f2f2f3` | Links (they read as links via underline, not hue) |

Component surfaces:

| Token | Light | Dark | Use for |
|---|---|---|---|
| `--color-pill-bg` / `--color-pill-text` | `#f2f2f2` / `#4b4b55` | `#232326` / `#c6c6d0` | Category pills, dropdown panels |
| `--color-pill-bg-active` / `--color-pill-text-active` | `#0d0d0d` / `#ffffff` | `#f2f2f3` / `#0d0d0e` | Inverted chips, count badges |
| `--color-code-bg` | `#f5f5f7` | `#1c1c1f` | Inline code and code blocks |
| `--color-quote-border` | `#d4d4d4` | `#3a3a3f` | Blockquote left rule |
| `--color-table-header-bg` | `#f7f7f8` | `#1c1c1f` | Table header row |
| `--color-admonition-bg` | `#f7f7f8` | `#17171a` | Admonition callout background |

Admonition accents — the **only** hued colors in the system, and they exist purely to distinguish
callout severity. Do not borrow them for general UI:

`--color-note` / `--color-info` (blue), `--color-tip` (green), `--color-important` (violet),
`--color-warning` / `--color-caution` (amber), `--color-danger` (red).

Each is lightened for dark mode so it stays legible on a near-black background — if you add
another, do the same rather than reusing the light value.

## Stormtrooper palette: deliberately monochrome

Black, white, and greys, with hue reserved for admonitions. Meaning is carried by **weight,
size, and spacing**, not color. A new control that introduces a brand color, a colored button, or
a colored focus ring will look foreign here. Emphasis is `--color-text`; de-emphasis is
`--color-text-muted`; that pair covers almost everything.

## Spacing

Use the scale. Do not invent one-off pixel values.

`--space-1: 4px` · `--space-2: 8px` · `--space-3: 12px` · `--space-4: 20px` ·
`--space-5: 32px` · `--space-6: 48px` · `--space-7: 72px`

Rough intent: `1–2` within a component, `3–4` between related elements, `5–6` between sections.

`--gutter: 20px` is the page's horizontal inset — use it, rather than repeating `20px`, for
anything that must line up with the page edge.

## Type

- Body is `17px` on `--font-sans` (system stack). Code uses `--font-mono`.
- Established sizes, in the order you'll usually want them:
  `0.75rem` badges · `0.8rem` small labels · `0.85rem` fine print ·
  `0.9rem` secondary UI · `0.95rem` default UI text · `1rem` panel options ·
  `1.05rem` article prose · `1.3rem`/`1.35rem`/`1.6rem` headings
- Large titles use `clamp()` so they scale with the viewport:
  page title `clamp(2.5rem, 5vw, 4rem)`, article title `clamp(1.9rem, 4vw, 2.6rem)`.
- Headings are `600`, never `700` — the site has no bold-black weight.
- Tight tracking on large text (`letter-spacing: -0.01em` to `-0.02em`); wide tracking
  (`0.03em`–`0.05em`) **only** on uppercase micro-labels. Never set wide tracking on
  sentence-case text.

## Shape and depth

- Radii: `4px` inline code · `8px` blocks (code, images, admonitions) · `12px` dropdown panels ·
  `999px` pills and badges.
- The site is **flat**. There are no borders-plus-shadows, no gradients, no card chrome. The one
  shadow is on floating dropdown panels (`0 8px 24px rgb(0 0 0 / 0.10)`), because they overlap
  content and need to detach from it. Don't add shadows to inline elements.
- Separation is done with a `1px solid var(--color-border)` hairline, not a box.

## Interaction

- Hover on a dark control goes **muted**, not darker: `color: var(--color-text-muted)`.
- Active/selected is `--color-text` plus `font-weight: 600`.
- Transitions are `0.15s ease`, and only on `color`, `background-color`, or `transform`.
- Any transition or animation needs a `@media (prefers-reduced-motion: reduce)` escape.
- Every disclosure control (dropdown, toggle) sets `aria-expanded`, `aria-controls`, and closes
  on both `Escape` and outside click, returning focus to its trigger. Copy the pattern in
  `js/posts-index.js` rather than inventing another.
- Icons are inline SVG on a `0 0 24 24` viewBox, `16`–`18px` rendered, drawn with
  `stroke="currentColor"` at `1.6`–`2` — never an icon font, never a raster image. Mark them
  `aria-hidden="true"` and put the accessible name on the control.

## Layout

- `--page-max-width: 1400px` centred, `--prose-max-width: 720px` for article text.
- Breakpoints: `740px` (tablet — where the desktop layout begins), `1024px` (full desktop
  sizing), `1600px` (ultrawide). Match these; don't add a fourth.
- **740px, not the usual 768**, so that every iPad held vertically gets the desktop layout — the
  narrowest is the iPad mini at 744 CSS px.
- **Anything that reveals the full-height fixed sidebar must pair the width with
  `(min-height: 600px)`.** A phone in landscape is also 740px+ wide but only ~400px tall, and a
  sidebar spanning the viewport height has nowhere to go there. The height guard admits every
  iPad in either orientation while leaving landscape phones on the mobile layout. The queries
  showing `.article-toc` and hiding `.mobile-toc` must stay identical, or some viewport gets
  both table-of-contents treatments, or neither.
- **Derive positions from tokens.** A `position: fixed` element aligned to the centred container
  must compute its offset from `--page-max-width`, as `.article-toc` does — hardcoding half the
  width silently breaks alignment the moment the token changes.
- Anything that can overflow (tables, code, diagrams) scrolls inside its own container. The page
  body must never scroll horizontally.

## Gotchas that have actually bitten

- **`[hidden]` loses to any `display` declaration.** If you style an element with
  `display: flex` and also toggle `hidden`, it stays visible. Add an explicit
  `.thing[hidden] { display: none; }`.
- **Partials cannot contain `<script>`.** They're injected with `outerHTML`, and the HTML spec
  says scripts inserted that way never execute. Runtime behavior goes in the hydrate step in
  `js/include-partials.js`.
- **Both pages repeat the stylesheet `<link>` list.** Adding a stylesheet means editing
  `index.html` *and* `post.html`. This is deliberate: injecting CSS from JS would flash unstyled
  content on every load.
- **Verify in both themes.** Toggling `data-theme="dark"` on `<html>` is enough to check.
