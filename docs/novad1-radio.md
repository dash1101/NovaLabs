# What the Nova D1 can see

The Nova D1 has two radios and needs no external modules to use either. This page
is about what they can and cannot observe, because that ceiling decides which
features are worth building and which are not possible at all.

## The two channels

| | What it sees | What it cannot see |
|---|---|---|
| **WiFi** (`WLAN.scan()`) | Access points: BSSID, SSID, channel, signal, encryption, hidden flag | **Client devices.** Phones, laptops, cameras — anything that connects *to* an access point rather than being one |
| **Bluetooth LE** (`gap_scan`) | Every advertising device, with its complete advertising payload: address, signal, name, service UUIDs, manufacturer data, transmit power | Devices that are paired and idle, or that have advertising switched off |

The asymmetry matters more than it first appears. WiFi scanning under MicroPython
has no monitor mode on this radio, so the device only ever hears the beacons that
access points broadcast; a phone sitting on the network is invisible. Bluetooth is
the opposite — nearly everything advertises, and the payload is rich enough to say
what a device is rather than merely that it exists.

### Ruled out, permanently

These are not backlog items. They are not possible on this hardware under
MicroPython, and revisiting them will not change that:

- **Packet capture.** No monitor mode means no raw 802.11 frames.
- **Probe request capture.** Would reveal which networks a nearby phone is
  looking for. Requires monitor mode.
- **Deauthentication detection or transmission.** Requires frame injection.
- **Tracking client devices over WiFi.** Follows from the above.

Anything on this list belongs to a device with a radio that supports it.

## What the radios are used for

### Radar — the background observer

The observer runs as a background service, alternating Bluetooth and WiFi scans
with a rest between them. It is not a scan button: because it keeps listening
while the device is doing something else, *time* becomes part of the evidence.

For each device it accumulates:

- how strong the signal is, and which way that is trending
- the best signal ever seen from it
- when it was first heard, and when it was last heard
- how many times it has been seen
- who made it, and what kind of thing it probably is

Scanning continuously would hold the radio permanently, prevent WiFi from
connecting, and drain the battery for no extra information, so the observer rests
between passes. The interval is configurable under *Settings → Radar*.

### Identifying a device

Two independent sources of evidence, in order of reliability.

**The advertising payload.** A Bluetooth advertisement carries a Bluetooth SIG
company identifier, service UUIDs, and often a name and transmit power. This is
the strongest signal available: it identifies the manufacturer even when the
address is randomised.

**The MAC prefix.** The first three bytes of an address are assigned to a
manufacturer by the IEEE. The Nova D1 carries a subset of that registry covering
camera, IoT, phone and network vendors.

Two rules govern the result, and both matter:

- **A randomised address has no manufacturer.** Modern phones rotate their
  Bluetooth address specifically to prevent this kind of identification. When the
  locally-administered bit is set the device reports *randomised* — it does not
  guess a vendor, because there is nothing there to guess from.
- **An unknown prefix stays unknown.** Unrecognised prefixes show as the raw
  prefix, and unrecognised company identifiers as their number. On a tool whose
  purpose is telling you what something is, a confident wrong answer is worse than
  an honest blank.

Expect a smart-home device to identify as its *silicon* rather than its brand —
Espressif, Realtek, Tuya. That is the correct answer: it means "an ESP32-class
module", which narrows things considerably even though it is not a brand name.

### Presence — the trick a smart camera uses

A WiFi camera that knows when you get home is not doing anything exotic. It is
watching for a radio it recognises and noting when that radio appears.

Name a device in Radar and the Nova D1 does the same thing. Named devices appear
in Presence as here or away, and arrivals and departures raise a notification.
Nothing is transmitted and no network is joined; it is passive listening.

A departure needs two consecutive missed passes before it is announced. Bluetooth
advertising is bursty and a wall is enough to lose a device for one pass, so a
single miss would produce constant false alarms.

Alerts for *unknown* devices are available but off by default. In any populated
area they fire constantly, and an alert that always fires is one you learn to
ignore.

### Locate — finding something physically

Pick a device and walk. The screen shows signal strength and, more usefully,
which way it is *moving*: warmer, colder.

There is deliberately no direction arrow. A single antenna cannot determine a
bearing; it can only tell you that a signal is stronger here than it was there.
Walking is what turns that into a location, and an arrow would imply a capability
the hardware does not have.

A rough distance appears when the device advertises its transmit power. Treat it
as an order of magnitude — walls, bodies and antenna orientation each move it by
metres.

### Wardriving — surveying access points

A survey of the access points around you, logged to a WiGLE-compatible CSV.

Each unique access point is recorded once, by BSSID, with its SSID, channel,
signal, encryption, and a GPS position and timestamp when a GPS module is fitted.

**Where it saves:** the SD card when one is mounted (`/sd/nova`), otherwise
onboard flash (`/Vela/nova`). An SD card is worth using — a survey is a great many
small writes. On flash the storage guard applies: a warning near 95% full and a
hard stop at 98%, so a survey cannot fill the disk out from under everything else.

## Where the interesting ideas live

The observer's history is the raw material. These follow naturally from what is
already recorded:

- **A device that follows you.** Something seen across several places over a long
  span, that is not one of yours, is worth flagging. The first-seen, last-seen and
  sighting count this needs are already collected.
- **Rogue access points.** A familiar network name appearing with an unfamiliar
  BSSID falls straight out of the WiFi scan.
- **Channel congestion.** Which WiFi channels are busy, from the same data.
- **Devices on a joined network.** Once the Nova D1 joins a network it has a full
  TCP/IP stack and can enumerate what is on it. That is a different capability
  from listening to the air, and it is the reliable way to find something that has
  no radio presence of its own.
