import asyncio
from datetime import datetime
from app.database import AsyncSessionLocal
from app.models.attendance import LeaveRequest, LeaveType
from app.models.user import User

async def test_insert():
    async with AsyncSessionLocal() as db:
        try:
            # get any user
            from sqlalchemy import select
            res = await db.execute(select(User).limit(1))
            user = res.scalar_one_or_none()
            if not user:
                print("No users found.")
                return

            leave = LeaveRequest(
                user_id=user.id,
                batch_id=None,
                leave_type=LeaveType.INTERVIEW,
                proof_url=None,
                start_date=datetime.strptime("2026-03-18", "%Y-%m-%d"),
                end_date=datetime.strptime("2026-04-15", "%Y-%m-%d"),
                reason="Test reason",
            )
            db.add(leave)
            await db.flush()
            print("Successfully inserted")
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_insert())
