#!/usr/bin/env python3
"""Regenerate posts/manifest.json and sitemap.xml from the posts themselves.

A post's frontmatter is the single source of truth. The other two files are
derived indexes that exist only because a static site can't list a directory
at runtime -- so they should be generated, never hand-edited.

Before this existed the three files were kept in step by hand, and drifted:
sitemap.xml once sat four posts behind. Frontmatter and the manifest duplicate
five fields each, which is five chances to mistype something per post.

Standard library only, and not required to serve the site -- run it after
adding or editing a post.

    python3 tools/sync.py           # rewrite the derived files
    python3 tools/sync.py --check   # report drift, change nothing (exit 1 if any)
"""

import json
import pathlib
import re
import sys
from xml.sax.saxutils import escape as xml_escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "posts"
MANIFEST = POSTS_DIR / "manifest.json"
SITEMAP = ROOT / "sitemap.xml"
CATEGORIES = ROOT / "data" / "categories.json"
AUTHORS = ROOT / "data" / "authors.json"

BASE_URL = "https://apbeers.github.io/blog"
MANIFEST_FIELDS = ("slug", "title", "date", "summary", "category", "author")


def parse_frontmatter(text):
    """Mirror of js/frontmatter.js: a leading --- block of flat key: value pairs."""
    match = re.match(r"^---\r?\n(.*?)\r?\n---\r?\n?", text.lstrip("﻿"), re.S)
    if not match:
        return None
    data = {}
    for line in match.group(1).splitlines():
        if not line.strip() or ":" not in line:
            continue
        key, _, value = line.partition(":")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
            value = value[1:-1]
        data[key.strip()] = value
    return data


def collect(problems):
    categories = json.loads(CATEGORIES.read_text(encoding="utf-8"))
    authors = json.loads(AUTHORS.read_text(encoding="utf-8"))
    posts = []

    for path in sorted(POSTS_DIR.glob("*/*.md")):
        rel = path.relative_to(ROOT)
        data = parse_frontmatter(path.read_text(encoding="utf-8"))
        if data is None:
            problems.append(f"{rel}: no frontmatter block")
            continue

        missing = [f for f in ("title", "date", "summary", "category", "author") if not data.get(f)]
        if missing:
            problems.append(f"{rel}: missing frontmatter: {', '.join(missing)}")
            continue

        folder = path.parent.name
        if data["category"] != folder:
            problems.append(
                f"{rel}: category '{data['category']}' but the file is in posts/{folder}/"
            )
        if data["category"] not in categories:
            problems.append(f"{rel}: category '{data['category']}' is not in data/categories.json")
        if data["author"] not in authors:
            problems.append(f"{rel}: author '{data['author']}' is not in data/authors.json")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", data["date"]):
            problems.append(f"{rel}: date '{data['date']}' is not YYYY-MM-DD")

        entry = dict(data)
        entry["slug"] = data.get("slug") or path.stem
        if entry["slug"] != path.stem:
            problems.append(f"{rel}: slug '{entry['slug']}' does not match the filename")
        posts.append({f: entry.get(f, "") for f in MANIFEST_FIELDS})

    # Newest first, matching the order the homepage renders.
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts


def render_manifest(posts):
    return json.dumps(posts, indent=2, ensure_ascii=False) + "\n"


def render_sitemap(posts):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        "  <url>",
        f"    <loc>{BASE_URL}/index.html</loc>",
        "  </url>",
    ]
    for p in posts:
        loc = f"{BASE_URL}/post.html?category={p['category']}&slug={p['slug']}"
        lines += [
            "  <url>",
            f"    <loc>{xml_escape(loc)}</loc>",
            f"    <lastmod>{p['date']}</lastmod>",
            "  </url>",
        ]
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main():
    check_only = "--check" in sys.argv[1:]
    problems = []
    posts = collect(problems)

    targets = [(MANIFEST, render_manifest(posts)), (SITEMAP, render_sitemap(posts))]
    stale = [
        path for path, content in targets
        if not path.exists() or path.read_text(encoding="utf-8") != content
    ]

    for problem in problems:
        print(f"  problem: {problem}")

    if check_only:
        for path in stale:
            print(f"  stale:   {path.relative_to(ROOT)} does not match the posts on disk")
        if problems or stale:
            print("\nRun `python3 tools/sync.py` to regenerate, and fix any problems above.")
            return 1
        print(f"{len(posts)} posts; manifest.json and sitemap.xml are up to date.")
        return 0

    if problems:
        print("\nRefusing to write while the problems above are unresolved.")
        return 1

    for path, content in targets:
        path.write_text(content, encoding="utf-8")
    if stale:
        for path in stale:
            print(f"  updated: {path.relative_to(ROOT)}")
    else:
        print("  (already up to date)")
    print(f"{len(posts)} posts indexed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
