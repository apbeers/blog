/**
 * Homepage logic: fetches posts/manifest.json plus the category/author
 * registries, then renders the post list with category tabs, a Filter menu and
 * a Sort menu. Expects #filter-tabs, #post-list, and the Filter/Sort buttons
 * and panels in index.html.
 *
 * The tabs and the Filter panel's Category facet are two views of ONE piece of
 * state (`state.categories`), so they can't contradict each other: picking a
 * tab selects exactly that category, ticking boxes selects several, and the
 * active tab is derived from whatever the set currently holds.
 *
 * Filter facets are derived from the posts that exist, and a facet is only
 * offered once it has more than one value to choose between -- with a single
 * author, an "Author" column would just be one checkbox that does nothing.
 *
 * Note this page does NOT load js/markdown.js -- the homepage only ever shows
 * frontmatter fields, never rendered Markdown, so it has no reason to pull in
 * the parser.
 */
(function () {
  const esc = window.BlogUtil.escapeHtml;

  const SORTS = [
    { id: "newest", label: "Newest → Oldest" },
    { id: "oldest", label: "Oldest → Newest" },
    { id: "az", label: "Alphabetical (A–Z)" },
    { id: "za", label: "Alphabetical (Z–A)" },
  ];

  // Posts sharing a date are tie-broken on their manifest position, so
  // "Newest" keeps the order tools/sync.py indexed and "Oldest" is its exact
  // mirror. Leaving ties alone instead would make the two orders identical
  // whenever a batch of posts shares a date -- which reads as a broken control.
  // Breaking the tie on title would silently alphabetise that same batch.
  const COMPARE = {
    newest: (a, b) => cmp(b.date, a.date) || cmp(a._index, b._index),
    oldest: (a, b) => cmp(a.date, b.date) || cmp(b._index, a._index),
    az: (a, b) => a.title.localeCompare(b.title),
    za: (a, b) => b.title.localeCompare(a.title),
  };

  const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

  const state = { categories: new Set(), authors: new Set(), sort: "newest" };

  let posts = [];
  let categories = {};
  let authors = {};
  let facets = [];
  let snapshot = null; // filter state captured when the panel opened, for Cancel

  const el = {};

  // --- data ---------------------------------------------------------------

  function visiblePosts() {
    return posts
      .filter((p) => !state.categories.size || state.categories.has(p.category))
      .filter((p) => !state.authors.size || state.authors.has(p.author))
      .sort(COMPARE[state.sort]);
  }

  function buildFacets() {
    const distinct = (field) => [...new Set(posts.map((p) => p[field]))];
    return [
      {
        key: "categories",
        label: "Category",
        options: distinct("category").map((id) => ({
          id,
          label: (categories[id] || {}).label || id,
        })),
      },
      {
        key: "authors",
        label: "Author",
        options: distinct("author").map((id) => ({
          id,
          label: (authors[id] || {}).name || id,
        })),
      },
    ]
      .map((f) => ({ ...f, options: f.options.sort((a, b) => a.label.localeCompare(b.label)) }))
      .filter((f) => f.options.length > 1);
  }

  function activeFilterCount() {
    return facets.reduce((n, f) => n + state[f.key].size, 0);
  }

  // --- rendering ----------------------------------------------------------

  function renderList() {
    const list = visiblePosts();
    el.list.innerHTML = "";

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "post-row__empty";
      empty.textContent = "No posts match these filters.";
      el.list.appendChild(empty);
      return;
    }

    list.forEach((post) => {
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
      el.list.appendChild(a);
    });
  }

  function renderTabs() {
    const used = new Set(posts.map((p) => p.category));
    const tabs = [{ id: "all", label: "All" }].concat(
      Object.keys(categories)
        .filter((id) => used.has(id))
        .map((id) => ({ id, label: categories[id].label }))
    );

    el.tabs.innerHTML = "";
    tabs.forEach((tab) => {
      const button = document.createElement("button");
      button.type = "button";
      button.role = "tab";
      button.textContent = tab.label;
      button.dataset.categoryId = tab.id;
      button.addEventListener("click", () => {
        state.categories.clear();
        if (tab.id !== "all") state.categories.add(tab.id);
        syncAll();
      });
      el.tabs.appendChild(button);
    });
  }

  // The active tab is derived from the category set rather than stored, so the
  // tabs and the Filter panel can never disagree about what's selected.
  function syncTabs() {
    el.tabs.querySelectorAll("button").forEach((button) => {
      const id = button.dataset.categoryId;
      const active =
        id === "all"
          ? state.categories.size === 0
          : state.categories.size === 1 && state.categories.has(id);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function syncFilterCount() {
    const n = activeFilterCount();
    el.filterCount.hidden = n === 0;
    el.filterCount.textContent = String(n);
    el.filterToggle.setAttribute(
      "aria-label",
      n ? `Filter (${n} active)` : "Filter"
    );
  }

  function syncPanels() {
    el.filterPanel.querySelectorAll("input[type=checkbox]").forEach((box) => {
      box.checked = state[box.dataset.facet].has(box.value);
    });
    el.sortPanel.querySelectorAll("input[type=radio]").forEach((radio) => {
      radio.checked = radio.value === state.sort;
    });
  }

  function syncAll() {
    syncTabs();
    syncFilterCount();
    syncPanels();
    renderList();
  }

  // --- panels -------------------------------------------------------------

  function buildSortPanel() {
    el.sortPanel.innerHTML =
      `<div role="radiogroup" aria-label="Sort posts">` +
      SORTS.map(
        (s) => `
        <label class="tool-panel__option">
          <input type="radio" name="post-sort" value="${esc(s.id)}"${s.id === state.sort ? " checked" : ""}>
          <span>${esc(s.label)}</span>
        </label>`
      ).join("") +
      `</div>`;

    el.sortPanel.addEventListener("change", (e) => {
      if (e.target.name !== "post-sort") return;
      state.sort = e.target.value;
      renderList();
      closePanels({ focus: true });
    });
  }

  function buildFilterPanel() {
    if (!facets.length) {
      el.filterPanel.innerHTML =
        `<p class="tool-panel__empty">Nothing to filter by yet — that needs posts differing by category or author.</p>`;
      return;
    }

    el.filterPanel.innerHTML =
      `<div class="tool-panel__groups">` +
      facets
        .map(
          (f) => `
          <div class="tool-panel__group">
            <div class="tool-panel__group-title" id="facet-${esc(f.key)}">${esc(f.label)}</div>
            <div class="tool-panel__list" role="group" aria-labelledby="facet-${esc(f.key)}">
              ${f.options
                .map(
                  (o) => `
                <label class="tool-panel__option">
                  <input type="checkbox" data-facet="${esc(f.key)}" value="${esc(o.id)}">
                  <span>${esc(o.label)}</span>
                </label>`
                )
                .join("")}
            </div>
          </div>`
        )
        .join("") +
      `</div>
      <div class="tool-panel__footer">
        <button type="button" class="tool-panel__action" data-action="clear">Clear all</button>
        <button type="button" class="tool-panel__action" data-action="cancel">Cancel</button>
      </div>`;

    el.filterPanel.addEventListener("change", (e) => {
      const facet = e.target.dataset.facet;
      if (!facet) return;
      const set = state[facet];
      if (e.target.checked) set.add(e.target.value);
      else set.delete(e.target.value);
      syncTabs();
      syncFilterCount();
      renderList();
    });

    el.filterPanel.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (!action) return;
      if (action === "clear") {
        facets.forEach((f) => state[f.key].clear());
        syncAll();
        return;
      }
      if (action === "cancel") {
        restoreSnapshot();
        closePanels({ focus: true });
      }
    });
  }

  function takeSnapshot() {
    snapshot = {};
    facets.forEach((f) => (snapshot[f.key] = new Set(state[f.key])));
  }

  function restoreSnapshot() {
    if (!snapshot) return;
    facets.forEach((f) => (state[f.key] = new Set(snapshot[f.key])));
    syncAll();
  }

  function openPanel(toggle, panel) {
    closePanels();
    if (toggle === el.filterToggle) takeSnapshot();
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
  }

  function closePanels(opts) {
    [
      [el.filterToggle, el.filterPanel],
      [el.sortToggle, el.sortPanel],
    ].forEach(([toggle, panel]) => {
      if (panel.hidden) return;
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (opts && opts.focus) toggle.focus();
    });
  }

  function wirePanel(toggle, panel) {
    toggle.addEventListener("click", () => {
      if (panel.hidden) openPanel(toggle, panel);
      else closePanels();
    });
  }

  // --- init ---------------------------------------------------------------

  async function init() {
    el.tabs = document.getElementById("filter-tabs");
    el.list = document.getElementById("post-list");
    el.filterToggle = document.getElementById("filter-toggle");
    el.filterPanel = document.getElementById("filter-panel");
    el.filterCount = document.getElementById("filter-count");
    el.sortToggle = document.getElementById("sort-toggle");
    el.sortPanel = document.getElementById("sort-panel");
    if (!el.tabs || !el.list) return;

    try {
      const [manifestRes, categoriesRes, authorsRes] = await Promise.all([
        fetch("posts/manifest.json"),
        fetch("data/categories.json"),
        fetch("data/authors.json"),
      ]);
      posts = (await manifestRes.json()).map((p, i) => ({ ...p, _index: i }));
      categories = await categoriesRes.json();
      authors = await authorsRes.json();
    } catch (err) {
      console.error(err);
      const hint =
        window.location.protocol === "file:"
          ? " You're viewing this file directly from disk — see the notice above for how to serve it locally."
          : "";
      el.list.innerHTML = `<div class="state-message">Could not load posts.${hint}</div>`;
      return;
    }

    facets = buildFacets();

    renderTabs();
    buildSortPanel();
    buildFilterPanel();
    wirePanel(el.filterToggle, el.filterPanel);
    wirePanel(el.sortToggle, el.sortPanel);

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".list-tools__item")) closePanels();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePanels({ focus: true });
    });

    syncAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
