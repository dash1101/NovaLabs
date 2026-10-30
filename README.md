# NovaLabs

Source for [**novalabs.app**](https://novalabs.app), a hub for the projects [dash](https://github.com/dash1101) has started and finished.

The projects listed there:

- **[RPCortex](https://rpc.novalabs.app)**: an operating system for the Raspberry Pi Pico family. v2 "Vela II" is written in C++ and is in beta; v1.0 "Vela" is the stable MicroPython release. *(source-available)*
- **Nova D1**: a build-it-yourself cybersecurity and networking multi-tool, built around a Raspberry Pi Pico 2 W. It runs RPCortex as the `novad1` package. *(in development)*
- **ytdl-UI**: a private media downloader at [yt.novalabs.app](https://yt.novalabs.app).

The Nova D1 documentation is in [`docs/`](docs/) and is rendered on the site: [Nova D1 on RPCortex v2](docs/novad1-v2.md), the [V1 reference](docs/novad1-v1.md), [wiring](docs/novad1-wiring.md), the [parts list](docs/novad1-bom.md), [radio notes](docs/novad1-radio.md), the [Flipper comparison](docs/novad1-flipper-map.md) and the [D2 concept](docs/novad2.md).

---

## Structure

The site is static and is served from this repository as it stands. The pages are generated from sources in `site/` by `python3 site/build.py`, and the generated files are committed beside them. `site/README.md` describes the everyday jobs: editing a page, marking a Nova D1 feature as done, adding a doc, showing a notice.

```
site/pages/    one source file per page
site/data/     the content that changes: nav, footer, Nova D1 progress, screens and links
site/build.py  the generator; it fails on a broken link or an unfilled placeholder
docs/          Nova D1 and Nova D2 reference docs (markdown), rendered to docs/*.html
ds/            the design system shared with rpc.novalabs.app (stylesheet and fonts)
nova.css       what only this site needs (the simulator)
js/sim.js      the browser simulator's glass: keys in, panel out
sim/           novad1-sim.wasm, the Nova D1 C++ package compiled to WebAssembly (a built artifact)
img/           Nova D1 screen renders and the social card
```

---

*&copy; 2026 NovaLabs (dash1101). All rights reserved.*
