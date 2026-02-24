import asyncio
import base64
import json
from datetime import datetime, timedelta

from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.attendance import TimeTracking, Attendance, AttendanceStatus
from sqlalchemy import select, and_, func

async def test_scan():
    async with AsyncSessionLocal() as db:
        # Get user
        result = await db.execute(select(User).where(User.email == "ankit@student.com"))
        user = result.scalar_one_or_none()
        if not user:
            print("User not found")
            return

        now = datetime.utcnow()
        today = now.date()
        
        try:
            print("Querying TimeTracking...")
            query = select(TimeTracking).where(
                and_(
                    TimeTracking.user_id == user.id,
                    func.date(TimeTracking.date) == today
                )
            )
            print("Executing query...")
            result = await db.execute(query)
            time_record = result.scalar_one_or_none()
            print("Result:", time_record)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_scan())
