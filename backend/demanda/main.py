from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import os
from datetime import date, timedelta
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import numpy as np

app = FastAPI(title="Microservicio Demanda")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.vzlrzsupvzyiqwetmgyt:distribuidos123@aws-1-us-east-2.pooler.supabase.com:6543/postgres"
)

async def get_connection():
    return await asyncpg.connect(DATABASE_URL, ssl="require")

@app.get("/")
async def root():
    return {"mensaje": "Microservicio de demanda funcionando"}

@app.get("/dashboard")
async def dashboard():
    conn = await get_connection()

    total = await conn.fetchval("""
        SELECT COUNT(*) FROM inventario.medicamentos WHERE activo = TRUE
    """)

    stock_bajo = await conn.fetch("""
        SELECT id, nombre, stock_actual, stock_minimo
        FROM inventario.medicamentos
        WHERE stock_actual <= stock_minimo
        AND activo = TRUE
    """)

    proximos_vencer = await conn.fetch("""
        SELECT id, nombre, fecha_vencimiento
        FROM inventario.medicamentos
        WHERE fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
        AND fecha_vencimiento >= CURRENT_DATE
        AND activo = TRUE
    """)

    vencidos = await conn.fetch("""
        SELECT id, nombre, fecha_vencimiento
        FROM inventario.medicamentos
        WHERE fecha_vencimiento < CURRENT_DATE
        AND activo = TRUE
    """)

    alertas = await conn.fetch("""
        SELECT tipo_alerta, mensaje, prioridad
        FROM inventario.alertas
        WHERE activa = TRUE
    """)

    await conn.close()

    return {
        "total_medicamentos": total,
        "stock_bajo": [dict(x) for x in stock_bajo],
        "proximos_vencer": [dict(x) for x in proximos_vencer],
        "vencidos": [dict(x) for x in vencidos],
        "alertas": [dict(x) for x in alertas]
    }

@app.get("/prediccion/{medicamento_id}")
async def predecir_demanda(medicamento_id: int):
    conn = await get_connection()

    datos = await conn.fetch("""
        SELECT cantidad_consumida
        FROM demanda.serie_historica
        WHERE medicamento_id = $1
        ORDER BY fecha ASC
    """, medicamento_id)

    if len(datos) < 3:
        await conn.close()
        return {"error": "No hay suficientes datos históricos"}

    serie = [float(x["cantidad_consumida"]) for x in datos]

    modelo = ExponentialSmoothing(serie, trend="add", seasonal=None).fit()
    predicciones = modelo.forecast(7)

    resultado = []
    for i, valor in enumerate(predicciones):
        resultado.append({
            "dia": str(date.today() + timedelta(days=i + 1)),
            "prediccion": round(float(valor), 2)
        })

    await conn.close()

    return {
        "medicamento_id": medicamento_id,
        "prediccion_7_dias": resultado
    }

@app.get("/riesgo-agotamiento")
async def riesgo_agotamiento():
    conn = await get_connection()

    medicamentos = await conn.fetch("""
        SELECT id, nombre, stock_actual, consumo_diario_est
        FROM inventario.medicamentos
        WHERE activo = TRUE
    """)

    resultado = []
    for med in medicamentos:
        consumo = float(med["consumo_diario_est"] or 0)
        dias_restantes = round(med["stock_actual"] / consumo, 2) if consumo > 0 else None

        resultado.append({
            "id": med["id"],
            "nombre": med["nombre"],
            "stock_actual": med["stock_actual"],
            "consumo_diario": consumo,
            "dias_restantes": dias_restantes if dias_restantes else "Sin datos"
        })

    await conn.close()
    return resultado

@app.get("/top-consumo")
async def top_consumo():
    conn = await get_connection()

    datos = await conn.fetch("""
        SELECT m.nombre, SUM(s.cantidad_consumida) as total_consumido
        FROM demanda.serie_historica s
        JOIN inventario.medicamentos m ON m.id = s.medicamento_id
        WHERE m.activo = TRUE
        GROUP BY m.nombre
        ORDER BY total_consumido DESC
        LIMIT 10
    """)

    await conn.close()
    return [dict(x) for x in datos]

@app.post("/generar-alertas")
async def generar_alertas():
    conn = await get_connection()

    medicamentos = await conn.fetch("""
        SELECT id, nombre, stock_actual, stock_minimo, fecha_vencimiento
        FROM inventario.medicamentos
        WHERE activo = TRUE
    """)

    creadas = []

    for med in medicamentos:
        if med["stock_actual"] <= med["stock_minimo"]:
            existe = await conn.fetchval("""
                SELECT COUNT(*) FROM inventario.alertas
                WHERE medicamento_id = $1
                AND tipo_alerta = 'STOCK_BAJO'
                AND activa = TRUE
            """, med["id"])
            if not existe:
                mensaje = f"Stock bajo para {med['nombre']}"
                await conn.execute("""
                    INSERT INTO inventario.alertas (medicamento_id, tipo_alerta, mensaje, prioridad)
                    VALUES ($1, $2, $3, $4)
                """, med["id"], "STOCK_BAJO", mensaje, "ALTA")
                creadas.append(mensaje)

        dias = (med["fecha_vencimiento"] - date.today()).days
        if dias <= 30:
            existe = await conn.fetchval("""
                SELECT COUNT(*) FROM inventario.alertas
                WHERE medicamento_id = $1
                AND tipo_alerta = 'VENCIMIENTO'
                AND activa = TRUE
            """, med["id"])
            if not existe:
                mensaje = f"{med['nombre']} vence pronto"
                await conn.execute("""
                    INSERT INTO inventario.alertas (medicamento_id, tipo_alerta, mensaje, prioridad)
                    VALUES ($1, $2, $3, $4)
                """, med["id"], "VENCIMIENTO", mensaje, "MEDIA")
                creadas.append(mensaje)

    await conn.close()

    return {
        "mensaje": "Alertas generadas",
        "total_alertas": len(creadas),
        "alertas": creadas
    }

@app.post("/desactivar-alertas/{medicamento_id}")
async def desactivar_alertas(medicamento_id: int):
    conn = await get_connection()
    await conn.execute("""
        UPDATE inventario.alertas
        SET activa = FALSE
        WHERE medicamento_id = $1
    """, medicamento_id)
    await conn.close()
    return {"mensaje": "Alertas desactivadas"}