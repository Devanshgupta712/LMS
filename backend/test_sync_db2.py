from sqlalchemy import create_engine, text
import traceback

DATABASE_URL = "postgresql://lms_db_v29i_user:V98fL6qC1hY6FvjX6qf0@dpg-cv29ik0gph6c738e65vg-a.singapore-postgres.render.com/lms_db_v29i"
engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'})
try:
    with engine.connect() as conn:
        with open("schema_sync.txt", "w") as f:
            for table in ['users', 'leave_requests', 'attendance', 'batches', 'courses', 'registrations']:
                res = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
                cols = [r[0] for r in res]
                f.write(f"{table}: {cols}\n")
    print("DONE writing schema_sync.txt")
except Exception as e:
    with open("sync_error.txt", "w") as f:
        f.write(traceback.format_exc())
