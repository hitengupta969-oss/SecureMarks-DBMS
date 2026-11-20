from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import check_db_health, execute_query
from app.api import auth, students, subjects, exams, marks, ledger, device, demo
from app.api.auth import get_current_user

app = FastAPI(
    title=f"{settings.PROJECT_NAME} - API",
    description="Tamper-Evident Marks Register Using Hash-Chained Ledger Database",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(students.router, prefix=settings.API_V1_STR)
app.include_router(subjects.router, prefix=settings.API_V1_STR)
app.include_router(exams.router, prefix=settings.API_V1_STR)
app.include_router(marks.router, prefix=settings.API_V1_STR)
app.include_router(ledger.router, prefix=settings.API_V1_STR)
app.include_router(device.router, prefix=settings.API_V1_STR)
app.include_router(demo.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    db_alive = check_db_health()
    return {
        "status": "healthy" if db_alive else "degraded",
        "database_connected": db_alive,
        "pgcrypto_enabled": db_alive,
        "demo_mode": settings.DEMO_MODE
    }

@app.get("/api/dashboard/stats")
def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Aggregate statistics directly from database for the dashboard."""
    total_students = execute_query("SELECT COUNT(*) FROM students;", fetch="val") or 0
    total_subjects = execute_query("SELECT COUNT(*) FROM subjects;", fetch="val") or 0
    total_exams = execute_query("SELECT COUNT(*) FROM exams;", fetch="val") or 0
    total_ledger_records = execute_query("SELECT COUNT(*) FROM marks_ledger;", fetch="val") or 0

    latest_verif = execute_query(
        "SELECT verification_status, invalid_records, verified_at FROM verification_logs ORDER BY verified_at DESC LIMIT 1;",
        fetch="one"
    )

    recent_ledger = execute_query(
        """
        SELECT 
            sequence_no, 
            student_roll_snapshot, 
            student_name_snapshot, 
            subject_code_snapshot, 
            marks, 
            event_type, 
            current_hash, 
            created_at 
        FROM marks_ledger 
        ORDER BY sequence_no DESC 
        LIMIT 5;
        """,
        fetch="all"
    )

    marks_distribution = execute_query(
        """
        SELECT 
            CASE 
                WHEN marks >= 90 THEN '90-100 (A+)'
                WHEN marks >= 80 THEN '80-89 (A)'
                WHEN marks >= 70 THEN '70-79 (B)'
                WHEN marks >= 60 THEN '60-69 (C)'
                ELSE 'Below 60 (D/F)'
            END AS grade_range,
            COUNT(*) AS count
        FROM marks_ledger
        GROUP BY grade_range
        ORDER BY grade_range ASC;
        """,
        fetch="all"
    )

    return {
        "total_students": total_students,
        "total_subjects": total_subjects,
        "total_exams": total_exams,
        "total_ledger_records": total_ledger_records,
        "latest_verification_status": latest_verif["verification_status"] if latest_verif else "NOT_VERIFIED",
        "detected_violations": latest_verif["invalid_records"] if latest_verif else 0,
        "last_verified_at": latest_verif["verified_at"] if latest_verif else None,
        "recent_ledger_entries": recent_ledger,
        "marks_distribution": marks_distribution
    }
