import pytest

def test_15_authentication_and_role_permissions(client, admin_token, faculty_token, student_token):
    """Requirement 15: Authentication and role permissions are strictly enforced."""
    # 1. Unauthenticated request to protected route fails
    res_unauth = client.get("/api/auth/me")
    assert res_unauth.status_code == 401

    # 2. Student cannot enter marks (requires admin or faculty)
    res_student_post = client.post(
        "/api/marks",
        json={"student_id": 1, "subject_id": 1, "exam_id": 1, "marks": 90.0},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res_student_post.status_code == 403

    # 3. Faculty can enter marks
    res_fac_post = client.post(
        "/api/marks",
        json={"student_id": 2, "subject_id": 2, "exam_id": 1, "marks": 87.5},
        headers={"Authorization": f"Bearer {faculty_token}"}
    )
    assert res_fac_post.status_code == 201

    # 4. Student can view marks, but only their own
    res_student_view = client.get("/api/marks", headers={"Authorization": f"Bearer {student_token}"})
    assert res_student_view.status_code == 200
    for mark in res_student_view.json():
        assert mark["roll_number"] == "CS2023001"

def test_16_backend_api_functionality(client, admin_token):
    """Requirement 16: All core backend API endpoints function properly."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Students API
    res_students = client.get("/api/students", headers=headers)
    assert res_students.status_code == 200
    assert len(res_students.json()) >= 10

    # Subjects API
    res_subjects = client.get("/api/subjects", headers=headers)
    assert res_subjects.status_code == 200
    assert len(res_subjects.json()) >= 5

    # Exams API
    res_exams = client.get("/api/exams", headers=headers)
    assert res_exams.status_code == 200
    assert len(res_exams.json()) >= 2

    # Ledger Explorer API
    res_ledger = client.get("/api/ledger?limit=10", headers=headers)
    assert res_ledger.status_code == 200
    records = res_ledger.json()
    assert len(records) >= 10

    # Specific sequence lookup
    res_seq1 = client.get("/api/ledger/1", headers=headers)
    assert res_seq1.status_code == 200
    assert res_seq1.json()["sequence_no"] == 1
    assert res_seq1.json()["previous_hash"] == "0" * 64

    # Ledger Verify API
    res_verify = client.post("/api/ledger/verify", headers=headers)
    assert res_verify.status_code == 200
    assert res_verify.json()["status"] == "VALID"

    # Demo Tamper and Restore API
    res_tamper = client.post(
        "/api/demo/tamper",
        json={"sequence_no": 1, "tampered_marks": 99.99},
        headers=headers
    )
    assert res_tamper.status_code == 200
    assert res_tamper.json()["verification_result"]["status"] == "TAMPERING_DETECTED"

    # Restore clean state
    res_restore = client.post(
        "/api/demo/restore",
        json={"sequence_no": 1},
        headers=headers
    )
    assert res_restore.status_code == 200
    assert res_restore.json()["verification_result"]["status"] == "VALID"
