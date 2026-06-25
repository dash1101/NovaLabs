# Nova D1 — categorized roadmap

Everything we've deferred or floated, grouped so we can tackle one category at a
time instead of scattering. Order is recommended (each category leans on the ones
above it). Status as of NovaD1 v0.11.0.

Legend: ✅ done · 🟡 partial · 🔜 next · 🗺 later · 🔧 needs hardware

---

## CATEGORY 1 — Verify & harden the core  (ongoing, you-driven)
Make sure every existing function works on real hardware before stacking on it.
- ✅ Display, encoder, buttons, IR tx/rx, SD, CC1101, PN532, DHT11, LED
- ✅ **SX1276 LoRa** — RegVersion 0x12 confirmed (radio inits)
- 🟡 GPS — RX proven; satellites/fix verification outdoors
- 🟡 LoRa comms — needs a **2nd board** to confirm board↔board
- Process: you flash, report any test app that fails, I fix. This stays priority 0.

## CATEGORY 2 — App framework  (the plumbing your new ideas need)  🔜
Cross-cutting infrastructure that several features below depend on.
- 🔜 **Notifications**: a top-bar icon + a notifications list + a `notify()` API any
  app/service (or the shell/web) can push to — with a background listener toggle.
- 🗺 **App-specific settings**: each app exposes its own settings page.
- 🗺 **Web↔Nova app sync**: a shared state layer so an app (Messages, Settings…)
  has both a Nova-UI view and a web view backed by the same data.

## CATEGORY 3 — Real functional apps  (turn "detect" into "do")
- 🗺 **LoRa Messages**: real text send/receive, background listener, notify on RX,
  synced to the web UI (compose on the phone keyboard). *Now unblocked by 0x12.*
- 🗺 **GPS live**: live coordinates/altitude/speed, save a waypoint to SD.
- 🗺 **NFC read/save**: read a tag, save its UID/data; (emulate where the PN532 can).
- 🗺 **IR record/replay**: learn a remote code, store a library, replay it.
- 🗺 **Sub-GHz capture/replay** (CC1101 OOK): the Flipper-style headline (own devices).

## CATEGORY 4 — Scripting & extensibility
- 🗺 **Python script API** (`nova.*`): scripts call gps/nfc/ir/lora/etc.
- 🗺 **Button-grid script apps**: data-driven UI (an IR remote of saved codes, a
  LoRa-button panel). *Depends on Cat 3 drivers being verified — that's why it waits.*
- 🗺 **Downloadable Nova-UI apps**: an app repo / install script-apps.

## CATEGORY 5 — Remote control
- 🟡 **Web panel**: status/apps/shell/WiFi GUI (done); deepen with app-sync (Cat 2).
- 🗺 **Web-Bluetooth bridge**: device BLE command service + an Android-Chrome page
  (works with WiFi down; the deliverable path vs a native APK).
- 🗺 **Native Android app**: later, if web-Bluetooth isn't enough.

## CATEGORY 6 — Hardware-gated  (need a new module first)
- 🔧 **125 kHz LF RFID** (RDM6300 / T5577 + coil) — to match Flipper's fob cloning.
- 🔧 **iButton** reader, extra sensors, etc.

## CATEGORY 7 — Power & polish  (continuous)
- ✅ screen-off, dynamic idle, fast boot
- 🗺 deeper power tuning, animation polish, more QoL.

---

**Recommended path:** finish Cat 1 (your testing) → build Cat 2 (framework) →
then Cat 3 real apps land fast because the plumbing + verified drivers are ready.
Starting now with **Cat 2: notifications** (foundation + the icon you asked for).
