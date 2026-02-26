import asyncio
from app.database import engine
from sqlalchemy import text

async def check():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text('SELECT id, name FROM batches'))
            rows = result.fetchall()
            print(f'TOTAL_BATCHES:{len(rows)}')
            for r in rows:
                print(f'BATCH:{r[0]}:{r[1]}')
    except Exception as e:
        print(f'ERROR:{e}')

if __name__ == "__main__":
    asyncio.run(check())
