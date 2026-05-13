from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def predecir():
    return {
        "mensaje": "Prediccion funcionando"
    }