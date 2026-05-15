const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const Rol = sequelize.define(
  'Rol',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    permisos_json: { type: DataTypes.JSONB, allowNull: true },
  },
  { schema: 'usuarios', tableName: 'roles', timestamps: false }
);

module.exports = Rol;