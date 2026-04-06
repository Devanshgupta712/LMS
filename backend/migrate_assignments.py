import asyncio
from sqlalchemy import text
from app.database import engine

async def update_schema():
    async with engine.begin() as conn:
        try:
            # Need to use plain SQL to alter the table
            await conn.execute(text("ALTER TABLE assignments ADD COLUMN student_id VARCHAR;"))
            await conn.execute(text("ALTER TABLE assignments ADD CONSTRAINT fk_assignments_student_id FOREIGN KEY (student_id) REFERENCES users (id);"))
            print("Successfully added student_id to assignments!")
        except Exception as e:
            print(f"Error (maybe already exists?): {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
