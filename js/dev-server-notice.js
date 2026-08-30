/**
 * Detects the common mistake of opening a page straight from disk
 * (file:///path/to/index.html, e.g. by double-clicking it in Finder) instead
 * of through a local HTTP server. Browsers block fetch()/XHR to other local
 * files when the page itself is loaded over file://, so every fetch() this
 * site makes (manifest.json, categories.json, content.md, the header/footer
 * partials) fails silently with a cross-origin error in that case. This is a
 * browser security rule, not a bug -- GitHub Pages always serves over https://
 * so this never appears there. Show a banner explaining the fix instead of
 * leaving visitors looking at "Could not load posts."
 */
(function () {
  if (window.location.protocol !== "file:") return;

  const bar = document.createElement("div");
  bar.className = "dev-notice";
  bar.innerHTML =
    'This page was opened directly from disk (<code>file://</code>), so the browser blocks ' +
    "the requests this site uses to load Markdown/JSON content — that's a browser security " +
    "rule, not a bug here. Serve the repo over HTTP instead, from its root: " +
    "<code>python3 serve.py</code>, then open <code>http://localhost:8000/</code>.";

  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertBefore(bar, document.body.firstChild);
  });
})();
