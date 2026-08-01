# Nova D1 — V1 reference

The build reference and status for Nova D1 V1: supported modules, the Pico 2 W pinout,
the parts list, and remaining work. Features that need hardware D1 can't provide are
[Nova D2](novad2.md).

Status keys: **done** · **hw** (verified on hardware) · **code** (written, needs hardware)
· **wip** · **todo**.

## Hardware

Reference board: **Raspberry Pi Pico 2 W** (RP2350, 520 KB RAM, WiFi + BLE). Display:
**SSD1309** 2.42" 128×64 I²C (SH1106 also supported). The Pimoroni Pico Plus 2 W is a
drop-in headroom option.

### Pico 2 W pinout

Board profile `pico2w`. SD shares the radio SPI0 bus. `d1 pins` on the device is
canonical; this table is a snapshot.

| Signal | GPIO | Signal | GPIO |
|---|---|---|---|
| I²C SDA | 4 | CC1101 CS | 17 |
| I²C SCL | 5 | CC1101 GDO0 | 20 |
| Encoder A | 14 | SX1276 CS | 21 |
| Encoder B | 15 | SX1276 RST | 12 |
| Encoder SW | 13 | IR TX | 6 |
| Button 1 | 22 | IR RX | 7 |
| Button 2 | 26 | GPS TX | 0 |
| Kill switch | 8 | GPS RX | 1 |
| SPI SCK | 18 | Buzzer | 27 |
| SPI MOSI | 19 | Vibration | 28 |
| SPI MISO | 16 | Status LED | 2 |
| SD CS | 9 | DHT | 3 |

Reserved by the board (wireless module): GPIO 23, 24, 25, 29. iButton and a 125 kHz LF
front-end need a GPIO expander (PCF8574 / 74HC165); the base map has no free pins for
them. Full per-module wiring: [novad1-wiring.md](novad1-wiring.md).

### V1 bill of materials

Indicative USD, before shipping. Commodity modules are far cheaper from AliExpress/eBay.

| Part | Purpose | Price |
|---|---|---|
| Raspberry Pi Pico 2 W | MCU | $6–7 |
| 2.42" SSD1309 OLED, I²C | display | $8–12 |
| EC11 rotary encoder | primary control | $1–2 |
| 2× tactile buttons + 1 kill-switch button | navigation + stealth | <$1 |
| VS1838B IR receiver + 940 nm IR LED | infrared | <$2 |
| CC1101 module (433 / 868 / 915 MHz) | sub-GHz | $2–5 |
| SX1276 LoRa module | LoRa mesh | $5–7 |
| PN532 NFC module (set DIP to I²C) | NFC/RFID | $3–6 |
| 2× antennas, band-matched | required before TX | $2–5 |
| microSD module + card | storage | $2–4 |
| NEO-M8N GPS | position | $8–25 |
| DHT22, vibration motor + transistor, buzzer, WS2812 LED | sensors + feedback | $5–10 |
| LiPo + TP4056 (USB-C) + 2× 100 kΩ divider | power | $10–15 |
| Breadboard + jumpers | assembly | $3–8 |

Match the CC1101, SX1276, and antennas to one frequency band, legal for transmit in the
region (433 MHz common in EU/Asia; 915 MHz licence-free in North America). Everything runs
at 3.3 V except the microSD module (5 V, regulated onboard).

## Module support

Drivers exist for every module; the gap is on-hardware bring-up, one at a time.

| Module | Bus | Driver | Status |
|---|---|---|---|
| OLED SH1106 | I²C | `display` | hw |
| OLED SSD1309 | I²C | `display` | hw (`d1 display ssd1309`) |
| Encoder + buttons | GPIO | `novainput` | hw |
| WiFi (CYW43439) | — | `net`/`novawifi` | hw |
| Bluetooth LE | — | `novable` | hw |
| PN532 NFC/RFID | I²C | `novanfc` | code — bring up first |
| CC1101 sub-GHz | SPI | `novacc` | code |
| SX1276 LoRa | SPI | `novalora`/`novamsg` | code |
| IR TX + RX | GPIO | `novair` | code |
| GPS | UART | `novamods` | code |
| DHT11/22 | GPIO | `novamods` | code |
| Battery / VBUS | ADC/GPIO | `novapower` | code |
| Vibration + buzzer | GPIO/PWM | `novamods`/`novasound` | code |
| microSD | SPI | `novamods` | code |
| iButton | GPIO | `novamods` | code (needs expander pin) |
| RDM6300 125 kHz LF read | UART | — | todo (optional) |

## Feature status

### Privacy (Nova D standard)
- **code** — Incognito kill switch: `incognito on` silences all radios instantly
  (WiFi/BLE/LoRa/sub-GHz/NFC). Also in the GUI power menu (STEALTH splash + notification)
  and via a physical `killsw` button (GPIO 8). `off` / `toggle` / `status`. `novastealth`.
- **code** — MAC randomisation: `incognito mac on`.

### UI
- **hw** — GUI on the OLED; app system, app store, apps, scripting.
- **done** — Home favorites bar (`d1 fav add/remove`) over the folder gallery.
- **done** — Native scroll + word-wrap for long text screens.
- **done** — Splash plays in full (opening frame no longer clipped by slow panel init).
- **done** — Power menu: Lock / Incognito / Reload / Reboot / Shutdown / Sleep.
- **done** — Troubleshoot menu (reconnect WiFi, blink display, reload pins, restart GUI,
  freeup, I2C scan, soft reboot) + a curated Commands menu (GUI access to safe shell cmds).
- **todo** — Smaller elements to fit more on the 2.42" panel.

### Notifications
- **done** — Queue + unread bell.
- **code** — Haptic alert: vibration + buzzer chirps per notification
  (`Apps.NovaD1_Notify_Haptic`, guarded).

### Comms
- **done** — LoRa mesh: managed-flood routing + TTL + dedup + AES-128 (code).
- **code** — Background RX + device send (`novamsg.manager`); needs a 2nd unit on-air.
- **done** — Wardriving: WiFi survey → WiGLE CSV, GPS-tagged, SD/flash (`novawardrive`,
  GUI Wardrive app + `d1 wardrive`). Scan-based; no pcap.
- **todo** — Explicit open broadcast + named encrypted channels.
- **todo** — Rolling-code analyzer.

### Platform
- **hw** — Board auto-detect, streamed install, async multitasking, TLS-fragmentation
  handling, `safeboot` (+ staged updates), storage guard (95% warn / 98% block).
- **done** — `pkg remove` clears a package's startup/service autostart entries.
- **done** — D1 service control: `novad1 service start|stop|restart|status`, `d1 refresh`.
- **todo** — Footprint reduction (deferred to the custom-firmware phase; see the plan).
- **todo** — IR TX off `esp32.RMT` → RP2 timing loop → PIO.

## Not in V1 → Nova D2
WiFi pcap/Wireshark, LF RFID emulate, dual-band WiFi, multi-threading, PSRAM / richer UI.
See [novad2.md](novad2.md).

## Path to V1
1. UI polish (home, scroll, smaller elements, splash) — no new hardware.
2. Radio bring-up in order: PN532 → CC1101 → IR → GPS → SX1276, each async so it never
   blocks the loop.
3. Verify stealth, notifications, and LoRa on hardware.
4. Graduate v1.0 from the beta channel to stable.
