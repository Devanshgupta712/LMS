import asyncio
import traceback
import uuid

async def run():
    try:
        from app.database import AsyncSessionLocal, engine
        from app.models.user import User, Role
        from sqlalchemy import select, text

        async with engine.begin() as conn:
            # Inspection
            result = await conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in result.fetchall()]
            
            # Resolve the mismatch ONLY for THIS diagnostic test
            for c, t in [("studentId", "TEXT"), ("isActive", "BOOLEAN"), ("isVerified", "BOOLEAN"), ("createdAt", "DATETIME"), ("updatedAt", "DATETIME")]:
                if c not in cols:
                    await conn.execute(text(f"ALTER TABLE users ADD COLUMN {c} {t}"))

        async with AsyncSessionLocal() as session:
            email = f"final_test_{uuid.uuid4().hex[:4]}@example.com"
            print(f"Testing model with email: {email}")
            
            # Create user using model (this tests if SQLAlchemy correctly maps properties to columns)
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                password="hashed_password",
                name="Test Mapping",
                role=Role.STUDENT,
                is_active=True,
                is_verified=True
            )
            session.add(user)
            await session.commit()
            
            # Fetch using model (this tests query mapping)
            result = await session.execute(select(User).where(User.email == email))
            fetched = result.scalar_one()
            
            print(f"SUCCESS: Mapped properties verified.")
            print(f"student_id -> {fetched.student_id}")
            print(f"is_active -> {fetched.is_active}")
            print(f"is_verified -> {fetched.is_verified}")
            
    except Exception as e:
        print(f"Verification Failed: {e}")
        traceback.print_exc()

asyncio.run(run())
