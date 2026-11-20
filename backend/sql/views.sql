-- ==============================================================================
-- SecureMarks Database Views
-- ==============================================================================

-- View: v_effective_marks
-- Returns the latest effective mark for each (student, subject, exam) combination
-- based on the highest sequence_no (incorporating MARK_ENTERED and MARK_CORRECTED events)
CREATE OR REPLACE VIEW v_effective_marks AS
SELECT DISTINCT ON (l.student_id, l.subject_id, l.exam_id)
    l.id AS ledger_id,
    l.sequence_no,
    l.student_id,
    l.student_roll_snapshot AS roll_number,
    l.student_name_snapshot AS student_name,
    s.department,
    s.semester AS student_semester,
    l.subject_id,
    l.subject_code_snapshot AS subject_code,
    sub.subject_name,
    sub.credits,
    l.exam_id,
    l.exam_name_snapshot AS exam_name,
    e.academic_year,
    l.marks,
    l.event_type,
    l.created_by,
    u.name AS faculty_name,
    l.created_at AS last_updated,
    l.current_hash
FROM marks_ledger l
JOIN students s ON l.student_id = s.id
JOIN subjects sub ON l.subject_id = sub.id
JOIN exams e ON l.exam_id = e.id
JOIN users u ON l.created_by = u.id
ORDER BY l.student_id, l.subject_id, l.exam_id, l.sequence_no DESC;

-- View: v_student_academic_summary
-- Summarizes overall academic performance per student across latest effective marks
CREATE OR REPLACE VIEW v_student_academic_summary AS
SELECT 
    student_id,
    roll_number,
    student_name,
    department,
    student_semester,
    COUNT(ledger_id) AS total_subjects_evaluated,
    ROUND(AVG(marks), 2) AS average_marks,
    MAX(marks) AS highest_marks,
    MIN(marks) AS lowest_marks,
    MAX(last_updated) AS latest_record_time
FROM v_effective_marks
GROUP BY student_id, roll_number, student_name, department, student_semester;
