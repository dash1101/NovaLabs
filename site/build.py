#!/usr/bin/env python3
"""Build novalabs.app from its sources.

    python3 site/build.py                  write the site into the repository root
    python3 site/build.py --out DIR        write a complete copy into DIR (for a preview)
    python3 site/build.py --status "text"  show a status bar line, whatever site.json says
    python3 site/build.py --check          build into a scratch folder and only check links

SOURCES
-------
  site/pages/*.html     one page each: a front-matter block, then the body
  site/data/site.json   the name, the nav, the footer and the status bar
  site/data/d1.json     the Nova D1 progress list, screens and resource links
  docs/*.md             rendered to docs/*.html, with a sidebar
  ds/                   the shared design system (a copy; see ds/README.md)

The generated .html files are committed beside the sources, because GitHub Pages
serves the repository as it is. Edit the sources and rebuild, never the output.
A build fails on a broken link, a missing anchor or a placeholder left unfilled.
"""

import argparse
import html
import json
import os
import re
import shutil
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import md  # noqa: E402

ASSETS = ("ds", "img", "js", "sim", "nova.css", "logo.svg", "favicon.svg", "CNAME")


def load(name):
    with open(os.path.join(HERE, "data", name), encoding="utf-8") as f:
        return json.load(f)


def front_matter(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        raise SystemExit("a page has no front matter")
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    return meta, m.group(2)


def rel_root(path, absolute=False):
    if absolute:
        return "/"
    depth = path.count("/")
    return "../" * depth if depth else "./"


def resolve(href, root):
    """A site-relative href as it is written from a page at `root`."""
    if re.match(r"^(https?:|mailto:|#|/)", href):
        return href
    return root + href


class Site:
    def __init__(self, status_override=None):
        self.site = load("site.json")
        self.d1 = load("d1.json")
        self.noindex = set()
        self.social = ""
        if status_override is not None:
            self.site["status"] = {"text": status_override, "tone": "warn"}

    # ---- chrome -----------------------------------------------------------
    def statusbar(self, root):
        s = self.site.get("status") or {}
        if not s.get("text"):
            return ""
        link = ""
        if s.get("link"):
            link = ' <a href="%s">%s</a>' % (resolve(s["link"], root), s.get("link_text", "More"))
        return '<div class="statusbar" data-tone="%s">%s%s</div>' % (s.get("tone", "warn"), s["text"], link)

    def nav(self, active, root):
        links = ""
        for n in self.site["nav"]:
            cur = ' aria-current="page"' if n.get("key") and n["key"] == active else ""
            links += '<a href="%s"%s>%s</a>' % (resolve(n["href"], root), cur, n["label"])
        e = self.site["external"]
        links += '<a class="ext" href="%s" target="_blank" rel="noopener">%s</a>' % (e["href"], e["label"])
        return ('<header class="nav"><div class="wrap nav-in">'
                '<a class="brand" href="%s"><img src="%slogo.svg" alt="">%s</a>'
                '<button class="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="menu"><span></span></button>'
                '<nav id="menu" class="menu" aria-label="Main">%s</nav></div></header>'
                % (root, root, self.site["name"], links))

    def footer(self, root):
        links = ""
        for n in self.site["footer"]:
            ext = ' target="_blank" rel="noopener"' if n["href"].startswith("http") else ""
            links += '<a href="%s"%s>%s</a>' % (resolve(n["href"], root), ext, n["label"])
        return ('<footer class="foot"><div class="wrap foot-in">'
                '<a class="brand" href="%s"><img src="%slogo.svg" alt="">%s</a>'
                '<div class="foot-links">%s</div><small>%s</small></div></footer>'
                % (root, root, self.site["name"], links, self.site["copyright"]))

    def page(self, meta, body, root):
        title = meta.get("window_title") or (meta["title"] if meta["title"] == self.site["name"]
                                             else "%s | %s" % (meta["title"], self.site["name"]))
        scripts = ""
        for s in filter(None, [meta.get("external_scripts")]):
            scripts += '<script src="%s"></script>' % s
        scripts += '<script src="%sds/ds.js"></script>' % root
        for s in filter(None, [meta.get("scripts")]):
            scripts += '<script src="%s%s"></script>' % (root, s)
        body = body.replace("<main>", '<main id="main">', 1)
        path = meta.get("path", "")
        url = self.site["url"] + ("" if path in ("", "index.html") else path)
        desc = html.escape(meta.get("description", ""), quote=True)
        ttl = html.escape(title, quote=True)
        social = (
            '<meta name="theme-color" content="#090f1d">'
            '<link rel="canonical" href="%s">'
            '<meta property="og:site_name" content="%s"><meta property="og:type" content="website">'
            '<meta property="og:title" content="%s"><meta property="og:description" content="%s">'
            '<meta property="og:url" content="%s"><meta property="og:image" content="%simg/og.png">'
            '<meta name="twitter:card" content="summary_large_image">'
            % (url, self.site["name"], ttl, desc, url, self.site["url"]))
        if meta.get("noindex"):
            social += '<meta name="robots" content="noindex">'
            self.noindex.add(path)
        self.social = social
        return ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8">'
                '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
                '<title>%s</title><meta name="description" content="%s">%s'
                '<link rel="icon" type="image/svg+xml" href="%sfavicon.svg">'
                '<link rel="preload" as="font" type="font/woff2" crossorigin href="%sds/fonts/BricolageGrotesque-latin.woff2">'
                '<link rel="preload" as="font" type="font/woff2" crossorigin href="%sds/fonts/InstrumentSans-latin.woff2">'
                '<link rel="stylesheet" href="%sds/ds.css"><link rel="stylesheet" href="%snova.css">'
                '</head><body><a class="skip" href="#main">Skip to content</a>%s%s%s%s%s</body></html>\n'
                % (html.escape(title), html.escape(meta.get("description", ""), quote=True), self.social,
                   root, root, root, root, root,
                   self.statusbar(root), self.nav(meta.get("nav", ""), root), body,
                   self.footer(root), scripts))

    # ---- generated blocks ---------------------------------------------------
    def d1_blocks(self, root):
        d = self.d1
        shots = "".join(
            '<div class="shot"><figure><img src="%s%s" alt="%s"><figcaption>%s</figcaption></figure></div>'
            % (root, s["img"], html.escape(s["alt"], quote=True), s["caption"]) for s in d["shots"])
        prog = ""
        for c in d["categories"]:
            tag = '<span class="pct">%s</span>' % c["tag"] if c.get("tag") else ""
            items = "".join('<div class="feat">%s <span class="badge b-%s">%s</span></div>'
                            % (i["text"], i["status"], d["legend"][i["status"]]) for i in c["items"])
            note = '<p class="progress-note">%s</p>' % c["note"] if c.get("note") else ""
            prog += '<div class="panel cat"><h3>%s %s</h3>%s%s</div>' % (c["name"], tag, items, note)
        legend = " ".join('<span class="badge b-%s">%s</span>' % (k, v) for k, v in d["legend"].items())
        res = ""
        for r in d["resources"]:
            ext = ' target="_blank" rel="noopener"' if r["href"].startswith("http") else ""
            res += ('<a class="link-card" href="%s"%s><h3>%s</h3><p>%s</p></a>'
                    % (resolve(r["href"], root), ext, r["title"], r["text"]))
        return {"d1_shots": shots, "d1_progress": prog, "d1_legend": legend, "d1_resources": res}

    def fill(self, body, root):
        blocks = self.d1_blocks(root)
        body = body.replace("{{root}}", root)
        for k, v in blocks.items():
            body = body.replace("{{%s}}" % k, v)
        body = re.sub(r"\{\{d1\.(\w+)\}\}", lambda m: self.d1[m.group(1)], body)
        return body

    # ---- docs ---------------------------------------------------------------
    def docs(self):
        src = os.path.join(ROOT, "docs")
        names = sorted(f[:-3] for f in os.listdir(src) if f.endswith(".md"))
        titles = {}
        for n in names:
            with open(os.path.join(src, n + ".md"), encoding="utf-8") as f:
                titles[n] = md.convert(f.read())[1] or n
        return names, titles

    def docs_nav(self, names, titles, active):
        out = '<nav class="docs-nav" aria-label="Documents"><div class="tag">Documents</div>'
        out += '<a href="./"%s>Overview</a>' % (' aria-current="page"' if active == "index" else "")
        for n in names:
            short = re.sub(r"^Nova D(\d)\s*[:—-]?\s*", r"D\1 ", titles[n])
            out += '<a href="%s.html"%s>%s</a>' % (n, ' aria-current="page"' if n == active else "", html.escape(titles[n]))
        return out + "</nav>"


def link_map(url):
    return url[:-3] + ".html" if re.match(r"^[\w.-]+\.md(#.*)?$", url) and "/" not in url else url


def build(out_dir, status=None):
    s = Site(status)
    written = []

    def write(rel, text):
        path = os.path.join(out_dir, rel)
        os.makedirs(os.path.dirname(path) or out_dir, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        written.append(rel)

    pdir = os.path.join(HERE, "pages")
    for fn in sorted(os.listdir(pdir)):
        with open(os.path.join(pdir, fn), encoding="utf-8") as f:
            meta, body = front_matter(f.read())
        root = rel_root(meta["path"], bool(meta.get("absolute")))
        write(meta["path"], s.page(meta, s.fill(body, root), root))

    names, titles = s.docs()
    root = "../"
    for n in names:
        with open(os.path.join(ROOT, "docs", n + ".md"), encoding="utf-8") as f:
            body, title = md.convert(f.read(), link_map)
        main = ('<main id="main"><div class="wrap docs">%s<article class="docs-body prose">%s</article></div></main>'
                % (s.docs_nav(names, titles, n), body))
        meta = {"title": titles[n], "description": "Nova D1 documentation: " + titles[n] + ".", "nav": "docs", "path": "docs/%s.html" % n}
        write("docs/%s.html" % n, s.page(meta, main, root).replace('<main id="main">', '<main id="main">', 1))

    # the docs overview is the "Docs, specs & tools" list
    cards = s.d1_blocks(root)["d1_resources"]
    main = ('<main id="main"><div class="wrap docs">%s<div class="docs-body"><h1>Docs, specs &amp; tools</h1>'
            '<p class="lede" style="margin-bottom:28px">%s</p><div class="links">%s</div>'
            '<p class="progress-note">%s</p></div></div></main>'
            % (s.docs_nav(names, titles, "index"), s.d1["resources_intro"], cards, s.d1["runs_on"]))
    write("docs/index.html", s.page({"title": "Docs", "description": "Nova D1 documentation, specs and tools.", "nav": "docs", "path": "docs/index.html"},
                                    main, root))
    # the files a crawler asks for
    base = s.site["url"]
    urls = [base + ("" if r == "index.html" else r) for r in written if r not in s.noindex]
    with open(os.path.join(out_dir, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n'
                % "".join("  <url><loc>%s</loc></url>\n" % u for u in sorted(urls)))
    with open(os.path.join(out_dir, "robots.txt"), "w", encoding="utf-8") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % base)
    return written


def check(out_dir, written):
    """Every local link and anchor in the generated pages resolves."""
    problems = []
    pages = {}
    for rel in written:
        with open(os.path.join(out_dir, rel), encoding="utf-8") as fh:
            pages[rel] = fh.read()
    ids = {p: set(re.findall(r'\bid="([^"]+)"', t)) for p, t in pages.items()}
    for p, text in pages.items():
        if "{{" in text:
            problems.append("%s: an unfilled placeholder: %s" % (p, re.search(r"\{\{[^}]*\}\}", text).group(0)))
        for attr, url in re.findall(r'\b(href|src)="([^"]*)"', text):
            if re.match(r"^(https?:|mailto:|tel:|data:|javascript:)", url) or not url:
                continue
            path, _, frag = url.partition("#")
            path = path.partition("?")[0]
            if path.startswith("/"):
                target = path[1:]
                if not target or target.endswith("/"):
                    target += "index.html"
            else:
                target = p if not path else os.path.normpath(os.path.join(os.path.dirname(p), path))
            full = os.path.join(out_dir, target)
            if os.path.isdir(full):
                target = os.path.join(target, "index.html")
                full = os.path.join(out_dir, target)
            if not os.path.exists(full):
                problems.append("%s: %s=%s does not exist" % (p, attr, url))
            elif frag and target in ids and frag not in ids[target]:
                problems.append("%s: %s has no #%s" % (p, target, frag))
    return problems


def ds_drift():
    """Warn when ds/ differs from the other site's copy; the two are meant to be identical."""
    import hashlib
    mine, theirs = os.path.join(ROOT, "ds"), os.path.join(os.path.dirname(ROOT), "RPCortex-site", "ds")
    if not os.path.isdir(theirs):
        return []
    out = []
    for dp, _, fs in os.walk(mine):
        for f in fs:
            a = os.path.join(dp, f)
            b = os.path.join(theirs, os.path.relpath(a, mine))
            if not os.path.exists(b) or hashlib.sha256(open(a, "rb").read()).hexdigest() != hashlib.sha256(open(b, "rb").read()).hexdigest():
                out.append(os.path.relpath(a, ROOT))
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", help="write a complete copy here instead of the repository root")
    ap.add_argument("--status", help="status bar text for this build")
    ap.add_argument("--check", action="store_true", help="build to a scratch folder and only check")
    a = ap.parse_args()

    out = a.out or (tempfile.mkdtemp(prefix="novalabs-") if a.check else ROOT)
    if out != ROOT:
        os.makedirs(out, exist_ok=True)
        for item in ASSETS:
            src = os.path.join(ROOT, item)
            dst = os.path.join(out, item)
            if os.path.isdir(src):
                shutil.copytree(src, dst, dirs_exist_ok=True)
            elif os.path.exists(src):
                shutil.copy(src, dst)
    for f in ds_drift():
        print("  ~ %s differs from the other site's copy (see ds/README.md)" % f)
    written = build(out, a.status)
    problems = check(out, written)
    for p in problems:
        print("  ! " + p)
    print("%d pages%s" % (len(written), "" if not problems else ", %d problem(s)" % len(problems)))
    if a.check:
        shutil.rmtree(out, ignore_errors=True)
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
