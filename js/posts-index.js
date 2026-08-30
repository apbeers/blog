/**
 * Homepage logic: fetches posts/manifest.json + data/categories.json, renders the
 * post list (newest first) and the category filter tabs. Expects these elements
 * to exist on the page: #filter-tabs, #post-list.
 *
 * Note this page does NOT load js/markdown.js -- the homepage only ever shows
 * frontmatter fields, never rendered Markdown, so it has no reason to pull in
 * the parser.
 */
(function () {
  const esc = window.BlogUtil.escapeHtml;

  function renderRow(post, categories) {
    const category = categories[post.category] || { label: post.category };
    const a = document.createElement("a");
    a.href = `post.html?category=${encodeURIComponent(post.category)}&slug=${encodeURIComponent(post.slug)}`;

    a.innerHTML = `
      <div class="post-row">
        <div class="post-row__meta">
          <div class="post-row__category">${esc(category.label)}</div>
          <time class="post-row__date">${window.BlogUtil.formatDate(post.date, "short")}</time>
        </div>
        <div>
          <div class="post-row__title">${esc(post.title)}</div>
          <div class="post-row__summary">${esc(post.summary)}</div>
        </div>
      </div>
    `;
    return a;
  }

  function renderList(listEl, posts, categories) {
    listEl.innerHTML = "";
    if (!posts.length) {
      const empty = document.createElement("div");
      empty.className = "post-row__empty";
      empty.textContent = "No posts in this category yet.";
      listEl.appendChild(empty);
      return;
    }
    posts.forEach((post) => listEl.appendChild(renderRow(post, categories)));
  }

  function renderTabs(tabsEl, categories, posts, listEl) {
    const usedCategoryIds = new Set(posts.map((p) => p.category));
    const tabs = [{ id: "all", label: "All" }].concat(
      Object.keys(categories)
        .filter((id) => usedCategoryIds.has(id))
        .map((id) => ({ id, label: categories[id].label }))
    );

    tabsEl.innerHTML = "";
    tabs.forEach((tab, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = tab.label;
      button.dataset.categoryId = tab.id;
      if (index === 0) button.classList.add("is-active");
      button.addEventListener("click", () => {
        tabsEl.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
        button.classList.add("is-active");
        const filtered = tab.id === "all" ? posts : posts.filter((p) => p.category === tab.id);
        renderList(listEl, filtered, categories);
      });
      tabsEl.appendChild(button);
    });
  }

  async function init() {
    const tabsEl = document.getElementById("filter-tabs");
    const listEl = document.getElementById("post-list");
    if (!tabsEl || !listEl) return;

    try {
      const [manifestRes, categoriesRes] = await Promise.all([
        fetch("posts/manifest.json"),
        fetch("data/categories.json"),
      ]);
      const manifest = await manifestRes.json();
      const categories = await categoriesRes.json();

      const posts = manifest
        .slice()
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

      renderTabs(tabsEl, categories, posts, listEl);
      renderList(listEl, posts, categories);
    } catch (err) {
      console.error(err);
      const hint =
        window.location.protocol === "file:"
          ? " You're viewing this file directly from disk — see the notice above for how to serve it locally."
          : "";
      listEl.innerHTML = `<div class="state-message">Could not load posts.${hint}</div>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
