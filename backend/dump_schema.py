import sqlite3

def dump_schema():
    conn = sqlite3.connect('apptech_lms.db')
    cursor = conn.cursor()
    
    with open('schema_dump.txt', 'w') as f:
        tables = ['users', 'leave_requests', 'batches', 'attendance', 'courses']
        for table in tables:
            f.write(f"\n--- Schema for table: {table} ---\n")
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            for col in columns:
                f.write(str(col) + "\n")
            
    conn.close()

if __name__ == "__main__":
    dump_schema()
