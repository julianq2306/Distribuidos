const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD

// ─── MODELO: ROL ─────────────────────────────────────────────────────────────
// Define los roles del sistema y sus permisos asociados
// Ej: Administrador, Empleado
const Rol = sequelize.define(
  'Rol',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false, // Nombre del rol (obligatorio)
      unique: true      // No pueden existir dos roles con el mismo nombre
    },
    permisos_json: {
      type: DataTypes.JSONB,
      allowNull: true
      // Permisos del rol en formato JSON
      // Ej: { "inventario": ["leer", "escribir"], "usuarios": ["leer"] }
    },
  },
  {
    schema: 'usuarios', // Esquema de PostgreSQL del módulo de usuarios
    tableName: 'roles', // Nombre exacto de la tabla en la BD
    timestamps: false   // Desactivar createdAt/updatedAt de Sequelize
  }
);

module.exports = Rol;