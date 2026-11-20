import time
import requests
import sys

BACKEND_URL = "http://127.0.0.1:8000"
DEVICE_KEY = "esp32_securemarks_device_key_2026"
DEVICE_ID = "ESP32_TERM_01"

HEADERS = {
    "Content-Type": "application/json",
    "X-Device-Key": DEVICE_KEY
}

def render_oled(line1: str, line2: str = "", line3: str = "", line4: str = ""):
    print("\n+------------------------------------------+")
    print("|          SECUREMARKS - OLED (128x64)     |")
    print("+------------------------------------------+")
    print(f"| {line1:<40} |")
    print(f"| {line2:<40} |")
    print(f"| {line3:<40} |")
    print(f"| {line4:<40} |")
    print("+------------------------------------------+\n")

def simulate_device_entry(roll: str, subject: str, marks: float):
    render_oled("COMMUNICATING WITH BACKEND...", f"Student: {roll}", f"Subject: {subject}", f"Marks: {marks}")
    time.sleep(0.5)

    try:
        res = requests.post(
            f"{BACKEND_URL}/api/device/marks",
            headers=HEADERS,
            json={
                "device_id": DEVICE_ID,
                "student_roll": roll,
                "subject_code": subject,
                "exam_id": 1,
                "marks": marks
            },
            timeout=5
        )
        if res.status_code == 200:
            data = res.json()
            render_oled(
                ">> RECORD SAVED SUCCESSFULLY <<",
                f"Seq: #{data['sequence_no']} | Marks: {data['marks']}",
                f"Hash: {data['current_hash'][:20]}...",
                "[GREEN LED: ON] [BEEP]"
            )
            print("[ACTUATOR] Green LED ON (2.0s), Single Confirmation Tone Beep.")
        else:
            render_oled(">> ERROR SAVING RECORD <<", f"Code: {res.status_code}", res.text[:35], "[RED LED: ON] [ALARM]")
            print("[ACTUATOR] Red LED Flashing, Continuous Buzzer Alarm!")
    except Exception as e:
        render_oled(">> CONNECTION ERROR <<", str(e)[:35], "", "[RED LED: ON]")

def simulate_device_verify():
    render_oled("VERIFYING LEDGER...", "Running Independent SHA-256...", "Checking Chain Discontinuity...", "Please wait...")
    time.sleep(0.5)

    try:
        res = requests.post(
            f"{BACKEND_URL}/api/device/verify",
            headers=HEADERS,
            json={"device_id": DEVICE_ID},
            timeout=5
        )
        if res.status_code == 200:
            data = res.json()
            status = data["status"]
            if status == "LEDGER_VALID":
                render_oled(
                    "*** LEDGER INTEGRITY VALID ***",
                    f"Records Checked: {data['records_checked']}",
                    "All 100% SHA-256 Hashes Match",
                    "[GREEN LED: SOLID ON]"
                )
                print("[ACTUATOR] Green LED Solid ON (3.0s). Success chime.")
            else:
                render_oled(
                    "!!! TAMPERING DETECTED !!!",
                    f"Compromised Records: {data['invalid_records']}",
                    "CRITICAL HASH MISMATCH",
                    "[RED LED: RAPID FLASH] [BUZZER]"
                )
                print("[ACTUATOR] RED LED RAPID STROBE, ACTIVE BUZZER ALARM PULSING!")
        else:
            render_oled("VERIFICATION CALL FAILED", f"Code: {res.status_code}", "", "[RED LED: ON]")
    except Exception as e:
        render_oled("CONNECTION ERROR", str(e)[:35], "", "[RED LED: ON]")

def main():
    print("==================================================")
    print("   SECUREMARKS ESP32 HARDWARE TERMINAL SIMULATOR  ")
    print("==================================================")
    print("Simulating ESP32 DevKit + SSD1306 OLED + 4x4 Keypad")
    print("Connecting to live backend at:", BACKEND_URL)
    
    while True:
        print("\n--- Keypad Menu ---")
        print("1. [Key 'A'] Enter Student Marks")
        print("2. [Key '*'] Run Ledger Integrity Verification")
        print("3. [Key 'D'] Query Hardware Terminal Status")
        print("4. Exit Simulator")
        choice = input("Press key (1/2/3/4): ").strip()

        if choice == "1":
            roll = input("Enter Student Roll (default: CS2023001): ").strip() or "CS2023001"
            subject = input("Enter Subject Code (default: CS601): ").strip() or "CS601"
            marks_input = input("Enter Marks (0-100, default: 88.5): ").strip() or "88.5"
            try:
                marks = float(marks_input)
                simulate_device_entry(roll, subject, marks)
            except ValueError:
                print("Invalid marks format.")
        elif choice == "2":
            simulate_device_verify()
        elif choice == "3":
            try:
                res = requests.get(f"{BACKEND_URL}/api/device/status?device_id={DEVICE_ID}", timeout=5)
                print("\nDEVICE STATUS REPORT:", res.json())
            except Exception as e:
                print("Error querying status:", e)
        elif choice == "4":
            print("Exiting simulator.")
            break
        else:
            print("Invalid key pressed.")

if __name__ == "__main__":
    main()
