/**
 * Injects shared partials (header/footer) into any page that has the matching
 * placeholder elements. Usage: <div data-include="header"></div>
 * Path is relative to the page's location, so pages at different folder depths
 * pass a `data-root` attribute on <body> (e.g. data-root="../../") pointing back
 * to the site root.
 */
(function () {
  function rootPath() {
    return document.body.getAttribute("data-root") || "";
  }

  async function includePartials() {
    const nodes = document.querySelectorAll("[data-include]");
    await Promise.all(
      Array.from(nodes).map(async (node) => {
        const name = node.getAttribute("data-include");
        try {
          const res = await fetch(`${rootPath()}partials/${name}.html`);
          if (!res.ok) throw new Error(`Failed to load partial: ${name}`);
          const html = await res.text();
          node.outerHTML = html.replace(/\{\{ROOT\}\}/g, rootPath());
        } catch (err) {
          console.error(err);
        }
      })
    );
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", includePartials);
  } else {
    includePartials();
  }
})();
