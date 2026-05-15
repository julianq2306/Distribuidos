const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const ModeloPrediccion = sequelize.define(
  'ModeloPrediccion',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    medicamento_id: { type: DataTypes.INTEGER, allowNull: true },
    tipo_modelo: { type: DataTypes.STRING(30), allowNull: true },
    parametros_json: { type: DataTypes.JSONB, allowNull: true },
    mape: { type: DataTypes.DECIMAL(8, 4), allowNull: true },
    rmse: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    mae: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
    entrenado_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { schema: 'demanda', tableName: 'modelos_prediccion', timestamps: false }
);

module.exports = ModeloPrediccion;