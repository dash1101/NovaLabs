# NovaLabs

Source for [**novalabs.app**](https://novalabs.app) — the home of NovaLabs, an independent hardware &amp; software lab founded by [dash](https://github.com/dash1101).

NovaLabs builds:

- **[RPCortex](https://rpc.novalabs.app)** — a real, multitasking operating system for microcontrollers. v1.0 "Vela" is the stable MicroPython release; v2.0 "Vela II", the native C++ rewrite, is in beta. *(source-available)*
- **Nova D1** — a build-it-yourself cybersecurity &amp; networking multi-tool, and an affordable alternative to the Flipper Zero. It runs RPCortex as the `novad1` package suite rather than as its own firmware. *(in active development — est. Q1 2027)*
- **ytdl-UI** — a private, no-tracking media downloader at [yt.novalabs.app](https://yt.novalabs.app).

The Nova D1 docs live in [`docs/`](docs/) — the [V1 reference](docs/novad1-v1.md), [wiring](docs/novad1-wiring.md), [parts list](docs/novad1-bom.md), [radio notes](docs/novad1-radio.md), the [Flipper comparison](docs/novad1-flipper-map.md) and the [D2 concept](docs/novad2.md).

---

## Structure

```
index.html     — the landing page
d1.html        — the Nova D1 product page
d1-sim.html    — the browser simulator; runs the real Nova D1 modules under Pyodide
contact.html   — contact
privacy.html   — privacy policy
style.css      — glass-morphism styling (NovaLabs blue palette)
script.js      — nav, scroll reveals, animated stats, ambient effects
announce.js    — the announcement banner
favicon.svg    — the NovaLabs "N" chip mark
logo.svg       — transparent "N" mark for dark backgrounds
docs/          — Nova D1 and Nova D2 reference docs
banners/       — announcement art, and the renders made from it
img/           — screenshots and page art
.nojekyll      — serve files as-is if hosted on GitHub Pages
```

It's a static site — relative paths throughout, so it serves the same whether
it's behind the homelab Caddy or on GitHub Pages.

---

*&copy; 2026 NovaLabs (dash1101). All rights reserved.*
