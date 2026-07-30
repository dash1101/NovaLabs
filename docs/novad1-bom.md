# Nova D1 — what it does, and what it costs to build

The Nova D1 is a pocket multi-tool for radio, RFID and infrared: a small OLED, a
rotary encoder and three buttons on top of a microcontroller running
[RPCortex](https://rpc.novalabs.app), our MicroPython operating system. It reads and
replays IR remotes, captures and replays sub-GHz signals, reads NFC tags, sends
encrypted LoRa messages across a self-relaying mesh, and reads Flipper Zero files
directly.

It's **fully DIY** — every part is an off-the-shelf module, no custom PCB, no
soldering iron strictly required if you use a breadboard. The software is free and
source-available.

**Try it before you buy anything:** the [browser simulator](https://novalabs.app/d1-sim)
runs the real firmware, in your browser.

> **Prices below are indicative, gathered July 2026, in USD, before shipping and tax.**
> The microcontroller and display prices are stable. The radio and sensor modules are
> commodity parts sold by hundreds of sellers, and prices swing a lot with source and
> quantity — buying from AliExpress or eBay is typically a third of the price of a
> Western hobby retailer, with a 2–4 week wait.

---

## 1. What it can do

Everything in this section is **built and working today** unless marked otherwise.

### Infrared
- **Learn any remote.** Capture a raw IR burst and replay it with the correct 38 kHz
  carrier — TV, air conditioner, soundbar, LED strip.
- **Reads and writes Flipper Zero `.ir` files**, so the community's existing remote
  libraries work as-is, and files you make work on a Flipper.
- **Decoded protocols** so a signal can be stored compactly rather than as raw
  timings: NEC, NEC-extended, Samsung32, Sony SIRC (12/15/20-bit), Philips RC5/RC5X,
  RC6, and Pioneer.
- A saved remote becomes an on-screen button grid you can drive with the encoder.

### Sub-GHz radio (433 / 868 / 915 MHz)
- **Capture and replay** fixed-code OOK signals — garage remotes, gate fobs, cheap
  doorbells, 433 MHz sensors.
- **Reads Flipper Zero `.sub` files.**
- Configurable frequency, and a saved-code library on the device.
- **Deliberately not supported: rolling-code / keeloq rotation.** Modern car keys and
  good garage openers change their code every press. Replaying an old capture will not
  open them, and we don't pretend otherwise.

### NFC / RFID (13.56 MHz)
- **Read tags** — UID, type, and stored blocks — from MIFARE Classic, NTAG and other
  ISO14443-A tags.
- **Reads and writes Flipper Zero `.nfc` files.**
- Save a tag to the device and browse your collection.

### LoRa — long-range mesh messaging
- **Encrypted text messaging** between Nova D1 units, AES-128, kilometres of range
  with a clear path.
- **Multi-hop mesh routing.** Messages relay through other units to reach further than
  any single radio can, using managed flooding with a hop limit and duplicate
  suppression — the same approach Meshtastic uses.
- Works with no WiFi, no cell service, no infrastructure at all.

### The rest
- **GPS** — position, altitude, satellite count, live NMEA.
- **WiFi** — scan networks, connect, and a **phone control panel** served over WiFi so
  you can drive the device from a browser.
- **Bluetooth LE** — scan for nearby devices; proximity "ping" advertisements.
- **iButton / 1-Wire** — read DS1990-style contact keys.
- **Environment** — temperature and humidity from a DHT11/22.
- **Battery monitoring** with a low-battery warning.
- **microSD** for storing captures, scripts and apps.

### The interface
- **A real app system** — a folders home screen, an icon gallery, or a plain list;
  your choice. Plus an on-device **app store** that installs new apps over WiFi.
- **Nine apps included**: TOTP two-factor authenticator, countdown timer, tally
  counter, base converter, dice, flashlight, LoRa quick-message, BLE pranks, and a
  system shortcut panel.
- **Write your own apps** in a few lines of Python with the `nova` scripting API — one
  file, drop it on the device, it appears on the home screen.
- Clock, notifications, screen dimming, auto-lock, and a system self-check.
- Everything is also driveable from the **serial shell**, because underneath it's a
  full operating system with a package manager, user accounts and OTA updates.

### Known limits, stated plainly
- **125 kHz LF RFID** (old building fobs, EM4100) needs an extra reader module — see
  the optional parts. The PN532 physically cannot do 125 kHz.
- **WiFi packet capture** to `.pcap` is not possible on stock MicroPython; the file
  writer is built, but the capture itself needs a custom firmware build.
- **Sub-GHz rolling codes** — see above. Not a limitation we plan to remove.

---

## 2. Three ways to build it

Pick a tier. Every tier runs the same software; missing modules simply show as
unavailable in the menu, so you can start small and add radios later.

| Tier | What you get | Rough cost |
|---|---|---|
| **Essentials** | The device, its screen and controls, IR send/receive | **$25 – $35** |
| **Recommended** | Adds sub-GHz, NFC and LoRa mesh — the full multi-tool | **$55 – $75** |
| **Everything** | Adds GPS, SD, sensors, battery, iButton, haptics | **$95 – $125** |

The **Recommended** tier is the one to build. It's what the project is designed
around and it lands close to a **$60 target per unit** if you source the commodity
modules from AliExpress or eBay.

---

## 3. Parts

### Essentials — you need all of these

| Part | What for | Price | Where |
|---|---|---|---|
| **Raspberry Pi Pico 2 W** | The microcontroller. RP2350, 520 KB RAM, WiFi + Bluetooth. | **$7** | [Official](https://www.raspberrypi.com/news/raspberry-pi-pico-2-w-on-sale-now/) · [PiShop](https://www.pishop.us/product/raspberry-pi-pico-2-w/) · [Pimoroni](https://shop.pimoroni.com/en-us/products/raspberry-pi-pico-2-w) · [Seeed](https://www.seeedstudio.com/Raspberry-Pi-Pico-2-W-p-6244.html) |
| **2.42" OLED display**, 128×64, SSD1309, **I2C** | The screen. Bigger and much more readable than the common 0.96". | $9 – $16 | Search `2.42 inch OLED SSD1309 I2C` |
| **EC11 rotary encoder** with push switch | Primary control — scroll and click. | $1 – $2 | Search `EC11 rotary encoder module` |
| **2 × tactile push buttons** | Back and Home. | <$1 | Any electronics kit |
| **IR receiver** (VS1838B / TSOP38238) | Learning remotes. | <$1 | Search `VS1838B IR receiver` |
| **IR LED emitter** (940 nm) | Sending. A 3-pin module is easiest. | <$1 | Search `940nm IR LED module` |
| Breadboard + jumper wires | Wiring it up. | $5 – $8 | Any starter kit |
| | | **≈ $25 – $30** | |

### Recommended — the full multi-tool

Everything above, plus:

| Part | What for | Price | Where |
|---|---|---|---|
| **CC1101 module**, 433 MHz *(or 868/915 for your region)* | Sub-GHz capture and replay. | $4 – $9 | Search `CC1101 433MHz module` |
| **SX1276 LoRa module**, 433 or 868/915 MHz | LoRa mesh messaging. | $7 – $13 | Search `SX1276 LoRa module RA-02` |
| **PN532 NFC module** | NFC/RFID reading. Set its DIP switches to **I2C**. | $8 – $13 | Search `PN532 NFC module V3` |
| **2 × antennas** (SMA or spring, matched to your frequencies) | **Required** — transmitting without an antenna can damage the radio. | $2 – $5 | Search `433MHz SMA antenna` |
| | | **≈ +$25 – $40** | |

> ⚠️ **Pick your frequencies by region.** 433 MHz is common in Europe and most of
> Asia; **915 MHz** is the licence-free band in North America. Buy the CC1101, the
> SX1276 and the antennas for the same band, and check what's legal to transmit on
> where you live.

### Everything — the rest of the sensors

| Part | What for | Price | Where |
|---|---|---|---|
| **NEO-M8N GPS module** *(NEO-6M is a cheaper alternative)* | Position and satellites. | $8 – $25 | Search `NEO-M8N GPS module` |
| **microSD card module** (SPI) + a card | Storing captures and apps. | $2 – $4 | Search `microSD card module SPI` |
| **DHT22** *(or the cheaper DHT11)* | Temperature and humidity. | $2 – $6 | Search `DHT22 module` |
| **LiPo battery**, 1000–2000 mAh | Making it portable. | $8 – $12 | [Adafruit](https://www.adafruit.com/product/377) · search `1200mAh LiPo 3.7V` |
| **TP4056 charger module** (USB-C version) | Charging the battery safely. | $1 – $2 | Search `TP4056 USB-C charging module` |
| **2 × 100 kΩ resistors** | Voltage divider for battery sensing. **Never** wire a battery straight to a GPIO. | <$1 | Any resistor kit |
| **Vibration motor** + a small transistor | Haptic feedback. | $1 – $2 | Search `coin vibration motor 3V` |
| **Active buzzer**, 3 V | Beeps and the timer alarm. | <$1 | Search `3V active buzzer` |
| **WS2812 / NeoPixel LED** | Status light and the flashlight app. | <$1 | Search `WS2812 single LED module` |
| **iButton / 1-Wire reader probe** + 4.7 kΩ resistor | Reading DS1990 contact keys. | $2 – $4 | Search `DS1990 iButton probe` |
| | | **≈ +$30 – $55** | |

### Optional extras

| Part | What for | Price | Where |
|---|---|---|---|
| **PCF8574 I2C expander** *(or a 74HC165 shift register)* | **Recommended on Pico boards.** The default map already uses all 26 available pins; this frees about seven of them for the buttons, so you have room to grow. | $1 – $2 | Search `PCF8574 I2C expander module` |
| **125 kHz LF RFID** | The one band the PN532 can't do (old building/apartment fobs, EM4100). Two ways to add it — see the note below. | $3 – $6 | see below |
| **DS3231 RTC module** | Keeps the clock accurate with no WiFi. | $2 – $4 | Search `DS3231 RTC module` |
| **3D-printed or laser-cut case** | Making it pocketable. | varies | Your own design for now |

**125 kHz LF RFID — read vs. emulate.** There's no cheap module that *emulates* a
125 kHz tag over the air, so there are two levels:

- **Read only (available now):** an **RDM6300** module (~$3–6, UART, one data pin). It
  reads EM4100 fobs and nothing else — no writing, no emulation. Plug-and-play if you
  just want to identify a fob.
- **Read + emulate (the standout, planned):** a small **125 kHz coil front-end** — an
  antenna coil, a driver transistor, and an envelope detector (~$3–5 in passives) —
  driven by the RP2350's **PIO**. This is how a Flipper does it, and PIO is exactly the
  right tool for the carrier timing. One antenna reads, clones, *and* emulates. It's a
  bit of analog to get right, so it lands after the coil is tuned on real hardware; the
  RDM6300 covers reading in the meantime.

### Which board

The software supports all three and detects which one it's on, so the build is the
same either way. But there's a clear recommendation:

| Board | Role | Price |
|---|---|---|
| **Raspberry Pi Pico 2 W** | **The reference board — build this.** RP2350, so it has the full PIO block (the hardware that drives IR / sub-GHz / LF timing), plus WiFi + Bluetooth, in 520 KB of RAM. At $7 it leaves almost the whole budget for radios. | **$7** — [official](https://www.raspberrypi.com/news/raspberry-pi-pico-2-w-on-sale-now/) · [PiShop](https://www.pishop.us/product/raspberry-pi-pico-2-w/) |
| **Pimoroni Pico Plus 2 W** | **The "Rev 2" board.** Same RP2350 family and identical header, so the code drops straight in — but 8 MB PSRAM, 16 MB flash, USB-C and extra GPIO. Headroom for big capture buffers and every module at once without an expander. | **≈$25** — [Pimoroni](https://shop.pimoroni.com/en-us/products/pimoroni-pico-plus-2-w) · [Adafruit](https://www.adafruit.com/product/6243) |
| **ESP32-S3 devkit (N16R8)** | Legacy — what the project was first built on. Still runs, but no PIO, so it's not the direction. | $8 – $15 |

**Pico 2 W vs. Pico Plus 2 W:** they share the same RP2350 core, the *same* PIO, and
the *same* CYW43439 radio — so PIO, speed and WiFi capability (including whatever the
radio can and can't capture) are identical. The Plus only adds memory, flash and pins.
The Pico 2 W's one tight spot is GPIO count, and a **$1–2 I²C expander** solves that far
more cheaply than the ~$18 board difference. So the Pico 2 W is the build; the Plus is
the premium **Rev 2** for anyone who wants the extra headroom, and its extra RAM is the
natural home if WiFi packet capture ever needs big buffers.

---

## 4. Software — all free

| What | Cost | Where |
|---|---|---|
| **RPCortex OS** — the operating system | Free, source-available | [rpc.novalabs.app](https://rpc.novalabs.app) — flash it from your browser |
| **Nova D1 package** — the multi-tool itself | Free | `pkg install NovaD1` on the device |
| Apps, and the app store | Free | Built in |
| **Browser simulator** | Free | [novalabs.app/d1-sim](https://novalabs.app/d1-sim) |

Install is two commands once RPCortex is on the board. Full walkthrough:
[SETUP.md](https://github.com/dash1101/RPCortex-repo/blob/main/repo/packages/novad1/SETUP.md).

---

## 5. Before you order

- **Everything runs at 3.3 V** — display, CC1101, SX1276, PN532, DHT, GPS. The only
  common exception is the microSD module, which usually wants 5 V because it regulates
  onboard. Check each module's silkscreen; 5 V into a 3.3 V part kills it.
- **Buy the antennas with the radios.** Transmitting on a bare module can destroy it,
  and it's the part people forget.
- **The PN532 has DIP switches.** Set them to I2C mode or it won't answer.
- **You don't need everything at once.** Wire the essentials, confirm the screen and
  menu work, then add one radio at a time — the built-in System Check tells you what it
  can see. The [wiring guide](https://github.com/dash1101/NovaLabs/blob/main/docs/novad1-wiring.md)
  has the pin table for each board, and `d1 pins` on the device shows the live map.
- **Check your local radio rules.** Receiving is broadly fine; transmitting on
  sub-GHz bands is regulated, and the legal band differs by country.

Questions, or want to show off a build? [Get in touch](https://novalabs.app/contact).
