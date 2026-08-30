#!/usr/bin/env python3
"""Local development server for this blog: static files, with caching disabled.

Standard library only -- nothing to install, matching the rest of the repo.

Why this exists instead of plain `python3 -m http.server`: that server stamps
every response with `Last-Modified`, and answers the browser's follow-up
`If-Modified-Since` with `304 Not Modified`. So after you edit a .js, .css or
.md file, the browser frequently keeps rendering the copy it already had, and
you end up debugging a stale file that no longer exists on disk. This serves
the same files but tells the browser never to store or reuse anything, and
refuses to issue 304s at all.

Only ever use this locally. GitHub Pages serves the real site and *should*
cache normally.

Usage:
    python3 serve.py            # port 8000, the port the tooling expects
    python3 serve.py 8080       # some other port
"""

import contextlib
import errno
import http.server
import os
import sys

DEFAULT_PORT = 8000

# Content types the stdlib doesn't know or gets wrong for this repo's files.
EXTRA_TYPES = {
    ".md": "text/markdown; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".svg": "image/svg+xml",
}


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, **EXTRA_TYPES}

    def send_head(self):
        # SimpleHTTPRequestHandler answers these with 304 Not Modified, which
        # is exactly the staleness we're trying to avoid. Drop them so every
        # request is served in full.
        for header in ("If-Modified-Since", "If-None-Match", "If-Unmodified-Since", "If-Range"):
            del self.headers[header]
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Quieter than the default: skip the routine 200s, keep anything that
        # looks like a problem (404s, 500s) since those are what you want to see.
        status = str(args[1]) if len(args) > 1 else ""
        if not status.startswith("2"):
            super().log_message(fmt, *args)


def main():
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            sys.exit(f"Not a port number: {sys.argv[1]}")

    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    server = http.server.ThreadingHTTPServer
    server.allow_reuse_address = True

    try:
        httpd = server(("", port), NoCacheHandler)
    except OSError as err:
        if err.errno == errno.EADDRINUSE:
            sys.exit(
                f"Port {port} is already in use -- something else is serving there.\n"
                f"Stop it first (macOS/Linux: lsof -ti :{port} | xargs kill), then rerun this."
            )
        raise

    print(f"Serving {os.getcwd()} at http://localhost:{port}/  (caching disabled)")
    print("Press Ctrl-C to stop.")
    with contextlib.suppress(KeyboardInterrupt):
        httpd.serve_forever()
    httpd.server_close()
    print("\nStopped.")


if __name__ == "__main__":
    main()
