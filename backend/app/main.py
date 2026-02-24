from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base

# Import all models so tables can be created
from app.models import *  # noqa: F401, F403

from app.routers import auth, admin, marketing, training, placement
from app.seed import seed as run_seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables if they don't exist
    print("Starting up: checking database connection and creating tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
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
    version="1.0.0",
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


@app.get("/api/seed-db")
async def trigger_seed():
    """Temporary endpoint to seed DB since Shell is paid on Render"""
    try:
        await run_seed()
        return {"status": "success", "message": "Database seeded!"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
