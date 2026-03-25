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

# /api/uploads/{filename} — serve uploaded proof files through FastAPI (ASGI-routed; LiteSpeed-safe)
import mimetypes
from fastapi import Response

@app.get("/api/uploads/{filename}")
async def serve_upload(filename: str):
    _base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(_base, "uploads", os.path.basename(filename))
    if not os.path.isfile(file_path):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="File not found")
    mime, _ = mimetypes.guess_type(file_path)
    with open(file_path, "rb") as f:
        content = f.read()
    return Response(content=content, media_type=mime or "application/octet-stream")


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "Apptech Careers LMS"}
