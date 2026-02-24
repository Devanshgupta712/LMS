from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

db_url = settings.DATABASE_URL
# Managed databases often provide urls starting with postgres:// but SQLAlchemy async requires postgresql+asyncpg://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

if db_url.startswith("sqlite"):
    engine = create_async_engine(
        db_url, 
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    # Managed Postgres often requires SSL
    engine = create_async_engine(
        db_url, 
        echo=False,
        connect_args={"ssl": True}
    )
    
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
