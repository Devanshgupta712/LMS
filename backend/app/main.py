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
            
            # Auto-migrate tables to align with camelCase schema
            if "sqlite" in str(engine.url):
                print("Running SQLite migrations...")
                
                # Migrate users table
                result = await conn.execute(text("PRAGMA table_info(users)"))
                user_cols = [row[1] for row in result.fetchall()]
                user_migrations = [
                    ("studentId", "TEXT"),
                    ("isActive", "BOOLEAN DEFAULT true"),
                    ("isVerified", "BOOLEAN DEFAULT false"),
                    ("verificationCode", "TEXT"),
                    ("verificationExpiry", "DATETIME"),
                    ("createdAt", "DATETIME DEFAULT CURRENT_TIMESTAMP"),
                    ("updatedAt", "DATETIME"),
                    ("educationStatus", "TEXT"),
                    ("highestEducation", "TEXT"),
                    ("degree", "TEXT"),
                    ("passingYear", "TEXT"),
                    ("dob", "TEXT")
                ]
                for col_name, col_type in user_migrations:
                    if col_name not in user_cols:
                        print(f"Adding column {col_name} to users...")
                        await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))

                # Migrate leave_requests table
                result = await conn.execute(text("PRAGMA table_info(leave_requests)"))
                leave_cols = [row[1] for row in result.fetchall()]
                if "leaveType" not in leave_cols:
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN leaveType TEXT DEFAULT 'OTHER' NOT NULL"))
                if "proofUrl" not in leave_cols:
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN proofUrl TEXT"))
            else:
                print("PostgreSQL detected - no additional migrations needed.")

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
