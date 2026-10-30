# Working on novalabs.app

The site is static and is served from this repository as it stands, so **a push to `main` is a
deployment**. Pages are generated from sources in `site/`; the generated `.html` files are committed
next to them.

```
python3 site/build.py            # rebuild the site into the repository root
python3 site/build.py --check    # build to a scratch folder and only check links
python3 site/build.py --out DIR --status "Draft preview"   # a complete copy for a preview
python3 site/test_md.py          # the markdown converter's tests
```

A build fails on a broken link, a missing anchor, or a `{{placeholder}}` left unfilled.

## Where things live

| To change | Edit |
|---|---|
| Wording on the home, Nova D1, simulator, contact or privacy page | `site/pages/<page>.html` (the front matter at the top sets the title, description and which nav item is lit) |
| The Nova D1 build progress, the screens, the docs and tools list | `site/data/d1.json` |
| The nav, the footer, the one-line status bar | `site/data/site.json` |
| A Nova D1 doc | `docs/<name>.md`; it is rendered to `docs/<name>.html` with a sidebar |
| A Nova D1 screenshot | replace the file in `img/d1/` (rendered by the package repository's `mock_render.py`) |
| Look and feel | `ds/` (shared with rpc.novalabs.app, see `ds/README.md`) and `nova.css` |

## Everyday jobs

**Mark a Nova D1 feature as done.** In `site/data/d1.json`, find the item and change its `status` to
`done`, `part`, `next`, `late` or `hw`. Rebuild.

**Add a feature or a category.** Add an object to `items` or `categories` in `d1.json`. The page,
the percentages and the legend follow.

**Add a doc.** Drop `docs/<name>.md` in. It appears in the sidebar and needs a card in the
`resources` list of `d1.json` only if it should be on the Nova D1 page too. A link to another doc
is written `[text](other-doc.md)` and becomes the page link.

**Show a notice on every page.** Set `status.text` in `site.json` (and optionally `link` and
`link_text`; `tone` is `warn` or `ok`). Empty it to hide the bar.

**Add a Nova D1 module to the simulator.** `js/sim.js` has a hand-maintained `MODS` list. Every
module added to the Nova D1 package must be added there too, or the simulator fails at load.

## Statements that must follow the products

The site describes things that live in other repositories. When they change, these pages need to:

- RPCortex (what it is written in, what version is current): the home page and the privacy page.
- Nova D1 hardware (ESP32-S3 today, an RP2350 port planned): `d1.json`, the docs and the home page.
  The wiring doc and the board profile in the package repository must agree.
