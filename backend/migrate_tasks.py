import asyncio
from sqlalchemy import text
from app.database import engine

async def update_schema():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE tasks ADD COLUMN student_id VARCHAR;"))
            await conn.execute(text("ALTER TABLE tasks ADD CONSTRAINT fk_tasks_student_id FOREIGN KEY (student_id) REFERENCES users (id);"))
            print("Successfully added student_id to tasks!")
        except Exception as e:
            print(f"Error for student_id: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE tasks ADD COLUMN pdf_url VARCHAR;"))
            print("Successfully added pdf_url to tasks!")
        except Exception as e:
            print(f"Error for pdf_url: {e}")

if __name__ == "__main__":
    asyncio.run(update_schema())
