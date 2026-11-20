/**
 * ==============================================================================
 * SecureMarks - ESP32 Smart Verification Terminal Firmware
 * ==============================================================================
 * Academic DBMS Project: Tamper-Evident Marks Register
 * Hardware:
 *   - ESP32-WROOM-32 DevKit V1
 *   - 0.96" SSD1306 OLED Display (I2C: 128x64)
 *   - 4x4 Matrix Keypad
 *   - Status LEDs: Green (Valid/Success), Red (Tampering/Alert)
 *   - Active Buzzer (Alert/Tone)
 *
 * REST API Integration:
 *   - POST /api/device/marks   (Records student marks -> Trigger computes hash)
 *   - POST /api/device/verify  (Executes cryptographic hash-chain verification)
 *   - GET  /api/device/status  (Queries terminal health & status)
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Keypad.h>
#include <ArduinoJson.h>

// ------------------------------------------------------------------------------
// User Configurable Wi-Fi and Backend Settings
// ------------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend API Base URL (Change to host workstation IP or domain)
const char* BACKEND_HOST  = "http://192.168.1.100:8000";
const char* DEVICE_KEY    = "esp32_securemarks_device_key_2026";
const char* DEVICE_ID     = "ESP32_TERM_01";

// ------------------------------------------------------------------------------
// Pin Definitions (Configured to avoid ESP32 strapping pins)
// ------------------------------------------------------------------------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C

// I2C Pins for SSD1306 OLED
#define I2C_SDA 21
#define I2C_SCL 22

// Actuator Pins
#define PIN_LED_GREEN 2
#define PIN_LED_RED   4
#define PIN_BUZZER    5

// 4x4 Keypad Matrix Pins
const byte ROWS = 4;
const byte COLS = 4;
char keys[ROWS][COLS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

// Row pins connected to: R1->GPIO 13, R2->GPIO 12, R3->GPIO 14, R4->GPIO 27
byte rowPins[ROWS] = {13, 12, 14, 27};
// Column pins connected to: C1->GPIO 26, C2->GPIO 25, C3->GPIO 33, C4->GPIO 32
byte colPins[COLS] = {26, 25, 33, 32};

// ------------------------------------------------------------------------------
// Global Instances & State Machine
// ------------------------------------------------------------------------------
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

enum TerminalState {
  STATE_IDLE,
  STATE_ENTER_ROLL,
  STATE_ENTER_SUBJECT,
  STATE_ENTER_MARKS,
  STATE_SUBMITTING,
  STATE_VERIFYING,
  STATE_RESULT_DISPLAY
};

TerminalState currentState = STATE_IDLE;
String inputBuffer = "";
String studentRoll = "";
String subjectCode = "";
String inputMarks  = "";

// ------------------------------------------------------------------------------
// Hardware Output Helpers
// ------------------------------------------------------------------------------
void setGreenLed(bool state) { digitalWrite(PIN_LED_GREEN, state ? HIGH : LOW); }
void setRedLed(bool state)   { digitalWrite(PIN_LED_RED, state ? HIGH : LOW); }

void buzzBeep(int durationMs = 100) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(durationMs);
  digitalWrite(PIN_BUZZER, LOW);
}

void triggerAlarmSequence() {
  for (int i = 0; i < 4; i++) {
    setRedLed(true);
    digitalWrite(PIN_BUZZER, HIGH);
    delay(150);
    setRedLed(false);
    digitalWrite(PIN_BUZZER, LOW);
    delay(100);
  }
}

void renderHeader(const char* title) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.print(F("SECUREMARKS - IoT"));
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.setCursor(0, 14);
  display.print(title);
}

void updateDisplayIdle() {
  renderHeader("READY - SELECT MODE");
  display.setCursor(0, 26);
  display.print(F("A: Enter Marks"));
  display.setCursor(0, 38);
  display.print(F("*: Verify Ledger"));
  display.setCursor(0, 50);
  display.print(F("WiFi: "));
  display.print(WiFi.status() == WL_CONNECTED ? F("Connected") : F("Offline"));
  display.display();
}

// ------------------------------------------------------------------------------
// REST API Communications
// ------------------------------------------------------------------------------
void submitMarksToLedger() {
  renderHeader("COMMUNICATING...");
  display.setCursor(0, 28);
  display.print(F("Sending to PostgreSQL"));
  display.setCursor(0, 42);
  display.print(F("Triggering Hash..."));
  display.display();

  if (WiFi.status() != WL_CONNECTED) {
    display.clearDisplay();
    display.setCursor(0, 20);
    display.print(F("WiFi Disconnected!"));
    display.display();
    triggerAlarmSequence();
    delay(2000);
    currentState = STATE_IDLE;
    updateDisplayIdle();
    return;
  }

  HTTPClient http;
  String url = String(BACKEND_HOST) + "/api/device/marks";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  StaticJsonDocument<256> doc;
  doc["device_id"]    = DEVICE_ID;
  doc["student_roll"] = studentRoll;
  doc["subject_code"] = subjectCode;
  doc["exam_id"]      = 1;
  doc["marks"]        = inputMarks.toFloat();

  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    long seq = resDoc["sequence_no"];
    const char* hash = resDoc["current_hash"];

    display.clearDisplay();
    display.setCursor(0, 0);
    display.print(F("RECORD RECORDED!"));
    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
    display.setCursor(0, 14);
    display.printf("Seq: #%ld", seq);
    display.setCursor(0, 26);
    display.printf("Roll: %s", studentRoll.c_str());
    display.setCursor(0, 38);
    display.printf("Marks: %s", inputMarks.c_str());
    display.setCursor(0, 50);
    display.printf("Hash: %.10s...", hash);
    display.display();

    setGreenLed(true);
    buzzBeep(150);
    delay(3000);
    setGreenLed(false);
  } else {
    display.clearDisplay();
    display.setCursor(0, 10);
    display.print(F("ERROR SAVING!"));
    display.setCursor(0, 25);
    display.printf("HTTP Code: %d", httpCode);
    display.display();
    triggerAlarmSequence();
    delay(2500);
  }
  http.end();
  currentState = STATE_IDLE;
  updateDisplayIdle();
}

void verifyLedgerViaDevice() {
  renderHeader("VERIFYING LEDGER...");
  display.setCursor(0, 28);
  display.print(F("Independent SHA-256"));
  display.setCursor(0, 42);
  display.print(F("Validating Chain..."));
  display.display();

  if (WiFi.status() != WL_CONNECTED) {
    display.clearDisplay();
    display.setCursor(0, 20);
    display.print(F("WiFi Disconnected!"));
    display.display();
    triggerAlarmSequence();
    delay(2000);
    currentState = STATE_IDLE;
    updateDisplayIdle();
    return;
  }

  HTTPClient http;
  String url = String(BACKEND_HOST) + "/api/device/verify";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);

  StaticJsonDocument<128> doc;
  doc["device_id"] = DEVICE_ID;
  String payload;
  serializeJson(doc, payload);

  int httpCode = http.POST(payload);
  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<512> resDoc;
    deserializeJson(resDoc, response);

    const char* status = resDoc["status"];
    int checked = resDoc["records_checked"];
    int invalid = resDoc["invalid_records"];

    display.clearDisplay();
    display.setCursor(0, 0);
    display.print(F("VERIFICATION RESULT"));
    display.drawLine(0, 10, 128, 10, SSD1306_WHITE);

    if (strcmp(status, "LEDGER_VALID") == 0) {
      display.setCursor(0, 18);
      display.print(F("LEDGER VALID!"));
      display.setCursor(0, 32);
      display.printf("Checked: %d recs", checked);
      display.setCursor(0, 46);
      display.print(F("Hash Chain: 100% OK"));
      display.display();

      setGreenLed(true);
      buzzBeep(200);
      delay(3000);
      setGreenLed(false);
    } else {
      display.setCursor(0, 18);
      display.print(F("TAMPERING DETECTED!"));
      display.setCursor(0, 32);
      display.printf("Invalid: %d recs", invalid);
      display.setCursor(0, 46);
      display.print(F("INTEGRITY COMPROMISED"));
      display.display();

      triggerAlarmSequence();
      delay(3000);
    }
  } else {
    display.clearDisplay();
    display.setCursor(0, 15);
    display.print(F("VERIFICATION FAIL"));
    display.setCursor(0, 30);
    display.printf("HTTP Code: %d", httpCode);
    display.display();
    triggerAlarmSequence();
    delay(2500);
  }
  http.end();
  currentState = STATE_IDLE;
  updateDisplayIdle();
}

// ------------------------------------------------------------------------------
// Setup & Loop
// ------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  setGreenLed(false);
  setRedLed(false);
  digitalWrite(PIN_BUZZER, LOW);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
  }

  display.clearDisplay();
  renderHeader("BOOTING TERMINAL");
  display.setCursor(0, 25);
  display.print(F("Connecting WiFi..."));
  display.display();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 15) {
    delay(500);
    retries++;
  }

  display.clearDisplay();
  renderHeader("INITIALIZATION");
  display.setCursor(0, 25);
  display.print(WiFi.status() == WL_CONNECTED ? F("WiFi Online") : F("WiFi Offline"));
  display.display();
  buzzBeep(100);
  delay(1500);

  updateDisplayIdle();
}

void loop() {
  char key = keypad.getKey();

  if (key) {
    buzzBeep(40); // Key click feedback

    switch (currentState) {
      case STATE_IDLE:
        if (key == 'A') {
          currentState = STATE_ENTER_ROLL;
          inputBuffer = "";
          renderHeader("STEP 1/3: ROLL NO");
          display.setCursor(0, 26);
          display.print(F("Enter Roll No:"));
          display.setCursor(0, 42);
          display.print(F("E.g. CS2023001 (#)"));
          display.display();
        } else if (key == '*') {
          currentState = STATE_VERIFYING;
          verifyLedgerViaDevice();
        }
        break;

      case STATE_ENTER_ROLL:
        if (key == '#') {
          studentRoll = inputBuffer.length() > 0 ? inputBuffer : "CS2023001";
          currentState = STATE_ENTER_SUBJECT;
          inputBuffer = "";
          renderHeader("STEP 2/3: SUBJECT");
          display.setCursor(0, 26);
          display.print(F("Enter Subject Code:"));
          display.setCursor(0, 42);
          display.print(F("E.g. CS601 (#)"));
          display.display();
        } else if (key == 'C') {
          inputBuffer = "";
        } else {
          inputBuffer += key;
          renderHeader("STEP 1/3: ROLL NO");
          display.setCursor(0, 26);
          display.print(F("Roll: "));
          display.print(inputBuffer);
          display.display();
        }
        break;

      case STATE_ENTER_SUBJECT:
        if (key == '#') {
          subjectCode = inputBuffer.length() > 0 ? inputBuffer : "CS601";
          currentState = STATE_ENTER_MARKS;
          inputBuffer = "";
          renderHeader("STEP 3/3: MARKS");
          display.setCursor(0, 26);
          display.print(F("Enter Marks (0-100):"));
          display.display();
        } else if (key == 'C') {
          inputBuffer = "";
        } else {
          inputBuffer += key;
          renderHeader("STEP 2/3: SUBJECT");
          display.setCursor(0, 26);
          display.print(F("Subject: "));
          display.print(inputBuffer);
          display.display();
        }
        break;

      case STATE_ENTER_MARKS:
        if (key == '#') {
          inputMarks = inputBuffer.length() > 0 ? inputBuffer : "85.0";
          currentState = STATE_SUBMITTING;
          submitMarksToLedger();
        } else if (key == 'C') {
          inputBuffer = "";
        } else {
          inputBuffer += key;
          renderHeader("STEP 3/3: MARKS");
          display.setCursor(0, 26);
          display.print(F("Marks: "));
          display.print(inputBuffer);
          display.display();
        }
        break;

      default:
        break;
    }
  }
}
