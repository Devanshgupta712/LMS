
import asyncio
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.course import Course, Batch

async def check_duplicates():
    async with AsyncSessionLocal() as db:
        print("Checking for duplicate courses...")
        res = await db.execute(select(Course.name).group_by(Course.name).having(func.count(Course.id) > 1))
        dups = res.scalars().all()
        if dups:
            print(f"Found duplicate course names: {dups}")
        else:
            print("No duplicate course names found.")
            
        print("\nChecking for courses with multiple active batches...")
        res = await db.execute(select(Batch.course_id).where(Batch.is_active == True).group_by(Batch.course_id).having(func.count(Batch.id) > 1))
        multi = res.scalars().all()
        if multi:
            for cid in multi:
                course = await db.get(Course, cid)
                print(f"Course '{course.name}' (ID: {cid}) has multiple active batches.")
        else:
            print("No courses with multiple active batches found.")

if __name__ == "__main__":
    try:
        asyncio.run(check_duplicates())
    except Exception as e:
        print(f"Error: {e}")
