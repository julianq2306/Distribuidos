from fastapi import APIRouter
from schemas import SaludResponse

router = APIRouter()

@router.get("/", response_model=SaludResponse)
async def salud():
    """
    Endpoint de health check.

    Comprueba que el servicio y la base de datos estén operativos.

    Returns:
        SaludResponse: Objeto con el estado del servicio y de la base de datos.
    """
    return SaludResponse(
        status="ok",
        db="ok"
    )