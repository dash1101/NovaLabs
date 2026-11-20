# Nova D1 on RPCortex v2

Nova D1 is a package for RPCortex v2 "Vela II", the C++ rewrite of the operating system. It is not
firmware: install the OS on a Raspberry Pi Pico 2 W, install the package, and the device has a
screen, an app system and the radio tools. Remove the package and it is an ordinary RPCortex
board again.

This page covers the C++ build, which is where development is now. The MicroPython build for RPCortex
v1 is tracked in the [V1 reference](novad1-v1.md).

## Install

On a Pico 2 W running RPCortex v2 (see [Get RPCortex](https://rpc.novalabs.app/get)):

```
pkg update
pkg install novad1
novad1 service start
```

The commands `novad1` and `d1` appear once it is installed. `novad1 service start` and `stop`
control the GUI, which runs as a background service. To upgrade, run `pkg update` first (the install
compares against the cached package index), then:

```
novad1 service stop
pkg install novad1
novad1 service start
```

`novad1 shot` prints the screen that is currently on the display as text, which is also how the
screens are checked without a panel attached.

## How it runs

- **From a flash slot.** A package built position-independent executes from a reserved 256 KB slot in
  flash instead of being copied into RAM. On a Pico 2 W, Nova D1 1.7.1 runs from it with about 80 KB
  resident, which leaves the heap free for the radios and the network. The Pico 2 W and Pico 2 have
  the slot; the RP2040 boards do not, so Nova D1 targets the RP2350 boards.
- **In a sandbox.** On RP2350 a package runs unprivileged with the memory protection unit limiting
  what it can touch, so a bad screen costs a command and not the device.
- **On both cores.** The OS schedules tasks on both cores; the GUI and the input reader are separate
  tasks you can see with `ps`.
- **A package, so it updates like one.** `pkg update` and `pkg install` bring a new version over the
  air, checked against a SHA-256 before anything is written.

## What exists

The GUI and its app system, the app store, and the Wi-Fi, Bluetooth, radio (sub-GHz, LoRa, NFC),
sensor, file, task, settings and USB (including BadUSB) screens are written, ported file by file from
the MicroPython build so the two stay comparable. The pure logic is covered by host tests, and every screen is rendered as
text on the host and fails the test run if it draws nothing.

## What has run on a board

The package has run on a bare Pico 2 W, drawing its screens into a framebuffer. That is the whole of
the hardware confirmation so far.

The OLED, the encoder and buttons, and the radio and sensor modules have **not** been wired to a
board running v2 yet. Every module therefore starts at "written and host-tested" and moves to
"confirmed on hardware" as it is brought up. The [V1 reference](novad1-v1.md) shows what has been
confirmed on the MicroPython build, which is the same hardware and the same screens.

## Hardware

The reference board is the Raspberry Pi Pico 2 W; the pin map, the parts and their prices are in
[Wiring](novad1-wiring.md) and [Parts & prices](novad1-bom.md). The browser simulator is this C++
build compiled to WebAssembly, so it draws the same screens the device does.
