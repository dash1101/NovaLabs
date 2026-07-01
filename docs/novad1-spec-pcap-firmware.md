# Nova D1 — Design Spec: Custom pcap Firmware (WiFi packet capture)

**Status:** design, build-ready. **Target:** ESP32-S3. **Depends on:** a custom
MicroPython firmware build (this is the one Nova feature that can't ride stock
MicroPython). **Consumes:** `novapcap.py` (already shipped — the libpcap writer).

## Why this needs custom firmware

`novad1 wifiprobe` confirmed on-device: stock MicroPython (`esp32 1.28.0-preview`)
exposes **no** promiscuous/monitor API (`WLAN sniff API: NONE`). Real 802.11 capture
requires ESP-IDF's `esp_wifi` promiscuous mode, which isn't surfaced to Python. So we
build a **MicroPython esp32 firmware with a small C user-module** that exposes it.
Everything else (the `.pcap` writer, the capture app, channel hopping) is Python we
already can build; this spec is about the ~150-line C shim + the build.

## The C user-module: `wifisniff`

A USER_C_MODULE for the MicroPython esp32 port. Minimal Python-facing API:

```python
import wifisniff
wifisniff.start(channel=6, rssi_min=-100)   # promiscuous on, set channel + filter
buf = wifisniff.read()                        # -> bytes of the next queued frame, or b''
wifisniff.channel(11)                         # hop channel
wifisniff.stop()
```

### Internals (ESP-IDF)
- `start()`: ensure WiFi inited in NULL/STA mode (`esp_wifi_init` + `esp_wifi_start`),
  then `esp_wifi_set_promiscuous(true)`, `esp_wifi_set_promiscuous_filter(...)`
  (MGMT|DATA|CTRL as configured), `esp_wifi_set_channel(channel, SECOND_CHAN_NONE)`,
  and `esp_wifi_set_promiscuous_rx_cb(_rx_cb)`.
- **`_rx_cb(void *buf, wifi_promiscuous_pkt_type_t t)`** runs in the WiFi task — it may
  **not** call into the MicroPython VM. It copies `wifi_promiscuous_pkt_t` (the
  `rx_ctrl` radio metadata + the 802.11 `payload[len]`) into a **FreeRTOS ringbuffer**
  (`xRingbufferCreate`, sized from PSRAM — we have 8 MB, so a generous 256 KB ring
  absorbs bursts). Drops the oldest on overflow + bumps a dropped counter.
- **`read()`**: `xRingbufferReceive` (non-blocking) → return the frame bytes to Python,
  or `b''` if empty. Prepend a small header carrying `rx_ctrl.rssi` + `channel` +
  `timestamp` so the Python side can build a radiotap header (see below).
- `channel()` / `stop()`: `esp_wifi_set_channel` / `esp_wifi_set_promiscuous(false)`.

### Build
- ESP-IDF (matching the MicroPython esp32 port's IDF version) + MicroPython repo.
- Put `wifisniff/` (a `micropython.cmake` + `wifisniff.c`) under a modules dir and
  build with `make ... USER_C_MODULES=.../wifisniff/micropython.cmake BOARD=ESP32_GENERIC_S3 BOARD_VARIANT=SPIRAM_OCT`.
- Output: a custom `.bin`/`.uf2`. Flash it, then install RPCortex + `novad1` on top as
  usual. This becomes the **Nova D1 flagship firmware** (also the natural home for
  frozen modules / performance later).

## Python side (Nova, on top of the custom firmware)

New module `novasniff.py` (guarded — no-ops with a clear message if `wifisniff` is
absent, so the normal build is unaffected):

```python
def available():            # -> bool: is the wifisniff C module present?
def capture(channels, secs, path, cancel):  # generator, yields ('progress', frames)
```

- Build the **pcap global header** with `novapcap.LINKTYPE_RADIOTAP` (127) and, per
  frame, a minimal **radiotap header** (8-byte it_header + channel + dBm antsignal)
  from the `rx_ctrl` metadata `read()` prepends — so Wireshark shows RSSI/channel.
  (Fallback: `LINKTYPE_IEEE802_11` (105), bare frames, no radio metadata.)
- **Channel hopper**: rotate the requested channels every ~250 ms so we sample the
  band (a single channel only sees that channel's traffic). Cooperative — `await`
  between hops so the GUI/services keep running (Tier-2 async, like `awget`).
- Stream frames straight to a `novapcap.PcapWriter` on SD (`/sd/nova/captures/*.pcap`)
  — never buffer a whole capture in RAM. Report frames/s + dropped count.

### App + command
- `novad1 pcap capture [--ch 1,6,11] [--secs 30]` → writes a `.pcap`, prints the path.
- A **PcapScreen** GUI app: pick channels, Start (live frame counter + dropped), Stop,
  then the file is on the SD for Wireshark. Cooperative (progress + cancel), like the
  NFC dump / Sub-GHz TX screens.

## Sequencing / deliverables
1. `wifisniff` C module + custom firmware build (the gate). Verify with a 3-line REPL
   test: `start(6)`, loop `read()`, print lengths.
2. `novasniff.py` + radiotap header builder (CPython-testable: feed synthetic frames,
   assert the `.pcap` opens in Wireshark / round-trips — reuse the `novapcap` test).
3. Channel hopper (cooperative) + the PcapScreen app + the `novad1 pcap` command.
4. Deauth/inject are **out of scope** (regulated); capture is passive.

## Risks / notes
- IDF/MicroPython version matching is the fiddliest part; pin both.
- The `_rx_cb` must stay ISR-light (copy to ringbuffer only) — no allocation, no VM.
- 802.11 encryption: we capture frames as-is; decrypting WPA needs the PSK + the
  handshake (a later Python-side feature, or just hand the `.pcap` to Wireshark with
  the key). Management/beacon frames are always in the clear (good for recon).
- This custom firmware is also the vehicle for a future **RP2350 5 GHz board** and the
  per-device performance images (frozen modules, `@native`).
