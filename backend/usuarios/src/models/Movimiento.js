const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const Medicamento = require('./Medicamento');

const Movimiento = sequelize.define(
  'Movimiento',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    medicamento_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Medicamento, key: 'id' } },
    tipo: { type: DataTypes.STRING(20), allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    lote: { type: DataTypes.STRING(100), allowNull: true },
    fecha_movimiento: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    observaciones: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { schema: 'inventario', tableName: 'movimientos', timestamps: false }
);

Movimiento.belongsTo(Medicamento, { foreignKey: 'medicamento_id', as: 'medicamento' });
Medicamento.hasMany(Movimiento, { foreignKey: 'medicamento_id' });

module.exports = Movimiento;