import asyncio
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.course import Batch

# Explicitly use the SQLite DB in the backend folder
DB_PATH = os.path.join(os.getcwd(), 'backend', 'apptech_lms.db')
if not os.path.exists(DB_PATH):
    print(f"Warning: {DB_PATH} not found, checking root...")
    DB_PATH = os.path.join(os.getcwd(), 'apptech_lms.db')

print(f"Using DB: {DB_PATH}")
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"
engine = create_async_engine(DATABASE_URL)

async def check():
    async with engine.connect() as conn:
        try:
            res = await conn.execute(select(Batch))
            batches = res.all()
            print(f"Batch count: {len(batches)}")
            for b in batches:
                # b is a Row object, accessing by attribute name
                print(f"ID: {b.id}, Name: {b.name}, Course ID: {b.course_id}, Active: {b.is_active}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
