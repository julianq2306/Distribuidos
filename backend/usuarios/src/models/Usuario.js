const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const Rol = require('./Rol');

const Usuario = sequelize.define(
  'Usuario',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    contrasena: { type: DataTypes.STRING(255), allowNull: false },
    rol_id: { type: DataTypes.INTEGER, references: { model: Rol, key: 'id' } },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { schema: 'usuarios', tableName: 'usuarios', timestamps: false }
);

Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });
Rol.hasMany(Usuario, { foreignKey: 'rol_id' });

module.exports = Usuario;