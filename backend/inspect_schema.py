import sqlite3

def get_db_schema():
    conn = sqlite3.connect('apptech_lms.db')
    cursor = conn.cursor()
    
    tables = ['users', 'leave_requests', 'batches', 'attendance']
    for table in tables:
        print(f"\n--- Schema for table: {table} ---")
        cursor.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        for col in columns:
            print(col)
            
    conn.close()

if __name__ == "__main__":
    get_db_schema()
