# Nova D1 — Concept: The App System (beyond test modules)

You nailed the gap: today the home is a **flat gallery of ~21 icons**, several of which
are still bare **hardware-test screens** (probe the chip, print status), and app
"management" is just a show/hide list. This is the plan to make Nova D1 feel like a
real handheld OS — and almost all of it is buildable + testable in the **simulator**
with no hardware.

## Where we are
- Apps come from `_all_apps()` = the hardware `MODULES` + a few built-in apps.
- **Real apps:** GPS, NFC, IR, Sub-GHz, LoRa, BLE, **LED (new — see below)**, WiFi,
  Messages, Notifications, Scripts, Logs, Power, Settings, Sys Check.
- **Still just test screens:** DHT11, iButton, SD Card, Battery, Buzzer, Vibration.
- Management: `Apps.NovaD1_Home` csv + `novad1 apps show|hide` + a Manage Apps toggle
  list. Home styles: `gallery` | `menu`.

## The vision — five pieces

### 1. An app registry with metadata (the foundation)
Formalize every app as a descriptor instead of an ad-hoc tuple:
```
{ key, name, category, icon, kind, factory }
kind  = real | test | system
```
A new `novaapps.py` owns this (derived from MODULES + built-ins), so the home, the
manager, and scripts all read one source of truth. Non-invasive; unlocks the rest.

### 2. Categories / folders (fixes the 21-flat-icons clutter)
Group apps: **Wireless** (NFC · BLE · Sub-GHz · LoRa · WiFi · IR) · **Sensors** (GPS ·
Environment · Battery) · **Tools** (Scripts · Messages · Notifications · Logs · LED) ·
**System** (Settings · Power · Sys Check · SD · Diagnostics). New home style `folders`:
top level = category icons, drill in for apps (keeps `gallery`/`menu` too). Much nicer
on a small OLED than 21 icons in one ring. Fully sim-testable.

### 3. Test → real apps (the "make it functional" pass)
Retire the pure hardware-tests into a single **Diagnostics** app (Sys Check already
does module probing), and promote the useful ones to real apps:
- **LED → done** (this build): a live colour picker (turn the encoder, the LED changes;
  Select to keep). `novamods.set_led(r,g,b)` is the reusable control.
- **Battery → Battery app:** %, voltage, USB/charging, history bar (from `novapower`).
- **DHT11 → Environment app:** live temp + humidity, min/max.
- **Buzzer / Vibration → a "Feedback" test action** inside Settings (they're actuators,
  not apps) or a Tools > Diagnostics entry.
- **iButton / SD → Diagnostics** (they're status probes, not interactive apps).

### 4. App manager (real management, not just show/hide)
Extend Manage Apps: enable/disable, **reorder**, **pin favourites** to the top,
assign/adjust **category**, per-app settings. Backed by the registry (#1). Plus richer
`novad1 apps` CLI (`list [category]`, `move`, `pin`, `reset`).

### 5. User-installable apps (the open-ended future)
- **Script-apps as first-class apps:** a button-grid `.rps`/`.txt` in the scripts store
  can be "installed" so it shows on the home with its own icon (the button-grid engine
  already exists — this just registers it in the app registry).
- **Downloadable Nova-UI apps:** an app repo (like the RPCortex package repo) of
  Nova-UI mini-apps installable over the web panel / SD. A manifest per app
  (name/category/icon/entry). Long-term, the "app store" for Nova D1.

## Phased plan
1. **`novaapps.py` registry + categories** (metadata; home + manager read it). Sim-tested.
2. **`folders` home style** (category → apps). Sim-tested + rendered.
3. **Real apps:** LED ✅ → Battery → Environment; fold actuator tests into Diagnostics.
4. **App manager v2** (reorder/pin/category) + richer `novad1 apps`.
5. **Script-apps installable** → then a downloadable Nova-UI app repo.

## What's testable now vs on device
- **Now (sim + CPython):** the registry, categories, the folders home, every app's UI
  and navigation, the manager. This is ~90% of the work.
- **Device-only:** the actual hardware effects (the LED lighting, battery ADC, DHT
  reads) — but the apps degrade gracefully (show "no hardware") so they're fully
  navigable/renderable in the sim.

## Open questions for dash
- **Folders vs enhanced-flat home?** I lean folders (categories) for 21+ apps, but it
  adds a nav level — your call (the sim will show both).
- **Diagnostics app** to absorb the pure hardware-tests — good, or keep per-module test
  screens reachable somewhere?
- **App repo** ambition: is a downloadable Nova-UI "app store" something you want to aim
  for, or keep apps built-in + script-apps only?
