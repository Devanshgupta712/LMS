import asyncio
from app.database import engine, Base
from app.models import *
from sqlalchemy import text

async def test_migration():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            if "sqlite" in str(engine.url):
                print("Testing SQLite migration...")
                result = await conn.execute(text("PRAGMA table_info(leave_requests)"))
                columns = [row[1] for row in result.fetchall()]
                if "leave_type" not in columns:
                    print("Adding leave_type...")
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN leave_type VARCHAR(9) DEFAULT 'OTHER' NOT NULL"))
                if "proof_url" not in columns:
                    print("Adding proof_url...")
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN proof_url VARCHAR(255)"))
            else:
                print("Testing remote PostgreSQL migration...")
                await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type VARCHAR(9) DEFAULT 'OTHER' NOT NULL"))
                await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS proof_url VARCHAR(255)"))
        print("Success!")
    except Exception as e:
        print(f"FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_migration())
