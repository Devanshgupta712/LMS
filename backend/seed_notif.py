import sqlite3, uuid, datetime

conn = sqlite3.connect('apptech_lms.db')
c = conn.cursor()

c.execute("SELECT id FROM users WHERE email='ankit@student.com'")
user = c.fetchone()
if user:
    user_id = user[0]
    notif_id = str(uuid.uuid4())
    now = datetime.datetime.now().isoformat()
    
    try:
        c.execute("INSERT INTO notifications (id, user_id, title, message, read, type, reference_id, created_at) VALUES (?, ?, 'Welcome to Apptech LMS', 'This is your new notification dashboard!', 0, 'SYSTEM', 'test1', ?)", (notif_id, user_id, now))
        conn.commit()
        print("Notification seeded successfully.")
    except Exception as e:
        print("Error:", e)
else:
    print("User not found.")

conn.close()
