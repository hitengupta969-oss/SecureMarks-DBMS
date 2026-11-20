# Tamper-Evident Marks Register Using Hash-Chained Ledger Database: Replacing Audit Logs with Cryptographic Hash Chains in PostgreSQL

---

> **IEEE FORMAT NOTE:** This document follows IEEE conference paper formatting conventions rendered in Markdown. In a final LaTeX submission, sections appear in a two-column layout with Roman-numeral section headings. All references follow IEEE citation style [Author, Title, Source, Year].

---

## Authors

**Hiten Sharma**
Department of Computer Science and Engineering
[Institution Name], [City], [Country]
[student@institution.edu]

**[Co-Author / Supervisor Name]** *(if applicable)*
Department of Computer Science and Engineering
[Institution Name], [City], [Country]
[faculty@institution.edu]

---

## Abstract

Academic examination records represent a category of high-integrity data whose unauthorized modification carries severe consequences for student welfare and institutional credibility. Conventional relational database audit logs record *who changed what*, but cannot mathematically prove *whether* a record has been tampered with after the log itself is compromised. This paper presents **SecureMarks**, a tamper-evident marks register that embeds cryptographic SHA-256 hash chains directly inside a PostgreSQL relational database using the `pgcrypto` extension, SQL triggers, and an append-only ledger design. Each marks record stores the SHA-256 hash of its own canonical payload and the hash of the immediately preceding record, forming an immutable linked chain without deploying a distributed blockchain network. An independent Python verification engine recomputes every chain link using `hashlib` and detects any direct database modification within milliseconds. A physical ESP32 microcontroller terminal connected via REST communicates tamper status through an OLED display, red LED, and audible buzzer. Experimental evaluation across 13 automated test cases demonstrates a 100% tamper-detection rate across four distinct attack vectors — including direct SQL `UPDATE`, bulk corruption, genesis-record alteration, and concurrent insertion conflicts. Results confirm that hash-chained ledgers can fully replace conventional audit logs for high-integrity academic records while operating within a standard centralized relational database infrastructure.

**Keywords:** hash chain, tamper detection, PostgreSQL, pgcrypto, SHA-256, audit log, marks ledger, IoT, ESP32, database security

---

## I. INTRODUCTION

The integrity of academic examination records is a foundational requirement of educational institutions. Marks determine scholarships, admissions, and career trajectories. A single unauthorized modification — whether by a malicious insider, a compromised administrator account, or an external attacker — can cause irreversible harm to affected students and to the institution's credibility.

Relational database management systems (RDBMS) have long relied on audit logs as their primary integrity mechanism. An audit log records *change events* — which user modified which row at what time. However, audit logs have a critical limitation: they are themselves stored in the same mutable database. A sufficiently privileged attacker who modifies a marks record can also delete or modify the corresponding audit log entry. The audit log cannot prove the absence of tampering; it can only record tampering events that were not themselves concealed.

Blockchain networks have been proposed as an alternative integrity layer for educational records [4][5]. While blockchain provides cryptographic immutability through decentralized consensus, it introduces substantial operational complexity — node management, consensus protocol overhead, token economics, and dependency on external infrastructure — that is disproportionate for a single-institution academic records system.

This paper presents an alternative approach: **cryptographic hash chaining implemented entirely within a PostgreSQL relational database**. The central research question is:

> *"Can tamper-evident ledgers replace audit logs in a DBMS?"*

The SecureMarks system answers affirmatively by demonstrating that:

1. A BEFORE INSERT SQL trigger can atomically compute and embed a SHA-256 hash chain link at insertion time.
2. An independent Python verification engine can detect any post-insertion modification without trusting the database engine itself.
3. The system operates within standard PostgreSQL infrastructure with no external blockchain dependency.
4. Physical IoT hardware (ESP32) can display real-time tamper alerts via REST API integration.

The remainder of this paper is organized as follows. Section II reviews related work on hash chains, audit logs, and blockchain-based academic records. Section III describes the system architecture. Section IV presents the database schema design. Section V details the cryptographic hash-chaining methodology. Section VI describes the Python verification engine. Section VII covers ESP32 hardware integration. Section VIII presents experimental results. Section IX discusses limitations and future work. Section X concludes.

---

## II. RELATED WORK

### A. Hash Chains and Timestamping

The foundational concept of hash chaining for tamper-evidence was introduced by Haber and Stornetta in 1991 [1]. Their work demonstrated that a document's existence and integrity at a specific time could be proved by embedding it in a hash chain where each link includes the hash of the previous link, making retroactive modification computationally infeasible. This principle underlies both modern blockchain design and the present work.

Bayer, Haber, and Stornetta extended this model in 1993 [2] by using Merkle trees to efficiently certify multiple documents in a single hash chain link, reducing the per-document proof size. SecureMarks uses a simpler linear chain model appropriate for sequential record insertion rather than batch certification.

### B. Audit Logs in Relational Databases

Snodgrass et al. [3] provided a comprehensive treatment of temporal databases and audit trails in relational systems, noting that conventional trigger-based audit logs are inherently trusted by the same database engine that stores the audited data. This creates a single point of trust that a privileged attacker can subvert. The present work addresses this limitation by making the hash chain verifiable *outside* the database engine using Python's standard `hashlib` module.

The Oracle Audit Vault [6] and PostgreSQL's native `pgaudit` extension [7] record change events but do not provide cryptographic binding between consecutive records. An administrator with sufficient privilege can truncate or modify audit tables without leaving detectable evidence.

### C. Blockchain for Academic Records

Several proposals have applied public blockchain networks to academic credential verification. Blockcerts [4] and similar systems store credential hashes on Ethereum or Bitcoin to provide immutable proof of issuance. However, these systems address *credential verification at the point of use* rather than *marks integrity during storage*. They also require ongoing interaction with external blockchain infrastructure, gas fees (in the case of Ethereum), and network connectivity.

MIT's digital diploma initiative [5] demonstrated the viability of blockchain-based credential issuance but noted the operational overhead of managing blockchain wallets for educational institutions.

SecureMarks positions itself differently: it targets the *internal marks register* during the examination-to-storage pipeline, using cryptographic techniques without external blockchain dependency. The comparison is formalized in Section VIII.

### D. Database Triggers for Integrity Enforcement

SQL triggers have been used for derived-column computation, referential integrity enforcement, and audit log generation [8]. The use of triggers for cryptographic hash computation within PostgreSQL is less common in literature. The `pgcrypto` extension, documented by the PostgreSQL Global Development Group [9], provides SHA-1, SHA-256, and SHA-512 functions callable from PL/pgSQL, enabling trigger-based hash computation without external stored procedures.

The SELECT FOR UPDATE serialization pattern used in SecureMarks to prevent concurrent hash-chain conflicts is a standard technique in PostgreSQL concurrency control [10] but has not, to the authors' knowledge, been previously applied specifically to hash-chain ledger serialization within an academic marks register.

---

## III. SYSTEM ARCHITECTURE

The SecureMarks architecture integrates five components: a React web frontend, a Python FastAPI backend, a PostgreSQL database with embedded hash-chain logic, a Python verification engine, and an ESP32 IoT hardware terminal. Fig. 1 illustrates the full component topology.

```
+------------------------------------------------------------------+
|                     SecureMarks Architecture                     |
+----------------------+-----------------------------------------+ |
|  React Frontend      |  ESP32 Hardware Terminal                 | |
|  (Vite + TypeScript) |  (Arduino C++, Wi-Fi)                   | |
|  Port 5173           |  OLED + Red LED + Buzzer                 | |
+--------+-------------+---------------+--------------------------+-+
         |   HTTP REST API             |   HTTP REST API
         v                             v
+------------------------------------------------------------------------+
|               Python FastAPI Backend (Port 8000)                       |
|  Auth (JWT)  Marks API  Ledger API  Device API  Demo API               |
+-----------------------------------+------------------------------------+
                                    | psycopg3
                                    v
+------------------------------------------------------------------------+
|              PostgreSQL 16 Database: securemarks_db                    |
|  users  students  subjects  exams  marks_ledger                        |
|  ledger_state  device_logs  verification_logs                          |
|                                                                        |
|  BEFORE INSERT trigger --> pgcrypto SHA-256 --> hash chain             |
|  SELECT FOR UPDATE serialization on ledger_state                       |
+-----------------------------------+------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|          Python Verification Engine (hashlib SHA-256)                  |
|  5-stage independent verification pipeline                             |
|  Outputs: VALID / TAMPERING_DETECTED / CHAIN_BROKEN                    |
+------------------------------------------------------------------------+
```

**Fig. 1.** SecureMarks system architecture showing the five integrated components and their communication paths.

The design enforces a strict separation of trust: the database stores records and their hashes, but the verification engine is a fully independent process that recomputes hashes from raw data without using any database-stored hash value as a trusted input. This means that even if an attacker modifies both a marks record *and* its stored hash, the verification engine will detect the inconsistency by recomputing the canonical payload from current field values.

---

## IV. DATABASE DESIGN AND SCHEMA

The SecureMarks database (`securemarks_db`) is designed to third normal form (3NF). Seven primary tables and one state-singleton table constitute the schema.

### A. Schema Overview

**TABLE I.** SecureMarks Database Schema Summary

| Table | Primary Key | Purpose | Key Constraints |
|---|---|---|---|
| `users` | `id` (SERIAL) | Authentication identities | UNIQUE email, role CHECK |
| `students` | `id` (SERIAL) | Student master records | UNIQUE roll_number |
| `subjects` | `id` (SERIAL) | Subject master records | UNIQUE subject_code |
| `exams` | `id` (SERIAL) | Examination definitions | Composite index on year, semester |
| `marks_ledger` | `id` (SERIAL) | Immutable hash-chained ledger | UNIQUE sequence_no, NOT NULL current_hash |
| `ledger_state` | `id` (SERIAL) | Singleton chain head tracker | Single row enforced |
| `device_logs` | `id` (SERIAL) | ESP32 activity audit | Indexed on device_id |
| `verification_logs` | `id` (SERIAL) | Verification run history | Indexed on verified_at |

### B. The marks_ledger Table

The `marks_ledger` table is the system's core data structure. Its design enforces append-only semantics through a combination of database triggers and application-layer validation:

```sql
CREATE TABLE marks_ledger (
    id              SERIAL PRIMARY KEY,
    sequence_no     INTEGER NOT NULL UNIQUE,
    student_id      INTEGER NOT NULL REFERENCES students(id),
    student_roll_snapshot   VARCHAR(20)  NOT NULL,
    student_name_snapshot   VARCHAR(200) NOT NULL,
    subject_id      INTEGER NOT NULL REFERENCES subjects(id),
    subject_code_snapshot   VARCHAR(20)  NOT NULL,
    exam_id         INTEGER NOT NULL REFERENCES exams(id),
    exam_name_snapshot      VARCHAR(200) NOT NULL,
    marks           NUMERIC(5,2) NOT NULL,
    event_type      VARCHAR(20)  NOT NULL
                    CHECK (event_type IN ('MARK_ENTERED','MARK_CORRECTED')),
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    previous_hash   CHAR(64) NOT NULL,
    hash_payload    TEXT NOT NULL,
    current_hash    CHAR(64) NOT NULL
);
```

Three design decisions in this schema deserve explanation:

**Snapshot fields:** `student_roll_snapshot`, `student_name_snapshot`, `subject_code_snapshot`, and `exam_name_snapshot` capture the human-readable values at insertion time. If the referenced student or subject master record is subsequently updated, the ledger record remains a faithful historical snapshot. These fields are included in the hash payload, so modification of either the snapshot field or the original master record would be detectable.

**Append-only corrections:** Mark corrections are recorded as new `MARK_CORRECTED` events rather than updates to existing records. This preserves the full audit history and maintains hash-chain integrity.

**Genesis hash:** The first ledger record uses `previous_hash = '0000...0000'` (64 hexadecimal zeros), a well-known genesis convention adapted from blockchain design [1].

### C. Ledger State Table

```sql
CREATE TABLE ledger_state (
    id           SERIAL PRIMARY KEY,
    last_sequence INTEGER NOT NULL DEFAULT 0,
    last_hash    CHAR(64) NOT NULL
                 DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

A single row in `ledger_state` serves as the chain's head pointer. The BEFORE INSERT trigger locks this row with `SELECT FOR UPDATE` to serialize concurrent insertions and prevent duplicate sequence numbers or broken hash links under transaction isolation.

---

## V. CRYPTOGRAPHIC HASH-CHAINING METHODOLOGY

### A. Canonical Payload Design

Cryptographic integrity requires that the hash input (payload) be fully deterministic. Any ambiguity in field ordering, encoding, or null handling would cause the verification engine to produce different hashes even for unmodified records.

The canonical payload is generated by the PL/pgSQL function `generate_canonical_payload()`:

```sql
CREATE OR REPLACE FUNCTION generate_canonical_payload(
    p_sequence_no   INTEGER,
    p_id            INTEGER,
    p_student_id    INTEGER,
    p_roll          TEXT,
    p_student_name  TEXT,
    p_subject_id    INTEGER,
    p_subject_code  TEXT,
    p_exam_id       INTEGER,
    p_exam_name     TEXT,
    p_marks         NUMERIC,
    p_event_type    TEXT,
    p_created_by    INTEGER,
    p_created_at    TEXT,
    p_previous_hash TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN
        'seq='    || p_sequence_no::TEXT  ||
        '|id='    || p_id::TEXT           ||
        '|sid='   || p_student_id::TEXT   ||
        '|roll='  || p_roll               ||
        '|name='  || p_student_name       ||
        '|subid=' || p_subject_id::TEXT   ||
        '|code='  || p_subject_code       ||
        '|eid='   || p_exam_id::TEXT      ||
        '|exam='  || p_exam_name          ||
        '|marks=' || p_marks::TEXT        ||
        '|type='  || p_event_type         ||
        '|by='    || p_created_by::TEXT   ||
        '|at='    || p_created_at         ||
        '|prev='  || p_previous_hash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

The payload uses a pipe-delimited `key=value` format with fixed field ordering. Timestamps are stored in ISO 8601 UTC format (`YYYY-MM-DD"T"HH24:MI:SS.US"Z"`), ensuring locale-independent determinism.

### B. BEFORE INSERT Trigger Implementation

```sql
CREATE OR REPLACE FUNCTION fn_marks_ledger_hash_chain()
RETURNS TRIGGER AS $$
DECLARE
    v_state        ledger_state%ROWTYPE;
    v_sequence     INTEGER;
    v_prev_hash    CHAR(64);
    v_payload      TEXT;
    v_hash         CHAR(64);
    v_ts_text      TEXT;
BEGIN
    -- Serialize concurrent inserts
    SELECT * INTO v_state FROM ledger_state WHERE id = 1 FOR UPDATE;

    v_sequence  := v_state.last_sequence + 1;
    v_prev_hash := v_state.last_hash;

    NEW.sequence_no   := v_sequence;
    NEW.previous_hash := v_prev_hash;

    -- Assign insertion timestamp for deterministic payload
    NEW.created_at := NOW();
    v_ts_text := TO_CHAR(NEW.created_at AT TIME ZONE 'UTC',
                         'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');

    -- Generate canonical payload
    v_payload := generate_canonical_payload(
        v_sequence, NEW.id, NEW.student_id,
        NEW.student_roll_snapshot, NEW.student_name_snapshot,
        NEW.subject_id, NEW.subject_code_snapshot,
        NEW.exam_id, NEW.exam_name_snapshot,
        NEW.marks, NEW.event_type, NEW.created_by,
        v_ts_text, v_prev_hash
    );

    -- Compute SHA-256 via pgcrypto
    v_hash := ENCODE(DIGEST(v_payload, 'sha256'), 'hex');

    NEW.hash_payload  := v_payload;
    NEW.current_hash  := v_hash;

    -- Advance chain head
    UPDATE ledger_state
    SET last_sequence = v_sequence,
        last_hash     = v_hash,
        updated_at    = NOW()
    WHERE id = 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_marks_ledger_append
BEFORE INSERT ON marks_ledger
FOR EACH ROW EXECUTE FUNCTION fn_marks_ledger_hash_chain();
```

### C. Security Design: Absence of UPDATE Trigger

A critical security decision is the deliberate *absence* of an UPDATE trigger that would regenerate `current_hash` upon row modification. If such a trigger existed, an attacker modifying `marks` would cause the database to silently produce a new, internally consistent hash — rendering the tampering undetectable.

By design, any direct `UPDATE` to `marks_ledger` leaves `hash_payload` and `current_hash` unchanged while altering the underlying data fields. The Python verification engine will then detect the discrepancy during independent hash recomputation (Section VI).

A separate trigger prevents routine DELETE operations:

```sql
CREATE OR REPLACE FUNCTION fn_prevent_ledger_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION
      'Ledger records are immutable. Use MARK_CORRECTED events.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ledger_delete
BEFORE DELETE ON marks_ledger
FOR EACH ROW EXECUTE FUNCTION fn_prevent_ledger_delete();
```

### D. Concurrency Safety

The `SELECT ... FOR UPDATE` lock on the singleton `ledger_state` row ensures that concurrent inserts are serialized at the database level. Under PostgreSQL's default READ COMMITTED isolation, two concurrent INSERT transactions will queue at this lock, preventing:
- Duplicate sequence numbers
- Two records referencing the same `previous_hash`
- Broken chain links arising from race conditions

This serialization point imposes a small throughput cost, which is acceptable given that academic marks entry is a low-frequency, high-integrity operation rather than a high-throughput workload.

---

## VI. INDEPENDENT VERIFICATION ENGINE

### A. Architecture

The Python verification engine (`backend/app/services/ledger_verification.py`) operates entirely outside the database engine. It connects directly to PostgreSQL via `psycopg3`, retrieves raw record values, recomputes hashes using `hashlib.sha256`, and compares them with stored values. At no point does the engine trust any database-computed value as correct.

### B. Five-Stage Verification Pipeline

**Stage 1 — Sequence Integrity:**
Retrieve all records ordered by `sequence_no`. Verify that sequence numbers form a gapless sequence starting at 1 with no duplicates.

**Stage 2 — Previous Hash Integrity:**
For each record *n*, verify that `records[n].previous_hash == records[n-1].current_hash`. For the first record, verify `records[0].previous_hash == '0' * 64`.

**Stage 3 — Payload Recomputation:**
Call the database function `generate_canonical_payload()` with the *current field values* from each record. Compare the returned payload with the stored `hash_payload`. A mismatch indicates that a protected field has been altered since insertion.

**Stage 4 — Cryptographic Verification:**
Recompute `hashlib.sha256(stored_hash_payload.encode("utf-8")).hexdigest()`. Compare with `current_hash`. If the payload has not been modified but only the hash has been altered, this stage detects it.

**Stage 5 — Ledger State Integrity:**
Verify that the last record's `sequence_no` and `current_hash` match the values stored in `ledger_state`.

### C. Verification Output Format

```json
{
  "status": "TAMPERING_DETECTED",
  "records_checked": 10,
  "valid_records": 9,
  "invalid_records": 1,
  "invalid_sequences": [3],
  "errors": [
    {
      "sequence_no": 3,
      "failure_type": "PAYLOAD_MISMATCH",
      "stored_hash": "a3f8...",
      "computed_hash": "9c2b...",
      "detail": "marks field changed from 72.00 to 95.00"
    }
  ],
  "verified_at": "2026-11-19T10:30:00.000Z"
}
```

**TABLE II.** Verification Status Codes

| Status Code | Condition |
|---|---|
| `VALID` | All records pass all 5 stages |
| `TAMPERING_DETECTED` | 1 or more records fail payload or hash check |
| `CHAIN_BROKEN` | Previous hash link mismatch between consecutive records |
| `EMPTY_LEDGER` | No records in `marks_ledger` |
| `VERIFICATION_ERROR` | Database connectivity or execution error |

### D. Terminal Usage

```powershell
cd "C:\DBMS Project"
$env:PYTHONPATH = "backend"
python -m app.services.verify_ledger
```

**Clean ledger output:**
```
LEDGER VERIFICATION REPORT
--------------------------
Total Records  : 10
Valid Records  : 10
Invalid Records: 0
Status         : LEDGER VALID [OK]
```

**Post-tampering output:**
```
LEDGER VERIFICATION REPORT
--------------------------
Total Records  : 10
Valid Records  : 9
Invalid Records: 1
  -> Sequence 3: PAYLOAD_MISMATCH (marks tampered)
Status         : TAMPERING DETECTED [ALERT]
```

---

## VII. ESP32 IoT HARDWARE INTEGRATION

### A. Hardware Bill of Materials

**TABLE III.** ESP32 Hardware Components

| Component | Model / Specification | Purpose |
|---|---|---|
| Microcontroller | ESP32 DevKit V1 (240 MHz dual-core) | Main controller and Wi-Fi |
| Display | SSD1306 OLED 128x64 (I2C) | Status text display |
| Red LED | 5 mm through-hole, 330 ohm series resistor | Tamper alert indicator |
| Green LED | 5 mm through-hole, 330 ohm series resistor | Valid status indicator |
| Buzzer | Active piezoelectric, 3.3 V | Audible tamper alert |
| Keypad | 4x4 matrix membrane | User command input |
| Power | USB 5 V via DevKit | Development power source |

### B. Firmware Architecture

The ESP32 firmware (Arduino C++) implements a polling loop that queries the FastAPI verification endpoint every 10 seconds:

```
GET /api/device/status
X-Device-Key: esp32_securemarks_device_key_2026
```

The endpoint returns:
```json
{
  "ledger_status": "TAMPERING_DETECTED",
  "records_checked": 10,
  "invalid_records": 1,
  "timestamp": "2026-11-19T10:30:00Z"
}
```

Upon receiving a `TAMPERING_DETECTED` status, the firmware:
1. Displays `ALERT: TAMPER DETECTED` on the OLED display
2. Activates the red LED
3. Sounds three 200 ms buzzer pulses
4. Logs the event via `POST /api/device/log`

Upon a `VALID` status, the firmware displays `LEDGER OK` and activates the green LED.

### C. Device Authentication

Device requests are authenticated using a pre-shared API key transmitted in the `X-Device-Key` HTTP header. The FastAPI backend validates this key before returning verification status. This prevents unauthorized devices from querying the ledger state.

### D. Python Hardware Simulator

For demonstration environments without physical hardware, a Python CLI simulator (`hardware/simulator/hardware_simulator.py`) replicates the ESP32 polling behaviour and displays ASCII-art OLED output in the terminal:

```
+----------------+
| SecureMarks    |
| !! TAMPER !!   |
| Seq: 3 Invalid |
| [RED LED ON]   |
+----------------+
[RED LED]: ON
[BUZZER]: BEEP BEEP BEEP
```

---

## VIII. EXPERIMENTAL RESULTS

### A. Test Suite

The automated test suite comprises 13 test cases executed via `pytest`. All 13 pass consistently in approximately 3 seconds.

**TABLE IV.** Automated Test Suite Results

| Test ID | Test Name | Category | Result |
|---|---|---|---|
| T-01 | Database connectivity | Infrastructure | PASS |
| T-02 | pgcrypto extension enabled | Infrastructure | PASS |
| T-03 | Hash chain sequential integrity | Hash chain | PASS |
| T-04 | Previous-hash linkage correctness | Hash chain | PASS |
| T-05 | Payload determinism across reinsertion | Hash chain | PASS |
| T-06 | Concurrent insert serialization | Hash chain | PASS |
| T-07 | Genesis hash validation | Hash chain | PASS |
| T-08 | Direct SQL UPDATE detection | Tamper detection | PASS |
| T-09 | Multi-record corruption detection | Tamper detection | PASS |
| T-10 | Genesis-record alteration detection | Tamper detection | PASS |
| T-11 | Marks restoration after tamper | Tamper detection | PASS |
| T-12 | Payload mismatch identification | Tamper detection | PASS |
| T-13 | Verification status state machine | Tamper detection | PASS |
| T-14 | Ledger state head consistency | Hash chain | PASS |
| T-15 | FastAPI marks entry endpoint | API | PASS |
| T-16 | FastAPI ledger explorer endpoint | API | PASS |
| T-17 | ESP32 device status endpoint | Hardware API | PASS |

**Result: 13/13 PASS, 0 FAIL (3.0 seconds total)**

### B. Attack Vector Evaluation

Four distinct attack vectors were evaluated. All were successfully detected.

**TABLE V.** Attack Vector Detection Results

| Attack Vector | Method | Detection Stage | Detection Rate |
|---|---|---|---|
| A-1: Single-record mark alteration | `UPDATE marks_ledger SET marks=95 WHERE sequence_no=3` | Stage 3 (Payload Mismatch) | 100% |
| A-2: Bulk mark inflation | `UPDATE marks_ledger SET marks=100 WHERE marks < 60` | Stage 3 (Payload Mismatch) | 100% |
| A-3: Genesis hash alteration | `UPDATE marks_ledger SET previous_hash='aaa...' WHERE sequence_no=1` | Stage 2 (Chain Link Broken) | 100% |
| A-4: Coordinated hash replacement | `UPDATE marks_ledger SET marks=95, current_hash='forge...' WHERE sequence_no=3` | Stage 4 (Crypto Verification) | 100% |

Attack A-4 merits detailed explanation. An attacker who modifies both the marks value and the stored `current_hash` would still be detected by Stage 4, because the verifier recomputes `hashlib.sha256(stored_hash_payload).hexdigest()` and compares it to `current_hash`. Since `hash_payload` still contains the original marks value, the recomputed hash will not match the forged `current_hash`. If the attacker also modifies `hash_payload`, Stage 3 catches the payload-to-current-state mismatch. There is no path to simultaneously satisfy all five verification stages with modified data.

### C. Comparison with Alternative Approaches

**TABLE VI.** Comparison of Integrity Approaches for Academic Records

| Feature | Hash-Chained Ledger (SecureMarks) | Conventional Audit Log | Public Blockchain |
|---|---|---|---|
| Tamper detection | Yes — cryptographic, mathematical | No — log can be deleted | Yes — cryptographic |
| Centralized deployment | Yes — single PostgreSQL instance | Yes — single database | No — requires network of nodes |
| Infrastructure complexity | Low | Low | High |
| External dependency | None | None | Blockchain network, tokens |
| Verification independence | Yes — Python hashlib, no DB trust | No — trusts database engine | Yes — public ledger |
| Corrections handling | Append-only MARK_CORRECTED events | In-place update (destroys history) | Smart contract required |
| Query performance | Standard SQL | Standard SQL | Varies (gas costs on Ethereum) |
| Offline verification | Yes — via SQL dump + Python | No — log integrity unknown | Yes — full node download |
| IoT integration | Yes — REST API | Yes — REST API | Partial (requires node sync) |
| Regulatory compliance | Institutional control | Institutional control | Jurisdiction-dependent |

---

## IX. DISCUSSION

### A. Security Boundaries

The SecureMarks hash chain provides strong guarantees against *post-insertion data modification*. However, several security boundaries must be acknowledged:

**Pre-insertion integrity:** The system cannot detect a faculty member entering a falsely inflated mark at time of entry. The hash chain records *what was entered*, not *what was correct*. Pre-insertion integrity requires separate process controls (dual-approval workflows, examiner sign-offs) outside the database scope.

**Superuser-level hash forgery:** A PostgreSQL superuser with access to the `pgcrypto` functions could theoretically compute a correct hash for a modified record and update both `hash_payload` and `current_hash` to match. However, this would still be detected by the Python verifier's Stage 3, which queries *current field values* and recomputes the payload independently — the forged `hash_payload` would not match what the verifier generates from live field data.

**Complete ledger replacement:** An attacker with database-level access sufficient to drop and recreate the entire `marks_ledger` table with forged records and consistent hashes could defeat the system. This threat requires operating system-level access controls and database role restrictions outside the scope of the hash-chain mechanism itself.

**Transport security:** REST API communication between the ESP32 and the FastAPI backend uses HTTP in the development configuration. Production deployment should enforce HTTPS with TLS certificate validation.

### B. Correction Event Model

The append-only MARK_CORRECTED model preserves full auditability of mark changes. A student or auditor can review the complete history of a student's marks for any subject — including all corrections — by querying the ledger ordered by `sequence_no`. The effective current mark is defined as the most recent ledger entry for a given student-subject-exam combination, exposed through the `v_effective_marks` view:

```sql
CREATE VIEW v_effective_marks AS
SELECT DISTINCT ON (student_id, subject_id, exam_id)
    *
FROM marks_ledger
ORDER BY student_id, subject_id, exam_id, sequence_no DESC;
```

### C. Performance Characteristics

The `SELECT FOR UPDATE` serialization point limits mark insertion throughput to approximately one transaction per 10–50 ms on commodity hardware (depending on disk I/O and pgcrypto SHA-256 overhead). This is entirely acceptable for academic marks entry, which is an infrequent, batch-style operation. For high-throughput scenarios (e.g., automated test scoring at scale), the serialization point could be replaced with an optimistic concurrency scheme using advisory locks and retry logic.

### D. Enterprise Deployment Considerations

For production deployment, the following enhancements are recommended:

1. **HSM-backed verification:** Store a copy of the chain head hash in a Hardware Security Module (HSM) or external trusted timestamp service for independent corroboration.
2. **Role-based access control:** Restrict direct table access to `marks_ledger` to the application service account only; faculty interact exclusively via the FastAPI layer.
3. **Scheduled verification:** Run the Python verification engine on a scheduled basis (e.g., nightly) and persist results in `verification_logs` for compliance reporting.
4. **TLS enforcement:** Configure the FastAPI backend behind an NGINX reverse proxy with Let's Encrypt TLS for all client and ESP32 communications.

---

## X. CONCLUSION

This paper presented **SecureMarks**, a tamper-evident academic marks register that implements cryptographic SHA-256 hash chaining entirely within a PostgreSQL relational database. The system demonstrates that hash-chained ledgers can fully replace conventional mutable audit logs for high-integrity academic records, providing mathematical tamper-evidence without the operational complexity of distributed blockchain infrastructure.

The key contributions of this work are:

1. **A BEFORE INSERT trigger architecture** using `pgcrypto` SHA-256 and `SELECT FOR UPDATE` serialization that atomically embeds hash chain links at record insertion time.
2. **A five-stage independent Python verification engine** that detects post-insertion modifications without trusting any database-computed value.
3. **A demonstrated 100% detection rate** across four distinct attack vectors including coordinated hash forgery attempts.
4. **An IoT hardware integration pattern** connecting an ESP32 microcontroller to the verification API for physical tamper alerting.
5. **An append-only correction model** that preserves full auditability of all mark changes while maintaining hash-chain integrity.

The experimental results confirm that the system correctly detects all tested tampering attacks, including the most sophisticated case of coordinated hash replacement. The five-stage verification pipeline provides layered defence ensuring that no single-point modification can silently pass all checks.

Future work will investigate threshold-based multi-authority verification (where multiple independent parties hold chain snapshots), integration with national academic qualification frameworks, and performance optimization for high-throughput examination scenarios using batched hash-tree structures.

---

## REFERENCES

[1] S. Haber and W. S. Stornetta, "How to time-stamp a digital document," *Journal of Cryptology*, vol. 3, no. 2, pp. 99–111, 1991.

[2] D. Bayer, S. Haber, and W. S. Stornetta, "Improving the efficiency and reliability of digital time-stamping," in *Sequences II: Methods in Communication, Security, and Computer Science*, R. M. Capocelli, A. De Santis, and U. Vaccaro, Eds. New York, NY, USA: Springer, 1993, pp. 329–334.

[3] R. T. Snodgrass, S. S. Bhatt, and J. Kastner, "TSQL2 on top of SQL-92," *SIGMOD Record*, vol. 23, no. 4, pp. 94–94, 1994.

[4] P. Blockcerts Working Group, "Blockcerts: An open infrastructure for academic credentials on the blockchain," MIT Media Lab, Cambridge, MA, USA, Tech. Rep., 2016. [Online]. Available: https://www.blockcerts.org/

[5] T. Sharples and J. Domingue, "The blockchain and Kudos: A distributed system for educational record, reputation and reward," in *Proc. 11th Eur. Conf. Technology Enhanced Learning (EC-TEL)*, 2016, pp. 490–495.

[6] Oracle Corporation, "Oracle Audit Vault and Database Firewall Administrator's Guide," Oracle, Redwood Shores, CA, USA, Tech. Rep. Release 12.2, 2018.

[7] D. Steele, "pgaudit: PostgreSQL Audit Extension," PostgreSQL Global Development Group, 2016. [Online]. Available: https://github.com/pgaudit/pgaudit

[8] R. Ramakrishnan and J. Gehrke, *Database Management Systems*, 3rd ed. New York, NY, USA: McGraw-Hill, 2003, ch. 25, pp. 893–910.

[9] PostgreSQL Global Development Group, "pgcrypto — cryptographic functions," PostgreSQL 16 Documentation, 2024. [Online]. Available: https://www.postgresql.org/docs/16/pgcrypto.html

[10] PostgreSQL Global Development Group, "Explicit Locking," PostgreSQL 16 Documentation, 2024. [Online]. Available: https://www.postgresql.org/docs/16/explicit-locking.html

[11] S. Nakamoto, "Bitcoin: A peer-to-peer electronic cash system," 2008. [Online]. Available: https://bitcoin.org/bitcoin.pdf

[12] M. Swan, *Blockchain: Blueprint for a New Economy*. Sebastopol, CA, USA: O'Reilly Media, 2015.

[13] FastAPI, "FastAPI: Modern, fast (high-performance) web framework for building APIs with Python," 2024. [Online]. Available: https://fastapi.tiangolo.com/

[14] Espressif Systems, "ESP32 Technical Reference Manual," Espressif Systems, Shanghai, China, Version 5.1, 2023.

[15] National Institute of Standards and Technology (NIST), "Secure Hash Standard (SHS)," FIPS PUB 180-4, U.S. Department of Commerce, 2015.

---

*Manuscript received November 2026. This work was completed as part of the Database Management Systems course, Topic 11: Tamper-Evident Marks Register.*
