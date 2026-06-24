# Nova D1 — Wiring map (ESP32-S3-N16R8)

Recommended, conflict-free default pin map. **Everything is config-driven** —
wire however you like and set the pins via `novad1` (registry `Apps.NovaD1_*`),
but these defaults are what the package ships with so a fresh wire-up "just works."

## ⚠️ Pins you must NOT use on the N16R8
The N16R8 has 16 MB flash + **8 MB octal PSRAM**, which reserves extra GPIOs:
- **GPIO 26–32** — SPI flash
- **GPIO 33–37** — octal PSRAM (this is the N16R8 gotcha — these look free but aren't)
- **GPIO 0, 3, 45, 46** — strapping pins (avoid for I/O)
- **GPIO 19, 20** — native USB D−/D+
- **GPIO 43, 44** — UART0 TX/RX (the serial console / shell)

**Usable:** GPIO 1–18, 21, 38–42, 47, 48.

## Recommended default pin map

| Function | Pin(s) | Notes |
|---|---|---|
| **I2C** (OLED SH1106 + PN532) | SDA **8**, SCL **9** | shared bus; OLED @ 0x3C, PN532 @ 0x24 |
| **SPI** (CC1101 + SX1276 + SD) | SCK **12**, MOSI **11**, MISO **13** | one shared bus, separate CS each |
| CC1101 | CS **10**, GDO0 **14** | sub-GHz (SPI) |
| SX1276 LoRa | CS **21**, RST **47**, DIO0 **48** | 915 MHz (SPI) |
| SD card | CS **15** | SPI |
| **GPS** NEO-M8N | ESP TX **17** → GPS RX, ESP RX **18** ← GPS TX | UART1, 9600 baud |
| **Encoder** EC11 | A **4**, B **5**, SW **6** | SW = the "Select" button |
| Buttons (2 extra) | BTN1 **7** (Back), BTN2 **16** (Home) | 3 buttons total with the encoder SW |
| IR receiver | **38** | input (e.g. VS1838B) |
| IR emitter | **39** | PWM 38 kHz |
| Buzzer | **40** | PWM tone |
| Vibration motor | **41** | via transistor |
| Status LED | **42** | (or your board's onboard LED) |
| DHT11 | **2** | 1-wire-ish (firmware `dht`) |
| iButton (1-Wire) | **1** | DS1990 etc. |
| Battery sense | **3?** → use an **ADC1** pin | ADC1 = GPIO 1–10; pick a free one |

> **Pin budget note:** with *every* module wired at once it's tight (~25 usable
> pins, and the shared SPI/I2C buses are what make it fit). For a breadboard fair
> demo you'll likely wire a subset — set only those pins; absent modules just show
> greyed in the UI. The buses (I2C pins 8/9, SPI 11/12/13) are the ones to keep
> stable; everything else you can move freely in config.

## Per-module pinouts (module side → ESP32-S3)

- **SH1106 OLED (I2C, 4-pin):** VCC→3V3, GND→GND, SCL→9, SDA→8.
- **PN532 (I2C mode, set DIP to I2C):** VCC→3V3, GND→GND, SDA→8, SCL→9.
- **CC1101 (8-pin SPI):** VCC→3V3, GND→GND, SCK→12, MOSI(SI)→11, MISO(SO)→13,
  CSN→10, GDO0→14, GDO2→(unused).
- **SX1276 LoRa (SPI):** VCC→3V3, GND→GND, SCK→12, MOSI→11, MISO→13, NSS→21,
  RST→47, DIO0→48. **Antenna required before TX.**
- **SD module (6-pin SPI):** VCC→**5V** (most modules have a regulator), GND→GND,
  SCK→12, MOSI→11, MISO→13, CS→15.
- **NEO-M8N GPS (4-pin):** VCC→3V3/5V, GND→GND, RX→17 (ESP TX), TX→18 (ESP RX).
- **IR receiver (3-pin):** VCC→3V3, GND→GND, OUT→38.
- **IR emitter (3-pin module):** VCC→3V3, GND→GND, IN→39.
- **DHT11 (3-pin):** VCC→3V3, GND→GND, DATA→2 (10k pull-up to 3V3).
- **iButton reader:** data→1 (4.7k pull-up to 3V3), GND→GND.
- **Buzzer / vibration / LED:** signal→40/41/42, GND→GND (use a transistor for the
  motor; small active buzzer can be driven directly).
- **Battery:** Li-Po → TP4056 → a **voltage divider** (e.g. 100k/100k) → an ADC1
  pin (do **not** feed raw battery voltage to a GPIO).

⚠️ **3V3 vs 5V:** the OLED, CC1101, SX1276, PN532, DHT11, GPS run at 3V3. The SD
module usually wants 5V (it regulates). Double-check each module's silkscreen.

## Set pins in software (if your wiring differs)
```
novad1 status                      # see the current map
reg set Apps.NovaD1_SDA 8
reg set Apps.NovaD1_PIN_enc_a 4
reg set Apps.NovaD1_SPI_sck 12
... etc, then: novad1 scan
```
