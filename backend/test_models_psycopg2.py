import traceback
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.models.course import Batch, Course, BatchStudent
from app.models.registration import Registration
from app.models.attendance import LeaveRequest
from app.models.lead import Lead
from app.models.project import Project

DATABASE_URL = "postgresql://lms_db_v29i_user:V98fL6qC1hY6FvjX6qf0@dpg-cv29ik0gph6c738e65vg-a.singapore-postgres.render.com/lms_db_v29i"
engine = create_engine(DATABASE_URL, connect_args={'sslmode': 'require'})

def main():
    with Session(engine) as session:
        try:
            print("Querying Courses...")
            courses = session.execute(select(Course)).scalars().all()
            print(f"Courses: {len(courses)}")
            
            print("Querying Batches...")
            batches = session.execute(select(Batch)).scalars().all()
            print(f"Batches: {len(batches)}")
            
            print("Querying BatchStudent...")
            session.execute(select(BatchStudent)).scalars().all()
            
            print("Querying Registration...")
            session.execute(select(Registration)).scalars().all()

            print("Querying LeaveRequest...")
            session.execute(select(LeaveRequest)).scalars().all()
            print("ALL OK")
        except Exception as e:
            print("ERROR CAUGHT:")
            traceback.print_exc()

if __name__ == "__main__":
    main()
