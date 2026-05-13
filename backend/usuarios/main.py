from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncpg
import os

app = FastAPI()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sdi_user:sdi_pass@postgres:5432/sdi_db"
)

class Login(BaseModel):
    usuario: str
    contrasena: str

@app.post("/login")
async def login(data: Login):

    conn = await asyncpg.connect(DATABASE_URL)

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

    await conn.close()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Usuario o contraseña incorrectos"
        )

    return {
        "mensaje": "Login exitoso",
        "usuario": usuario["usuario"]
    }

