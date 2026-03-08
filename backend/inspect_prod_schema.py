import asyncio
import ssl
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

async def inspect_db():
    DATABASE_URL = "postgresql+asyncpg://lms_db_v29i_user:V98fL6qC1hY6FvjX6qf0@dpg-cv29ik0gph6c738e65vg-a.singapore-postgres.render.com/lms_db_v29i"
    
    # Create an SSL context
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"ssl": ctx}
    )
    
    async with engine.connect() as conn:
        for table in ['users', 'leave_requests', 'attendance', 'batches', 'courses', 'registrations', 'documents', 'projects', 'tasks', 'assignments', 'lead_activities', 'leads']:
            print(f"\n--- {table} ---")
            try:
                res = await conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'"))
                cols = [r[0] for r in res]
                print(cols)
            except Exception as e:
                print(f"Error reading {table}: {e}")
                
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(inspect_db())
