import psycopg
from psycopg.rows import dict_row
from contextlib import contextmanager
from typing import Generator, Any, Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

def get_connection_params() -> dict:
    return {
        "host": settings.POSTGRES_SERVER,
        "port": settings.POSTGRES_PORT,
        "user": settings.POSTGRES_USER,
        "password": settings.POSTGRES_PASSWORD,
        "dbname": settings.POSTGRES_DB,
    }

@contextmanager
def get_db_connection() -> Generator[psycopg.Connection, None, None]:
    """Provide a transactional database connection with dictionary rows."""
    conn = psycopg.connect(**get_connection_params(), row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Database transaction rolled back due to error: {e}")
        raise
    finally:
        conn.close()

def execute_query(
    query: str,
    params: Optional[tuple | dict] = None,
    fetch: str = "all"
) -> Any:
    """Execute SQL query safely and return results."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params or ())
            if fetch == "all":
                return cur.fetchall()
            elif fetch == "one":
                return cur.fetchone()
            elif fetch == "val":
                row = cur.fetchone()
                return list(row.values())[0] if row else None
            return None

def check_db_health() -> bool:
    """Verify that PostgreSQL is reachable and pgcrypto is enabled."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS alive;")
                res = cur.fetchone()
                if not res or res["alive"] != 1:
                    return False
                cur.execute("SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';")
                ext = cur.fetchone()
                return bool(ext)
    except Exception as ex:
        logger.warning(f"Database health check failed: {ex}")
        return False
