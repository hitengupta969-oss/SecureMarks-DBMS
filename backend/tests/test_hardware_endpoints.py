import pytest
from app.core.config import settings

def test_17_hardware_endpoint_functionality(client):
    """
    Requirement 17: Hardware endpoint functionality.
    Simulates physical ESP32 terminal communication with FastAPI backend.
    """
    device_headers = {"X-Device-Key": settings.DEVICE_API_KEY}

    # 1. Device enters marks for student
    res_entry = client.post(
        "/api/device/marks",
        json={
            "device_id": "ESP32_TERM_01",
            "student_roll": "CS2023002",
            "subject_code": "CS602",
            "exam_id": 1,
            "marks": 95.0
        },
        headers=device_headers
    )
    assert res_entry.status_code == 200, f"Device entry failed: {res_entry.text}"
    body = res_entry.json()
    assert body["status"] == "RECORD_SAVED"
    assert "sequence_no" in body
    assert len(body["current_hash"]) == 64

    # 2. Device requests cryptographic verification
    res_verify = client.post(
        "/api/device/verify",
        json={"device_id": "ESP32_TERM_01"},
        headers=device_headers
    )
    assert res_verify.status_code == 200
    verif = res_verify.json()
    assert verif["status"] in ("LEDGER_VALID", "TAMPERING_DETECTED")
    assert verif["records_checked"] > 0

    # 3. Query device status
    res_status = client.get("/api/device/status?device_id=ESP32_TERM_01")
    assert res_status.status_code == 200
    st = res_status.json()
    assert st["device_id"] == "ESP32_TERM_01"
    assert st["is_online"] is True
    assert st["last_action"] == "VERIFY_REQUEST"

    # 4. Query device logs
    res_logs = client.get("/api/device/logs?limit=10")
    assert res_logs.status_code == 200
    logs = res_logs.json()
    assert len(logs) > 0
    assert any(log["device_id"] == "ESP32_TERM_01" for log in logs)
