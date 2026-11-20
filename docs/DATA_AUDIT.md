# SecureMarks — Data Audit & Forensic Verification Analysis

## 1. Executive Summary
Traditional database audit mechanisms capture chronological event logs into flat auxiliary tables (e.g. `audit_log`, `pg_stat_activity`, or write-ahead logging WAL archives). However, standard audit logs do not form an interdependent mathematical chain. A privileged insider with direct database access can silently execute:
```sql
UPDATE audit_log SET new_value = '95.00' WHERE user_id = 1;
```
Because each row is independent, relational databases cannot mathematically determine whether an audit record has been revised after creation.

SecureMarks replaces this vulnerable paradigm with a **tamper-evident hash-chained ledger database**.

---

## 2. Comparative Matrix: Standard Audit Logging vs. Hash-Chained Ledger

| Metric / Capability | Conventional Audit Log Table | SecureMarks Hash-Chained Ledger |
| :--- | :--- | :--- |
| **Tamper Resistance** | Low (Mutable by DBA/Superuser) | High (Mathematical Avalanche Effect) |
| **Detection Method** | Manual Log Parsing / Forensic Audits | Automated Algorithmic Verification ($O(N)$) |
| **Historical Lineage** | Disjoint records with system timestamps | Strict linear cryptographic chain ($h_i = H(R_i \| h_{i-1})$) |
| **Replay Attack Resistance** | Vulnerable to inserted/deleted rows | Prevented by monotonically increasing sequence checks |
| **Verification Overhead** | High human effort | $< 0.1\text{ ms}$ per block (in-memory SHA-256) |
| **Hardware Integration** | Typically none | Hardware alerting (OLED, Red LED, Buzzer) |

---

## 3. Cryptographic Verification Pipeline

The verification engine verifies 5 distinct mathematical properties:

```
[ Row Sequence Verification ]
  Check: sequence_no[i] == sequence_no[i-1] + 1
  Detects: Dropped records, re-sequencing, and unauthorized insertions.

[ Genesis Hash Anchor ]
  Check: previous_hash[1] == '0' * 64
  Detects: Alteration of root evaluation state.

[ Previous Hash Linkage ]
  Check: previous_hash[i] == current_hash[i-1] (for i > 1)
  Detects: Chain breaks, insertion of foreign blocks, and historical splices.

[ Canonical Payload Reconciliation ]
  Check: stored_payload[i] == generate_canonical_payload(live_columns[i])
  Detects: Direct SQL UPDATE modifications to marks, snapshots, or timestamps.

[ SHA-256 Cryptographic Seal ]
  Check: current_hash[i] == hashlib.sha256(stored_payload[i]).hexdigest()
  Detects: Manual tampering with the stored hash itself.

[ Terminal State Synchronization ]
  Check: ledger_state.last_sequence == records[-1].sequence_no AND
         ledger_state.last_hash == records[-1].current_hash
  Detects: Desynchronized transactions and truncation of terminal records.
```

---

## 4. Re-evaluation & Grade Correction Audit Trail

In real-world academic institutions, grades are legitimately revised following re-evaluations, RTI scrutiny, or committee arbitrations. Traditional systems either overwrite the existing mark or append an untracked comment.

In SecureMarks:
1. Historical ledger blocks are **never updated**.
2. A new evaluation event `MARK_CORRECTED` is appended to the ledger as a new block.
3. The database view `v_effective_marks` uses `DISTINCT ON` to display the latest mark as effective.
4. The complete chronological evaluation lineage (Initial: 76.50 &rarr; Correction: 81.50) remains cryptographically verifiable forever.
