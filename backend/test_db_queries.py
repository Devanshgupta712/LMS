import os
os.environ['DATABASE_URL'] = "postgresql+asyncpg://lms_db_v29i_user:V98fL6qC1hY6FvjX6qf0@dpg-cv29ik0gph6c738e65vg-a.singapore-postgres.render.com/lms_db_v29i"

import asyncio
from app.database import AsyncSessionLocal
from app.models.course import Batch, Course
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        try:
            print('Querying batches...')
            res = await session.execute(select(Batch))
            b = res.scalars().all()
            print(f'Got {len(b)} batches.')
            
            print('Querying courses...')
            res = await session.execute(select(Course))
            c = res.scalars().all()
            print(f'Got {len(c)} courses.')
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
