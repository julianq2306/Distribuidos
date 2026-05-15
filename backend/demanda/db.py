import os
import asyncpg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.vzlrzsupvzyiqwetmgyt:distribuidos123@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
)

_pool = None

async def get_pool():
    global _pool

    if _pool is None:
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=2,
            max_size=10,
            ssl="require"
        )

    return _pool

async def get_conn():
    pool = await get_pool()

    async with pool.acquire() as conn:
        yield conn