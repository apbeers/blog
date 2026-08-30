/**
 * A dependency-free Markdown -> HTML renderer.
 *
 * Blocks:  ATX headings (with optional {#id .class} attribute lists), paragraphs,
 *          fenced and 4-space-indented code, blockquotes, admonitions/alerts,
 *          bullet/ordered/task lists (nested, tight and loose), definition lists,
 *          tables (with column alignment), horizontal rules, footnote definitions.
 * Inline:  bold, italic, strikethrough, superscript, subscript, inline code,
 *          inline and reference-style links and images, autolinks, footnote
 *          references, abbreviations, emoji shortcodes, hard line breaks,
 *          backslash escapes.
 *
 * SECURITY / IMPLEMENTATION NOTE
 * -----------------------------
 * Everything that survives from the source document is HTML-escaped. The inline
 * pass works by replacing markup with sentinel tokens ("slots") that hold the
 * generated *tags only* -- never the text between them. So `**a < b**` becomes
 * <slot:strong> a < b <slot:/strong>, the "a < b" is still plain source text when
 * escapeHtml runs at the end, and nested inline markup inside the emphasis still
 * gets parsed by the passes that follow. Constructs whose contents must not be
 * reinterpreted (code spans, autolinks, images) are held whole, already escaped.
 *
 * Slot tokens use Unicode private-use code points, which cannot appear in a post
 * (they are stripped from the input first), match no Markdown syntax, and are not
 * touched by escapeHtml -- unlike the ASCII placeholders an earlier version used,
 * which the bold rule happily ate.
 *
 * No lookbehind assertions are used anywhere, for the sake of older browsers.
 */
(function (global) {
  "use strict";

  var SLOT_OPEN = "\uE000";
  var SLOT_CLOSE = "\uE001";
  var SLOT_RE = /\uE000(\d+)\uE001/g;

  var EMOJI = {
    smile: "😄", smiley: "😃", grin: "😁", laughing: "😆", wink: "😉",
    blush: "😊", heart_eyes: "😍", sunglasses: "😎", thinking: "🤔",
    cry: "😢", sob: "😭", angry: "😠", scream: "😱", sleeping: "😴",
    heart: "❤️", broken_heart: "💔", star: "⭐", star2: "🌟", zap: "⚡",
    fire: "🔥", boom: "💥", sparkles: "✨", tada: "🎉", rocket: "🚀",
    thumbsup: "👍", "+1": "👍", thumbsdown: "👎", "-1": "👎", clap: "👏",
    wave: "👋", pray: "🙏", muscle: "💪", eyes: "👀", brain: "🧠",
    check: "✔️", white_check_mark: "✅", x: "❌", warning: "⚠️",
    bulb: "💡", bug: "🐛", wrench: "🔧", hammer: "🔨", lock: "🔒",
    key: "🔑", package: "📦", books: "📚", memo: "📝", pushpin: "📌",
    chart_with_upwards_trend: "📈", coffee: "☕", beer: "🍺", cake: "🎂",
    robot: "🤖", ghost: "👻", alien: "👽", skull: "💀", poop: "💩",
    dog: "🐶", cat: "🐱", unicorn: "🦄", snake: "🐍", whale: "🐳"
  };

  var ADMONITIONS = {
    note: "Note", info: "Info", tip: "Tip", important: "Important",
    warning: "Warning", caution: "Caution", danger: "Danger"
  };

  // Shared with the homepage; see js/util.js, which must load before this file.
  var escapeHtml = global.BlogUtil.escapeHtml;

  // Only allow URLs that can't execute script. Anything else becomes "#".
  function safeUrl(url) {
    var trimmed = String(url).trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^(https?|mailto|tel|ftp):/i.test(trimmed)) {
      return "#";
    }
    return trimmed;
  }

  // --- per-render state ----------------------------------------------------

  var usedSlugs = new Set();
  var references = {};      // reference-style link/image definitions
  var abbreviations = {};   // *[HTML]: Hyper Text Markup Language
  var footnotes = {};       // [^1]: text
  var footnoteOrder = [];   // ids in order of first reference, for numbering
  var abbrevRe = null;

  function slugify(text) {
    var base = String(text)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    if (!base) base = "section";

    var slug = base;
    var n = 2;
    while (usedSlugs.has(slug)) {
      slug = base + "-" + n;
      n += 1;
    }
    usedSlugs.add(slug);
    return slug;
  }

  // --- inline --------------------------------------------------------------

  // The passes below run in a deliberate order. These constraints are
  // load-bearing -- reordering them reintroduces real bugs:
  //
  //   1. code spans     first, so nothing inside `...` is reinterpreted
  //   2. hard breaks    before escapes, or a trailing "\" is eaten as an escape
  //   3. autolinks      before escaping, while <...> is still recognisable
  //   4. footnote refs  before superscript, or [^1]...[^2] is read as ^...^
  //   5. images/links   before backslash escapes, so \[ is not read as a link
  //   6. backslash      before emphasis, or \* becomes a tag instead of a "*"
  //   7. ~~ before ~    and ** before *, so the longer marker wins
  //   8. escapeHtml     last, over everything still in the stream
  //
  // Anything that must not be reparsed is held whole and pre-escaped; anything
  // that wraps content holds only its tags, leaving the text in the stream.
  function renderInline(text) {
    var slots = [];
    // Hold a finished HTML fragment; returns a token that no later pass matches.
    function hold(html) {
      slots.push(html);
      return SLOT_OPEN + (slots.length - 1) + SLOT_CLOSE;
    }
    // Wrap source text in held tags, leaving the text itself in the stream so it
    // still gets escaped and parsed for nested markup.
    function wrap(open, inner, close) {
      return hold(open) + inner + hold(close);
    }

    var out = String(text);

    // Code spans: contents are literal, so hold them whole and pre-escaped.
    out = out.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, function (_m, _ticks, code) {
      return hold("<code>" + escapeHtml(code.replace(/^ (.*) $/, "$1")) + "</code>");
    });

    // Hard line breaks: two+ trailing spaces, or a trailing backslash.
    out = out.replace(/(?: {2,}|\\)\n/g, function () {
      return hold("<br>") + "\n";
    });

    // Autolinks.
    out = out.replace(/<((?:https?|ftp):\/\/[^\s<>]+)>/gi, function (_m, url) {
      return hold('<a href="' + escapeHtml(safeUrl(url)) + '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(url) + "</a>");
    });
    out = out.replace(/<([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)>/g, function (_m, email) {
      return hold('<a href="mailto:' + escapeHtml(email) + '">' + escapeHtml(email) + "</a>");
    });

    // Footnote references: [^id]. Held before superscript so ^ can't tangle.
    out = out.replace(/\[\^([^\]\s]+)\]/g, function (m, id) {
      if (!Object.prototype.hasOwnProperty.call(footnotes, id)) return m;
      var idx = footnoteOrder.indexOf(id);
      if (idx === -1) {
        footnoteOrder.push(id);
        idx = footnoteOrder.length - 1;
      }
      var n = idx + 1;
      var slug = escapeHtml(id);
      return hold('<sup class="footnote-ref"><a href="#fn-' + slug + '" id="fnref-' + slug + '">' +
        n + "</a></sup>");
    });

    // Images (alt text is an attribute, so these are held whole).
    out = out.replace(/!\[([^\]]*)\]\(\s*((?:[^()\s]|\([^()\s]*\))*)(?:\s+"([^"]*)")?\s*\)/g, function (_m, alt, src, title) {
      return hold('<img src="' + escapeHtml(safeUrl(src)) + '" alt="' + escapeHtml(alt) + '"' +
        (title ? ' title="' + escapeHtml(title) + '"' : "") + ">");
    });
    out = out.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, function (m, alt, ref) {
      var def = references[(ref || alt).toLowerCase()];
      if (!def) return m;
      return hold('<img src="' + escapeHtml(safeUrl(def.url)) + '" alt="' + escapeHtml(alt) + '"' +
        (def.title ? ' title="' + escapeHtml(def.title) + '"' : "") + ">");
    });

    // Links: hold the tags, keep the label in the stream.
    out = out.replace(/\[([^\]]+)\]\(\s*((?:[^()\s]|\([^()\s]*\))*)(?:\s+"([^"]*)")?\s*\)/g, function (_m, label, href, title) {
      return wrap(anchor(href, title), label, "</a>");
    });
    out = out.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, function (m, label, ref) {
      var def = references[(ref || label).toLowerCase()];
      if (!def) return m;
      return wrap(anchor(def.url, def.title), label, "</a>");
    });
    // Shortcut reference links: [label], only when that label is defined.
    out = out.replace(/\[([^\]^][^\]]*)\]/g, function (m, label) {
      var def = references[label.toLowerCase()];
      if (!def) return m;
      return wrap(anchor(def.url, def.title), label, "</a>");
    });

    function anchor(href, title) {
      var url = safeUrl(href);
      var external = /^(https?|ftp):\/\//i.test(url);
      return '<a href="' + escapeHtml(url) + '"' +
        (title ? ' title="' + escapeHtml(title) + '"' : "") +
        (external ? ' target="_blank" rel="noopener noreferrer"' : "") + ">";
    }

    // Backslash escapes: after links (so \[ isn't read as one), before emphasis
    // (so \* doesn't turn into a tag).
    out = out.replace(/\\([\\`*_{}\[\]()#+\-.!|~^<>&"'])/g, function (_m, ch) {
      return hold(escapeHtml(ch));
    });

    // Emphasis. Longest markers first; each keeps its content in the stream.
    out = out.replace(/~~(?=\S)([\s\S]*?\S)~~/g, function (_m, t) { return wrap("<del>", t, "</del>"); });
    out = out.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, function (_m, t) { return wrap("<strong>", t, "</strong>"); });
    out = out.replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, function (_m, pre, t) {
      return pre + wrap("<strong>", t, "</strong>");
    });
    out = out.replace(/\*(?=\S)([\s\S]*?\S)\*/g, function (_m, t) { return wrap("<em>", t, "</em>"); });
    out = out.replace(/(^|[^\w])_(?=\S)([\s\S]*?\S)_(?!\w)/g, function (_m, pre, t) {
      return pre + wrap("<em>", t, "</em>");
    });

    // Super/subscript: no spaces inside, so they can't swallow a whole line.
    out = out.replace(/\^([^\s^]+)\^/g, function (_m, t) { return wrap("<sup>", t, "</sup>"); });
    out = out.replace(/~([^\s~]+)~/g, function (_m, t) { return wrap("<sub>", t, "</sub>"); });

    // Emoji shortcodes.
    out = out.replace(/:([a-z0-9_+-]+):/gi, function (m, name) {
      var key = name.toLowerCase();
      return Object.prototype.hasOwnProperty.call(EMOJI, key) ? EMOJI[key] : m;
    });

    // Abbreviations.
    if (abbrevRe) {
      out = out.replace(abbrevRe, function (m) {
        return hold('<abbr title="' + escapeHtml(abbreviations[m]) + '">' + escapeHtml(m) + "</abbr>");
      });
    }

    // Everything still in the stream is source text: escape it.
    out = escapeHtml(out);

    // Put the generated markup back. Held fragments never contain tokens
    // themselves, so a single pass suffices; the loop is cheap insurance.
    var guard = 0;
    var prev;
    do {
      prev = out;
      out = out.replace(SLOT_RE, function (m, i) {
        return slots[Number(i)] !== undefined ? slots[Number(i)] : m;
      });
      guard += 1;
    } while (out !== prev && guard < 10);

    // Soft line breaks inside a paragraph render as spaces.
    return out.replace(/\n/g, " ");
  }

  // --- block helpers -------------------------------------------------------

  function isBlank(line) {
    return !line || !line.trim();
  }

  // Treat a tab as 4 columns so tab- and space-indented posts behave alike.
  function widthOf(str) {
    return str.replace(/\t/g, "    ").length;
  }

  function indentOf(line) {
    return widthOf(line.match(/^[ \t]*/)[0]);
  }

  var RE_FENCE = /^ {0,3}(```+|~~~+)\s*([^`\s]*)\s*$/;
  var RE_HEADING = /^ {0,3}(#{1,6})(?:\s+(.*?))?\s*$/;
  var RE_HR = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
  var RE_LIST_ITEM = /^([ \t]*)([-*+]|\d{1,9}[.)])([ \t]+)([\s\S]*)$/;
  var RE_EMPTY_ITEM = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]*$/;
  var RE_QUOTE = /^ {0,3}>/;
  var RE_DEF = /^ {0,3}:[ \t]+/;

  function isBlockStart(line) {
    if (isBlank(line)) return true;
    if (RE_FENCE.test(line)) return true;
    if (RE_HR.test(line)) return true;
    if (RE_HEADING.test(line)) return true;
    if (RE_QUOTE.test(line)) return true;
    if (RE_DEF.test(line)) return true;
    if (/^ {0,3}\|/.test(line)) return true;
    var m = line.match(RE_LIST_ITEM) || line.match(RE_EMPTY_ITEM);
    return !!(m && m[1].length < 4);
  }

  function splitRow(row) {
    var s = row.trim();
    if (s.charAt(0) === "|") s = s.slice(1);
    if (s.length && s.charAt(s.length - 1) === "|" && s.charAt(s.length - 2) !== "\\") s = s.slice(0, -1);
    var cells = [];
    var cur = "";
    for (var i = 0; i < s.length; i += 1) {
      var c = s.charAt(i);
      if (c === "\\" && s.charAt(i + 1) === "|") { cur += "|"; i += 1; continue; }
      if (c === "|") { cells.push(cur); cur = ""; continue; }
      cur += c;
    }
    cells.push(cur);
    return cells.map(function (cell) { return cell.trim(); });
  }

  function isDelimiterRow(line) {
    if (line.indexOf("|") === -1 && line.indexOf("-") === -1) return false;
    var cells = splitRow(line);
    if (!cells.length) return false;
    return cells.every(function (cell) { return /^:?-+:?$/.test(cell); });
  }

  function alignOf(cell) {
    var left = cell.charAt(0) === ":";
    var right = cell.charAt(cell.length - 1) === ":";
    if (left && right) return "center";
    if (right) return "right";
    if (left) return "left";
    return "";
  }

  // --- block parser --------------------------------------------------------

  // Returns an array of { html, inner } blocks. `inner` is set for paragraphs so
  // a tight list item can drop the <p> wrapper.
  function parseBlocks(lines) {
    var blocks = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (isBlank(line)) { i += 1; continue; }

      // Fenced code
      var fence = line.match(RE_FENCE);
      if (fence) {
        var marker = fence[1].charAt(0);
        var lang = fence[2];
        var code = [];
        i += 1;
        while (i < lines.length && !new RegExp("^ {0,3}" + marker + "{" + fence[1].length + ",}\\s*$").test(lines[i])) {
          code.push(lines[i]);
          i += 1;
        }
        i += 1;
        blocks.push({
          html: "<pre><code" + (lang ? ' class="language-' + escapeHtml(lang) + '"' : "") + ">" +
            escapeHtml(code.join("\n")) + "</code></pre>"
        });
        continue;
      }

      // Indented code (4 spaces). Nested list content is dedented before it
      // reaches here, so this only fires for genuine code blocks.
      if (indentOf(line) >= 4 && !isBlank(line)) {
        var codeLines = [];
        while (i < lines.length && (isBlank(lines[i]) || indentOf(lines[i]) >= 4)) {
          codeLines.push(isBlank(lines[i]) ? "" : lines[i].replace(/^ {4}| {0,3}\t/, ""));
          i += 1;
        }
        while (codeLines.length && !codeLines[codeLines.length - 1].trim()) codeLines.pop();
        blocks.push({ html: "<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>" });
        continue;
      }

      // Horizontal rule (before lists: "- - -" is an hr, not a list)
      if (RE_HR.test(line)) {
        blocks.push({ html: "<hr>" });
        i += 1;
        continue;
      }

      // ATX heading, with optional {#id .class} attribute list
      var heading = line.match(RE_HEADING);
      if (heading) {
        var level = heading[1].length;
        var text = (heading[2] || "").replace(/\s+#+\s*$/, "");
        var id = null;
        var classes = [];
        text = text.replace(/\s*\{([^}]*)\}\s*$/, function (m, attrs) {
          var idMatch = attrs.match(/#([\w-]+)/);
          var classMatches = attrs.match(/\.[\w-]+/g);
          if (idMatch) id = idMatch[1];
          if (classMatches) {
            classes = classMatches.map(function (c) { return c.slice(1); });
          }
          return idMatch || classMatches ? "" : m;
        });
        if (!id) id = slugify(text.replace(/[*_`~]/g, ""));
        else usedSlugs.add(id);
        blocks.push({
          html: "<h" + level + ' id="' + escapeHtml(id) + '"' +
            (classes.length ? ' class="' + escapeHtml(classes.join(" ")) + '"' : "") + ">" +
            renderInline(text) + "</h" + level + ">"
        });
        i += 1;
        continue;
      }

      // Blockquote / admonition
      if (RE_QUOTE.test(line)) {
        var quoted = [];
        while (i < lines.length && (RE_QUOTE.test(lines[i]) || (!isBlank(lines[i]) && quoted.length && !isBlockStart(lines[i])))) {
          quoted.push(lines[i].replace(/^ {0,3}> ?/, ""));
          i += 1;
        }
        blocks.push({ html: renderQuote(quoted) });
        continue;
      }

      // Definition list: a term line immediately followed by a ": " line
      if (!isBlockStart(line) && i + 1 < lines.length && RE_DEF.test(lines[i + 1])) {
        var dl = [];
        while (i < lines.length) {
          if (isBlank(lines[i])) {
            // A blank line only continues the list if a definition follows.
            var j = i;
            while (j < lines.length && isBlank(lines[j])) j += 1;
            if (j < lines.length && (RE_DEF.test(lines[j]) ||
              (j + 1 < lines.length && !isBlockStart(lines[j]) && RE_DEF.test(lines[j + 1])))) {
              i = j;
              continue;
            }
            break;
          }
          if (RE_DEF.test(lines[i])) {
            dl.push("<dd>" + renderInline(lines[i].replace(RE_DEF, "")) + "</dd>");
            i += 1;
            continue;
          }
          if (!isBlockStart(lines[i]) && i + 1 < lines.length && RE_DEF.test(lines[i + 1])) {
            dl.push("<dt>" + renderInline(lines[i].trim()) + "</dt>");
            i += 1;
            continue;
          }
          break;
        }
        blocks.push({ html: "<dl>" + dl.join("") + "</dl>" });
        continue;
      }

      // Table: a row, then a delimiter row
      if (line.indexOf("|") !== -1 && i + 1 < lines.length && isDelimiterRow(lines[i + 1])) {
        var header = splitRow(line);
        var aligns = splitRow(lines[i + 1]).map(alignOf);
        i += 2;
        var body = [];
        while (i < lines.length && !isBlank(lines[i]) && lines[i].indexOf("|") !== -1) {
          body.push(splitRow(lines[i]));
          i += 1;
        }
        blocks.push({ html: renderTable(header, aligns, body) });
        continue;
      }

      // Lists
      if ((line.match(RE_LIST_ITEM) || line.match(RE_EMPTY_ITEM)) && indentOf(line) < 4) {
        var list = parseList(lines, i);
        blocks.push({ html: list.html });
        i = list.next;
        continue;
      }

      // Paragraph
      var para = [line.replace(/^[ \t]+/, "")];
      i += 1;
      while (i < lines.length && !isBlockStart(lines[i])) {
        para.push(lines[i].replace(/^[ \t]+/, ""));
        i += 1;
      }
      var innerHtml = renderInline(para.join("\n"));
      blocks.push({ html: "<p>" + innerHtml + "</p>", inner: innerHtml });
    }

    return blocks;
  }

  function renderQuote(quoted) {
    var type = null;
    // GitHub alerts: > [!NOTE] -- and the plainer "> note: ..." spelling.
    var alert = quoted[0].match(/^\s*\[!(\w+)\]\s*$/);
    if (alert && ADMONITIONS[alert[1].toLowerCase()]) {
      type = alert[1].toLowerCase();
      quoted = quoted.slice(1);
    } else {
      var labelled = quoted[0].match(/^(\w+):\s*([\s\S]*)$/);
      if (labelled && ADMONITIONS[labelled[1].toLowerCase()]) {
        type = labelled[1].toLowerCase();
        quoted = quoted.slice();
        quoted[0] = labelled[2];
        if (!quoted[0].trim()) quoted.shift();
      }
    }

    var body = blocksToHtml(parseBlocks(quoted));
    if (type) {
      return '<div class="admonition admonition-' + type + '">' +
        '<p class="admonition-title">' + ADMONITIONS[type] + "</p>" + body + "</div>";
    }
    return "<blockquote>" + body + "</blockquote>";
  }

  function renderTable(header, aligns, body) {
    function cell(tag, content, idx) {
      var align = aligns[idx];
      return "<" + tag + (align ? ' style="text-align:' + align + '"' : "") + ">" +
        renderInline(content) + "</" + tag + ">";
    }
    var html = '<div class="table-wrap"><table><thead><tr>';
    header.forEach(function (c, idx) { html += cell("th", c, idx); });
    html += "</tr></thead>";
    if (body.length) {
      html += "<tbody>";
      body.forEach(function (row) {
        html += "<tr>";
        for (var idx = 0; idx < header.length; idx += 1) {
          html += cell("td", row[idx] === undefined ? "" : row[idx], idx);
        }
        html += "</tr>";
      });
      html += "</tbody>";
    }
    return html + "</table></div>";
  }

  function parseList(lines, start) {
    var first = lines[start].match(RE_LIST_ITEM) || lines[start].match(RE_EMPTY_ITEM);
    var baseIndent = indentOf(lines[start]);
    var ordered = /\d/.test(first[2]);
    var startNum = ordered ? parseInt(first[2], 10) : 1;
    var items = [];
    var loose = false;
    var i = start;
    var pendingBlank = false;

    while (i < lines.length) {
      var m = lines[i].match(RE_LIST_ITEM) || lines[i].match(RE_EMPTY_ITEM);
      var sameLevel = m && indentOf(lines[i]) === baseIndent && (/\d/.test(m[2]) === ordered);
      if (!sameLevel) break;
      if (pendingBlank) { loose = true; pendingBlank = false; }

      // Content of a list item starts in the column just past its marker;
      // everything indented at least that far (including nested lists) belongs
      // to the item, and is dedented before being parsed recursively.
      var contentIndent = widthOf(m[1]) + m[2].length +
        (m[3] === undefined ? 1 : widthOf(m[3]));
      var itemLines = [m[4] === undefined ? "" : m[4]];
      i += 1;

      while (i < lines.length) {
        if (isBlank(lines[i])) {
          var j = i;
          while (j < lines.length && isBlank(lines[j])) j += 1;
          if (j < lines.length && indentOf(lines[j]) >= contentIndent) {
            itemLines.push("");
            loose = true;
            i = j;
            continue;
          }
          pendingBlank = true;
          i = j;
          break;
        }
        if (indentOf(lines[i]) >= contentIndent) {
          itemLines.push(dedent(lines[i], contentIndent));
          i += 1;
          continue;
        }
        // Lazy continuation of the item's paragraph.
        if (!isBlockStart(lines[i])) {
          itemLines.push(lines[i].replace(/^[ \t]+/, ""));
          i += 1;
          continue;
        }
        break;
      }

      items.push(itemLines);
    }

    var isTaskList = items.length > 0 && items.every(function (item) {
      return /^\[[ xX]\]\s/.test(item[0]);
    });

    var html = items.map(function (item) {
      var checkbox = "";
      var itemClass = "";
      if (isTaskList) {
        var task = item[0].match(/^\[([ xX])\]\s+([\s\S]*)$/);
        if (task) {
          checkbox = '<input type="checkbox" disabled' +
            (task[1].toLowerCase() === "x" ? " checked" : "") + "> ";
          itemClass = ' class="task-list-item"';
          item = item.slice();
          item[0] = task[2];
        }
      }
      var blocks = parseBlocks(item);
      var content = loose ? blocksToHtml(blocks) : blocksToTightHtml(blocks);
      return "<li" + itemClass + ">" + checkbox + content + "</li>";
    }).join("");

    var tag = ordered ? "ol" : "ul";
    var attrs = isTaskList ? ' class="task-list"' : "";
    if (ordered && startNum !== 1) attrs += ' start="' + startNum + '"';

    return { html: "<" + tag + attrs + ">" + html + "</" + tag + ">", next: i };
  }

  function dedent(line, columns) {
    var removed = 0;
    var idx = 0;
    while (idx < line.length && removed < columns) {
      var ch = line.charAt(idx);
      if (ch === " ") removed += 1;
      else if (ch === "\t") removed += 4;
      else break;
      idx += 1;
    }
    return line.slice(idx);
  }

  function blocksToHtml(blocks) {
    return blocks.map(function (b) { return b.html; }).join("\n");
  }

  // Tight list items drop the <p> wrapper around their paragraphs.
  function blocksToTightHtml(blocks) {
    return blocks.map(function (b) {
      return b.inner !== undefined ? b.inner : b.html;
    }).join("\n");
  }

  // --- definitions pass ----------------------------------------------------

  // Pull link references, abbreviations and footnote definitions out of the
  // document before block parsing. Fenced code is skipped so a code sample
  // containing "[foo]: bar" survives intact.
  function extractDefinitions(lines) {
    var remaining = [];
    var inFence = false;
    var fenceMarker = "";

    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      var fence = line.match(RE_FENCE);

      if (inFence) {
        if (new RegExp("^ {0,3}" + fenceMarker + "{3,}\\s*$").test(line)) inFence = false;
        remaining.push(line);
        continue;
      }
      if (fence) {
        inFence = true;
        fenceMarker = fence[1].charAt(0);
        remaining.push(line);
        continue;
      }
      if (indentOf(line) >= 4) { remaining.push(line); continue; }

      // Footnotes first: [^1]: would otherwise match the link-reference form.
      var footnote = line.match(/^ {0,3}\[\^([^\]\s]+)\]:\s*([\s\S]*)$/);
      if (footnote) {
        var body = [footnote[2]];
        while (i + 1 < lines.length && (indentOf(lines[i + 1]) >= 4 ||
          (!isBlank(lines[i + 1]) && !isBlockStart(lines[i + 1]) && !/^ {0,3}\[/.test(lines[i + 1])))) {
          body.push(lines[i + 1].replace(/^[ \t]+/, ""));
          i += 1;
        }
        footnotes[footnote[1]] = body.join("\n").trim();
        continue;
      }

      var abbrev = line.match(/^ {0,3}\*\[([^\]]+)\]:\s*(.+)$/);
      if (abbrev) {
        abbreviations[abbrev[1]] = abbrev[2].trim();
        continue;
      }

      var reference = line.match(/^ {0,3}\[([^\]^][^\]]*)\]:\s*(\S+)(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?\s*$/);
      if (reference) {
        references[reference[1].toLowerCase()] = {
          url: reference[2],
          title: reference[3] || reference[4] || reference[5] || ""
        };
        continue;
      }

      remaining.push(line);
    }

    return remaining;
  }

  function buildAbbrevRegex() {
    var keys = Object.keys(abbreviations);
    if (!keys.length) return null;
    keys.sort(function (a, b) { return b.length - a.length; });
    var escaped = keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    return new RegExp("\\b(?:" + escaped.join("|") + ")\\b", "g");
  }

  function renderFootnotes() {
    if (!footnoteOrder.length) return "";
    var items = footnoteOrder.map(function (id) {
      var slug = escapeHtml(id);
      var body = blocksToTightHtml(parseBlocks(String(footnotes[id]).split("\n")));
      return '<li id="fn-' + slug + '">' + body +
        ' <a href="#fnref-' + slug + '" class="footnote-backref" aria-label="Back to content">↩</a></li>';
    }).join("");
    return '\n<section class="footnotes"><hr><ol>' + items + "</ol></section>";
  }

  // --- entry point ---------------------------------------------------------

  function render(markdown) {
    usedSlugs.clear();
    references = {};
    abbreviations = {};
    footnotes = {};
    footnoteOrder = [];
    abbrevRe = null;

    var lines = String(markdown)
      .replace(/\r\n?/g, "\n")
      // Private-use code points are reserved for slot tokens.
      .replace(/[\uE000\uE001]/g, "")
      .split("\n");

    lines = extractDefinitions(lines);
    abbrevRe = buildAbbrevRegex();

    // Footnote bodies are rendered after the body, but their numbering comes
    // from reference order, which parseBlocks discovers as it goes.
    var html = blocksToHtml(parseBlocks(lines));
    return html + renderFootnotes();
  }

  global.BlogMarkdown = { render };
})(window);
