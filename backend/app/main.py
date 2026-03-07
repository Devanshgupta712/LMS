from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base

# Import all models so tables can be created
from app.models import *  # noqa: F401, F403

from app.routers import auth, admin, marketing, training, placement


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist
    print("Starting up: checking database connection and creating tables...")
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            # Auto-migrate leave_requests table
            if "sqlite" in str(engine.url):
                try:
                    result = await conn.execute(text("PRAGMA table_info(leave_requests)"))
                    columns = [row[1] for row in result.fetchall()]
                    if "leave_type" not in columns:
                        await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN leave_type VARCHAR(9) DEFAULT 'OTHER' NOT NULL"))
                    if "proof_url" not in columns:
                        await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN proof_url VARCHAR(255)"))
                except Exception as e:
                    print(f"Error migrating SQLite leave_requests: {e}")
            else:
                try:
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type VARCHAR(9) DEFAULT 'OTHER' NOT NULL"))
                except Exception as e:
                    pass
                try:
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS proof_url VARCHAR(255)"))
                except Exception as e:
                    pass

        print("Database startup successful!")
    except Exception as e:
        print(f"DATABASE STARTUP CRITICAL ERROR: {e}")
        # Re-raise so Render knows the service failed to start correctly
        raise e 
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title="Apptech Careers LMS API",
    description="Learning Management System backend for Apptech Careers",
    version="1.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(marketing.router)
app.include_router(training.router)
app.include_router(placement.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "Apptech Careers LMS"}
