import asyncio
import os
import sys

# Add current dir to path
sys.path.append(os.getcwd())

async def test():
    print("Testing database connection...")
    try:
        from app.database import engine
        from sqlalchemy import text
        
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version();"))
            row = result.fetchone()
            print(f"\nSUCCESS! Database version: {row[0]}")
            
            result = await conn.execute(text("SELECT count(*) FROM users;"))
            count = result.scalar()
            print(f"User count: {count}")
            
    except Exception as e:
        print(f"\nFAILED to connect: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
