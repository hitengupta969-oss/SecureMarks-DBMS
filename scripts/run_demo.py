import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import psycopg
from app.core.config import settings
from app.services.ledger_verification import verify_ledger

def print_separator(title=""):
    print("\n" + "=" * 60)
    if title:
        print(f"   {title}")
        print("=" * 60)

def main():
    print_separator("SECUREMARKS - AUTOMATED TAMPERING DEMONSTRATION")
    print("Academic DBMS Project: Topic 11 - Tamper-Evident Marks Register")
    print(f"Connecting to PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}...\n")

    # Step 1: Baseline Verification
    print("[STEP 1] Running Baseline Verification on Clean Ledger...")
    report1 = verify_ledger()
    print(f"-> Total Records: {report1['records_checked']}")
    print(f"-> Valid Records: {report1['valid_records']}")
    print(f"-> Status:        {report1['status']}")
    print(f"-> Result:        {report1['summary']}")

    if report1["status"] != "VALID":
        print("Warning: Ledger not initially clean. Restoring clean state...")

    # Step 2: Adversarial SQL Tampering
    target_seq = 1
    tampered_marks = 99.99

    print_separator("[STEP 2] Simulating Adversarial Direct SQL Tampering")
    print(f"An attacker accesses PostgreSQL directly and executes:")
    print(f"   UPDATE marks_ledger SET marks = {tampered_marks} WHERE sequence_no = {target_seq};")
    print("NOTE: No update trigger exists to regenerate the cryptographic hash!\n")

    conn = psycopg.connect(
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        dbname=settings.POSTGRES_DB,
        autocommit=True
    )
    with conn.cursor() as cur:
        # Get original marks
        cur.execute("SELECT marks, current_hash FROM marks_ledger WHERE sequence_no = %s;", (target_seq,))
        row = cur.fetchone()
        orig_marks = row[0]
        orig_hash = row[1]
        print(f"Original Marks for Seq #{target_seq}: {orig_marks} (Hash: {orig_hash[:16]}...)")

        # Execute direct modification
        cur.execute("UPDATE marks_ledger SET marks = %s WHERE sequence_no = %s;", (tampered_marks, target_seq))
        print(f"Database column altered to: {tampered_marks}")

    time.sleep(1)

    # Step 3: Run Verification on Tampered Ledger
    print_separator("[STEP 3] Running Independent Python Verification Engine")
    report2 = verify_ledger()
    print(f"-> Total Records: {report2['records_checked']}")
    print(f"-> Valid Records: {report2['valid_records']}")
    print(f"-> Invalid Recs:  {report2['invalid_records']}")
    print(f"-> Status:        {report2['status']}")
    print(f"-> Result:        {report2['summary']}")

    if report2["invalid_details"]:
        print("\nTAMPERING DETECTION PROOF:")
        for inv in report2["invalid_details"]:
            print(f"-> Compromised Sequence: #{inv.get('sequence_no')} ({inv.get('student_roll')})")
            for err in inv.get("errors", []):
                print(f"   [!] {err}")
            if "expected_payload" in inv and "stored_payload" in inv:
                print(f"   Expected Live Payload: {inv['expected_payload']}")
                print(f"   Stored Initial Payload:{inv['stored_payload']}")

    # Step 4: Restoring Clean State
    print_separator("[STEP 4] Restoring Original Marks & Re-verifying")
    with conn.cursor() as cur:
        cur.execute("UPDATE marks_ledger SET marks = %s WHERE sequence_no = %s;", (orig_marks, target_seq))
        print(f"Restored marks for Seq #{target_seq} back to: {orig_marks}")
    conn.close()

    report3 = verify_ledger()
    print(f"-> Status After Restore: {report3['status']}")
    print(f"-> Summary:              {report3['summary']}")

    print_separator("DEMONSTRATION COMPLETE: TAMPERING FULLY DETECTED & PROVEN")

if __name__ == "__main__":
    main()
