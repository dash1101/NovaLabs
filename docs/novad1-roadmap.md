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
- 🗺 **WiFi packet capture → pcap (Wireshark)**: put the radio in **promiscuous /
  monitor mode**, capture 802.11 frames, write a standard **`.pcap`** (or pcapng)
  to SD so they open in Wireshark for offline review. *Feasibility:* **ESP32-target**
  — the ESP-IDF exposes `esp_wifi_set_promiscuous` + a sniffer callback, and pcap
  is just a 24-byte global header + per-packet headers we can write ourselves; the
  question is whether THIS MicroPython firmware surfaces the promiscuous callback
  (may need a custom build / C binding). **RP2 (CYW43) likely can't** do monitor
  mode, so scope this to the S3. Pairs with a live channel-hopper + a top "frames/s"
  readout. Honest: capture is passive/legal on your own networks; deauth/injection
  is a separate, regulated thing — capture first.
- 🗺 **BLE scanner & interact** (S3 has BLE built in — `bluetooth` / `aioble`):
  scan nearby BLE devices (name, MAC, RSSI, advertised services), connect to a
  GATT peripheral, read/write characteristics, subscribe to notifications. The
  base for a Nova "BLE app" + a `nova.ble.*` script API. *Feasible on-device.*
- 🗺 **BLE proximity ping ("headphones nearby")**: BROADCAST a BLE advertisement
  so a nearby phone shows a popup — the Apple-AirPods-open effect. *Feasible:*
  it's a known ESP32 trick (advertise an Apple "Continuity" proximity-pairing
  packet → iOS shows the pairing card). It SPOOFS the advertisement; it does not
  touch real earbuds. *NOT feasible:* jamming or taking over already-paired
  earbuds — BLE audio is encrypted/paired, and RF jamming is illegal. Scope this
  as a fun "advertise a beacon" demo, not an audio attack.
- 🗺 **Garage door opener** (needs the CC1101 sub-GHz module — Cat 6): goal is a
  one-remote-household backup opener. *Honest reality, two cases:*
  • **Fixed-code openers** (older, ~300–433 MHz OOK / DIP-switch / simple PT2262):
    CAN be captured and replayed — this is the realistic, achievable feature and
    falls straight out of Sub-GHz capture/replay above. Likely covers an older
    garage.
  • **Rolling-code openers** (KeeLoq, Chamberlain Security+ / Security+ 2.0):
    by design a captured code is single-use and invalid on replay; the next code
    is derived from a secret manufacturer key + a counter. Brute-forcing the
    keyspace (KeeLoq ~2^64, Security+2.0 ~2^66) is computationally infeasible to
    "just open it." Known real attacks (RollJam = capture-while-jamming a fresh
    code; KeeLoq manufacturer-key recovery) are sophisticated, hardware-specific,
    and legally sensitive — **research/your-own-device only.**
  *Recommended legit path:* clone your own fixed-code remote, OR use the opener
  unit's built-in "learn/add a remote" button (if you can reach the motor head),
  OR a programmable universal remote. Implement capture/replay + the rolling-code
  math/notes; be upfront that rolling-code replay won't work by design.

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
- ✅ **native framebuf canvas** (v0.28.0) — C-accelerated draw, ~10-50x faster
  redraw; killed the ~4fps OLED + the "shell echoes in chunks" loop starvation.
- ✅ **tiered screen timeout** (v0.28.0) — dim → off → auto-lock (PIN), all via
  contrast (never power-off, so no screen-off brick).
- 🗺 **Use the 8 MB PSRAM** (target HW is ESP32-S3-N16R8 = 8 MB PSRAM, 16 MB
  flash): cache for performance — glyph/icon bitmap caches, a parsed-code cache
  (decoded .ir/.sub libraries kept in RAM), prerendered screen buffers, larger
  HTTP/LoRa buffers, an in-RAM request/log ring. The RP2040 RAM budget no longer
  binds on the D1 hardware, so spend RAM to cut latency. *Verify PSRAM is enabled
  in the firmware build first (`gc.mem_free()` should show megabytes).*
- 🗺 deeper power tuning, animation polish, more QoL.

---

**Progress:** Cat 1 ✅ (all modules hardware-verified) · Cat 2 ✅ (notifications) ·
Cat 3 mostly ✅ (LoRa Messages, GPS live, NFC read, **IR record/replay + Flipper
.ir incl. parsed NEC** all working on hardware). **Now building Cat 4 (scripting:
nova.* API + button-grid apps + bg event scripts)**, then encrypted LoRa, web
app-ification, and Cat 7 polish.
