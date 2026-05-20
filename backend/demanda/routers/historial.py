from fastapi import APIRouter

router = APIRouter()


@router.get(
    "/{medicamento_id}",
    summary="Obtener historial de un medicamento",
)
async def historial(medicamento_id: int):
    
    """
    Devuelve el historial de eventos asociado a un medicamento.

    Args:
        medicamento_id: ID único del medicamento.

    Returns:
        dict con el ID del medicamento y su lista de historial.
    """
    return {
        "medicamento_id": medicamento_id,
        "historial": []
    }