const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const ModeloPrediccion = require('./ModeloPrediccion');

const Prediccion = sequelize.define(
  'Prediccion',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    medicamento_id: { type: DataTypes.INTEGER, allowNull: true },
    modelo_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: ModeloPrediccion, key: 'id' } },
    fecha_pred: { type: DataTypes.DATEONLY, allowNull: true },
    cantidad_pred: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ic_inferior: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    ic_superior: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  },
  { schema: 'demanda', tableName: 'predicciones', timestamps: false }
);

Prediccion.belongsTo(ModeloPrediccion, { foreignKey: 'modelo_id', as: 'modelo' });
ModeloPrediccion.hasMany(Prediccion, { foreignKey: 'modelo_id' });

module.exports = Prediccion;