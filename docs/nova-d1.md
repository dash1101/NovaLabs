# RPC Nova D1
#### An open, DIY cybersecurity &amp; networking multi-tool for security research and hardware exploration — powered by RPCortex.

The RPC Nova D1 is an accessible, low-cost alternative to tools like the Flipper Zero. Designed to be built entirely from off-the-shelf components and housed in a 3D-printed enclosure, it skips custom PCBs and complex manufacturing entirely. You source the parts, wire them up, and the software handles the rest — a tool for learning, research, and tinkering with the devices and signals you own.

The Nova D1's hardware is open and buildable; it runs on **RPCortex Vela (v1.0)**, NovaLabs' source-available operating system. Rather than relying on rigid custom firmware, the Nova D1 operates as a seamless wrapper package on top of a fully functional, multi-tasking OS. 

## 🧠 The RPCortex Advantage
Development of the Nova D1 is officially back in active status, made possible by massive leaps in the RPCortex OS:
* **Multi-Device Support & Optimization:** Highly optimized to run flawlessly across ESP32-S3 and Pico 2W architectures.
* **True Multi-Tasking:** Background processes, seamless UI navigation, and active hardware scanning run concurrently without hanging.
* **Modular Package System:** Features native packages for GPIO management, I2C scanning, and NTP. 
* **The NovaD1 Wrapper:** A dedicated package that automatically installs into RPCortex, triggers Autonomy Mode to bypass login, initializes the hardware scanner to locate your display, and boots the Nova GUI and necessary background processes instantly on startup.
* **OTA Updates:** Over-the-air updates ensure your tool is always running the latest features and security patches.

## 🔧 Hardware Specifications
*No custom PCB required. All parts are standard, accessible modules.*

| Component | Description / Name / Details | Part Link / Example | Est. Cost |
|-----------|------------------------------|---------------------|-----------|
| **📟 Interface** | 1.3" OLED, EC11 Rotary Encoder, 2x Buttons | [Module](#) | ~$4.00 |
| **📶 MCU Board** | **ESP32-S3** (16MB) - Chosen for speed, GPIO, & WiFi/BT | [ESP32-S3](#) | ~$5.00 |
| **📡 Sub-1GHz** | Transceiver for interacting with RF devices | [CC1101](#) | ~$2.50 |
| **📲 NFC/RFID** | Read, write, and emulate NFC/RFID tags | [PN532](#) | ~$2.50 |
| **📡 Infrared (IR)** | Universal remote, IR communication, and cloning | [Generic 3-Pin](#) | ~$1.00 |
| **🔋 Power** | 3.7V Rechargeable Li-Po battery | [Generic Li-Po](#) | ~$7.00 |
| **🔌 Charging** | Ultra-Small external charging circuit | [TP4056/Similar](#) | ~$0.50 |
| **🔉 Audio** | Buzzer for feedback, notifications, and alerts | [Generic 3v Piezo](#) | ~$0.75 |
| **💾 Storage** | MicroSD slot for OS packages, scripts, and payloads | [Micro-SD Module](#) | ~$0.75 |
| **📡 LoRa** | Faster, long-range wireless communication | [SX1276 915MHz](#) | ~$4.50 |
| **🔁 Haptics** | Motor for tactile feedback in the OS UI | [1027 Motor](#) | ~$1.25 |
| **🛰️ Location** | GPS Module for location tracking/wardriving | [Neo-8M](#) | ~$6.50 |
| **🔛 Toggles** | Physical switches to kill/route power to specific modules| [8-way DIP](#) | ~$1.50 |
| **⌚ Timing** | Hardware Real-Time Clock | [DS3231](#) | ~$1.25 |
| **📦 Enclosure** | 3D-Printed chassis to house all components cleanly | [STL File](#) | Cost of Filament |
| **Total Build** | **Fully functional DIY multi-tool** | **Nova D1** | **Approx. $40** |

## 🚀 Core Capabilities
- **Script Execution:** Run custom scripts directly from the MicroSD.
- **RF & Wireless:** Sub-GHz RF control and long-range LoRa communication.
- **Access Emulation:** RFID/NFC emulation, copying, and writing (badges, microchips).
- **IR & HID:** Infrared cloning/broadcasting and Bad USB functionality.
- **Spatial Data:** Live location detection and parsing.
- *More documentation and features to be announced as RPCortex Vela scales.*

### 🏗 Status: ACTIVE DEVELOPMENT
With the core operating system now highly capable of supporting advanced hardware routines, the Nova D1 hardware integration is officially underway.

💡 **Suggestions, hardware mods, and feature requests are welcome!**  
🗓️ **Estimated Release:** Aligning with RPCortex Vela updates. `Q1 of 2027`