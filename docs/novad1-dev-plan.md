# Nova D1 — Development Roadmap

The build plan for the Nova D1 *software*: a modular, package-based multi-tool on
RPCortex Vela. Hardware spec: [`nova-d1.md`](nova-d1.md). This doc is the source
of truth for how we build it — architecture, requirements, and the staged plan.

> **Status:** Stage 0 (wrapper scaffold) shipped in the repo. Betas of the GUI
> start next; on-display testing when the SH1106 unit arrives.

---

## 1. The model

The Nova D1 is **not its own firmware** — it's RPCortex Vela running with a
**`novad1` wrapper package** on top. Everything the D1 does is built on what v1.0
already gives us:

- **The UI runs as a background SERVICE, the shell stays free.** This is the
  whole reason it works cleanly: the OLED and the serial/USB shell are *separate
  output surfaces*. The Nova GUI drives the OLED over I2C as a registered
  background service (like `httpd --bg`); the RPCortex shell stays usable over
  serial the entire time. So you can be navigating menus on the screen **and**
  drop to the shell to change anything — no conflict, no quitting the UI.
- **Cooperative multitasking** (`appkit` loop) — scan RF, poll GPS, animate the
  UI, and run a script all at once; any of them is cancellable mid-run.
- **Packages** — the wrapper + each driver/app are OTA-updatable, installable,
  removable. Build only what you wired.
- **Autonomy mode** — boots straight into the D1, headless, no login.

## 2. Design principles (non-negotiable)

1. **Modular everywhere** — hardware modules, the UI, and the wiring are all
   pluggable + config-driven. Adding/removing a module never means a rewrite.
2. **Seamless, automated setup** — auto-detect what we can, prompt only for what
   we can't, sensible defaults. Install and uninstall are one step each.
3. **Everything controllable from the shell** — every module and setting the UI
   exposes is also a `novad1 …` shell command. The shell is the escape hatch.
4. **Graceful degradation** — a missing/unplugged/broken module hides its app and
   logs a note; it never crashes the UI. Re-detect picks it back up.
5. **Persistent + OTA-safe** — all config survives reboots and updates.
6. **Target = ESP32-S3** (16 MB). Pins are configurable, not baked in.

## 3. Architecture

```
novad1 (wrapper package)
├── boot:   autonomy on → module check → start Nova UI service → spawn module tasks
├── core/
│   ├── registry   — the module table: {type, bus, pins, enabled, status}; persisted
│   ├── probe      — module check: I2C scan + per-driver SPI/UART version probes
│   └── service    — the UI background service (appkit loop; cancellable actions)
├── ui/  (modular UI framework)
│   ├── display    — abstraction + backends: SH1106 (primary) and SSD1306
│   ├── input      — EC11 rotary (rotate + push) + 3 buttons → logical events
│   ├── widgets    — status bar (WiFi · battery · clock), menus, lists, dialogs, toasts
│   └── app        — base "screen/app" (draw + on_input + optional bg task + cancel)
└── apps/  (one per capability — appears only if its module is present)
    ├── scripts    — list + run + quit scripts (from MicroSD / flash)
    ├── settings   — brightness, screensaver, WiFi, time/RTC, per-module enable
    ├── nfc (PN532 / RC522)   subghz (CC1101)   ir (emit + receive)
    ├── lora (SX1276)         gps (NEO-M8N)      rtc (DS3231)
    └── …                     (beeper / haptics used cross-app for feedback)
```

## 4. Hardware module registry (the modular backbone)

Every peripheral is an entry in a persisted **module registry** (a `novad1.cfg`
or `Apps.NovaD1_*` registry keys): `type`, `bus` (i2c/spi/uart/gpio), `pins`,
`enabled`, and a live `status` (present/absent/error). Drivers are pluggable —
each module = a thin driver + a probe + (optionally) a UI app.

**Module check** runs at setup and on demand (`novad1 scan`):
- **I2C** (scan the bus): screen (SH1106/SSD1306 @ 0x3C/0x3D), DS3231 RTC (0x68),
  PN532 NFC (0x24).
- **SPI** (driver version-register probe): RC522 RFID, CC1101 sub-GHz,
  SX1276 LoRa, PN532 (SPI mode).
- **UART**: NEO-M8N GPS (listen for NMEA sentences).
- **GPID/other**: IR emitter + receiver, beeper, haptics (declared, not probed).

Modules to support (modular — wire what you have):
display (SH1106 + SSD1306) · EC11 + 3 buttons · **RC522** and/or **PN532**
(NFC/RFID — both backends) · CC1101 (sub-GHz) · SX1276 (LoRa) · IR emit+receive ·
NEO-M8N (GPS) · DS3231 (RTC) · beeper · haptics · battery sense · DIP power toggles.

## 5. The Nova GUI

A 128×64 UI built *for* the tiny display — fun, legible, fast.

- **Display abstraction** — one interface, SH1106 + SSD1306 backends. Auto-pick by
  I2C address/probe, override in config. SH1106 is the dev default. Contrast/
  brightness control + an idle **screensaver / dim** (OLED burn-in protection).
- **Input model** — EC11 rotate = move selection, EC11 push = **Select/OK**;
  3 buttons = **Back**, **Home**, and a context **Action** button (all remappable
  in config). Debounced; encoder via IRQ/quadrature.
- **Status bar** (always on top): **WiFi icon** (full = connected / empty = not),
  **battery icon** (half-full placeholder until battery sense lands), and the
  **current time**. Room for a tiny "update available" / activity dot.
- **Screens**: a home menu (the apps for present modules) → list/detail screens →
  running-action view. A modular widget set (menu, list, progress, dialog, toast).
- **Multitasking / cancel-anything** — the rule: **any running action or script
  can be quit at any time** (Back/long-press sets a cancel flag the action polls
  on the cooperative loop). Long ops show progress + "hold Back to cancel"; the UI
  never locks up because the loop keeps turning.

## 6. Setup & lifecycle (seamless is the whole point)

- **Install:** `pkg install novad1`. Then **`novad1 setup`** — an automated wizard:
  module check → confirm the few it can't auto-detect → set/confirm pins → enable
  autonomy → register the UI service → reboot into the D1. Minimal prompts, good
  defaults.
- **Post-setup modification (seamless):** add/move a module any time →
  `novad1 scan` re-probes and the UI adapts live (apps appear/disappear), or
  `novad1 module <name> bus/pins/on/off` to adjust — **no reinstall, no wipe.**
- **Uninstall:** `pkg remove novad1` cleanly disables autonomy, removes the startup
  hook, and restores the normal shell boot. One step, fully reversible.
- **Recovery:** the UI service is supervised — if it crashes it restarts, and the
  shell is always reachable to fix config. `asyncmode off` / recovery shell remain.

## 7. Scripting

- A **Scripts app** lists scripts (from MicroSD when present, else flash) and runs
  them; running scripts are **cancellable** (the cancel rule above). RPCortex's
  `.rps` engine + Python scripts both run. Results/log shown in the UI.

## 8. Shell control surface (mirrors the UI)

Everything is reachable headless via `novad1 …`:
`scan` · `setup` · `status` · `gui` (start/stop the UI service) ·
`module <name> on|off|bus|pins|probe` · `set <setting> <value>` (brightness,
screensaver, button map, …) · `scripts list|run <f>` · `wifi`/`time` passthroughs.

## 9. Wise additions (things to fold in)

- **First-boot safety notice** — it's a security tool; a one-time "use only on
  hardware/signals you own" acknowledgement. Important for a Flipper-class device.
- **Battery path** — half-icon now → ADC battery sense + low-battery warning +
  the DIP power toggles (cut power to unused modules) + light/deep-sleep (ties to
  the v1.1 power-management work).
- **Feedback** — beeper + haptics for confirmations/alerts; UI toasts for status.
- **Audit log** — security actions logged via the RPCortex log (what was run/when).
- **Update awareness** — surface "update available" in the status bar; trigger OTA
  from a Settings entry (reuses `update channel` / `update online`).
- **Identity & theming** — device name on a boot/home splash; a couple of UI
  accent themes later (the desktop/site already have a palette to borrow).
- **Per-module driver isolation** — a driver fault shows a UI error + disables that
  app only; the rest keeps running (graceful degradation in practice).
- **Config export/import** — back up the module/pin setup (rides the `backup` pkg)
  so a rebuild or second unit is one restore.
- **NFC backend choice** — RC522 (cheap MIFARE) and PN532 (fuller NFC) are both
  "the NFC app" with swappable backends, picked by what's detected.
- **Headless/CLI mode** — the D1 still fully usable over serial with no display
  (every app has a shell equivalent), useful for bring-up and scripting.

## 10. Staged build (each stage independently testable)

- **Stage 0 — Wrapper scaffold** ✅ *(no special hardware)* — `novad1` package:
  scan / setup / status / gui-stub; autonomy + startup registration; config-driven
  I2C pins. Shipped.
- **Stage 1 — Nova GUI core** *(needs SH1106 + EC11 + 3 buttons — testing tomorrow)*
  Display abstraction (SH1106 first, SSD1306 backend), input layer, status bar
  (WiFi/battery/clock), home menu + widget framework, the UI **as a background
  service** with the shell free, and the cancel-anything rule. *Build the
  framework + render-to-buffer logic now (beta-able headless); wire to the panel
  tomorrow.*
- **Stage 2 — Module registry + module check + Settings app** — the persisted
  registry, full probe (I2C + SPI/UART version reads), live add/move re-detect,
  and the in-UI Settings app mirroring the shell.
- **Stage 3 — Storage + Scripts** — MicroSD mount (rides the v1.1 `sd` package) +
  the Scripts app (list/run/cancel).
- **Stage 4 — Peripheral apps, one at a time** — order by simplicity: beeper/
  haptics → RTC (DS3231) → IR → NFC/RFID (RC522/PN532) → sub-GHz (CC1101) →
  LoRa (SX1276) → GPS (NEO-M8N). Each = driver + UI app + shell command + docs.
- **Stage 5 — Power & polish** — battery sense, low-batt warning, sleep modes,
  DIP power routing, screensaver tuning, themes.

## 11. Open decisions (for dash)

1. **Pin map** — config-driven defaults you can override, or a fixed reference
   wiring you'll publish? (Plan assumes config-driven.)
2. **Button mapping** — proposed: encoder-push = OK, btn1 = Back, btn2 = Home,
   btn3 = Action/context. Good, or different?
3. **Script storage** — MicroSD primary with a flash fallback? (Plan assumes yes.)
4. **NFC** — ship both RC522 + PN532 backends, auto-selected by detection? (Yes.)
5. **Bring-up order tomorrow** — display + input first (Stage 1), agreed?
