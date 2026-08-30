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
  function formatDate(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  // The header (and, on mobile, the TOC toggle bar under it) are sticky, so
  // both scroll-spy detection and TOC-link jumps need to account for how
  // much of the viewport's top they cover -- otherwise a heading can end up
  // hidden behind them right when you jump to it.
  function getStickyOffset() {
    const header = document.querySelector(".site-header");
    const mobileToc = document.getElementById("mobile-toc");
    let offset = header ? header.offsetHeight : 0;
    if (mobileToc && getComputedStyle(mobileToc).display !== "none") {
      offset += mobileToc.offsetHeight;
    }
    return offset;
  }

  function closeMobileToc() {
    const root = document.getElementById("mobile-toc");
    const toggleBtn = document.getElementById("mobile-toc-toggle");
    if (!root || !toggleBtn) return;
    root.classList.remove("is-open");
    toggleBtn.setAttribute("aria-expanded", "false");
  }

  function setupScrollSpy(headingsList, tocListEls) {
    const headings = Array.from(headingsList); // querySelectorAll order == document order, relied on below
    const linkByHeadingId = new Map();
    headings.forEach((h) => {
      const links = tocListEls.flatMap((listEl) => Array.from(listEl.querySelectorAll(`a[href="#${h.id}"]`)));
      linkByHeadingId.set(h.id, links);
    });

    // On mobile, the collapsed toggle bar shows the current section's text
    // in place of the static "On this page" label.
    const currentLabelEl = document.getElementById("mobile-toc-current");
    const defaultLabel = currentLabelEl ? currentLabelEl.textContent : "";

    let activeId = null;
    const setActive = (id) => {
      if (id === activeId) return;
      activeId = id;
      tocListEls.forEach((listEl) => {
        listEl.querySelectorAll("a.is-active").forEach((link) => link.classList.remove("is-active"));
      });
      if (!id) {
        if (currentLabelEl) currentLabelEl.textContent = defaultLabel;
        return;
      }
      const links = linkByHeadingId.get(id) || [];
      links.forEach((link) => link.classList.add("is-active"));
      if (currentLabelEl && links.length) currentLabelEl.textContent = links[0].textContent;
    };

    const lastHeadingId = headings[headings.length - 1].id;

    // Deliberately not IntersectionObserver: with several headings crossing
    // the trigger line within one scroll, its batched entries can arrive out
    // of document order, letting the wrong one win. A direct geometric scan
    // -- the last heading that has scrolled past the line below the sticky
    // bars -- is simple and unambiguous.
    function update() {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        setActive(lastHeadingId);
        return;
      }
      const triggerLine = getStickyOffset() + 16;
      let current = null;
      for (const h of headings) {
        const top = h.getBoundingClientRect().top;
        // If heading is above trigger line (has scrolled past sticky header), mark it as current
        if (top < triggerLine) {
          current = h.id;
        } else {
          // Stop checking once we hit a heading below the trigger line
          break;
        }
      }
      // If no heading has scrolled past yet, highlight the first one
      if (!current && headings.length) {
        current = headings[0].id;
      }
      setActive(current);
    }

    update();

    // A click-triggered jump (see jumpTo below) animates the scroll over
    // several hundred ms; it sets the active state itself immediately rather
    // than waiting for that scroll to settle, so the natural scroll handler
    // is suppressed for the duration to avoid it flickering through
    // whatever headings pass by mid-flight.
    let suppressed = false;
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          if (!suppressed) update();
          ticking = false;
        });
      },
      { passive: true }
    );

    function jumpTo(id, { smooth = true } = {}) {
      const target = document.getElementById(id);
      if (!target) return;
      suppressed = true;
      setActive(id);
      const top = target.getBoundingClientRect().top + window.scrollY - getStickyOffset() - 16;
      window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });

      const resume = () => {
        suppressed = false;
        // Don't immediately call update() — wait for the next scroll event.
        // The jumpTo already set the correct active section, and calling update()
        // right away can cause it to pick the wrong section if scroll hasn't settled.
      };
      if (smooth && "onscrollend" in window) {
        window.addEventListener("scrollend", resume, { once: true });
      } else {
        // Use longer timeout for smooth scrolls to account for animation duration
        // Smooth scroll distance scales with scroll distance, so use generous timeout
        setTimeout(resume, smooth ? 1500 : 50);
      }
    }

    return { setActive, jumpTo };
  }

  function setupMobileToggle() {
    const root = document.getElementById("mobile-toc");
    const toggleBtn = document.getElementById("mobile-toc-toggle");
    if (!root || !toggleBtn) return;

    toggleBtn.addEventListener("click", () => {
      const isOpen = root.classList.toggle("is-open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (e) => {
      if (!root.contains(e.target)) closeMobileToc();
    });
  }

  function buildToc(tocListEls, contentEl) {
    const headings = contentEl.querySelectorAll("h2, h3");
    const mobileToc = document.getElementById("mobile-toc");
    if (!headings.length) {
      tocListEls.forEach((listEl) => {
        const wrapper = listEl.closest("#post-toc");
        if (wrapper) wrapper.style.display = "none";
      });
      if (mobileToc) mobileToc.style.display = "none";
      return;
    }
    headings.forEach((h) => {
      tocListEls.forEach((listEl) => {
        const link = document.createElement("a");
        link.href = `#${h.id}`;
        link.textContent = h.textContent;
        if (h.tagName === "H3") link.classList.add("is-sub");
        listEl.appendChild(link);
      });
    });

    const scrollSpy = setupScrollSpy(headings, tocListEls);

    // Intercept TOC-link clicks (desktop sidebar and mobile dropdown alike)
    // to scroll with the sticky-offset correction above, instead of the
    // browser's default anchor jump, which doesn't know about the sticky
    // header/toggle bar and would land the heading half-hidden behind them.
    tocListEls.forEach((listEl) => {
      listEl.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (!link) return;
        e.preventDefault();
        const id = link.getAttribute("href").slice(1);
        closeMobileToc();
        scrollSpy.jumpTo(id);
        history.pushState(null, "", `#${id}`);
      });
    });

    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      requestAnimationFrame(() => scrollSpy.jumpTo(id, { smooth: false }));
    }

    setupMobileToggle();
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
    const tocListEls = [document.getElementById("post-toc-list"), document.getElementById("mobile-toc-list")].filter(
      Boolean
    );
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
          <span class="byline__author">${window.BlogMarkdown.escapeHtml(author.name)}</span>
          <span aria-hidden="true">&middot;</span>
          <time datetime="${window.BlogMarkdown.escapeHtml(data.date || "")}">${formatDate(data.date || "")}</time>
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
      if (tocListEls.length) buildToc(tocListEls, contentEl);
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
