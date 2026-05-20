const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD
const Medicamento = require('./Medicamento'); // Modelo relacionado

// ─── MODELO: ALERTA ──────────────────────────────────────────────────────────
// Representa una alerta generada sobre un medicamento (ej: stock bajo, vencimiento)
const Alerta = sequelize.define(
  'Alerta',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Se genera automáticamente
    },
    medicamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Medicamento, key: 'id' } // Llave foránea hacia Medicamento
    },
    tipo_alerta: {
      type: DataTypes.STRING(30),
      allowNull: true // Ej: 'stock_bajo', 'vencimiento', 'caducado'
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: true // Descripción detallada de la alerta
    },
    prioridad: {
      type: DataTypes.STRING(10),
      allowNull: true // Ej: 'alta', 'media', 'baja'
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true // true = alerta pendiente, false = resuelta
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Fecha de creación automática
    },
  },
  {
    schema: 'inventario',   // Esquema de PostgreSQL donde vive la tabla
    tableName: 'alertas',   // Nombre exacto de la tabla en la BD
    timestamps: false       // Desactivar createdAt/updatedAt automáticos de Sequelize
  }
);

// ─── RELACIONES ──────────────────────────────────────────────────────────────
// Una alerta pertenece a un medicamento (accesible como alerta.medicamento)
Alerta.belongsTo(Medicamento, { foreignKey: 'medicamento_id', as: 'medicamento' });

// Un medicamento puede tener muchas alertas
Medicamento.hasMany(Alerta, { foreignKey: 'medicamento_id' });

module.exports = Alerta;