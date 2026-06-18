# NovaLabs

Source for [**novalabs.app**](https://novalabs.app) — the home of NovaLabs, an independent hardware &amp; software lab founded by [dash](https://github.com/dash1101).

NovaLabs builds:

- **[RPCortex](https://rpc.novalabs.app)** — a real, multitasking operating system for microcontrollers, written in MicroPython. *(source-available)*
- **Nova D1** — a build-it-yourself cybersecurity &amp; networking multi-tool powered by RPCortex; a ~$40 alternative to the Flipper Zero. *(in active development — est. Q1 2027)*
- **ytdl-UI** — a private, no-tracking media downloader at [yt.novalabs.app](https://yt.novalabs.app).

The Nova D1 spec lives in [`docs/nova-d1.md`](docs/nova-d1.md).

---

## Structure

```
index.html     — the single-page site
style.css      — glass-morphism styling (NovaLabs blue palette)
script.js      — nav, scroll reveals, animated stats, ambient effects
favicon.svg    — the NovaLabs "N" chip mark
logo.svg       — transparent "N" mark for dark backgrounds
docs/          — reference docs (Nova D1 spec)
.nojekyll      — serve files as-is if hosted on GitHub Pages
```

It's a static site — relative paths throughout, so it serves the same whether
it's behind the homelab Caddy or on GitHub Pages.

---

*&copy; 2026 NovaLabs (dash1101). All rights reserved.*
