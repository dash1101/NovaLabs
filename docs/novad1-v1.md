# Nova D1 — V1 status board

**Goal: a finished V1 proof-of-concept.** This is the single place to see what the D1
supports and what's left before we call V1 done. The big, hardware-blocked features are
[Nova D2](novad2.md); what's here is what D1 actually ships.

Status: **✅ done** · **🔬 hardware-verified** · **💻 code done, needs hardware** ·
**🔨 in progress** · **⬜ to do**

## Module support matrix

Every hardware module the D1 targets, its driver, and whether it's been proven on the
board. Drivers exist for all of them; the gap is on-hardware bring-up (one at a time).

| Module | Bus | Driver | On hardware | Notes |
|---|---|---|---|---|
| OLED display (SH1106) | I2C | `display` | 🔬 | current panel; GUI runs |
| OLED display (SSD1309) | I2C | `display` | 💻 | 2.42" panel; init written, unconfirmed |
| Encoder + buttons | GPIO | `novainput` | 🔬 | works |
| WiFi (CYW43439) | — | `net`/`novawifi` | 🔬 | on-board |
| Bluetooth LE | — | `novable` | 🔬 | scan verified, 29 devices |
| PN532 (NFC/RFID) | I2C | `novanfc` | 💻 | **first radio to bring up** |
| CC1101 (sub-GHz) | SPI | `novacc` | 💻 | capture/replay OOK |
| SX1276 (LoRa) | SPI | `novalora`/`novamsg` | 💻 | mesh; needs 2nd unit for range |
| IR TX + RX | GPIO | `novair` | 💻 | `.ir`; NEC/Sony/RC5/RC6/Pioneer |
| GPS | UART | `novamods` | 💻 | position + NMEA |
| DHT11/22 | GPIO | `novamods` | 💻 | temp + humidity |
| Battery / VBUS | ADC/GPIO | `novapower` | 💻 | opt-in pins |
| Vibration + buzzer | GPIO/PWM | `novamods`/`novasound` | 💻 | now drives notification alerts |
| iButton / 1-Wire | GPIO | `novamods` | 💻 | needs a pin (GPIO expander) |
| microSD | SPI | `novamods` | 💻 | storage |
| RDM6300 (125 kHz LF read) | UART | — | ⬜ | optional; the one D1 LF capability |

The whole radio column is the critical path to V1: **wire → bring up → prove → async-ify
→ test**, PN532 first. You have most modules in hand now.

## V1 feature checklist

### Privacy / stealth (the new Nova D standard)
- 🔬 (pending device test) **Kill switch / incognito** — `incognito on` silences ALL
  radios instantly (WiFi/BLE/LoRa/sub-GHz/NFC); `off`/`toggle`/`status`. `novastealth`.
- 💻 **Anti-fingerprinting** — `incognito mac on` sets random locally-administered MACs
  to resist fingerprinting.
- ⬜ **Physical kill switch** — wire a switch to `killsw` (`d1 pins set killsw <gpio>`);
  the poll hook exists, needs the switch + a poll site in the UI loop.

### UI
- 🔬 GUI runs (SH1106); app system, app store, 9 apps, scripting
- 🔨 **Home rework** — centralize common actions + subcategories
- ⬜ **Smaller elements** — fit more on the 2.42" panel without hurting legibility
- ⬜ **Native scroll** — for screens whose text runs off 128×64
- ⬜ **Startup animation** — show the full splash while the panel finishes init, without
  adding boot time (currently clipped because init is slow)

### Notifications
- ✅ Notification queue + unread bell
- 💻 **Haptic alert** — vibe pulse + short fast buzzer chirps on each notification
  (guarded; no-op when unwired; `Apps.NovaD1_Notify_Haptic`)

### Radios & comms
- (module bring-up per the matrix above)
- ✅ LoRa mesh: routing (managed flood + TTL + dedup) + AES-128 — code done
- 💻 **LoRa BG receive + device send** — `novamsg.manager` already does background RX →
  inbox + notify and drains a send queue; verify on hardware with a 2nd unit
- ⬜ **Nova mesh standard**: explicit open broadcast + named encrypted channels
- ⬜ Rolling-code analyzer

### Platform (mostly done)
- 🔬 Board auto-detect, streamed install, async multitasking, TLS-fragmentation handling
- ⬜ Footprint reduction (banked for the custom-firmware endgame — see the plan)
- ⬜ Fix IR TX off `esp32.RMT` (RP2 timing loop → PIO)

## Explicitly NOT in V1 (→ Nova D2)
WiFi pcap/Wireshark, LF RFID **emulate**, dual-band WiFi, multi-threading, PSRAM / richer
UI. See [novad2.md](novad2.md). Killing these off the D1 path is what makes V1 finishable.

## The short path to "V1 done"
1. Finish the UI polish (home, scroll, smaller elements, splash) — no new hardware.
2. Bring up the radios one at a time (PN532 → CC1101 → IR → GPS → SX1276), async-ifying
   each so nothing blocks the loop.
3. Verify stealth + notifications + LoRa on hardware.
4. Graduate v1.0 from the beta channel to stable.
