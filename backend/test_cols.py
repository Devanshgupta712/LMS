import os
os.environ['DATABASE_URL'] = "postgresql+asyncpg://lms_db_v29i_user:V98fL6qC1hY6FvjX6qf0@dpg-cv29ik0gph6c738e65vg-a.singapore-postgres.render.com/lms_db_v29i"

import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        for t in ['courses', 'batches']:
            print(f"--- {t} ---")
            res = await conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{t}'"))
            cols = [r[0] for r in res]
            print(cols)

if __name__ == "__main__":
    asyncio.run(main())
