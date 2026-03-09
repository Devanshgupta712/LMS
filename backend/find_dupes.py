
import asyncio
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.user import User

async def find_dupe_emails():
    async with AsyncSessionLocal() as db:
        print("Finding duplicate emails...")
        query = select(User.email, func.count(User.id)).group_by(User.email).having(func.count(User.id) > 1)
        result = await db.execute(query)
        dupes = result.all()
        if dupes:
            print(f"Found duplicate emails: {dupes}")
        else:
            print("No duplicate emails found.")
            
        print("\nChecking for any student_id duplicates...")
        query = select(User.student_id, func.count(User.id)).where(User.student_id != None).group_by(User.student_id).having(func.count(User.id) > 1)
        result = await db.execute(query)
        dupes = result.all()
        if dupes:
            print(f"Found duplicate student_ids: {dupes}")
        else:
            print("No duplicate student_ids found.")

if __name__ == "__main__":
    asyncio.run(find_dupe_emails())
