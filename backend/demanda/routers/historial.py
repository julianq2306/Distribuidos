from fastapi import APIRouter

router = APIRouter()

@router.get("/{medicamento_id}")
async def historial(medicamento_id: int):
    return {
        "medicamento_id": medicamento_id,
        "historial": []
    }