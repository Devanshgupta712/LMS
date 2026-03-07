import sqlite3

try:
    conn = sqlite3.connect('apptech_lms.db')
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE leave_requests ADD COLUMN leave_type VARCHAR(9) DEFAULT 'OTHER' NOT NULL;")
    cursor.execute("ALTER TABLE leave_requests ADD COLUMN proof_url VARCHAR(255);")
    conn.commit()
    print("Migration successful")
except Exception as e:
    print(f"Error: {e}")
finally:
    if conn:
        conn.close()
