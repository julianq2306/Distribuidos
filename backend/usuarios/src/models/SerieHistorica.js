const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD

// ─── MODELO: SERIE HISTÓRICA ─────────────────────────────────────────────────
// Registra el consumo diario histórico de cada medicamento
// Es la fuente de datos principal para entrenar los modelos de predicción de demanda
const SerieHistorica = sequelize.define(
  'SerieHistorica',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medicamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true // Medicamento al que corresponde este registro de consumo
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false // Fecha del registro (solo fecha, sin hora)
    },
    cantidad_consumida: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0 // Unidades consumidas ese día (0 si no hubo consumo)
    },
  },
  {
    schema: 'demanda',           // Esquema de PostgreSQL del módulo de demanda
    tableName: 'serie_historica', // Nombre exacto de la tabla en la BD
    timestamps: false             // Desactivar createdAt/updatedAt de Sequelize
  }
);

module.exports = SerieHistorica;