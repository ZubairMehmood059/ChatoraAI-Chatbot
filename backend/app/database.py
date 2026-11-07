import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from backend.app.config import get_settings
from backend.app.models.base import Base

logger = logging.getLogger("chatora_database")
settings = get_settings()

db_url = settings.async_database_url

# Configure engine kwargs depending on dialect
engine_kwargs = {"echo": False}
if "postgresql" in db_url:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 300,
    })
elif "sqlite" in db_url:
    # SQLite async settings
    engine_kwargs.update({
        "pool_pre_ping": True,
    })

engine: AsyncEngine = create_async_engine(db_url, **engine_kwargs)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create database tables if they do not exist."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error("Failed to initialize database: %s", e)
        raise


async def close_db() -> None:
    """Dispose of the database engine connection pool."""
    await engine.dispose()
    logger.info("Database connections closed.")

