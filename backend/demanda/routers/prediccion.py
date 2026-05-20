from fastapi import APIRouter

router = APIRouter()


@router.post(
    "/",
    summary="Realizar una predicción",
)
async def predecir():
    """
    Ejecuta el modelo de predicción y devuelve el resultado.

    Returns:
        dict con un mensaje indicando el estado de la predicción.
    """
    return {
        "mensaje": "Prediccion funcionando"
    }