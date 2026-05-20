const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD

// ─── MODELO: USER ────────────────────────────────────────────────────────────
// Representa los usuarios del sistema con autenticación JWT
// Maneja login, roles y permisos de acceso
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Genera un UUID único automáticamente
    primaryKey: true                // Más seguro que un ID numérico secuencial
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false // Nombre completo del usuario (obligatorio)
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false, // Email obligatorio
    unique: true      // No pueden existir dos usuarios con el mismo email
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false  // Contraseña hasheada con bcrypt (nunca en texto plano)
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user' // Por defecto todo usuario nuevo es 'user'
    // 'admin' — acceso total al sistema
    // 'user'  — acceso limitado según permisos
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true // false = usuario desactivado (baja lógica, no se elimina)
  },
});

module.exports = User;