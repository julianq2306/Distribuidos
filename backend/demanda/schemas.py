"""
Esquemas Pydantic para validación y serialización de datos.
"""

from pydantic import BaseModel


class SaludResponse(BaseModel):
    """
    Respuesta del endpoint de health check.

    Indica el estado general del servicio y de la conexión a la
    base de datos, junto con la versión de la API.
    """

    status: str
    db: str
    version: str = "1.0.0"