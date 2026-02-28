import asyncio
from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def migrate():
    url = settings.DATABASE_URL
    print(f"Connecting to database: {url.split('@')[-1] if '@' in url else url}")
    
    engine = create_async_engine(url)
    
    async with engine.begin() as conn:
        print("Checking for missing columns in 'users' table...")
        
        if "sqlite" in url:
            # SQLite specific check
            result = await conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]
            
            if "is_verified" not in columns:
                print("Adding 'is_verified' (SQLite)...")
                await conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
            if "verification_code" not in columns:
                print("Adding 'verification_code' (SQLite)...")
                await conn.execute(text("ALTER TABLE users ADD COLUMN verification_code VARCHAR"))
            if "verification_expiry" not in columns:
                print("Adding 'verification_expiry' (SQLite)...")
                await conn.execute(text("ALTER TABLE users ADD COLUMN verification_expiry DATETIME"))
        else:
            # Postgres (Neon) specific check
            # We use 'IF NOT EXISTS' for Postgres 9.6+
            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE"))
                print("Handled 'is_verified' (Postgres)")
            except Exception as e:
                print(f"Error adding is_verified: {e}")

            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR"))
                print("Handled 'verification_code' (Postgres)")
            except Exception as e:
                print(f"Error adding verification_code: {e}")

            try:
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expiry TIMESTAMP"))
                print("Handled 'verification_expiry' (Postgres)")
            except Exception as e:
                print(f"Error adding verification_expiry: {e}")
        
    await engine.dispose()
    print("Migration process finished!")

if __name__ == "__main__":
    asyncio.run(migrate())
