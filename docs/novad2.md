# Nova D2 — the next device *(concept)*

**Status: concept / planning.** D2 starts after Nova D1 ships. This doc collects the
vision so D1 stays focused and D2 has a clear target. Everything here is deliberately
*out of D1's scope* — moving it here is what makes D1 finishable.

## Why a D2, not a "D1 Rev 2"

The RP2350 was the right call for D1, and PIO is non-negotiable for its radio timing.
But two things we want — **WiFi packet capture** and **125 kHz LF emulation** — either
can't be done on the D1's hardware or don't fit its ~100 KB RAM budget. Rather than
compromise D1, they define a genuinely next-generation device. D2 isn't a spin of D1;
it's the ambitious follow-up with the headroom to do the things D1 can't.

## The headline: a two-brain design

The single biggest change. D1 is one MCU doing everything. D2 splits the work:

```
   ┌─────────────────────┐        UART / SPI        ┌──────────────────────┐
   │  RP2350 (the brain) │◄────────────────────────►│  ESP32-C5 (the radio │
   │  UI · PIO · sub-GHz │                          │  co-processor)       │
   │  IR · LF · LoRa/mesh│                          │  dual-band WiFi + BT │
   │  apps · storage     │                          │  pcap / promiscuous  │
   └─────────────────────┘                          └──────────────────────┘
```

- The **RP2350** stays the brain: PIO, the UI, sub-GHz/IR/LF, LoRa mesh, apps. Everything
  D1 already does, kept.
- An **ESP32-C5** (~$5) becomes a dedicated networking + sniffing radio. It's **dual-band
  (2.4 + 5 GHz)** and can run promiscuous capture in ESP-IDF/C — so *one* co-processor
  delivers **both** pcap/Wireshark sniffing **and** dual-band networking, off the
  RP2350's heap entirely. It streams captured frames to the RP2350 (or straight to SD /
  a `.pcap`) over UART/SPI.

This is a better pcap than rewriting an ESP32-S3 image would give us, and it keeps PIO.
There are decent references for ESP32 promiscuous capture, so the C5 firmware is a
contained C/C++ job rather than a MicroPython-core fork.

## Headline features

- **WiFi packet capture → `.pcap` / Wireshark** — via the ESP32-C5 co-processor. The
  `.pcap` writer already exists (`novapcap`); D2 finally has a radio that can feed it.
- **Dual-band networking** (2.4 + 5 GHz) — same co-processor.
- **125 kHz LF RFID: read *and* emulate** — the PIO coil front-end, with the RAM and
  pins to host it properly.
- **More RAM / PSRAM** — Pico Plus 2 W class (8 MB PSRAM, 16 MB flash) for capture
  buffers and every module resident at once.
- **Improved UI** — the headroom to do a richer interface (larger panel, more animation,
  more on-screen at once) than D1's tight budget allows.
- **Custom RP2350 firmware** — frozen OS + package (frees the heap), `@native`/`@viper`
  on hot paths, and the cyw43 patches if we want on-board capture too. See the D1 plan's
  "custom-firmware endgame."
- **Multi-threading** — the RP2350 is dual-core (dual M33). D2 can put PIO/radio/capture
  work on core 1 while the UI + async loop own core 0. MicroPython's `_thread` runs on
  the second core; the shared heap needs care (GC, shared state), so this is a
  *deliberate, measured* experiment — and much of the heavy sniffing is offloaded to the
  C5 anyway, so threading is for the RP2350-side parallelism, not the capture itself.

## What moved from D1 to D2

So D1 can ship focused and fast:

| Feature | D1 | D2 |
|---|---|---|
| WiFi pcap / Wireshark | ✗ (radio can't) | ✓ (ESP32-C5) |
| Dual-band WiFi | ✗ | ✓ |
| LF RFID **emulate** | ✗ | ✓ (PIO coil) |
| LF RFID **read** | maybe (RDM6300) | ✓ |
| Multi-threading | — | experiment |
| PSRAM headroom / richer UI | tight | ✓ |

D1 keeps: sub-GHz, IR, NFC, LoRa mesh, GPS, BLE, the app system, the whole multi-tool.

## Software direction (carries over from D1, extended)

- **Everything fast and seamless — sync *and* async.** D1's cooperative model (blocking
  commands + async foreground apps + background services) carries over. On D2 the extra
  cores + co-processor mean radio/capture can run genuinely in parallel with the UI, not
  just cooperatively. The goal is the same: nothing the user does should stutter.
- **The Nova mesh standard** (below) is shared across the whole Nova D lineup — a D1 and
  a D2 talk to each other over LoRa.

## The Nova mesh standard *(shared D1 ↔ D2)*

Nova devices already speak a compact LoRa mesh (`novamesh`): addressed packets, TTL
hop-limit, managed-flood relay, `(src,id)` dedup. The standard formalizes two modes on
top of it — see the D1 plan for the implementation:

- **Encrypted channels** (Meshtastic-style): a named channel with a pre-shared key;
  AES-encrypted payloads (`novacrypt`) so only devices on that channel can read them.
  Already have AES-128 keyed messaging; the enhancement is *named, selectable channels*.
- **Open broadcast**: an explicit unencrypted mode for pushing a plaintext LoRa message
  to *any* nearby Nova device — no key needed. Already works as the no-key path; the
  enhancement is making it an explicit choice even when a key is set.

*Note on true Meshtastic interop* (talking to real Meshtastic hardware): possible but a
big lift — their exact LoRa PHY params + protobuf payloads + AES-256-CTR named-channel
PSKs, and protobufs are heavy for MicroPython. The Nova standard is "Meshtastic in
spirit, our compact format." Real interop is a D2-era stretch if we want it.

## Rough sequencing

D2 is **after D1 ships.** The path: finish D1 (radios + PIO + a solid v1.0) → bring up
the ESP32-C5 co-processor + its capture firmware → the custom RP2350 firmware (frozen +
native) → LF emulate → the richer UI. Each is a real chunk; D2 is a year-out target, not
a next-month one.
