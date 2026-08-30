/**
 * Wires up the header's dark-mode toggle button (#theme-toggle, from
 * partials/header.html). The button itself is injected asynchronously by
 * include-partials.js, so this waits for its "partials:loaded" event.
 *
 * Effective theme resolution order: an explicit data-theme attribute (set by
 * js/theme-init.js from a "theme" cookie) wins; otherwise it follows the
 * browser's prefers-color-scheme. Clicking the button always sets an
 * explicit choice from then on, persisted as a first-party cookie.
 */
(function () {
  var COOKIE_NAME = "theme";
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // ~1 year

  function getEffectiveTheme() {
    var explicit = document.documentElement.getAttribute("data-theme");
    if (explicit === "light" || explicit === "dark") return explicit;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.cookie =
      COOKIE_NAME + "=" + theme + "; max-age=" + COOKIE_MAX_AGE + "; path=/; SameSite=Lax";
  }

  function updateButton(button) {
    button.setAttribute("aria-pressed", getEffectiveTheme() === "dark" ? "true" : "false");
  }

  function wireUp() {
    var button = document.getElementById("theme-toggle");
    if (!button) return;

    updateButton(button);

    button.addEventListener("click", function () {
      setTheme(getEffectiveTheme() === "dark" ? "light" : "dark");
      updateButton(button);
    });

    // Keep the button's a11y state correct if the OS theme changes while the
    // page is open and the visitor has never made an explicit choice here.
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
      if (!document.documentElement.getAttribute("data-theme")) {
        updateButton(button);
      }
    });
  }

  document.addEventListener("partials:loaded", wireUp);
})();
