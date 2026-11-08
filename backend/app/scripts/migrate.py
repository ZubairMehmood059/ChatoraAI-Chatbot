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
        migrations_dir = Path(__file__).resolve().parent.parent.parent / "migrations"
        migration_files = sorted(migrations_dir.glob("*.sql"))
        if not migration_files:
            logger.error("No SQL migrations found in %s", migrations_dir)
            sys.exit(1)

        for migration_file in migration_files:
            sql_content = migration_file.read_text(encoding="utf-8")
            logger.info("Executing %s...", migration_file.name)
            async with engine.begin() as conn:
                await conn.execute(text(sql_content))
            logger.info("Successfully applied %s.", migration_file.name)
    else:
        # SQLite / Dev mode: Initialize SQLAlchemy declarative schema
        logger.info("Initializing schema via SQLAlchemy metadata...")
        await init_db()
        logger.info("Successfully initialized development schema.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_migrations())

