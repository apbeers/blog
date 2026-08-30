/**
 * Logic for the single shared post.html page. Every post is viewed as
 * post.html?category=<id>&slug=<slug>, which maps directly to the file
 * posts/<category>/<slug>.md -- there is no per-post HTML file.
 *
 * Because there's only one post.html, this also sets <title>, the meta
 * description/OG tags, the canonical link, and the JSON-LD block in the
 * <head> at runtime from the post's frontmatter, in addition to rendering
 * the byline, article body, and heading-based TOC into the page.
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

  function updateHeadMeta({ title, summary, date, authorName, url }) {
    document.title = title;

    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", summary);

    const canonical = document.getElementById("meta-canonical");
    if (canonical) canonical.setAttribute("href", url);

    const ogTitle = document.getElementById("meta-og-title");
    if (ogTitle) ogTitle.setAttribute("content", title);

    const ogDescription = document.getElementById("meta-og-description");
    if (ogDescription) ogDescription.setAttribute("content", summary);

    const ogUrl = document.getElementById("meta-og-url");
    if (ogUrl) ogUrl.setAttribute("content", url);

    const published = document.getElementById("meta-article-published");
    if (published) published.setAttribute("content", date);

    const author = document.getElementById("meta-article-author");
    if (author) author.setAttribute("content", authorName);

    const ldJson = document.getElementById("meta-ld-json");
    if (ldJson) {
      ldJson.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: title,
        description: summary,
        datePublished: date,
        author: { "@type": "Person", name: authorName },
      });
    }
  }

  async function init() {
    const categoryEl = document.getElementById("post-category");
    const titleEl = document.getElementById("post-title");
    const bylineEl = document.getElementById("post-byline");
    const contentEl = document.getElementById("post-content");
    const tocListEl = document.getElementById("post-toc-list");
    if (!contentEl) return;

    const params = new URLSearchParams(window.location.search);
    const categoryId = params.get("category");
    const slug = params.get("slug");

    if (!categoryId || !slug) {
      contentEl.innerHTML =
        '<p class="state-message">No post specified. Go back to <a href="index.html">all posts</a>.</p>';
      return;
    }

    try {
      const [mdRes, authorsRes, categoriesRes] = await Promise.all([
        fetch(`posts/${categoryId}/${slug}.md`),
        fetch("data/authors.json"),
        fetch("data/categories.json"),
      ]);

      if (!mdRes.ok) throw new Error(`Post not found: ${categoryId}/${slug}`);

      const raw = await mdRes.text();
      const authors = await authorsRes.json();
      const categories = await categoriesRes.json();

      const { data, body } = window.BlogFrontmatter.parse(raw);
      const author = authors[data.author] || { name: data.author || "Unknown" };
      const category = categories[data.category] || { label: data.category || categoryId };

      if (categoryEl) categoryEl.textContent = category.label;
      if (titleEl) titleEl.textContent = data.title || "";
      if (bylineEl) {
        bylineEl.innerHTML = `
          <span class="byline__author">${escapeHtml(author.name)}</span>
          <span aria-hidden="true">&middot;</span>
          <time datetime="${escapeHtml(data.date || "")}">${formatDate(data.date || "")}</time>
        `;
      }

      updateHeadMeta({
        title: data.title || "Untitled post",
        summary: data.summary || "",
        date: data.date || "",
        authorName: author.name,
        url: `${window.location.origin}${window.location.pathname}?category=${encodeURIComponent(categoryId)}&slug=${encodeURIComponent(slug)}`,
      });

      contentEl.innerHTML = window.BlogMarkdown.render(body);
      if (tocListEl) buildToc(tocListEl, contentEl);
    } catch (err) {
      console.error(err);
      const hint =
        window.location.protocol === "file:"
          ? " You're viewing this file directly from disk — see the notice above for how to serve it locally."
          : "";
      contentEl.innerHTML = `<p class="state-message">Could not load this post.${hint}</p>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
