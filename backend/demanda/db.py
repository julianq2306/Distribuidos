"""
Conexión asíncrona a la base de datos mediante asyncpg.

Gestiona un pool de conexiones reutilizable para PostgreSQL y expone
una dependencia para obtener conexiones individuales por petición.
"""

import os
import asyncpg

# URL de conexión a la base de datos. Se obtiene de la variable de entorno
# DATABASE_URL, con un valor por defecto para desarrollo.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.vzlrzsupvzyiqwetmgyt:distribuidos123@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
)

# Pool de conexiones global. Se inicializa de forma perezosa en get_pool().
_pool = None


async def get_pool():
    """
    Obtiene el pool de conexiones, creándolo si aún no existe.

    Mantiene entre 2 y 10 conexiones abiertas con SSL requerido (Supabase).
    El pool se reutiliza durante toda la vida de la aplicación.

    Returns:
        asyncpg.Pool: Pool de conexiones listo para usar.
    """
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
    """
    Provee una conexión del pool por petición.

    Pensado para usarse como dependencia de FastAPI con Depends().
    La conexión se devuelve automáticamente al pool al finalizar.

    Yields:
        asyncpg.Connection: Conexión activa lista para ejecutar consultas.
    """
    pool = await get_pool()

    async with pool.acquire() as conn:
        yield conn