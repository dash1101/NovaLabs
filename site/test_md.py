import os, re, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import md

class Blocks(unittest.TestCase):
    def test_heading_title_and_ids(self):
        h, t = md.convert("# Wiring guide\n\n## Pins\n\n## Pins\n")
        self.assertEqual(t, "Wiring guide")
        self.assertIn('<h2 id="pins">', h); self.assertIn('<h2 id="pins-2">', h)
    def test_table(self):
        h, _ = md.convert("| A | B |\n|---|---|\n| 1 | `x|y` |\n| 2 | **b** |\n")
        self.assertIn("<th>A</th>", h); self.assertIn("<td><strong>b</strong></td>", h)
        self.assertEqual(h.count("<tr>"), 3)
    def test_fence_is_escaped_and_untouched(self):
        h, _ = md.convert("```\n<b>*not bold*</b>\n```\n")
        self.assertIn("&lt;b&gt;*not bold*&lt;/b&gt;", h); self.assertNotIn("<em>", h)
    def test_nested_and_ordered_lists(self):
        h, _ = md.convert("- one\n  - inner\n- two\n\n1. a\n2. b\n")
        self.assertIn("<ul><li>one<ul><li>inner</li></ul></li><li>two</li></ul>", h)
        self.assertIn("<ol><li>a</li><li>b</li></ol>", h)
    def test_wrapped_list_item(self):
        h, _ = md.convert("- first line\n  continued\n- next\n")
        self.assertIn("first line continued", h)
    def test_quote(self):
        h, _ = md.convert("> note one\n> note two\n")
        self.assertIn("<blockquote>", h); self.assertIn("note one note two", h)
    def test_html_comments_are_dropped(self):
        h, _ = md.convert("before\n\n<!-- BEGIN GENERATED -->\n\n<!--\nmulti\nline\n-->\n\nafter\n")
        self.assertNotIn("BEGIN", h); self.assertNotIn("multi", h); self.assertEqual(h.count("<p>"), 2)
    def test_paragraph_stops_at_a_list(self):
        h, _ = md.convert("text\n- item\n")
        self.assertIn("<p>text</p>", h); self.assertIn("<ul>", h)
class Inline(unittest.TestCase):
    def test_code_protects_markup(self):
        h, _ = md.convert("use `a*b*c` and **bold**")
        self.assertIn("<code>a*b*c</code>", h); self.assertIn("<strong>bold</strong>", h)
    def test_link_map_and_external(self):
        h, _ = md.convert("[a](x.md) [b](https://e.com/?a=1&b=2)", lambda u: u[:-3] + ".html" if u.endswith(".md") else u)
        self.assertIn('href="x.html"', h); self.assertIn('target="_blank"', h); self.assertIn("a=1&amp;b=2", h)
    def test_escapes_text(self):
        h, _ = md.convert("a < b & c")
        self.assertIn("a &lt; b &amp; c", h)
class RealDocs(unittest.TestCase):
    def test_every_doc_converts_cleanly(self):
        d = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "docs")
        for f in sorted(os.listdir(d)):
            if not f.endswith(".md"): continue
            with open(os.path.join(d, f), encoding="utf-8") as fh:
                h, t = md.convert(fh.read())
            self.assertTrue(t, f + " has no title")
            visible = re.sub(r"<pre>.*?</pre>", "", h, flags=re.S)
            visible = re.sub(r"<code>.*?</code>", "", visible, flags=re.S)
            self.assertNotRegex(visible, r"\*\*[^*\s]", f + " left bold markers")
            self.assertNotIn("|---", visible, f + " left a table")
            self.assertNotRegex(visible, r"(?m)^\s*#{1,6} ", f + " left a heading")
if __name__ == "__main__":
    unittest.main()
