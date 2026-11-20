import pytest
from app.core.database import get_db_connection, check_db_health

def test_1_database_connection():
    """Requirement 1: Database connection is healthy and responsive."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS alive;")
            row = cur.fetchone()
            assert row is not None
            assert row["alive"] == 1

def test_2_pgcrypto_availability():
    """Requirement 2: pgcrypto extension is installed and available."""
    assert check_db_health() is True
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';")
            ext = cur.fetchone()
            assert ext is not None
            assert ext["extname"] == "pgcrypto"
            
            # Verify pgcrypto digest function works directly
            cur.execute("SELECT encode(digest('SecureMarks2026', 'sha256'), 'hex') AS hash;")
            res = cur.fetchone()
            assert res is not None
            assert len(res["hash"]) == 64
