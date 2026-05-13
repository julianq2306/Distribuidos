from fastapi import FastAPI
import asyncpg
import os
from datetime import date, timedelta
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import numpy as np

app = FastAPI(title="Microservicio Demanda")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sdi_user:sdi_pass@postgres:5432/sdi_db"
)

# =========================================
# CONEXIÓN BD
# =========================================

async def get_connection():
    return await asyncpg.connect(DATABASE_URL)

# =========================================
# HEALTH CHECK
# =========================================

@app.get("/")
async def root():
    return {
        "mensaje": "Microservicio de demanda funcionando"
    }

# =========================================
# DASHBOARD GENERAL
# =========================================

@app.get("/dashboard")
async def dashboard():

    conn = await get_connection()

    # =========================
    # TOTAL MEDICAMENTOS
    # =========================

    total = await conn.fetchval("""
        SELECT COUNT(*)
        FROM inventario.medicamentos
        WHERE activo = TRUE
    """)

    # =========================
    # STOCK BAJO
    # =========================

    stock_bajo = await conn.fetch("""
        SELECT
            id,
            nombre,
            stock_actual,
            stock_minimo
        FROM inventario.medicamentos
        WHERE stock_actual <= stock_minimo
    """)

    # =========================
    # PRÓXIMOS A VENCER
    # =========================

    proximos_vencer = await conn.fetch("""
        SELECT
            id,
            nombre,
            fecha_vencimiento
        FROM inventario.medicamentos
        WHERE fecha_vencimiento <= CURRENT_DATE + INTERVAL '30 days'
    """)

    # =========================
    # VENCIDOS
    # =========================

    vencidos = await conn.fetch("""
        SELECT
            id,
            nombre,
            fecha_vencimiento
        FROM inventario.medicamentos
        WHERE fecha_vencimiento < CURRENT_DATE
    """)

    # =========================
    # ALERTAS ACTIVAS
    # =========================

    alertas = await conn.fetch("""
        SELECT
            tipo_alerta,
            mensaje,
            prioridad
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

# =========================================
# PREDICCIÓN SIMPLE
# =========================================

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

        return {
            "error": "No hay suficientes datos históricos"
        }

    serie = [float(x["cantidad_consumida"]) for x in datos]

    modelo = ExponentialSmoothing(
        serie,
        trend="add",
        seasonal=None
    ).fit()

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

# =========================================
# RIESGO DE AGOTAMIENTO
# =========================================

@app.get("/riesgo-agotamiento")
async def riesgo_agotamiento():

    conn = await get_connection()

    medicamentos = await conn.fetch("""
        SELECT
            id,
            nombre,
            stock_actual,
            consumo_diario_est
        FROM inventario.medicamentos
    """)

    resultado = []

    for med in medicamentos:

        consumo = float(med["consumo_diario_est"] or 0)

        if consumo > 0:
            dias_restantes = med["stock_actual"] / consumo
        else:
            dias_restantes = None

        resultado.append({
            "id": med["id"],
            "nombre": med["nombre"],
            "stock_actual": med["stock_actual"],
            "consumo_diario": consumo,
            "dias_restantes": round(dias_restantes, 2) if dias_restantes else "Sin datos"
        })

    await conn.close()

    return resultado

# =========================================
# MEDICAMENTOS MÁS CONSUMIDOS
# =========================================

@app.get("/top-consumo")
async def top_consumo():

    conn = await get_connection()

    datos = await conn.fetch("""
        SELECT
            m.nombre,
            SUM(s.cantidad_consumida) as total_consumido
        FROM demanda.serie_historica s
        JOIN inventario.medicamentos m
            ON m.id = s.medicamento_id
        GROUP BY m.nombre
        ORDER BY total_consumido DESC
        LIMIT 10
    """)

    await conn.close()

    return [dict(x) for x in datos]

# =========================================
# ALERTAS AUTOMÁTICAS
# =========================================

@app.post("/generar-alertas")
async def generar_alertas():

    conn = await get_connection()

    medicamentos = await conn.fetch("""
        SELECT
            id,
            nombre,
            stock_actual,
            stock_minimo,
            fecha_vencimiento
        FROM inventario.medicamentos
    """)

    creadas = []

    for med in medicamentos:

        # STOCK BAJO
        if med["stock_actual"] <= med["stock_minimo"]:

            mensaje = f"Stock bajo para {med['nombre']}"

            await conn.execute("""
                INSERT INTO inventario.alertas
                (
                    medicamento_id,
                    tipo_alerta,
                    mensaje,
                    prioridad
                )
                VALUES ($1, $2, $3, $4)
            """,
            med["id"],
            "STOCK_BAJO",
            mensaje,
            "ALTA"
            )

            creadas.append(mensaje)

        # VENCIMIENTO
        dias = (
            med["fecha_vencimiento"] - date.today()
        ).days

        if dias <= 30:

            mensaje = f"{med['nombre']} vence pronto"

            await conn.execute("""
                INSERT INTO inventario.alertas
                (
                    medicamento_id,
                    tipo_alerta,
                    mensaje,
                    prioridad
                )
                VALUES ($1, $2, $3, $4)
            """,
            med["id"],
            "VENCIMIENTO",
            mensaje,
            "MEDIA"
            )

            creadas.append(mensaje)

    await conn.close()

    return {
        "mensaje": "Alertas generadas",
        "total_alertas": len(creadas),
        "alertas": creadas
    }