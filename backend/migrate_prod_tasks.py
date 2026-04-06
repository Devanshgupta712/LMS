import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv(encoding="utf-16le")

db_url = os.environ.get("DATABASE_URL", "").strip()

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

if "?" in db_url:
    base, qs = db_url.split("?", 1)
    params = [p for p in qs.split("&") if "channel_binding" not in p and "sslmode" not in p]
    db_url = f"{base}?{'&'.join(params)}" if params else base

connect_args = {"timeout": 10}
if "neon.tech" in db_url:
    connect_args["ssl"] = True

engine = create_async_engine(db_url, connect_args=connect_args)

async def run_migrations():
    print(f"Connecting to {db_url.split('@')[1] if '@' in db_url else db_url}")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE assignments ADD COLUMN student_id VARCHAR;"))
            await conn.execute(text("ALTER TABLE assignments ADD CONSTRAINT fk_assignments_student_id FOREIGN KEY (student_id) REFERENCES users (id);"))
            print("Added student_id to assignments")
        except Exception as e:
            print(f"Failed assignments (maybe already exists): {e}")
            
        try:
            await conn.execute(text("ALTER TABLE tasks ADD COLUMN student_id VARCHAR;"))
            await conn.execute(text("ALTER TABLE tasks ADD CONSTRAINT fk_tasks_student_id FOREIGN KEY (student_id) REFERENCES users (id);"))
            print("Added student_id to tasks")
        except Exception as e:
            print(f"Failed tasks student_id (maybe already exists): {e}")

        try:
            await conn.execute(text("ALTER TABLE tasks ADD COLUMN pdf_url VARCHAR;"))
            print("Added pdf_url to tasks")
        except Exception as e:
            print(f"Failed tasks pdf_url (maybe already exists): {e}")

if __name__ == "__main__":
    asyncio.run(run_migrations())
