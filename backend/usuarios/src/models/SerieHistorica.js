const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const SerieHistorica = sequelize.define(
  'SerieHistorica',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    medicamento_id: { type: DataTypes.INTEGER, allowNull: true },
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    cantidad_consumida: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  },
  { schema: 'demanda', tableName: 'serie_historica', timestamps: false }
);

module.exports = SerieHistorica;