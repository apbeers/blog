/**
 * The site header is sticky (see .site-header in css/layout.css). Anything
 * that needs to stick directly below it -- e.g. the mobile TOC bar on
 * post.html -- reads the --header-height custom property this sets, since
 * the header's actual rendered height isn't a fixed value we can hardcode.
 */
(function () {
  function setHeaderHeightVar() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    document.documentElement.style.setProperty("--header-height", `${header.offsetHeight}px`);
  }

  document.addEventListener("partials:loaded", setHeaderHeightVar);
  window.addEventListener("resize", setHeaderHeightVar);
})();
