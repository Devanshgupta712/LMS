import sqlite3

conn = sqlite3.connect('apptech_lms.db')
c = conn.cursor()

users_cols = [r[1] for r in c.execute('PRAGMA table_info(users)').fetchall()]
leave_cols = [r[1] for r in c.execute('PRAGMA table_info(leave_requests)').fetchall()]

print('--- USERS COLUMNS ---')
for col in users_cols:
    print(col)

print('--- LEAVE REQUESTS COLUMNS ---')
for col in leave_cols:
    print(col)

conn.close()
