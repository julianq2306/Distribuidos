const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD
const Rol = require('./Rol'); // Modelo relacionado

// ─── MODELO: USUARIO ─────────────────────────────────────────────────────────
// Representa los usuarios del sistema en el esquema 'usuarios' de PostgreSQL
// A diferencia del modelo User (JWT), este modelo usa rol_id como llave foránea
// y pertenece al esquema interno del microservicio de usuarios
const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario: {
      type: DataTypes.STRING(100),
      allowNull: false, // Nombre de usuario para login (obligatorio)
      unique: true      // No pueden existir dos usuarios con el mismo nombre
    },
    contrasena: {
      type: DataTypes.STRING(255),
      allowNull: false // Contraseña del usuario (debe guardarse hasheada)
    },
    rol_id: {
      type: DataTypes.INTEGER,
      references: { model: Rol, key: 'id' } // Llave foránea hacia la tabla de roles
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true // false = usuario desactivado (baja lógica)
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Fecha de creación del usuario
    },
  },
  {
    schema: 'usuarios',  // Esquema de PostgreSQL del módulo de usuarios
    tableName: 'usuarios', // Nombre exacto de la tabla en la BD
    timestamps: false    // Desactivar createdAt/updatedAt de Sequelize
  }
);

// ─── RELACIONES ──────────────────────────────────────────────────────────────
// Un usuario pertenece a un rol (accesible como usuario.rol)
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });

// Un rol puede tener muchos usuarios asignados
Rol.hasMany(Usuario, { foreignKey: 'rol_id' });

module.exports = Usuario;