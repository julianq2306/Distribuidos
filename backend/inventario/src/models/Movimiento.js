// DataTypes: tipos de datos de Sequelize para definir las columnas del modelo
import { DataTypes } from "sequelize";

// Instancia de Sequelize configurada con la conexión a la base de datos
import sequelize from "../db.js";

// Modelo Medicamento, necesario para establecer la relación FK entre Movimiento y Medicamento
import Medicamento from "./Medicamento.js";

/**
 * Modelo Movimiento
 * Representa cada operación de inventario realizada sobre un medicamento.
 * Tipos posibles:
 *   - 'entrada': ingreso de unidades al inventario (compra, donación, devolución).
 *   - 'salida': egreso de unidades (despacho, consumo, vencimiento).
 *   - 'ajuste': corrección manual del stock (por inventario físico o errores).
 *
 * Tabla: inventario.movimientos
 * Sirve como bitácora/auditoría: permite reconstruir el historial de stock de cada medicamento.
 */
const Movimiento = sequelize.define(
  "Movimiento",
  {
    // Identificador único del movimiento (PK autoincremental)
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK al medicamento afectado por el movimiento.
    // No permite null porque todo movimiento debe estar asociado a un medicamento.
    medicamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Medicamento, key: "id" },
    },

    // Tipo de movimiento. Valores esperados: 'entrada', 'salida', 'ajuste'.
    // Sugerencia: podría implementarse como ENUM para garantizar integridad.
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    // Cantidad de unidades involucradas en el movimiento.
    // Se guarda como entero positivo; el "signo" (suma o resta) lo determina el campo `tipo`.
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Lote afectado por el movimiento (opcional).
    // Útil para trazabilidad: identifica de qué lote entraron/salieron las unidades.
    lote: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // Fecha en que ocurrió el movimiento (sin hora).
    // Puede diferir de created_at si el registro se hace en un momento posterior al hecho real.
    // Ejemplo: ingresar el lunes un movimiento físico que ocurrió el viernes anterior.
    fecha_movimiento: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },

    // Notas adicionales sobre el movimiento.
    // Ejemplo: "Devolución de paciente X", "Ajuste por inventario físico de Q1".
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Fecha y hora exactas en que se registró el movimiento en el sistema.
    // A diferencia de fecha_movimiento, esta marca de tiempo es de auditoría y no debería modificarse.
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: "inventario",        // Esquema de PostgreSQL donde vive la tabla
    tableName: "movimientos",    // Nombre exacto de la tabla
    timestamps: false,           // Se desactivan los timestamps automáticos de Sequelize
                                 // (created_at se maneja manualmente; no hay updated_at
                                 // porque los movimientos no deberían modificarse).
  }
);

/**
 * Asociaciones entre Movimiento y Medicamento.
 * Permiten incluir datos relacionados al hacer consultas.
 */

// Un Movimiento pertenece a un Medicamento.
// Con el alias "medicamento" se accede como: movimiento.medicamento
// Ejemplo: Movimiento.findAll({ include: 'medicamento' })
Movimiento.belongsTo(Medicamento, {
  foreignKey: "medicamento_id",
  as: "medicamento",
});

// Un Medicamento tiene muchos Movimientos (relación 1:N).
// Ejemplo: Medicamento.findByPk(1, { include: Movimiento })
Medicamento.hasMany(Movimiento, { foreignKey: "medicamento_id" });

// Exporta el modelo para ser usado en controladores y otros módulos
export default Movimiento;