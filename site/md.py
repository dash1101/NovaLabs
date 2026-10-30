"""A small markdown converter for the docs.

Covers what the Nova D1 docs use: headings, paragraphs, bullet and numbered lists
(nested by indentation), pipe tables, fenced code, block quotes, rules, and inline
code, bold, italic and links. Raw HTML lines pass through untouched; the source
files are the maintainer's own. Standard library only.
"""

import html
import re


def _inline(text, link_map=None):
    """Inline markup. Code spans are lifted out first so nothing inside them is touched."""
    codes = []

    def keep(m):
        codes.append("<code>%s</code>" % html.escape(m.group(1)))
        return "\x00%d\x00" % (len(codes) - 1)

    text = re.sub(r"`([^`]+)`", keep, text)
    # Raw inline HTML tags are left alone; everything else is escaped.
    parts = re.split(r"(<[a-zA-Z/][^>]*>)", text)
    text = "".join(p if p.startswith("<") and p.endswith(">") and re.match(r"<[a-zA-Z/]", p)
                   else html.escape(p, quote=False) for p in parts)

    def link(m):
        label, href = m.group(1), m.group(2).replace("&amp;", "&")
        if link_map:
            href = link_map(href)
        ext = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        return '<a href="%s"%s>%s</a>' % (html.escape(href, quote=True), ext, label)

    text = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", link, text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", text)
    text = re.sub(r"(?<![\w_])_(?!\s)(.+?)(?<!\s)_(?![\w_])", r"<em>\1</em>", text)
    return re.sub(r"\x00(\d+)\x00", lambda m: codes[int(m.group(1))], text)


def _slug(text):
    s = re.sub(r"<[^>]+>", "", text).lower()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    return re.sub(r"[\s-]+", "-", s).strip("-")


def _cells(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in re.split(r"(?<!\\)\|", line)]


def _list_item(line):
    m = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", line)
    if not m:
        return None
    return len(m.group(1).expandtabs(4)), m.group(2)[0].isdigit(), m.group(3)


def convert(text, link_map=None):
    """Return (html, title) where title is the first level-one heading, if any."""
    lines = text.replace("\r\n", "\n").split("\n")
    out, title, i = [], None, 0
    seen = {}

    def inl(s):
        return _inline(s, link_map)

    def list_block(i):
        """Consume a list starting at lines[i]; returns (html, next index)."""
        items = []                       # (indent, ordered, text)
        while i < len(lines):
            li = _list_item(lines[i])
            if li:
                items.append(list(li))
                i += 1
            elif lines[i].strip() and lines[i].startswith((" ", "\t")) and items:
                items[-1][2] += " " + lines[i].strip()      # a wrapped item
                i += 1
            else:
                break

        def build(pos, indent):
            res, p = [], pos
            ordered = items[p][1]
            res.append("<%s>" % ("ol" if ordered else "ul"))
            while p < len(items) and items[p][0] >= indent:
                if items[p][0] > indent:
                    break
                res.append("<li>%s" % inl(items[p][2]))
                p += 1
                if p < len(items) and items[p][0] > indent:
                    sub, p = build(p, items[p][0])
                    res.append(sub)
                res.append("</li>")
            res.append("</%s>" % ("ol" if ordered else "ul"))
            return "".join(res), p
        html_, _ = build(0, items[0][0])
        return html_, i

    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue

        m = re.match(r"^```\s*([\w+-]*)\s*$", line)
        if m:
            i += 1
            code = []
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1
            out.append("<pre><code>%s</code></pre>" % html.escape("\n".join(code)))
            continue

        m = re.match(r"^(#{1,6})\s+(.*?)\s*#*\s*$", line)
        if m:
            level, body = len(m.group(1)), m.group(2)
            h = inl(body)
            if level == 1 and title is None:
                title = re.sub(r"<[^>]+>", "", h)
            slug = _slug(h) or "section"
            seen[slug] = seen.get(slug, 0) + 1
            if seen[slug] > 1:
                slug += "-%d" % seen[slug]
            out.append('<h%d id="%s">%s</h%d>' % (level, slug, h, level))
            i += 1
            continue

        if re.match(r"^\s*([-*_])(\s*\1){2,}\s*$", line):
            out.append("<hr>")
            i += 1
            continue

        if line.lstrip().startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|?\s*:?-{2,}", lines[i + 1]):
            head = _cells(line)
            i += 2
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(_cells(lines[i]))
                i += 1
            t = ["<div class=\"tbl-wrap\"><table><thead><tr>"]
            t += ["<th>%s</th>" % inl(c) for c in head]
            t.append("</tr></thead><tbody>")
            for r in rows:
                t.append("<tr>" + "".join("<td>%s</td>" % inl(c) for c in r) + "</tr>")
            t.append("</tbody></table></div>")
            out.append("".join(t))
            continue

        if line.startswith(">"):
            quote = []
            while i < len(lines) and lines[i].startswith(">"):
                quote.append(re.sub(r"^>\s?", "", lines[i]))
                i += 1
            inner, _ = convert("\n".join(quote), link_map)
            out.append("<blockquote>%s</blockquote>" % inner)
            continue

        if _list_item(line):
            block, i = list_block(i)
            out.append(block)
            continue

        if line.lstrip().startswith("<!--"):
            # an HTML comment (the generated-section markers in some docs): dropped
            while i < len(lines) and "-->" not in lines[i]:
                i += 1
            i += 1
            continue

        if line.lstrip().startswith("<") and re.match(r"^\s*</?[a-zA-Z]", line):
            out.append(line)
            i += 1
            continue

        para = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
                r"^(#{1,6}\s|```|>|\s*\||\s*([-*+]|\d+[.)])\s)", lines[i]):
            para.append(lines[i].strip())
            i += 1
        out.append("<p>%s</p>" % inl(" ".join(para)))

    return "\n".join(out), title
