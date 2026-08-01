# Nova D2 — concept

**Status: concept / planning.** D2 follows D1. This doc collects the features deferred
from D1 so D1 stays scoped. Nothing here is in D1's plan.

## Rationale

D1 runs on an RP2350 (Pico 2 W); PIO is required for its RF/IR/LF timing. Two targeted
features can't be met on that hardware or within its ~100 KB RAM: **WiFi packet capture**
and **125 kHz LF emulation**. Rather than compromise D1, they define D2.

## Architecture: two processors

D1 uses one MCU for everything. D2 splits the work:

```
   RP2350 (brain)  ── UART / SPI ──  ESP32-C5 (radio co-processor)
   UI · PIO · sub-GHz                dual-band WiFi + BT
   IR · LF · LoRa/mesh               promiscuous / pcap
   apps · storage
```

- **RP2350** keeps everything D1 does: PIO, UI, sub-GHz/IR/LF, LoRa mesh, apps.
- **ESP32-C5** (~$5) is a dedicated networking + sniffing radio: dual-band (2.4 + 5 GHz),
  ESP-IDF promiscuous capture, streaming frames to the RP2350 or SD over UART/SPI. One
  co-processor provides both pcap and dual-band, off the RP2350's heap.

Keeping PIO rules out returning D1/D2 to an ESP32-S3. ESP32 promiscuous capture is
well-documented, so the C5 firmware is a contained C/C++ job, not a MicroPython-core fork.

## Features

- **WiFi pcap / Wireshark** — ESP32-C5 co-processor. The `.pcap` writer (`novapcap`)
  already exists.
- **Dual-band WiFi** (2.4 + 5 GHz) — same co-processor.
- **125 kHz LF RFID read and emulate** — a PIO coil front-end with the RAM and pins to
  host it. (D1 offers optional LF read only.) *Emulate approach (to revisit):* PIO
  generates the 125 kHz carrier; the coil couples to the reader's field, and emulation
  works by **load modulation** — a FET across the coil switches the load in the card's
  bit pattern (EM4100 = Manchester, ~64 bits) so the reader sees a tag. Read = envelope-
  detect the returned modulation on the same coil. Reference: the Flipper's LF analog
  front-end. Needs the coil + FET + detector tuned on real hardware.
- **PSRAM / larger flash** — Pico Plus 2 W class; capture buffers, every module resident.
- **Richer UI** — larger panel, more on-screen, more animation.
- **A custom build, purpose-made for this device.** D2 is a single known target, so the
  software can stop being portable-by-default and be built *for* it:
  - **Frozen modules** — the RPCortex OS and the Nova D2 package are frozen into the
    firmware image. Frozen bytecode executes from flash instead of being loaded onto the
    heap, which removes most of the resident RAM cost (~79 KB of it on D1) and makes
    imports near-instant.
  - **`@native` / `@viper`** on hot paths (rendering, PIO feeding, packet decode) — the
    only real *runtime* speedups MicroPython offers. They emit machine code for one
    architecture, which is normally a portability problem; on a locked target it isn't.
  - **An architecture-built Nova D2 package** — compiled for the RP2350 rather than
    shipped as arch-neutral bytecode. Distributing that as an installable `.pkg` would
    need a `package.cfg` `arch:` field (`any` / `rp2350`) plus a `pkgmgr` check so a
    wrong-arch package can't install; freezing it into the firmware avoids that
    entirely, which is the preferred route.

  Net effect: faster, far more RAM headroom, and no compromise for boards D2 doesn't
  target. The cost is maintaining a MicroPython fork and a per-device build.
- **Multi-threading** — the RP2350 is dual-core; MicroPython `_thread` runs on core 1 for
  PIO/radio work while the UI and async loop own core 0. Shared-heap constraints (GC,
  shared state) make it a measured experiment; the heavy sniffing is offloaded to the C5.

## Deferred from D1

| Feature | D1 | D2 |
|---|---|---|
| WiFi pcap / Wireshark | — | yes (ESP32-C5) |
| Dual-band WiFi | — | yes |
| LF RFID emulate | — | yes (PIO coil) |
| LF RFID read | optional (RDM6300) | yes |
| Multi-threading | — | experiment |
| PSRAM / richer UI | tight | yes |

D1 keeps: sub-GHz, IR, NFC, LoRa mesh, GPS, BLE, the app system.

## Nova mesh standard (shared D1 ↔ D2)

Nova devices share a compact LoRa mesh (`novamesh`): addressed packets, TTL hop-limit,
managed-flood relay, `(src,id)` dedup, with AES-128 payload encryption (`novacrypt`). Two
explicit modes formalise it:

- **Open broadcast** — unencrypted, plaintext to any nearby Nova device. (Works today as
  the no-key path; needs to be an explicit choice.)
- **Encrypted channels** — named channels with pre-shared keys, Meshtastic-style.

True Meshtastic interop (real Meshtastic hardware) requires their LoRa PHY params, protobuf
payloads, and AES-256-CTR channel PSKs — heavy for MicroPython, a D2-era stretch. The Nova
standard is compatible in spirit, not on the wire.

## Sequencing

D2 follows D1's V1 release: finish D1 → ESP32-C5 co-processor + capture firmware → custom
RP2350 firmware (frozen + native) → LF emulate → richer UI. Each is a distinct phase.
