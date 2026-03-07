import asyncio
import traceback

async def run():
    try:
        from app.database import AsyncSessionLocal
        from app.models.user import User
        from sqlalchemy import select

        async with AsyncSessionLocal() as session:
            result = await session.execute(select(User).where(User.email == "devanshd7124g@gmail.com"))
            user = result.scalar_one_or_none()
            print("User found:", user.name if user else "NOT FOUND")
    except Exception as e:
        tb = traceback.format_exc()
        with open("debug_output.txt", "w") as f:
            f.write(tb)
        print("Error saved to debug_output.txt")
        print("Error summary:", str(e)[-500:])

asyncio.run(run())
