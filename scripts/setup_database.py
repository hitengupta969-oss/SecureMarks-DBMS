import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import psycopg
from app.core.config import settings

def run_sql_file(conn, filepath: str, filename: str):
    print(f"-> Executing {filename}...")
    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
    print(f"   [OK] {filename} executed successfully.")

def main():
    print("==================================================")
    print("      SECUREMARKS DATABASE INITIALIZATION         ")
    print("==================================================")
    print(f"Connecting to PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}...")

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "sql"))
    scripts = [
        ("schema.sql", os.path.join(base_dir, "schema.sql")),
        ("functions.sql", os.path.join(base_dir, "functions.sql")),
        ("triggers.sql", os.path.join(base_dir, "triggers.sql")),
        ("views.sql", os.path.join(base_dir, "views.sql")),
        ("seed.sql", os.path.join(base_dir, "seed.sql")),
    ]

    try:
        conn = psycopg.connect(
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            dbname=settings.POSTGRES_DB,
            autocommit=False
        )
        for fname, fpath in scripts:
            run_sql_file(conn, fpath, fname)

        # Quick validation
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM users;")
            users_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM students;")
            students_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM marks_ledger;")
            ledger_count = cur.fetchone()[0]
            cur.execute("SELECT last_sequence, last_hash FROM ledger_state WHERE id = 1;")
            state = cur.fetchone()

        conn.close()

        print("\nDATABASE SETUP SUMMARY:")
        print(f"- Total Users:    {users_count}")
        print(f"- Total Students: {students_count}")
        print(f"- Ledger Records: {ledger_count}")
        print(f"- Head Sequence:  {state[0]}")
        print(f"- Head Hash:      {state[1]}")
        print("Database setup completed successfully!")

    except Exception as ex:
        print(f"ERROR initializing database: {ex}")
        sys.exit(1)

if __name__ == "__main__":
    main()
