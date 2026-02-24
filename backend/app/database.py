from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

db_url = settings.DATABASE_URL
# Managed databases often provide urls starting with postgres:// but SQLAlchemy async requires postgresql+asyncpg://
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Remove 'sslmode' from query parameters as it's not supported by asyncpg and causes crashes
if "?" in db_url:
    base_url, query = db_url.split("?", 1)
    params = query.split("&")
    params = [p for p in params if not p.startswith("sslmode=")]
    db_url = f"{base_url}?{'&'.join(params)}" if params else base_url

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
