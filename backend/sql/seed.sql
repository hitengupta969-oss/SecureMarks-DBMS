-- ==============================================================================
-- SecureMarks Seed Data
-- ==============================================================================

-- 1. Insert System Users (Admin, Faculty, Students)
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES 
    (1, 'Dr. Alan Turing', 'admin@securemarks.edu', 'pbkdf2:sha256:100000$securemarks_salt_2026$f73c6457263ba886faae74ee675385a2c0a107c3819c38290bcb11123bee310d', 'admin', TRUE),
    (2, 'Prof. Priya Sharma', 'faculty.sharma@securemarks.edu', 'pbkdf2:sha256:100000$securemarks_salt_2026$ffe4285ab7e141490f6765923541d5fcf343096c19e5074d80ebb287447b8ffe', 'faculty', TRUE),
    (3, 'Prof. Rajesh Verma', 'faculty.verma@securemarks.edu', 'pbkdf2:sha256:100000$securemarks_salt_2026$ffe4285ab7e141490f6765923541d5fcf343096c19e5074d80ebb287447b8ffe', 'faculty', TRUE),
    (4, 'Aarav Patel', 'aarav.patel@student.securemarks.edu', 'pbkdf2:sha256:100000$securemarks_salt_2026$c53bcd344beb4ca52a50342a62f43da8d198c664d3b40c86aaea29ea6467d9c2', 'student', TRUE),
    (5, 'Diya Nair', 'diya.nair@student.securemarks.edu', 'pbkdf2:sha256:100000$securemarks_salt_2026$c53bcd344beb4ca52a50342a62f43da8d198c664d3b40c86aaea29ea6467d9c2', 'student', TRUE)
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 2. Insert Students
INSERT INTO students (id, roll_number, name, email, department, semester)
VALUES
    (1, 'CS2023001', 'Aarav Patel', 'aarav.patel@student.securemarks.edu', 'Computer Science & Engineering', 6),
    (2, 'CS2023002', 'Diya Nair', 'diya.nair@student.securemarks.edu', 'Computer Science & Engineering', 6),
    (3, 'CS2023003', 'Rohan Deshmukh', 'rohan.d@student.securemarks.edu', 'Computer Science & Engineering', 6),
    (4, 'CS2023004', 'Ananya Iyer', 'ananya.i@student.securemarks.edu', 'Computer Science & Engineering', 6),
    (5, 'CS2023005', 'Vikram Malhotra', 'vikram.m@student.securemarks.edu', 'Computer Science & Engineering', 6),
    (6, 'CS2023006', 'Sneha Kulkarni', 'sneha.k@student.securemarks.edu', 'Computer Science & Engineering', 6),
    (7, 'IT2023001', 'Kabir Mehta', 'kabir.m@student.securemarks.edu', 'Information Technology', 6),
    (8, 'IT2023002', 'Riya Sen', 'riya.s@student.securemarks.edu', 'Information Technology', 6),
    (9, 'IT2023003', 'Aditya Joshi', 'aditya.j@student.securemarks.edu', 'Information Technology', 6),
    (10, 'IT2023004', 'Meera Reddy', 'meera.r@student.securemarks.edu', 'Information Technology', 6),
    (11, 'CS2024001', 'Siddharth Rao', 'siddharth.r@student.securemarks.edu', 'Computer Science & Engineering', 4),
    (12, 'CS2024002', 'Pooja Hegde', 'pooja.h@student.securemarks.edu', 'Computer Science & Engineering', 4)
ON CONFLICT (roll_number) DO UPDATE
SET name = EXCLUDED.name,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    semester = EXCLUDED.semester;

SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));

-- 3. Insert Subjects
INSERT INTO subjects (id, subject_code, subject_name, semester, credits)
VALUES
    (1, 'CS601', 'Database Management Systems', 6, 4),
    (2, 'CS602', 'Cryptography & Network Security', 6, 4),
    (3, 'CS603', 'Operating Systems & Distributed Systems', 6, 4),
    (4, 'IT601', 'Cloud Computing Architectures', 6, 3),
    (5, 'IT602', 'Web Technologies & Microservices', 6, 3),
    (6, 'CS401', 'Data Structures & Algorithms', 4, 4)
ON CONFLICT (subject_code) DO UPDATE
SET subject_name = EXCLUDED.subject_name,
    semester = EXCLUDED.semester,
    credits = EXCLUDED.credits;

SELECT setval('subjects_id_seq', (SELECT MAX(id) FROM subjects));

-- 4. Insert Examinations
INSERT INTO exams (id, exam_name, academic_year, semester, exam_date)
VALUES
    (1, 'Mid-Term Examination 2025-26', '2025-26', 6, '2026-02-15'),
    (2, 'End-Semester Examination 2025-26', '2025-26', 6, '2026-05-10')
ON CONFLICT (id) DO UPDATE
SET exam_name = EXCLUDED.exam_name,
    academic_year = EXCLUDED.academic_year,
    semester = EXCLUDED.semester,
    exam_date = EXCLUDED.exam_date;

SELECT setval('exams_id_seq', (SELECT MAX(id) FROM exams));

-- 5. Insert Initial Marks Records into marks_ledger (Only if ledger is currently empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM marks_ledger) THEN
        -- Sequence 1: Aarav Patel - DBMS Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (1, 1, 1, 88.50, 'MARK_ENTERED', 2);

        -- Sequence 2: Diya Nair - DBMS Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (2, 1, 1, 94.00, 'MARK_ENTERED', 2);

        -- Sequence 3: Rohan Deshmukh - DBMS Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (3, 1, 1, 76.50, 'MARK_ENTERED', 2);

        -- Sequence 4: Ananya Iyer - Cryptography Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (4, 2, 1, 91.00, 'MARK_ENTERED', 2);

        -- Sequence 5: Vikram Malhotra - Cryptography Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (5, 2, 1, 82.00, 'MARK_ENTERED', 2);

        -- Sequence 6: Sneha Kulkarni - Cryptography Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (6, 2, 1, 89.50, 'MARK_ENTERED', 2);

        -- Sequence 7: Kabir Mehta - Cloud Computing Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (7, 4, 1, 85.00, 'MARK_ENTERED', 3);

        -- Sequence 8: Riya Sen - Cloud Computing Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (8, 4, 1, 93.50, 'MARK_ENTERED', 3);

        -- Sequence 9: Aditya Joshi - Web Technologies Mid-Term
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (9, 5, 1, 79.00, 'MARK_ENTERED', 3);

        -- Sequence 10: Authorized Mark Correction event: Rohan Deshmukh re-evaluation
        INSERT INTO marks_ledger (student_id, subject_id, exam_id, marks, event_type, created_by)
        VALUES (3, 1, 1, 81.50, 'MARK_CORRECTED', 2);

        -- Log sample device operation
        INSERT INTO device_logs (device_id, action, status, message)
        VALUES 
            ('ESP32_TERM_01', 'BOOT', 'ONLINE', 'SecureMarks terminal booted successfully.'),
            ('ESP32_TERM_01', 'VERIFY', 'VALID', 'Ledger verified: 10 records valid.');

        -- Log initial verification result
        INSERT INTO verification_logs (verification_status, records_checked, invalid_records, error_details)
        VALUES ('VALID', 10, 0, '{"message": "Genesis chain verified successfully", "errors": []}'::jsonb);
    END IF;
END;
$$;
