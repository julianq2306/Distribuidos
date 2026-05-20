const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD

// ─── MODELO: MEDICAMENTO ─────────────────────────────────────────────────────
// Representa un medicamento en el inventario de la clínica
const Medicamento = sequelize.define(
  'Medicamento',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Se genera automáticamente
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false // Nombre comercial del medicamento (obligatorio)
    },
    principio_activo: {
      type: DataTypes.STRING(150),
      allowNull: true // Componente activo (ej: Paracetamol, Ibuprofeno)
    },
    forma_farmaceutica: {
      type: DataTypes.STRING(80),
      allowNull: true // Presentación (ej: Tableta, Jarabe, Inyectable)
    },
    unidad_medida: {
      type: DataTypes.STRING(50),
      allowNull: false // Unidad de conteo (ej: tabletas, ml, frascos)
    },
    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0 // Cantidad disponible actualmente
    },
    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5 // Umbral mínimo — por debajo genera alerta
    },
    stock_maximo: {
      type: DataTypes.INTEGER,
      allowNull: true // Umbral máximo permitido en inventario
    },
    consumo_diario_est: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0 // Promedio estimado de consumo diario (para predicciones)
    },
    lote: {
      type: DataTypes.STRING(100),
      allowNull: false // Número de lote del fabricante (trazabilidad)
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false // Fecha de vencimiento (solo fecha, sin hora)
    },
    ubicacion: {
      type: DataTypes.STRING(150),
      allowNull: false // Ubicación física en bodega (ej: 'A-1', 'Estante 3')
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true // false = medicamento dado de baja lógicamente
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Fecha de registro en el sistema
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Fecha de última modificación
    },
  },
  {
    schema: 'inventario',      // Esquema de PostgreSQL donde vive la tabla
    tableName: 'medicamentos', // Nombre exacto de la tabla en la BD
    timestamps: false          // Desactivar createdAt/updatedAt automáticos de Sequelize
  }
);

module.exports = Medicamento;