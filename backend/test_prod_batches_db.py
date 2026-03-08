import traceback
import asyncio
import ssl
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from app.models.course import Batch
from sqlalchemy import select

async def test_batches():
    DATABASE_URL = "postgresql+asyncpg://lms_db_v29i_user:V98fL6qC1hY6FvjX6qf0@dpg-cv29ik0gph6c738e65vg-a.singapore-postgres.render.com/lms_db_v29i"
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    engine = create_async_engine(DATABASE_URL, connect_args={"ssl": ctx})
    
    async with AsyncSession(engine) as db:
        query = select(Batch).order_by(Batch.created_at.desc())
        try:
            print("Executing query...")
            result = await db.execute(query)
            batches = result.scalars().all()
            print("Successfully fetched batches:", len(batches))
        except Exception as e:
            print("Failed to execute!")
            traceback.print_exc()
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_batches())
