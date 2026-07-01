# Nova D1 — Design Spec: BLE GATT Interact

**Status:** design, build-ready. **Target:** ESP32-S3 (BLE built in). **Depends on:**
nothing new — stock MicroPython `bluetooth` is enough. **Builds on:** `novable.py`
(scan + advertise already shipped).

## Goal

Go beyond scan/ping: **connect** to a nearby BLE device, **discover** its services and
characteristics, **read/write** characteristic values, and **subscribe** to
notifications. Turns "I can see these devices" into "I can talk to them" — read a
heart-rate strap or a thermometer, dump a device's GATT table, toggle a BLE bulb, read
your earbuds' battery characteristic, poke at a lock's service, etc.

## Library choice: `aioble` (bundled) over raw IRQ

MicroPython BLE has two levels:
- **raw `bluetooth.BLE().irq(...)`** — an event/state machine (what `novable.scan`
  already uses). Powerful but verbose; a GATT client means hand-managing
  connect/disc-services/disc-chars/read/write/notify events + gattc handles.
- **`aioble`** — a small pure-Python async wrapper (micropython-lib) over that IRQ. It
  fits Nova's cooperative `asyncio` loop cleanly (`await device.connect()`,
  `await char.read()`), which is exactly our appkit model.

**Recommendation:** bundle `aioble` into the package (it's ~4 files, MIT, pure Python)
and build the GATT client on it. Keep the existing raw-IRQ `novable.scan` as-is (it
works) — or migrate scan to `aioble.scan` for consistency (optional).

## Module: extend `novable.py` (or a new `novagatt.py`)

Async API (fits the loop; sync wrappers where a shell command needs one):

```python
async def connect(mac, timeout_ms=5000)          # -> conn handle or None
async def services(conn)                          # -> [ (uuid, [char_uuid,...]) ]
async def read_char(conn, char_uuid)              # -> bytes
async def write_char(conn, char_uuid, data, resp=True)
async def subscribe(conn, char_uuid, cb)          # cb(data) on each notification
async def disconnect(conn)
```

Backed by aioble: `aioble.Device(addr_type, mac).connect()`, then
`connection.services()` / `service.characteristics()` /
`characteristic.read()/write()/subscribe()` + `characteristic.notified()`.

### Well-known UUID names
Ship a small map so the UI shows friendly names: Battery Service `0x180F` / Battery
Level `0x2A19`, Device Info `0x180A` (Manufacturer `0x2A29`, Model `0x2A24`), Heart
Rate `0x180D` / `0x2A37`, Current Time `0x1805`, plus a generic "Custom (128-bit)"
label. Unknown UUIDs show raw.

## GUI: a GATT browser app

Extend the BLE app (`_ble_app`) with a **Connect** flow:
- **Scan nearby** (have it) → pick a device.
- **BleDeviceScreen**: connect (cooperative — "Connecting…", cancel on BACK), then a
  scrollable list of services → characteristics with their friendly names + a value
  preview.
- On a characteristic: **Read** (show hex + ASCII), **Write** (enter bytes via the
  async text-line input), **Subscribe** (live-updating value from notifications).
- All cooperative (progress + cancel), like the NFC dump / Sub-GHz screens — a BLE
  connect/read must never block the loop (it's `await`-based, so it won't).

## Scripting + command
- `nova.ble_connect(mac)`, `nova.ble_read(mac, char)`, `nova.ble_write(mac, char, data)`,
  `nova.ble_notify(mac, char, cb)` — so scripts automate BLE (e.g. read a sensor on a
  timer, or a background script that reacts to a notification).
- `novad1 ble connect <mac>` / `ble read <mac> <char>` / `ble dump <mac>` (print the
  whole GATT table).

## Sequencing / deliverables
1. Bundle `aioble`; `novable.connect/services/disconnect` + a `ble dump <mac>` command
   that prints the GATT table (the simplest end-to-end proof).
2. `read_char` / `write_char` + the BleDeviceScreen browser (read/write).
3. `subscribe` + live notification display; the `nova.ble_*` script API.
4. UUID friendly-name map + polish.

## What to CPython-test vs device
- **Testable now:** the UUID name map, arg parsing / command routing, and the GATT-table
  formatting (feed a fake services/chars structure → assert the printed dump).
- **Device-only:** the actual connect/read/write/notify (real BLE stack) — the on-device
  checklist. aioble's async flow can't be exercised without the radio.

## Honest limits
- **Bonded/encrypted** characteristics need pairing (aioble supports pairing on recent
  builds, but it's finicky) — unbonded reads/writes work broadly; bonded ones are
  best-effort.
- One central connection at a time is the safe assumption on the ESP32-S3 (multiple
  simultaneous connections stress RAM/stack).
- This does **not** let us take over audio devices (BLE audio is bonded/encrypted) — it
  reads/writes exposed GATT characteristics, which is the legitimate, useful surface.
