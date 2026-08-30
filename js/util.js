/**
 * Small helpers shared by more than one page. Kept separate from
 * js/markdown.js so the homepage doesn't have to load the whole Markdown
 * parser just to escape a few strings.
 *
 * Load this before any script that uses it (plain blocking <script>, so the
 * order in each page's <body> is what guarantees availability).
 */
(function (global) {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * A post's `date` frontmatter is a plain YYYY-MM-DD string. Parsing it with
   * an explicit midnight time keeps it in the reader's local timezone -- bare
   * `new Date("2026-08-30")` is treated as UTC, which renders as the previous
   * day for anyone west of Greenwich.
   *
   * monthStyle is "long" (article bylines) or "short" (the homepage list).
   */
  function formatDate(dateStr, monthStyle) {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: monthStyle || "long",
      day: "numeric",
    });
  }

  global.BlogUtil = { escapeHtml, formatDate };
})(window);
