from fastapi import APIRouter
from schemas import SaludResponse

router = APIRouter()

@router.get("/", response_model=SaludResponse)
async def salud():
    return SaludResponse(
        status="ok",
        db="ok"
    )