const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD
const ModeloPrediccion = require('./ModeloPrediccion'); // Modelo relacionado

// ─── MODELO: PREDICCIÓN ──────────────────────────────────────────────────────
// Almacena los resultados generados por un modelo de predicción
// Cada registro es una predicción de demanda para un medicamento en una fecha futura
const Prediccion = sequelize.define(
  'Prediccion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medicamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true // Medicamento al que corresponde esta predicción
    },
    modelo_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: ModeloPrediccion, key: 'id' } // Modelo que generó la predicción
    },
    fecha_pred: {
      type: DataTypes.DATEONLY,
      allowNull: true // Fecha futura para la que se predice la demanda
    },
    cantidad_pred: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true // Cantidad de unidades predichas para esa fecha
    },

    // ─── INTERVALO DE CONFIANZA ───────────────────────────────────────────────
    ic_inferior: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true // Límite inferior del intervalo de confianza
    },
    ic_superior: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true // Límite superior del intervalo de confianza
    },
  },
  {
    schema: 'demanda',         // Esquema de PostgreSQL del módulo de demanda
    tableName: 'predicciones', // Nombre exacto de la tabla en la BD
    timestamps: false          // Desactivar createdAt/updatedAt de Sequelize
  }
);

// ─── RELACIONES ──────────────────────────────────────────────────────────────
// Una predicción fue generada por un modelo (accesible como prediccion.modelo)
Prediccion.belongsTo(ModeloPrediccion, { foreignKey: 'modelo_id', as: 'modelo' });

// Un modelo puede haber generado muchas predicciones
ModeloPrediccion.hasMany(Prediccion, { foreignKey: 'modelo_id' });

module.exports = Prediccion;