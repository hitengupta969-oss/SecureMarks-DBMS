# SecureMarks — ESP32 Smart Terminal Hardware Guide

The **SecureMarks Smart Verification Terminal** is an IoT client built on the ESP32 microcontroller that interfaces with the centralized PostgreSQL ledger via FastAPI REST endpoints.

---

## 1. Hardware Architecture

```
[ ESP32-WROOM-32 ]
  |-- I2C (GPIO 21, 22) --------> 0.96" SSD1306 OLED Display (128x64)
  |-- GPIO 13, 12, 14, 27 ------> 4x4 Keypad Rows (R1..R4)
  |-- GPIO 26, 25, 33, 32 ------> 4x4 Keypad Columns (C1..C4)
  |-- GPIO 2 -------------------> Green Indicator LED (220Ω Resistor)
  |-- GPIO 4 -------------------> Red Indicator LED (220Ω Resistor)
  |-- GPIO 5 -------------------> Active Piezo Buzzer
  |-- WiFi 802.11 b/g/n --------> FastAPI Backend (/api/device/*)
```

---

## 2. Complete Component Bill of Materials (BOM)
1. **ESP32-WROOM-32 DevKit V1:** 30-pin or 38-pin version with micro-USB.
2. **0.96" SSD1306 I2C OLED Display:** 128x64 resolution, 4-pin (VCC, GND, SCL, SDA).
3. **4x4 Matrix Membrane Keypad:** 8-pin connector.
4. **Green 5mm Diffused LED:** Evaluated / Valid confirmation.
5. **Red 5mm Diffused LED:** Tamper alarm indicator.
6. **Active 5V Piezo Buzzer:** Acoustic alarm on hash discrepancy.
7. **220Ω 1/4W Resistors (x2):** Current limiting for status LEDs.
8. **Breadboard (830 tie points):** Prototyping bus.
9. **Jumper Wires (M-to-M, M-to-F):** Circuit connections.

---

## 3. Practical Pin Mapping Table

| Component | Pin | ESP32 GPIO | Description |
| :--- | :--- | :--- | :--- |
| **SSD1306 OLED** | VCC | 3V3 | Power |
| | GND | GND | Ground |
| | SDA | GPIO 21 | I2C Data |
| | SCL | GPIO 22 | I2C Clock |
| **Green LED** | Anode (+) | GPIO 2 | Series 220Ω to Anode |
| **Red LED** | Anode (+) | GPIO 4 | Series 220Ω to Anode |
| **Buzzer** | Positive (+) | GPIO 5 | Direct drive active buzzer |
| **Keypad Rows** | R1..R4 | GPIO 13, 12, 14, 27 | Keypad row inputs |
| **Keypad Cols** | C1..C4 | GPIO 26, 25, 33, 32 | Keypad column strobes |

---

## 4. Firmware Setup & Flashing Instructions

1. Install **Arduino IDE** (v2.0+) from [arduino.cc](https://www.arduino.cc/).
2. Add ESP32 board support via **File > Preferences > Additional Boards Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Library Manager** (`Ctrl+Shift+I`) and install:
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`
   - `Keypad` by Mark Stanley & Alexander Brevig
   - `ArduinoJson` (v6.x or v7.x)
4. Open `hardware/esp32_firmware/esp32_securemarks.ino`.
5. Update your Wi-Fi credentials and backend IP address:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Network";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* BACKEND_HOST  = "http://192.168.1.100:8000";
   ```
6. Select **DOIT ESP32 DEVKIT V1** and your COM Port, then click **Upload**.

---

## 5. Software Simulator

If physical ESP32 hardware is not connected, the terminal workflow can be executed using either:
1. **Interactive Web Simulator:** Visit `http://localhost:5173`, navigate to **Hardware Terminal (IoT)**, and use the on-screen 128x64 OLED display, LEDs, synthesizer audio, and keypad.
2. **Python Terminal Simulator:**
   ```powershell
   python hardware/simulator/hardware_simulator.py
   ```
