from sqlalchemy import create_engine, inspect

DATABASE_URL = "postgresql://lms_db_v29i_user:V98fL6qC1hY6FvjX6qf0@dpg-cv29ik0gph6c738e65vg-a.singapore-postgres.render.com/lms_db_v29i"
engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'})

def main():
    inspector = inspect(engine)
    for table_name in ['courses', 'batches', 'users', 'registrations', 'attendance', 'leave_requests']:
        print(f"\nTABLE: {table_name}")
        columns = inspector.get_columns(table_name)
        for column in columns:
            print(f"  - {column['name']}")

if __name__ == "__main__":
    main()
