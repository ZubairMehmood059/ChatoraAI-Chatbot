import asyncio
import logging
import sys
from pathlib import Path
from sqlalchemy import text
from backend.app.config import get_settings
from backend.app.database import engine, init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migration_runner")


async def run_migrations() -> None:
    settings = get_settings()
    logger.info("Running migrations on database: %s", settings.async_database_url.split("@")[-1])

    # If it's PostgreSQL, execute the raw SQL migration file
    if "postgresql" in settings.async_database_url:
        migration_file = Path(__file__).resolve().parent.parent.parent / "migrations" / "001_initial_schema.sql"
        if not migration_file.exists():
            logger.error("Migration file %s does not exist", migration_file)
            sys.exit(1)

        sql_content = migration_file.read_text(encoding="utf-8")
        logger.info("Executing 001_initial_schema.sql...")
        async with engine.begin() as conn:
            # Execute statement by statement or block
            await conn.execute(text(sql_content))
        logger.info("Successfully applied 001_initial_schema.sql to PostgreSQL.")
    else:
        # SQLite / Dev mode: Initialize SQLAlchemy declarative schema
        logger.info("Initializing schema via SQLAlchemy metadata...")
        await init_db()
        logger.info("Successfully initialized development schema.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_migrations())

