/**
 * Injects the shared header/footer into any page with a matching placeholder:
 * <div data-include="header"></div>
 *
 * Partials are injected with outerHTML, and the HTML spec says scripts inserted
 * that way never execute -- so a partial CANNOT contain a working <script>.
 * Anything a partial needs done at runtime belongs in the hydrate step below,
 * or in its own file loaded by the page. (The footer's copyright year used to
 * be an inline script in the partial and silently never ran.)
 *
 * Every page lives at the site root -- posts are all served through the single
 * root-level post.html -- so partial paths are plain relative paths.
 */
(function () {
  function hydrate() {
    document.querySelectorAll("[data-current-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  async function includePartials() {
    const nodes = document.querySelectorAll("[data-include]");
    await Promise.all(
      Array.from(nodes).map(async (node) => {
        const name = node.getAttribute("data-include");
        try {
          const res = await fetch(`partials/${name}.html`);
          if (!res.ok) throw new Error(`Failed to load partial: ${name}`);
          node.outerHTML = await res.text();
        } catch (err) {
          console.error(err);
        }
      })
    );
    hydrate();
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", includePartials);
  } else {
    includePartials();
  }
})();
