"""
Modelos ORM de SQLAlchemy.

Define las tablas de la base de datos mapeadas a clases de Python.
"""

from sqlalchemy import Column, Integer, String
from database import Base


class Medicamento(Base):
    """
    Modelo de un medicamento en el inventario.

    Mapea la tabla `inventario.medicamentos` y representa cada
    producto registrado con su información básica de stock y lote.
    """

    __tablename__ = "medicamentos"
    __table_args__ = {"schema": "inventario"}

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    cantidad = Column(Integer)
    unidad = Column(String)
    consumodiario = Column(Integer)
    lote = Column(String)