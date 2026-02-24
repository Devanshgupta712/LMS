"""
Seed script: Populates the database with demo data.
Run: python -m app.seed
"""
import asyncio
from passlib.context import CryptContext
from sqlalchemy import select

from app.database import AsyncSessionLocal, engine, Base
from app.models import *  # noqa

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == "admin@apptech.com"))
        if result.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        print("[*] Seeding database...")

        # ── Users ─────────────────────────────────────────
        users = [
            User(email="admin@apptech.com", password=pwd_context.hash("admin123"),
                 name="Super Admin", role="SUPER_ADMIN", phone="9000000001"),
            User(email="manager@apptech.com", password=pwd_context.hash("admin123"),
                 name="Admin Manager", role="ADMIN", phone="9000000002"),
            User(email="trainer@apptech.com", password=pwd_context.hash("trainer123"),
                 name="Ravi Kumar", role="TRAINER", phone="9000000003"),
            User(email="marketer@apptech.com", password=pwd_context.hash("market123"),
                 name="Priya Sharma", role="MARKETER", phone="9000000004"),
        ]
        db.add_all(users)
        await db.flush()

        trainer = users[2]

        # Students
        students = []
        for i, (name, email) in enumerate([
            ("Ankit Verma", "ankit@student.com"),
            ("Sneha Patel", "sneha@student.com"),
            ("Rahul Singh", "rahul@student.com"),
            ("Meera Nair", "meera@student.com"),
            ("Vikram Das", "vikram@student.com"),
        ], start=1):
            s = User(
                email=email, password=pwd_context.hash("welcome123"),
                name=name, role="STUDENT", student_id=f"APC-2026-{i:04d}",
                phone=f"98000000{i:02d}",
            )
            students.append(s)
        db.add_all(students)
        await db.flush()

        # ── Courses ───────────────────────────────────────
        courses = [
            Course(name="Full Stack Web Development", description="Complete MERN/Next.js stack with projects",
                   duration="6 months", fee=45000),
            Course(name="Data Science & AI", description="Python, ML, Deep Learning, NLP",
                   duration="8 months", fee=55000),
            Course(name="Digital Marketing", description="SEO, SEM, Social Media, Analytics",
                   duration="3 months", fee=25000),
        ]
        db.add_all(courses)
        await db.flush()

        # ── Batches ───────────────────────────────────────
        from datetime import datetime
        batches = [
            Batch(name="FSWD Batch 2026-A", course_id=courses[0].id,
                  start_date=datetime(2026, 1, 15), end_date=datetime(2026, 7, 15),
                  trainer_id=trainer.id),
            Batch(name="DS&AI Batch 2026-A", course_id=courses[1].id,
                  start_date=datetime(2026, 2, 1), end_date=datetime(2026, 9, 30),
                  trainer_id=trainer.id),
        ]
        db.add_all(batches)
        await db.flush()

        # ── Batch-Student Mapping ─────────────────────────
        for student in students[:3]:
            db.add(BatchStudent(batch_id=batches[0].id, student_id=student.id))
        for student in students[3:]:
            db.add(BatchStudent(batch_id=batches[1].id, student_id=student.id))
        await db.flush()

        # ── Registrations ─────────────────────────────────
        for student in students[:3]:
            db.add(Registration(
                student_id=student.id, course_id=courses[0].id,
                batch_id=batches[0].id, fee_amount=45000, fee_paid=30000, status="CONFIRMED",
            ))
        await db.flush()

        # ── Leads ─────────────────────────────────────────
        leads = [
            Lead(name="Arun Kumar", email="arun@gmail.com", phone="9876543210",
                 source="Website", status="NEW"),
            Lead(name="Divya Raj", email="divya@gmail.com", phone="9876543211",
                 source="WhatsApp", status="CONTACTED"),
            Lead(name="Karthik M", email="karthik@gmail.com", phone="9876543212",
                 source="Social Media", status="INTERESTED"),
            Lead(name="Lakshmi S", email="lakshmi@gmail.com", phone="9876543213",
                 source="Reference", status="CONVERTED"),
        ]
        db.add_all(leads)
        await db.flush()

        # ── Projects ──────────────────────────────────────
        project = Project(
            batch_id=batches[0].id, title="E-Commerce Platform",
            description="Build a full-stack e-commerce app with cart, payment, and admin panel.",
            deadline=datetime(2026, 4, 30),
        )
        db.add(project)
        await db.flush()

        tasks = [
            Task(batch_id=batches[0].id, assigned_by=users[0].id,
                 title="Frontend (React)", due_date=datetime(2026, 3, 15), status="IN_PROGRESS"),
            Task(batch_id=batches[0].id, assigned_by=users[0].id,
                 title="Backend (Node.js API)", due_date=datetime(2026, 3, 20), status="PENDING"),
            Task(batch_id=batches[0].id, assigned_by=users[0].id,
                 title="Database & Deployment", due_date=datetime(2026, 3, 25), status="PENDING"),
        ]
        db.add_all(tasks)
        await db.flush()

        # ── Jobs ──────────────────────────────────────────
        jobs = [
            Job(title="Junior Full Stack Developer", company="TCS",
                description="React + Node.js, 0-2 years experience", location="Hyderabad", salary="4-6 LPA"),
            Job(title="Data Analyst Intern", company="Infosys",
                description="Python, SQL, Tableau", location="Bangalore", salary="3-4 LPA"),
        ]
        db.add_all(jobs)
        await db.flush()

        # ── Leave Requests ────────────────────────────────
        db.add(LeaveRequest(
            user_id=students[0].id,
            start_date=datetime(2026, 3, 10),
            end_date=datetime(2026, 3, 12),
            reason="Family function",
            status="PENDING",
        ))
        await db.flush()

        await db.commit()
        print("[OK] Database seeded successfully!")
        print("   Admin login: admin@apptech.com / admin123")
        print("   Trainer login: trainer@apptech.com / trainer123")
        print("   Student login: ankit@student.com / welcome123")


if __name__ == "__main__":
    asyncio.run(seed())
