
import asyncio
from sqlalchemy import text
from app.database import engine

async def find_dupes_raw():
    async with engine.connect() as conn:
        print("Finding duplicate emails (RAW SQL)...")
        res = await conn.execute(text("SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1"))
        print(f"Dupes: {res.all()}")
        
        print("\nFinding duplicate student_ids (RAW SQL)...")
        res = await conn.execute(text("SELECT student_id, COUNT(*) FROM users WHERE student_id IS NOT NULL GROUP BY student_id HAVING COUNT(*) > 1"))
        print(f"Dupes: {res.all()}")

if __name__ == "__main__":
    asyncio.run(find_dupes_raw())
