# Nova D1 — Development Plan

How we build the Nova D1 *software* on top of RPCortex Vela (v1.0). The hardware
spec lives in [`nova-d1.md`](nova-d1.md); this is the build roadmap.

## The model: a package suite on RPCortex, not custom firmware

The D1 is **not** its own firmware. It's RPCortex Vela running headless, with a
**`novad1` wrapper package** that turns a generic ESP32-S3 + modules into the
device. This is the whole point of shipping v1.0 first — the D1 leans on:

- **Autonomy mode** (`autonomy on`) — boot straight into the Nova GUI, no login.
- **Cooperative multitasking** (`appkit` + the async loop) — scan RF / poll GPS /
  drive the UI **concurrently** without blocking. This is what makes a Flipper-
  class tool feasible on one MCU.
- **The package system** — each capability is a driver + a GUI app, installable /
  updatable / removable independently. Build only the modules you wired up.
- **Startup tasks + services** — the wrapper registers its UI + scanners at boot.
- Existing packages to reuse/extend: `i2cscan` (display detect), `gpio`,
  `ntp`/RTC, and the v1.1 **`sd`** package (payloads/scripts off MicroSD).

## Architecture

```
novad1 (wrapper pkg)
├── boot:  enable autonomy → I2C-scan for the OLED → launch Nova GUI → spawn services
├── novagui   — OLED UI: display driver + menu/widget framework + encoder/button input
├── drivers/  — one module per peripheral (thin, hardware-facing)
│   ├── display  (SSD1306 / SH1106, 128×64 I2C)        [Interface]
│   ├── input    (EC11 rotary encoder + 2 buttons, GPIO/IRQ)
│   ├── subghz   (CC1101)        nfc (PN532)        ir (3-pin)
│   ├── lora     (SX1276)        gps (NEO-8M)       rtc (DS3231)
│   └── buzzer / haptics (PWM)   power (TP4056 sense)  toggles (DIP)
└── apps/     — a GUI app per capability (a menu entry that drives a driver)
```

**The Nova GUI** is a new UI paradigm vs the serial TUI: a 128×64 menu system
driven by the rotary encoder (scroll) + buttons (select/back). It runs as a
cooperative foreground app on the appkit loop, so background scanners keep going.
Input comes from GPIO (encoder quadrature + button IRQs), not stdin.

## Staged build order (each stage is independently testable)

- **Stage 0 — Wrapper scaffold + boot flow** *(no special hardware)*
  The `novad1` package: enables autonomy, runs an I2C scan to find/identify the
  OLED, prints a hardware report, and is the launch point. Testable on a bare
  ESP32-S3 (or Pico 2W) today.
- **Stage 1 — Nova GUI core** *(needs the OLED + encoder + buttons)*
  SSD1306/SH1106 driver, a menu/widget framework, encoder/button input → a
  navigable home menu. This is the heart; everything else hangs off it.
- **Stage 2 — Storage + scripting** *(needs MicroSD; rides v1.1 `sd`)*
  Mount the card, list/run scripts and payloads from it.
- **Stage 3 — Peripheral apps, one at a time** *(needs each module)*
  Order by simplicity → buzzer/haptics → RTC (DS3231) → GPIO toggles →
  IR → Sub-GHz (CC1101) → NFC/RFID (PN532) → LoRa (SX1276) → GPS (NEO-8M).
  Each = a thin driver + a GUI app + docs.

## What needs hardware vs not

- **Buildable/verifiable now (no D1 hardware):** the wrapper scaffold, the boot/
  autonomy/display-scan logic, the menu-framework *logic* (render to a buffer,
  unit-test navigation), driver *interfaces* + register maps.
- **Needs the actual modules:** every driver's on-wire behaviour and the GUI on a
  real OLED. Develop incrementally as parts arrive — a $4 OLED + the ESP32-S3 is
  enough to start Stage 1.

## Open questions (for dash)

1. Which modules do you have on hand to test first? (OLED + encoder unlock Stage 1.)
2. OLED controller — SSD1306 or SH1106? (Driver + address differ slightly.)
3. Pin map — do you have a wiring plan, or should the driver be config-driven
   (pins in a `novad1.cfg`) so builders can wire however they like?
4. Repo home — `novad1` as a normal package in RPCortex-repo (installable), with
   the GUI/drivers as sub-modules? (Recommended: yes — keeps it OTA-updatable.)
