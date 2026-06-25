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
- 🗺 **NFC read/save**: read a tag, save its UID/data.
- 🗺 **NFC write / emulate**: write a saved UID/record to a tag (where PN532 allows).
- 🗺 **IR record/replay**: learn a remote code, store a library, replay it.
- 🗺 **Sub-GHz capture/replay** (CC1101 OOK): the Flipper-style headline (own devices).
- 🗺 **LoRa mesh (Meshtastic-style)**: nodes relay messages across hops.
- 🗺 **Encrypted LoRa / P2P**: AES (pre-shared key) over the novamesh payload, so
  two D1s talk privately. (Feasible — ESP32 has hardware AES via ucryptolib.)

## CATEGORY 4 — Scripting & extensibility
- 🗺 **Python script API** (`nova.*`): scripts call ir/lora/gps/nfc/notify/run/etc.
- 🗺 **Button-grid script apps**: data-driven UI (an IR remote of saved codes, a
  LoRa-button panel).
- 🗺 **Background event scripts**: a script runs in the bg and reacts — e.g. on a
  specific IR code → push a notification → send a sub-GHz command.
- 🗺 **Flipper script conversion**: parse Flipper's formats/scripts (sub-GHz `.sub`,
  IR `.ir` ✅, etc.) into Nova scripts — "be able to run Flipper stuff."
- 🗺 **Downloadable Nova-UI apps**: an app repo / install script-apps.

## CATEGORY 5 — Remote control
- 🟡 **Web panel**: status/apps/shell/WiFi/codes (done); **app-ify** it — Msg/Codes/
  Shell become real app UIs under one launcher, not separate shell-ish tabs.
- 🗺 **Secure control (not raw root-over-WiFi)**: today the web shell is full root on
  any joined network (PIN-gated). Move privileged settings behind a **BT pairing**
  channel + a dedicated **Android (later iOS) app** — the proper secure path.
- 🗺 **Web-Bluetooth bridge**: device BLE command service + an Android-Chrome page
  (works with WiFi down).
- 🗺 **Native Android app**: pair over BT (no WiFi/IP needed). Android Studio
  workspace coming from dash.

## CATEGORY 6 — Hardware-gated  (need a new module first)
- 🔧 **125 kHz LF RFID** scanning/cloning (RDM6300 / T5577 + coil) — Flipper-style fobs.
- 🔧 **iButton** reader, extra sensors, etc.

## CATEGORY 8 — USB & HID  (rides the ESP32-S3 native USB; later)
The S3's native USB currently serves the serial console (CDC). These need a USB
mode switch / composite device, so they're a later workstream:
- 🗺 **HID controller** — act as a USB keyboard / mouse.
- 🗺 **BadUSB** — scripted keystroke payloads (own/authorized machines only).
- 🗺 **U2F** — act as a FIDO/U2F security key.

## CATEGORY 7 — Power & polish  (continuous)
- ✅ screen-off, dynamic idle, fast boot
- 🗺 deeper power tuning, animation polish, more QoL.

---

**Progress:** Cat 1 ✅ (all modules hardware-verified) · Cat 2 ✅ (notifications) ·
Cat 3 mostly ✅ (LoRa Messages, GPS live, NFC read, **IR record/replay + Flipper
.ir incl. parsed NEC** all working on hardware). **Now building Cat 4 (scripting:
nova.* API + button-grid apps + bg event scripts)**, then encrypted LoRa, web
app-ification, and Cat 7 polish.
