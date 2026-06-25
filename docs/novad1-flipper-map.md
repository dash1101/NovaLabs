# Nova D1 vs Flipper Zero — feature map

How the Nova D1 (ESP32-S3 + RPCortex + the `novad1` package suite) lines up with
the Flipper Zero, what's done, and what each missing piece needs. This guides what
to build and what hardware to add. Status as of NovaD1 v0.10.0.

Legend: ✅ working · 🟡 partial / device-pending · 🔧 needs hardware · 🗺 roadmap

## Sub-GHz (315/433/868/915 MHz)
| Flipper | Nova D1 | Notes |
|---|---|---|
| Read/replay OOK remotes (garage, some car fobs) | 🟡 CC1101 detected; capture/replay 🗺 | CC1101 is wired + ID-detected. OOK timing capture + replay is the next RF build. Rolling codes (KeeLoq) can't be replayed by design. |
| Frequency analyzer / RSSI | 🗺 | CC1101 can report RSSI; a scanner app is straightforward. |
| Sub-GHz brute (de-bruijn) | 🗺 / ethics-gated | Owner/test devices only. |

## 125 kHz RFID (LF)
| Flipper | Nova D1 | Notes |
|---|---|---|
| Read/emulate/write EM4100, HID, T5577 fobs | 🔧 | **Needs added LF hardware** — PN532 is 13.56 MHz only. Add an RDM6300 (read EM4100) and/or a T5577 + 125 kHz coil (write/emulate). Then a driver. |

## NFC (13.56 MHz / HF)
| Flipper | Nova D1 | Notes |
|---|---|---|
| Read UID / MIFARE Classic | ✅ PN532 | UID read works; the NFC app reads + can save. |
| Save / emulate a card | 🟡 | PN532 can emulate some types (UID); full MIFARE clone is limited vs Flipper's dedicated chip. |
| MIFARE key cracking | 🗺 | Possible but heavy on MCU. |

## Infrared
| Flipper | Nova D1 | Notes |
|---|---|---|
| Receive a remote signal | ✅ | IR receive app works (edge capture). |
| Send a signal | ✅ | IR send works (38 kHz burst). |
| Universal remote + saved IR library | 🗺 (script-UI) | The button-grid script app (a "remote" of saved IR codes) is the planned vehicle for this. |
| Learn → store → replay a specific code | 🗺 | Needs full IR decode/encode (NEC/RC5/etc.), then save to SD. |

## GPIO / hardware
| Flipper | Nova D1 | Notes |
|---|---|---|
| GPIO read/write, I2C/SPI/UART tools | ✅ (RPCortex `gpio`/`i2cscan` pkgs + Nova drivers) | |
| iButton (1-Wire) | ✅ (driver present) 🔧 | Reads DS1990 if a reader is wired. |
| 1-Wire / sensors (DHT, etc.) | ✅ DHT11 | |

## Wireless (Flipper needs add-ons; Nova has it built in — our edge)
| Capability | Nova D1 | Notes |
|---|---|---|
| WiFi scan / connect | ✅ | Background manager + scan app. |
| WiFi recon / deauth-detect / sniff | 🟡 scan ✅ / sniff 🗺 | Promiscuous mode is limited in MicroPython. |
| Bluetooth LE scan | ✅ | BLE scan app. |
| **LoRa P2P / mesh messaging** | 🟡 P2P foundation done; mesh 🗺 | **Flipper can't do this without add-ons.** Packet layer done + tested; SX1276 driver device-pending; Messages app (point-to-point). Meshtastic-style mesh routing is the headline roadmap item. |
| GPS | ✅ | NEO-M8N: RX + satellites-in-view; live-coordinates app next. |
| **Web control panel (phone)** | ✅ | Flipper has no equivalent. Run apps + shell from a browser. |

## Platform / UX
| Flipper | Nova D1 | Notes |
|---|---|---|
| App/plugin ecosystem | 🟡 RPCortex packages ✅ / Nova-UI app repo 🗺 | OS has a full package manager; downloadable Nova-UI apps (script-apps) are roadmap. |
| Scripting | 🟡 RPCortex `.rps` ✅ / Nova script-UI 🗺 | Button-grid script apps (IR remote, LoRa buttons) are the next build. |
| Animated UI, PIN lock, settings | ✅ | Icon gallery, PIN lock, kitted settings, web panel. |
| Battery life | 🟡 platform-bound | ESP32-S3 + WiFi won't match Flipper's STM32 deep-sleep. We compete on capability, not runtime. |

## Where the Nova D1 WINS
- **Built-in WiFi + BLE + LoRa + a phone web panel** — Flipper needs add-on boards for these.
- **A real OS underneath** (RPCortex): shell, package manager, scripting, multitasking.
- **LoRa mesh messaging** (Meshtastic-style) — a class of feature Flipper doesn't target.

## What to add to close the biggest gaps
1. **125 kHz LF module** (RDM6300 / T5577 + coil) → match Flipper's iconic fob cloning.
2. **Sub-GHz OOK capture/replay** on the CC1101 (software).
3. **IR learn/library + button-grid script UI** (software).
4. **Second LoRa board** to actually test/use the mesh.
