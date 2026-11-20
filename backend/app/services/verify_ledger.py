import sys
import json
from app.services.ledger_verification import verify_ledger

def main():
    print("==================================================")
    print("      SECUREMARKS CRYPTOGRAPHIC VERIFIER          ")
    print("==================================================")
    print("Executing independent ledger verification...\n")
    
    report = verify_ledger()
    
    print("LEDGER VERIFICATION REPORT")
    print("--------------------------")
    print(f"Total Records: {report['records_checked']}")
    print(f"Valid Records: {report['valid_records']}")
    print(f"Invalid Records: {report['invalid_records']}")
    print(f"Status: {report['status']}")
    print(f"Summary: {report['summary']}")
    
    if report["invalid_details"]:
        print("\nTAMPERING / INTEGRITY VIOLATION DETAILS:")
        print("---------------------------------------")
        for inv in report["invalid_details"]:
            seq = inv.get("sequence_no")
            roll = inv.get("student_roll", "N/A")
            name = inv.get("student_name", "N/A")
            print(f"-> Sequence #{seq} | Student: {roll} ({name})")
            for err in inv.get("errors", []):
                print(f"   [!] {err}")
            if "expected_payload" in inv and "stored_payload" in inv:
                print(f"   Expected Canonical Payload: {inv['expected_payload']}")
                print(f"   Stored Database Payload:    {inv['stored_payload']}")
            if "stored_hash" in inv and "calculated_hash" in inv:
                print(f"   Stored Hash:     {inv['stored_hash']}")
                print(f"   Calculated Hash: {inv['calculated_hash']}")
            print()
    
    print(f"Verified At: {report['verified_at']}")
    print("==================================================")

    # Return exit code 0 if valid, 1 if tampering or error
    if report["status"] == "VALID":
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
