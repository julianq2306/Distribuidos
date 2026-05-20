"""
Configuración de la base de datos.

Define la conexión a PostgreSQL mediante SQLAlchemy, la fábrica de sesiones
y la base declarativa para los modelos ORM.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# URL de conexión a la base de datos. Se obtiene de la variable de entorno
# DATABASE_URL, con un valor por defecto para desarrollo.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.vzlrzsupvzyiqwetmgyt:distribuidos123@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
)

# Motor de SQLAlchemy. SSL es requerido por Supabase.
engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"}
)

# Fábrica de sesiones. Cada instancia representa una conversación con la BD.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Clase base de la que heredan todos los modelos ORM.
Base = declarative_base()


def get_db():
    """
    Provee una sesión de base de datos por petición.

    Pensado para usarse como dependencia de FastAPI con Depends().
    Garantiza que la sesión se cierre al finalizar, incluso si ocurre un error.

    Yields:
        Session: Sesión activa de SQLAlchemy.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()