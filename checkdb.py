import sqlite3

conn = sqlite3.connect('backend/apptech_lms.db')
c = conn.cursor()
c.execute("SELECT email, role FROM users")
roles = c.fetchall()

print("User Roles in Database:")
for email, role in roles:
    print(f"{email}: {role}")
