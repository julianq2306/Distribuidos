from pydantic import BaseModel

class SaludResponse(BaseModel):
    status: str
    db: str
    version: str = "1.0.0"