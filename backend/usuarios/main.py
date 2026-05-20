from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncpg
import os

app = FastAPI()

# URL de conexión a la base de datos PostgreSQL en Supabase
# Se lee desde variable de entorno DATABASE_URL, con valor por defecto hardcodeado
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.vzlrzsupvzyiqwetmgyt:distribuidos123@aws-1-us-east-2.pooler.supabase.com:5432/postgres"
)

# Modelo de datos para el cuerpo del request de login
class Login(BaseModel):
    usuario: str      # Nombre de usuario
    contrasena: str   # Contraseña en texto plano

@app.post("/login")
async def login(data: Login):
    # Conectar a la base de datos de forma asíncrona
    conn = await asyncpg.connect(DATABASE_URL)

    # Buscar usuario que coincida con usuario, contraseña y esté activo
    usuario = await conn.fetchrow(
        """
        SELECT *
        FROM usuarios.usuarios
        WHERE usuario = $1
        AND contrasena = $2
        AND activo = true
        """,
        data.usuario,
        data.contrasena
    )

    # Cerrar la conexión después de la consulta
    await conn.close()

    # Si no se encontró el usuario, retornar error 401
    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos"
        )

    # Login exitoso — retornar mensaje y nombre de usuario
    return {
        "mensaje": "Login exitoso",
        "usuario": usuario["usuario"]
    }