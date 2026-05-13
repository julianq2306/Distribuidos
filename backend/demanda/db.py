import os
import asyncpg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sdi_user:sdi_pass@postgres:5432/sdi_db"
)

_pool = None

async def get_pool():
    global _pool

    if _pool is None:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=2,
            max_size=10
        )

    return _pool

async def get_conn():
    pool = await get_pool()

    async with pool.acquire() as conn:
        yield conn