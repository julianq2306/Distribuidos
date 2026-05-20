"""
Microservicio de Demanda.

Expone endpoints para dashboard de inventario, predicción de demanda
mediante suavizamiento exponencial, cálculo de riesgo de agotamiento,
ranking de consumo y gestión de alertas.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import os
import math
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
    """
    Abre una conexión asíncrona a PostgreSQL con SSL requerido.

    Returns:
        asyncpg.Connection: Conexión activa lista para ejecutar consultas.
    """
    return await asyncpg.connect(DATABASE_URL, ssl="require")

@app.get("/")
async def root():
    """
    Endpoint raíz. Confirma que el microservicio está operativo.

    Returns:
        dict: Mensaje de estado del servicio.
    """
    return {"mensaje": "Microservicio de demanda funcionando"}

@app.get("/dashboard")
async def dashboard():
    """
    Resumen general del inventario para el dashboard.

    Reúne en una sola respuesta: total de medicamentos activos,
    items con stock bajo, próximos a vencer (en 30 días), ya vencidos
    y alertas activas del sistema.

    Returns:
        dict: Información agregada del estado actual del inventario.
    """
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
    """
    Predice la demanda de un medicamento para los próximos 7 días.

    Usa el modelo de suavizamiento exponencial (Holt-Winters con tendencia
    aditiva) sobre la serie histórica de consumo. Calcula métricas de error
    (MAE, RMSE, MAPE), persiste el modelo entrenado, desactiva versiones
    anteriores y guarda las predicciones con intervalos de confianza del ±15%.

    Args:
        medicamento_id: ID único del medicamento a predecir.

    Returns:
        dict: ID del modelo generado, métricas de error y predicción
        diaria para los próximos 7 días con sus intervalos de confianza.
        Si hay menos de 3 puntos históricos, devuelve un error.
    """
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
    fitted = modelo.fittedvalues.tolist()

    # Calcular métricas
    n = len(fitted)
    serie_fit = serie[-n:]
    mae = round(sum(abs(r - f) for r, f in zip(serie_fit, fitted)) / n, 4)
    rmse = round(math.sqrt(sum((r - f) ** 2 for r, f in zip(serie_fit, fitted)) / n), 4)
    mape = round(
        sum(abs((r - f) / r) for r, f in zip(serie_fit, fitted) if r != 0) / n * 100, 4
    )

    # Desactivar modelos anteriores
    await conn.execute("""
        UPDATE demanda.modelos_prediccion
        SET activo = FALSE
        WHERE medicamento_id = $1
    """, medicamento_id)

    # Guardar modelo
    modelo_id = await conn.fetchval("""
        INSERT INTO demanda.modelos_prediccion
        (medicamento_id, tipo_modelo, parametros_json, mape, rmse, mae, activo)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE)
        RETURNING id
    """, medicamento_id, "ExponentialSmoothing",
        '{"trend": "add", "seasonal": null}',
        mape, rmse, mae)

    # Borrar predicciones anteriores del modelo
    await conn.execute("""
        DELETE FROM demanda.predicciones WHERE modelo_id = $1
    """, modelo_id)

    resultado = []
    for i, valor in enumerate(predicciones):
        fecha_pred = date.today() + timedelta(days=i + 1)
        pred_val = round(float(valor), 2)
        ic_inf = round(pred_val * 0.85, 2)
        ic_sup = round(pred_val * 1.15, 2)

        await conn.execute("""
            INSERT INTO demanda.predicciones
            (medicamento_id, modelo_id, fecha_pred, cantidad_pred, ic_inferior, ic_superior)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, medicamento_id, modelo_id, fecha_pred, pred_val, ic_inf, ic_sup)

        resultado.append({
            "dia": str(fecha_pred),
            "prediccion": pred_val,
            "ic_inferior": ic_inf,
            "ic_superior": ic_sup
        })

    await conn.close()

    return {
        "medicamento_id": medicamento_id,
        "modelo_id": modelo_id,
        "tipo_modelo": "ExponentialSmoothing",
        "metricas": {"mape": mape, "rmse": rmse, "mae": mae},
        "prediccion_7_dias": resultado
    }

@app.get("/riesgo-agotamiento")
async def riesgo_agotamiento():
    """
    Calcula los días restantes de stock para cada medicamento activo.

    Divide el stock actual entre el consumo diario estimado. Si no hay
    consumo estimado, devuelve "Sin datos" para ese medicamento.

    Returns:
        list[dict]: Lista con id, nombre, stock actual, consumo diario
        y días restantes estimados por medicamento.
    """
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
    """
    Top 10 de medicamentos más consumidos según la serie histórica.

    Agrega el total consumido por medicamento y devuelve los 10 con
    mayor consumo acumulado.

    Returns:
        list[dict]: Nombre y total consumido de los 10 medicamentos
        con mayor demanda histórica.
    """
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
    """
    Genera alertas automáticas de stock bajo y vencimiento próximo.

    Recorre todos los medicamentos activos y crea alertas para los que
    tengan stock por debajo del mínimo (prioridad ALTA) o que venzan
    en los próximos 30 días (prioridad MEDIA). Evita duplicados
    verificando que no exista ya una alerta activa del mismo tipo.

    Returns:
        dict: Mensaje de confirmación, total de alertas creadas
        y lista de los mensajes generados.
    """
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
    """
    Desactiva todas las alertas asociadas a un medicamento.

    Marca como inactivas todas las alertas del medicamento dado,
    sin eliminarlas (se conservan para auditoría).

    Args:
        medicamento_id: ID único del medicamento.

    Returns:
        dict: Mensaje de confirmación.
    """
    conn = await get_connection()
    await conn.execute("""
        UPDATE inventario.alertas
        SET activa = FALSE
        WHERE medicamento_id = $1
    """, medicamento_id)
    await conn.close()
    return {"mensaje": "Alertas desactivadas"}