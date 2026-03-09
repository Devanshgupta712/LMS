
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User

async def find_max_sid():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User.student_id).where(User.role == "STUDENT"))
        sids = result.scalars().all()
        print(f"Current Student IDs: {sids}")
        # Parse and find max
        nums = []
        for sid in sids:
            if sid and sid.startswith("APC-"):
                try:
                    num = int(sid.split("-")[-1])
                    nums.append(num)
                except:
                    pass
        if nums:
            print(f"Max number: {max(nums)}")
        else:
            print("No APC IDs found.")

if __name__ == "__main__":
    asyncio.run(find_max_sid())
