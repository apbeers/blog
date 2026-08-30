/**
 * Runs synchronously, before CSS is applied, to avoid a flash of the wrong
 * theme. Must be loaded as a plain blocking <script src> placed before the
 * page's stylesheet <link> tags (no defer/async) -- see any page's <head>.
 *
 * If the visitor has previously chosen a theme (js/theme-toggle.js writes a
 * "theme" cookie), apply it via data-theme on <html>. Otherwise leave
 * data-theme unset so css/variables.css's prefers-color-scheme media query
 * follows the OS/browser setting.
 */
(function () {
  var match = document.cookie.match(/(?:^|; )theme=(light|dark)(?:;|$)/);
  if (match) {
    document.documentElement.setAttribute("data-theme", match[1]);
  }
})();
