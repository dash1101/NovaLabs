# Nova D1 — Wiring

**Nova D1 V1 targets the Raspberry Pi Pico 2 W.** Its pinout leads below. The ESP32-S3
devkit and the Pimoroni Pico Plus 2 W run the same code and are also supported, but the
Pico 2 W is the reference build.

Pins come from a board profile and every pin is configurable. Nova D1 detects the board
from `os.uname()`, so a fresh Pico gets the right pinmap unset. A value set by hand
always wins over the profile and detection.

```
d1 pins board              # profiles; '*' active, shows the detected board
d1 pins board pico2w       # set the board (or: d1 pins board auto)
d1 pins                    # every pin, its value, and where it came from
d1 pins set enc_a 4        # override one pin  (d1 pins clear enc_a to revert)
d1 pins check              # validate the map for this MCU
```

Full walkthrough: **`SETUP.md`** in the package.

---

## Pin maps

<!-- BEGIN GENERATED PINMAPS -->

*Generated from the board profiles in `novaboard.py` — the code is the source of truth, so these cannot drift. Regenerate with `repo/tools/novad1/gen_wiring.py`.*

### Raspberry Pi Pico 2 W  <code>pico2w</code>

**rp2350** · status: **draft** · 24 GPIO assigned · display on **I2C**

> **Do not use GPIO 23, 24, 25, 29** — the board itself owns them (wireless module / VSYS sense). They look free on a pinout diagram but are not.

| Group | Signal | GPIO | Notes |
|---|---|---|---|
| I2C bus | `sda` | **4** | I2C data — Display, PN532, RTC all share this |
|  | `scl` | **5** | I2C clock |
| SPI bus (radios) | `spi_sck` | **18** | SPI clock — Separate CS per device |
|  | `spi_mosi` | **19** | SPI out (MOSI) |
|  | `spi_miso` | **16** | SPI in (MISO) |
| microSD | `sd_cs` | **9** | SD chip select |
| CC1101 sub-GHz | `cc_cs` | **17** | CC1101 chip select |
|  | `cc_gdo0` | **20** | CC1101 GDO0 (data) |
| SX1276 LoRa | `sx_cs` | **21** | SX1276 chip select (NSS) — DIO0 not needed - the driver polls |
|  | `sx_rst` | **12** | SX1276 reset |
| GPS | `gps_tx` | **0** | MCU TX -> GPS RX — UART, 9600 baud |
|  | `gps_rx` | **1** | MCU RX <- GPS TX |
| Controls | `enc_a` | **14** | Encoder A — EC11 encoder + 2 buttons |
|  | `enc_b` | **15** | Encoder B |
|  | `enc_sw` | **13** | Encoder button (Select) |
|  | `btn1` | **22** | Button 1 (Back) |
|  | `btn2` | **26** | Button 2 (Home) |
| Infrared | `ir_tx` | **6** | IR emitter — TX is PWM at 38 kHz |
|  | `ir_rx` | **7** | IR receiver |
| Feedback | `buzzer` | **27** | Buzzer |
|  | `vibe` | **28** | Vibration motor |
|  | `led` | **2** | Status LED |
| Sensors | `dht` | **3** | DHT11/22 data |
| Power sense | `battery` | _unset_ | Battery ADC (via divider) — Optional - unset unless wired |
|  | `vbus` | _unset_ | USB-power sense |

*Display on I2C. SD shares the radio SPI0 bus. Kill-switch on GPIO 8. iButton / LF front-end need a GPIO expander.*

### ESP32-S3 (Nova D1 rev A)  <code>esp32s3</code>

**esp32s3** · 24 GPIO assigned

| Group | Signal | GPIO | Notes |
|---|---|---|---|
| I2C bus | `sda` | **8** | I2C data — Display, PN532, RTC all share this |
|  | `scl` | **9** | I2C clock |
| SPI bus (radios) | `spi_sck` | **12** | SPI clock — Separate CS per device |
|  | `spi_mosi` | **11** | SPI out (MOSI) |
|  | `spi_miso` | **13** | SPI in (MISO) |
| microSD | `sd_cs` | **15** | SD chip select |
| CC1101 sub-GHz | `cc_cs` | **10** | CC1101 chip select |
|  | `cc_gdo0` | **14** | CC1101 GDO0 (data) |
| SX1276 LoRa | `sx_cs` | **21** | SX1276 chip select (NSS) — DIO0 not needed - the driver polls |
|  | `sx_rst` | **47** | SX1276 reset |
| GPS | `gps_tx` | **17** | MCU TX -> GPS RX — UART, 9600 baud |
|  | `gps_rx` | **18** | MCU RX <- GPS TX |
| Controls | `enc_a` | **4** | Encoder A — EC11 encoder + 2 buttons |
|  | `enc_b` | **5** | Encoder B |
|  | `enc_sw` | **6** | Encoder button (Select) |
|  | `btn1` | **7** | Button 1 (Back) |
|  | `btn2` | **16** | Button 2 (Home) |
| Infrared | `ir_tx` | **39** | IR emitter — TX is PWM at 38 kHz |
|  | `ir_rx` | **38** | IR receiver |
| Feedback | `buzzer` | **40** | Buzzer |
|  | `vibe` | **41** | Vibration motor |
|  | `led` | **48** | Status LED |
| Sensors | `dht` | **2** | DHT11/22 data |
|  | `ibutton` | **1** | iButton / 1-Wire |
| Power sense | `battery` | _unset_ | Battery ADC (via divider) — Optional - unset unless wired |
|  | `vbus` | _unset_ | USB-power sense |

*One shared SPI bus for SD + both radios.*

### Pimoroni Pico Plus 2 W  <code>picoplus2w</code>

**rp2350b** · status: **draft** · 24 GPIO assigned · display on **I2C**

> **Do not use GPIO 23, 24, 25, 29** — the board itself owns them (wireless module / VSYS sense). They look free on a pinout diagram but are not.

| Group | Signal | GPIO | Notes |
|---|---|---|---|
| I2C bus | `sda` | **4** | I2C data — Display, PN532, RTC all share this |
|  | `scl` | **5** | I2C clock |
| SPI bus (radios) | `spi_sck` | **18** | SPI clock — Separate CS per device |
|  | `spi_mosi` | **19** | SPI out (MOSI) |
|  | `spi_miso` | **16** | SPI in (MISO) |
| microSD | `sd_cs` | **9** | SD chip select |
| CC1101 sub-GHz | `cc_cs` | **17** | CC1101 chip select |
|  | `cc_gdo0` | **20** | CC1101 GDO0 (data) |
| SX1276 LoRa | `sx_cs` | **21** | SX1276 chip select (NSS) — DIO0 not needed - the driver polls |
|  | `sx_rst` | **12** | SX1276 reset |
| GPS | `gps_tx` | **0** | MCU TX -> GPS RX — UART, 9600 baud |
|  | `gps_rx` | **1** | MCU RX <- GPS TX |
| Controls | `enc_a` | **14** | Encoder A — EC11 encoder + 2 buttons |
|  | `enc_b` | **15** | Encoder B |
|  | `enc_sw` | **13** | Encoder button (Select) |
|  | `btn1` | **22** | Button 1 (Back) |
|  | `btn2` | **26** | Button 2 (Home) |
| Infrared | `ir_tx` | **6** | IR emitter — TX is PWM at 38 kHz |
|  | `ir_rx` | **7** | IR receiver |
| Feedback | `buzzer` | **27** | Buzzer |
|  | `vibe` | **28** | Vibration motor |
|  | `led` | **2** | Status LED |
| Sensors | `dht` | **3** | DHT11/22 data |
| Power sense | `battery` | _unset_ | Battery ADC (via divider) — Optional - unset unless wired |
|  | `vbus` | _unset_ | USB-power sense |

*Drop-in upgrade from the Pico 2 W: same header pinout, so the same map. Adds 8 MB PSRAM, 16 MB flash and extra GPIO beyond GP28 — put ibutton and the LF front-end there once the numbering is confirmed.*

<!-- END GENERATED PINMAPS -->

---

## Per-module wiring

Pin **numbers** differ per board — get them from the tables above or `d1 pins`. The
signal names below are the same everywhere, so this section applies to any board.

- **OLED display (I2C, 4-pin):** VCC→3V3, GND→GND, SDA→`sda`, SCL→`scl`.
  SH1106 / SSD1306 / SSD1309 all work; set which one with `d1 display <kind>`.
  Address 0x3C (some modules 0x3D — `d1 scan` will tell you).
- **PN532 NFC/RFID:** set the module's DIP switches to **I2C** mode.
  VCC→3V3, GND→GND, SDA→`sda`, SCL→`scl`. Address 0x24 (some report 0x48).
- **CC1101 sub-GHz (8-pin SPI):** VCC→3V3, GND→GND, SCK→`spi_sck`, MOSI(SI)→`spi_mosi`,
  MISO(SO)→`spi_miso`, CSN→`cc_cs`, GDO0→`cc_gdo0`. GDO2 unused.
- **SX1276 LoRa (SPI):** VCC→3V3, GND→GND, SCK→`spi_sck`, MOSI→`spi_mosi`,
  MISO→`spi_miso`, NSS→`sx_cs`, RST→`sx_rst`. DIO0 can stay unconnected — the driver
  polls status over SPI instead of using an interrupt line.
  ⚠️ **Attach the antenna before transmitting** or you can damage the module.
- **microSD (6-pin SPI):** VCC→**5V** on most modules (they regulate onboard),
  GND→GND, SCK→`sd_sck`, MOSI→`sd_mosi`, MISO→`sd_miso`, CS→`sd_cs`.
  On boards where `sd_sck`/`sd_mosi`/`sd_miso` are unset, the SD shares the radio SPI
  bus — use `spi_sck` / `spi_mosi` / `spi_miso` and only `sd_cs` is separate.
- **NEO-M8N GPS (4-pin):** VCC→3V3 or 5V, GND→GND, module RX→`gps_tx`,
  module TX→`gps_rx`. 9600 baud. Needs sky view for a first fix.
- **EC11 rotary encoder:** A→`enc_a`, B→`enc_b`, switch→`enc_sw`, common→GND.
  Internal pull-ups are enabled in software.
- **Buttons:** one side→`btn1` / `btn2`, other side→GND.
- **IR receiver (e.g. VS1838B, 3-pin):** VCC→3V3, GND→GND, OUT→`ir_rx`.
- **IR emitter (3-pin module):** VCC→3V3, GND→GND, IN→`ir_tx`.
- **Buzzer:** signal→`buzzer`, GND→GND. A small active buzzer can be driven directly.
- **Vibration motor:** signal→`vibe` **through a transistor** — do not drive a motor
  from a GPIO.
- **Status LED:** data→`led`. On ESP32-S3 devkits this is the onboard WS2812 RGB; on
  Pico boards use an external LED, because the onboard one is wired to the radio chip
  and isn't a GPIO.
- **DHT11/22 (3-pin):** VCC→3V3, GND→GND, DATA→`dht` with a 10k pull-up to 3V3.
- **iButton / 1-Wire reader:** data→`ibutton` with a 4.7k pull-up to 3V3, GND→GND.
- **Battery sense:** Li-Po → TP4056 charger → a **voltage divider** (e.g. 100k/100k) →
  `battery` (an ADC-capable pin). **Never feed raw battery voltage into a GPIO.**
  Set the divider ratio with `reg set Apps.NovaD1_BattDiv 2.0`.

⚠️ **3V3 vs 5V:** the display, CC1101, SX1276, PN532, DHT and GPS all run at 3V3. The
microSD module usually wants 5V because it regulates onboard. Check each module's
silkscreen — 5V into a 3V3 part is a dead part.

**`battery` and `vbus` ship unset on purpose.** An unconnected ADC pin floats, and a
floating reading would show a confident, wrong battery level. Nova D1 only reads them
once you've told it the pin, so leave them alone unless they're wired.

---

## Board-specific gotchas

### ESP32-S3 (N16R8)

The N16R8's 16 MB flash and 8 MB octal PSRAM consume GPIO that look free:

- **GPIO 26–32** — SPI flash
- **GPIO 33–37** — octal PSRAM (*the* N16R8 trap)
- **GPIO 0, 3, 45, 46** — strapping pins, avoid for I/O
- **GPIO 19, 20** — native USB D−/D+
- **GPIO 43, 44** — UART0, the serial console

**Usable:** GPIO 1–18, 21, 38–42, 47, 48.

### RP2350 (Pico 2 W and Pico Plus 2 W)

- **SPI and I2C are locked to fixed GPIO groups.** There's no ESP32-style GPIO matrix,
  so a sensible-looking pinmap can simply be unassignable. Build around the valid
  groups and run `d1 pins check`, which knows the rules.
- **GPIO 23/24/25/29 belong to the wireless module** (and VSYS sense). That leaves
  **26 usable pins** on the standard header — and the default map uses all 26, which
  is why `ibutton` is unassigned. A **PCF8574 I2C expander** or a **74HC165** shift
  register for the buttons and switches collapses ~7 pins into ~2 and buys the room
  back.
- **The display is on I2C**, sharing the bus with the PN532 and RTC. That's a
  deliberate choice: the frame buffer is only ~1 KB and the page-diff renderer only
  pushes changed rows, so I2C keeps up comfortably while saving 2–3 pins.
- **No `esp32.RMT`.** IR transmit uses a timing loop, and will move to a PIO state
  machine — that's the main reason for the RP2350: PIO handles RF/IR edge timing in
  hardware, in both directions.
- The **Pico Plus 2 W** shares the Pico 2 W header exactly, so the same map drops
  straight in. It adds 8 MB PSRAM, 16 MB flash and extra GPIO past GP28 — that's where
  `ibutton` and the 125 kHz LF front-end should go once the numbering is confirmed on
  a real board.
