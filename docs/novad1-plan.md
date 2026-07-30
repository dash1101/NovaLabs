# Nova D1 — execution plan

The current, prioritized plan for getting Nova D1 to a full, reliable multi-tool.
Grounded in what the hardware actually does as of the 2026-07-30 validation pass, not
in aspiration. For the full feature catalog see [`novad1-roadmap.md`](novad1-roadmap.md);
for the architecture see [`novad1-dev-plan.md`](novad1-dev-plan.md) and the package's
own `ARCHITECTURE.md`.

## Where we actually are

Validated on a real Pico 2 W (build 1.00.25, over serial):

- **The platform holds.** Boots to the shell, board **auto-detects** as `pico2w`, the
  pinmap validates, async multitasking works, and reboot-from-async is clean.
- **BLE works — decisively.** A scan returns 25–29 real devices with correct RSSI, and
  it stays reliable with a background service running. This was the single biggest
  unknown in the RP2350 switch. It's answered.
- **Package install works** — streamed to flash, and (as of 1.00.25) HTTPS downloads
  reclaim heap before the TLS handshake so large installs survive a fragmented heap.
- **The GUI runs** as a background service (on the current SH1106).

Not yet on hardware: any of the **radios** (CC1101 / SX1276 / PN532 / IR / GPS — not
wired yet), the **SSD1309** panel (not in hand), and **125 kHz LF** (no front-end yet).

## The one constraint that governs everything: memory

The Pico 2 W reports **~100 KB free even fresh-booted** with the Nova GUI service loaded
(~346 KB of the ~447 KB heap in use). This is *the* budget. Every driver, every buffer,
every feature has to fit inside ~100 KB of working room, on a heap that fragments.

Consequences that shape the plan:

- **One radio module in RAM at a time where possible.** Lazy-import drivers; don't hold
  every protocol resident.
- **Stream, don't slurp** — the lesson from the install fix applies everywhere: capture
  buffers, file reads, framebuffers.
- **Reclaim before HTTPS** — already wired; keep it.
- If a feature genuinely can't fit, it's a **Rev 2** (Pico Plus 2 W, 8 MB PSRAM) feature,
  not a Pico 2 W one. That's an honest cutoff, not a failure.

## Board decision (settled)

**Reference build: Raspberry Pi Pico 2 W ($7).** It has the full RP2350 PIO, WiFi + BLE,
and leaves ~$50 of the $60 budget for radios. **Nova D1 Rev 2: Pimoroni Pico Plus 2 W** —
identical header (code drops in) plus PSRAM/flash/GPIO, for anyone who wants headroom or
the features the Pico 2 W can't fit. ESP32-S3 is legacy (no PIO). pcap/monitor mode is
impossible on the CYW43439 (same radio on both Pico boards) — parked unless we build
custom firmware, which would be a Rev-2-only, single-device decision.

---

## The plan, in priority order

### Phase A — harden the base (mostly done; finish on-hardware)
- [x] pkg install streams to flash — **hardware-verified** (38-file NovaD1 install completed)
- [x] HTTPS reclaims heap before the TLS handshake, and fails with actionable guidance
  ("install from a fresh boot") when the heap is too fragmented for a contiguous block
- [x] **Learned on hardware:** a large online install is a non-moving-GC *fragmentation*
  wall — it works from a fresh boot (~100 KB free) and fails once the heap is carved up
  (~66–86 KB). The reliable path is: install big packages from a fresh boot. Not fixable
  purely in net.py; the real lever is the resident footprint (below).
- [ ] **Shrink the resident footprint** so more headroom is available (the Nova GUI
  service is the big chunk) — the highest-leverage memory work, and it helps everything.
- [ ] **SSD1309 bring-up** when the 2.42" panel arrives — the init sequence is written
  but device-unconfirmed; confirm it lights up, then it's a config toggle.
- [ ] Decide the button **GPIO expander** (PCF8574) now, because the pin budget is full —
  it's what frees room for LF + iButton.

### Phase B — radios, one at a time
Each follows the same loop: **wire → driver bring-up → prove read/echo → make it not
block the async loop → on-hardware test → document.** Order chosen by value and by what
unblocks the most:

1. **PN532 (NFC/RFID)** — I2C, shares the display bus, no extra SPI. Easiest first win;
   read tags, save/load `.nfc`.
2. **CC1101 (sub-GHz)** — SPI. Capture + replay fixed-code OOK; read `.sub`.
3. **SX1276 (LoRa)** — SPI. The mesh already has a protocol layer; wire the radio and
   prove node-to-node (needs a second unit for real range).
4. **IR** — TX (PWM timing loop first) + RX capture; already have the encoders.
5. **GPS** — UART, straightforward; position + NMEA.

Cross-cutting: **convert blocking radio ops to async foreground apps** (the way sysmon
was converted) so a capture or a scan doesn't freeze the UI/services. The BLE scan today
blocks the loop for its 5 s window — that's the template case to fix.

### Phase C — the PIO payoff (why we chose RP2350)
Move timing-critical work off CPU loops into PIO state machines:
- **IR TX** timing → PIO (replaces the first-pass loop).
- **Sub-GHz** edge capture/replay → PIO, so it stays accurate under load. (De-risk test:
  capture a known signal idle vs. with services running; if it degrades, PIO is
  mandatory — this is the test that proves the RP2350 was the right call.)
- **125 kHz LF carrier** → PIO (feeds Phase D).

### Phase D — LF RFID (the standout feature)
- **Read now:** RDM6300 (~$3–6, UART) reads EM4100 fobs. Drop-in, low effort.
- **Read + emulate (the selling point):** a 125 kHz coil front-end (coil + driver +
  envelope detector, ~$3–5) driven by PIO — one antenna reads, clones *and* emulates.
  The Flipper does exactly this, so it's proven-doable, not a moonshot. Needs the coil
  tuned on real hardware; RDM6300 covers reading until then.

### Phase E — features on top
- **Rolling-code analyzer** — capture several, identify the scheme, predict the next
  code *where the scheme is predictable* (weak/counter-based); honest that crypto rolling
  codes can't be predicted without the key.
- **Mesh enhancements** — node table, named nodes, ack/retry on top of the existing
  managed-flood routing.
- More **apps** on the app framework (the plumbing already ships).

### Phase F — Rev 2 (Pimoroni Pico Plus 2 W)
Only what the Pico 2 W genuinely can't do: big capture buffers in PSRAM, every module
resident at once, and the pcap-via-custom-firmware question if we ever pursue it.

---

## Working discipline (applies to every phase)

- **Prove logic in CPython, prove hardware on the board.** Parsers, encoders, routing,
  format code → `repo/tests/novad1/` (zero-dep, `python3 run_all.py`). Memory behavior,
  radios, PIO, TLS → the real Pico 2 W over `tools/devterm.py`.
- **Mark device-only claims `DEVICE-UNCONFIRMED`** rather than implying they're tested
  (e.g. the SSD1309 init today).
- **Ground protocol work in real sources** — firmware, datasheets, reference drivers —
  never recall. Silent-failure bugs (a wrong display init, a wrong IR layout) give no
  error at all.
- **Budget memory per feature.** Before adding a driver, know its resident cost and
  where it fits in the ~100 KB. If it doesn't, it's Rev 2.
- **One board profile, generated docs.** Pins come from `novaboard`; the wiring tables
  are generated, so they can't drift.

## Open decisions
- GPIO expander: PCF8574 (I2C) vs 74HC165 (shift register) — pick before wiring buttons.
- LF: start with RDM6300 read-only, or go straight to the coil front-end?
- When to convert each blocking command to an async foreground app vs. leave sync.
