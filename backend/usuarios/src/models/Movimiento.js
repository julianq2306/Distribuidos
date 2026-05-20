const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD
const Medicamento = require('./Medicamento'); // Modelo relacionado

// ─── MODELO: MOVIMIENTO ──────────────────────────────────────────────────────
// Registra cada entrada o salida de medicamentos del inventario
// Permite trazabilidad completa del stock (quién movió qué y cuándo)
const Movimiento = sequelize.define(
  'Movimiento',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medicamento_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Medicamento, key: 'id' } // Llave foránea hacia Medicamento
    },
    tipo: {
      type: DataTypes.STRING(20),
      allowNull: false // Tipo de movimiento (ej: 'entrada', 'salida', 'ajuste')
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false // Unidades movidas (positivo = entrada, negativo = salida)
    },
    lote: {
      type: DataTypes.STRING(100),
      allowNull: true // Número de lote asociado al movimiento
    },
    fecha_movimiento: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW // Fecha en que ocurrió el movimiento
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true // Notas adicionales (ej: 'Devolución proveedor', 'Vencido')
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Fecha de registro en el sistema
    },
  },
  {
    schema: 'inventario',    // Esquema de PostgreSQL del módulo de inventario
    tableName: 'movimientos', // Nombre exacto de la tabla en la BD
    timestamps: false         // Desactivar createdAt/updatedAt de Sequelize
  }
);

// ─── RELACIONES ──────────────────────────────────────────────────────────────
// Un movimiento pertenece a un medicamento (accesible como movimiento.medicamento)
Movimiento.belongsTo(Medicamento, { foreignKey: 'medicamento_id', as: 'medicamento' });

// Un medicamento puede tener muchos movimientos (historial completo)
Medicamento.hasMany(Movimiento, { foreignKey: 'medicamento_id' });

module.exports = Movimiento;