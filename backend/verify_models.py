import asyncio
import traceback
import uuid
import os

async def run():
    db_file = "verify_clean.db"
    if os.path.exists(db_file):
        os.remove(db_file)
    
    # Use a clean SQLite DB for verification
    db_url = f"sqlite+aiosqlite:///{db_file}"
    
    try:
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from app.models.user import User, Role
        from app.database import Base
        from sqlalchemy import select
        
        engine = create_async_engine(db_url)
        AsyncSession = async_sessionmaker(engine, expire_on_commit=False)

        async with engine.begin() as conn:
            # Create all tables using the ALIGNED models
            await conn.run_sync(Base.metadata.create_all)

        async with AsyncSession() as session:
            email = "clean_test@example.com"
            print(f"Testing ALIGNED models on FRESH database: {db_file}")
            
            # 1. Test insertion (Write Mapping)
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password="hashed_password",
                name="Clean Test User",
                role=Role.STUDENT,
                student_id="STU123", # mapped to studentId
                is_active=True,       # mapped to isActive
                is_verified=True      # mapped to isVerified
            )
            session.add(user)
            await session.commit()
            
            # 2. Test fetching (Read Mapping)
            result = await session.execute(select(User).where(User.email == email))
            fetched = result.scalar_one()
            
            print(f"SUCCESS: Mapped properties verified on fresh database.")
            print(f"Model student_id -> DB studentId: {fetched.student_id}")
            print(f"Model is_active -> DB isActive: {fetched.is_active}")
            print(f"Model is_verified -> DB isVerified: {fetched.is_verified}")
            print(f"Model created_at -> DB createdAt: {fetched.created_at}")

        await engine.dispose()
        os.remove(db_file)
            
    except Exception as e:
        print(f"Verification Failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
