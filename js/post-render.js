/**
 * Article page logic. Expects the page's <body> to carry:
 *   data-root  -- relative path back to the site root, e.g. "../../"
 * and these elements to exist:
 *   #post-category, #post-title, #post-byline, #post-content, #post-toc, #post-toc-list
 * Fetches the sibling content.md (same folder as this page), parses frontmatter +
 * markdown body, and renders the byline, article body, and a heading-based TOC.
 */
(function () {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function rootPath() {
    return document.body.getAttribute("data-root") || "";
  }

  function buildToc(tocListEl, contentEl) {
    const headings = contentEl.querySelectorAll("h2, h3");
    if (!headings.length) {
      const wrapper = tocListEl.closest("#post-toc");
      if (wrapper) wrapper.style.display = "none";
      return;
    }
    headings.forEach((h) => {
      const link = document.createElement("a");
      link.href = `#${h.id}`;
      link.textContent = h.textContent;
      if (h.tagName === "H3") link.classList.add("is-sub");
      tocListEl.appendChild(link);
    });
  }

  async function init() {
    const categoryEl = document.getElementById("post-category");
    const titleEl = document.getElementById("post-title");
    const bylineEl = document.getElementById("post-byline");
    const contentEl = document.getElementById("post-content");
    const tocListEl = document.getElementById("post-toc-list");
    if (!contentEl) return;

    try {
      const [mdRes, authorsRes, categoriesRes] = await Promise.all([
        fetch("./content.md"),
        fetch(`${rootPath()}data/authors.json`),
        fetch(`${rootPath()}data/categories.json`),
      ]);

      const raw = await mdRes.text();
      const authors = await authorsRes.json();
      const categories = await categoriesRes.json();

      const { data, body } = window.BlogFrontmatter.parse(raw);
      const author = authors[data.author] || { name: data.author || "Unknown" };
      const category = categories[data.category] || { label: data.category || "" };

      if (categoryEl) categoryEl.textContent = category.label;
      if (titleEl) titleEl.textContent = data.title || "";
      if (bylineEl) {
        bylineEl.innerHTML = `
          <span class="byline__author">${escapeHtml(author.name)}</span>
          <span aria-hidden="true">&middot;</span>
          <time datetime="${escapeHtml(data.date || "")}">${formatDate(data.date || "")}</time>
        `;
      }

      contentEl.innerHTML = window.BlogMarkdown.render(body);
      if (tocListEl) buildToc(tocListEl, contentEl);
    } catch (err) {
      console.error(err);
      contentEl.innerHTML = '<p class="state-message">Could not load this post.</p>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
