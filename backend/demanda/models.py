from sqlalchemy import Column, Integer, String
from database import Base

class Medicamento(Base):
    __tablename__ = "medicamentos"
    __table_args__ = {"schema": "inventario"}

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    cantidad = Column(Integer)
    unidad = Column(String)
    consumodiario = Column(Integer)
    lote = Column(String)