from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

db_url = settings.DATABASE_URL.strip()
# Managed databases often provide urls starting with postgres:// but SQLAlchemy async requires postgresql+asyncpg://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Aggressively remove all query parameters to avoid asyncpg connection errors (e.g., sslmode)
# We handle SSL via connect_args below instead.
if "?" in db_url:
    db_url = db_url.split("?")[0]

if db_url.startswith("sqlite"):
    engine = create_async_engine(
        db_url, 
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    # Managed Postgres requires SSL, but asyncpg uses 'ssl' instead of 'sslmode'
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
