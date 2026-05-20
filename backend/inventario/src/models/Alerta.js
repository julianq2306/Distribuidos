// DataTypes: tipos de datos que ofrece Sequelize para definir columnas (INTEGER, STRING, etc.)
import { DataTypes } from "sequelize";

// Instancia de Sequelize ya configurada con la conexión a la base de datos
import sequelize from "../db.js";

// Modelo Medicamento, necesario para establecer la relación (FK) entre Alerta y Medicamento
import Medicamento from "./Medicamento.js";

/**
 * Modelo Alerta
 * Representa una notificación generada por el sistema sobre un medicamento.
 * Por ejemplo: stock bajo, próximo a vencer, sin stock, etc.
 *
 * Tabla: inventario.alertas
 */
const Alerta = sequelize.define(
  "Alerta",
  {
    // Identificador único de la alerta (PK autoincremental)
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // FK hacia la tabla medicamentos.
    // Se permite null por si la alerta no está asociada a un medicamento específico
    // (por ejemplo, una alerta general del sistema).
    medicamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Medicamento, key: "id" },
    },

    // Tipo de alerta. Se usa un string corto para identificar la categoría.
    // Valores esperados: 'stock_bajo', 'vencimiento', 'sin_stock'
    // Sugerencia: podría ser un ENUM para garantizar la integridad de los valores.
    tipo_alerta: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    // Texto descriptivo de la alerta que se mostrará al usuario.
    // Se usa TEXT porque puede ser un mensaje largo y no tiene límite fijo.
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Nivel de prioridad de la alerta.
    // Valores esperados: 'alta', 'media', 'baja'
    // Igual que tipo_alerta, podría implementarse como ENUM.
    prioridad: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },

    // Indica si la alerta sigue vigente (true) o ya fue resuelta/descartada (false).
    // Por defecto, toda alerta nueva nace como activa.
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // Fecha de creación de la alerta. Se asigna automáticamente al momento del INSERT.
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    // Opciones del modelo:
    schema: "inventario",        // Esquema de PostgreSQL donde se encuentra la tabla
    tableName: "alertas",        // Nombre exacto de la tabla (evita pluralización automática)
    timestamps: false,           // Desactiva createdAt/updatedAt automáticos de Sequelize
                                 // (ya se maneja created_at manualmente)
  }
);

/**
 * Definición de relaciones (asociaciones) entre modelos.
 * Esto permite hacer consultas con include para traer los datos relacionados.
 */

// Una Alerta pertenece a un Medicamento.
// El alias "medicamento" permite acceder al objeto con: alerta.medicamento
// Ejemplo de uso: Alerta.findAll({ include: 'medicamento' })
Alerta.belongsTo(Medicamento, {
  foreignKey: "medicamento_id",
  as: "medicamento",
});

// Un Medicamento puede tener muchas Alertas asociadas (relación 1:N).
// Ejemplo de uso: Medicamento.findAll({ include: Alerta })
Medicamento.hasMany(Alerta, { foreignKey: "medicamento_id" });

// Exporta el modelo para ser utilizado en controladores y otros módulos
export default Alerta;