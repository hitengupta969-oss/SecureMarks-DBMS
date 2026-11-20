# SecureMarks ESP32 Hardware Pin Mapping & Circuit Specification

## 1. Component List
| Component | Specification | Quantity | Purpose |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32-WROOM-32 DevKit V1 (30-pin or 38-pin) | 1 | IoT verification terminal client |
| **Display** | 0.96" SSD1306 Monochrome OLED (128x64, I2C) | 1 | Cryptographic status & prompts |
| **Keypad** | 4x4 Matrix Membrane Keypad | 1 | Roll number & mark entry |
| **Green LED** | 5mm Diffused Green LED (with 220Ω resistor) | 1 | "LEDGER VALID" / Success indicator |
| **Red LED** | 5mm Diffused Red LED (with 220Ω resistor) | 1 | "TAMPERING DETECTED" alert |
| **Buzzer** | 5V Active Piezo Buzzer | 1 | Acoustic alarm on hash discrepancy |
| **Breadboard** | 830 tie-point breadboard | 1 | Prototyping bus |
| **Jumper Wires** | Male-to-Male and Male-to-Female | 25+ | Interconnects |

---

## 2. Pin Mapping Table (Avoiding Bootstrapping Conflicts)

> [!IMPORTANT]
> ESP32 strapping pins GPIO 0, 2, 12, and 15 affect boot mode when pulled HIGH or LOW during power-on. The pin assignments below avoid holding pull-down pins during startup.

| Device Peripheral | Peripheral Pin | ESP32 GPIO | Description / Notes |
| :--- | :--- | :--- | :--- |
| **SSD1306 OLED** | VCC | 3V3 | Power (3.3V) |
| | GND | GND | Common Ground |
| | SCL | GPIO 22 | Hardware I2C Clock |
| | SDA | GPIO 21 | Hardware I2C Data |
| **Status LEDs** | Green Anode (+) | GPIO 2 | Series 220Ω resistor to GPIO 2 (Cathode to GND) |
| | Red Anode (+) | GPIO 4 | Series 220Ω resistor to GPIO 4 (Cathode to GND) |
| **Buzzer** | Positive (+) | GPIO 5 | Direct drive active buzzer (Negative to GND) |
| **4x4 Keypad Rows** | Row 1 (R1) | GPIO 13 | Keypad Row 1 scanning input |
| | Row 2 (R2) | GPIO 12 | Keypad Row 2 scanning input |
| | Row 3 (R3) | GPIO 14 | Keypad Row 3 scanning input |
| | Row 4 (R4) | GPIO 27 | Keypad Row 4 scanning input |
| **4x4 Keypad Columns**| Col 1 (C1) | GPIO 26 | Keypad Column 1 strobe output |
| | Col 2 (C2) | GPIO 25 | Keypad Column 2 strobe output |
| | Col 3 (C3) | GPIO 33 | Keypad Column 3 strobe output |
| | Col 4 (C4) | GPIO 32 | Keypad Column 4 strobe output |

---

## 3. Power Distribution
- Connect ESP32 DevKit via Micro-USB to PC or 5V 1A USB adapter.
- Distribute **3.3V** rail to OLED VCC.
- Connect common **GND** bus across ESP32, OLED, LEDs (Cathodes), and Buzzer (-).
