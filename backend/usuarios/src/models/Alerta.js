const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const Medicamento = require('./Medicamento');

const Alerta = sequelize.define(
  'Alerta',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    medicamento_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: Medicamento, key: 'id' } },
    tipo_alerta: { type: DataTypes.STRING(30), allowNull: true },
    mensaje: { type: DataTypes.TEXT, allowNull: true },
    prioridad: { type: DataTypes.STRING(10), allowNull: true },
    activa: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { schema: 'inventario', tableName: 'alertas', timestamps: false }
);

Alerta.belongsTo(Medicamento, { foreignKey: 'medicamento_id', as: 'medicamento' });
Medicamento.hasMany(Alerta, { foreignKey: 'medicamento_id' });

module.exports = Alerta;