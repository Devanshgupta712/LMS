from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal

# Import all models so tables can be created
from app.models import *  # noqa: F401, F403

from app.routers import auth, admin, marketing, training, placement


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: verify DB connection (tables already exist in production)
    print("Starting up LMS API...")
    try:
        from sqlalchemy import text
        is_sqlite = "sqlite" in str(engine.url)

        if is_sqlite:
            # For local SQLite development: create tables and run migrations
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

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

                result = await conn.execute(text("PRAGMA table_info(leave_requests)"))
                leave_cols = [row[1] for row in result.fetchall()]
                if "leaveType" not in leave_cols:
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN leaveType TEXT DEFAULT 'OTHER' NOT NULL"))
                if "proofUrl" not in leave_cols:
                    await conn.execute(text("ALTER TABLE leave_requests ADD COLUMN proofUrl TEXT"))
            print("SQLite startup complete.")
        else:
            # For PostgreSQL production: skip the startup check to prevent hangs.
            # Connections are established lazily on request.
            print("PostgreSQL detected - app ready.")

    except Exception as e:
        # Log the error but do NOT crash the app. The API can still serve requests
        # even if the startup check fails (e.g. brief network blip at boot time).
        print(f"WARNING - Startup DB check failed (non-fatal): {e}")

    yield
    # Shutdown: clean up connection pool
    await engine.dispose()
    print("LMS API shut down.")


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

# Serve uploaded proof files (medical leave, etc.)
# Wrapped in try/except — a mount failure must never crash the whole app.
try:
    _uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    os.makedirs(_uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")
    print(f"[uploads] Serving files from: {_uploads_dir}")
except Exception as _mount_err:
    print(f"[WARNING] Could not mount /uploads static route: {_mount_err}")



@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "Apptech Careers LMS"}
