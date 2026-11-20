# SecureMarks ESP32 Circuit Wiring Guide & Assembly

This guide provides step-by-step breadboard assembly and wiring instructions for the **SecureMarks Smart Verification Terminal**.

```
                       +-------------------+
                       |    ESP32 DEVKIT   |
                       |                   |
        3V3 -----------> VCC (OLED)        |
        GND -----------> GND (Common Bus)  |
     GPIO21 -----------> SDA (OLED)        |
     GPIO22 -----------> SCL (OLED)        |
                       |                   |
      GPIO2 -----------> [220Ω] -> Green LED (+) -> GND
      GPIO4 -----------> [220Ω] -> Red LED (+)   -> GND
      GPIO5 -----------> Buzzer (+)              -> GND
                       |                   |
    GPIO 13,12,14,27 --> Keypad Rows (R1..R4)
    GPIO 26,25,33,32 --> Keypad Cols (C1..C4)
                       +-------------------+
```

---

## 1. Assembly Steps

### Step 1: Power & Ground Rails
1. Connect ESP32 **GND** pin to the blue breadboard negative rail (-).
2. Connect ESP32 **3V3** pin to the red breadboard positive rail (+).

### Step 2: SSD1306 OLED Wiring
1. Connect OLED **GND** to the ground rail.
2. Connect OLED **VCC** to the 3.3V power rail.
3. Connect OLED **SDA** to ESP32 **GPIO 21**.
4. Connect OLED **SCL** to ESP32 **GPIO 22**.

### Step 3: Indicator LEDs
1. Place Green LED on breadboard. Connect a 220Ω current-limiting resistor from its anode (long lead) to **GPIO 2**. Connect cathode (flat edge/short lead) to GND.
2. Place Red LED on breadboard. Connect a 220Ω resistor from its anode to **GPIO 4**. Connect cathode to GND.

### Step 4: Active Buzzer
1. Connect the positive terminal (+) of the active buzzer to **GPIO 5**.
2. Connect the negative terminal (-) to the ground rail.

### Step 5: 4x4 Matrix Keypad Ribbon Header
Looking at the 8-pin ribbon cable of the 4x4 keypad with the keypad facing up (pins 1 to 8 from left to right):
- Pin 1 (Row 1): Connect to **GPIO 13**
- Pin 2 (Row 2): Connect to **GPIO 12**
- Pin 3 (Row 3): Connect to **GPIO 14**
- Pin 4 (Row 4): Connect to **GPIO 27**
- Pin 5 (Col 1): Connect to **GPIO 26**
- Pin 6 (Col 2): Connect to **GPIO 25**
- Pin 7 (Col 3): Connect to **GPIO 33**
- Pin 8 (Col 4): Connect to **GPIO 32**

---

## 2. Firmware Compilation & Flashing Guide

1. **Install Arduino IDE** (version 2.0+ or PlatformIO).
2. Open **Boards Manager** and install `esp32 by Espressif Systems` (version 2.0.11 or higher).
3. Open **Library Manager** and install the following required dependencies:
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`
   - `Keypad` (by Mark Stanley, Alexander Brevig)
   - `ArduinoJson` (by Benoit Blanchon, v6.x or v7.x)
4. Select Board: **ESP32 Dev Module** or **DOIT ESP32 DEVKIT V1**.
5. Set Upload Speed: `921600` or `115200`.
6. Open `hardware/esp32_firmware/esp32_securemarks.ino`.
7. Configure `WIFI_SSID`, `WIFI_PASSWORD`, and `BACKEND_HOST` (e.g., `http://192.168.1.100:8000`).
8. Connect ESP32 via USB and click **Upload**.
