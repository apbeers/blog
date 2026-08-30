/**
 * Parses a leading `---` frontmatter block out of a raw markdown file's text.
 * Supported value shapes: plain strings, quoted strings, and comma-free flat values.
 * This is intentionally tiny — it is not a general YAML parser.
 */
(function (global) {
  function parseFrontmatter(raw) {
    const text = raw.replace(/^﻿/, ""); // strip BOM if present
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

    if (!match) {
      return { data: {}, body: text };
    }

    const [, block, body] = match;
    const data = {};

    block.split(/\r?\n/).forEach((line) => {
      if (!line.trim()) return;
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) return;

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      const quoted = value.match(/^"(.*)"$/) || value.match(/^'(.*)'$/);
      if (quoted) {
        value = quoted[1];
      }

      data[key] = value;
    });

    return { data, body };
  }

  global.BlogFrontmatter = { parse: parseFrontmatter };
})(window);
