const { DataTypes } = require('sequelize'); // Tipos de datos de Sequelize
const sequelize = require('../Config/database'); // Instancia de conexión a la BD

// ─── MODELO: MODELO DE PREDICCIÓN ────────────────────────────────────────────
// Almacena los modelos de machine learning entrenados para predecir
// la demanda de medicamentos (ej: ARIMA, Prophet, regresión lineal)
const ModeloPrediccion = sequelize.define(
  'ModeloPrediccion',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    medicamento_id: {
      type: DataTypes.INTEGER,
      allowNull: true // Medicamento al que aplica este modelo
    },
    tipo_modelo: {
      type: DataTypes.STRING(30),
      allowNull: true // Algoritmo usado (ej: 'ARIMA', 'Prophet', 'LinearRegression')
    },
    parametros_json: {
      type: DataTypes.JSONB,
      allowNull: true // Hiperparámetros del modelo en formato JSON (ej: {p:1, d:1, q:1})
    },

    // ─── MÉTRICAS DE EVALUACIÓN DEL MODELO ───────────────────────────────────
    mape: {
      type: DataTypes.DECIMAL(8, 4),
      allowNull: true // Mean Absolute Percentage Error — error porcentual promedio
    },
    rmse: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true // Root Mean Square Error — penaliza errores grandes
    },
    mae: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true // Mean Absolute Error — error absoluto promedio
    },

    entrenado_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Fecha y hora en que se entrenó el modelo
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true // true = modelo vigente, false = reemplazado por uno nuevo
    },
  },
  {
    schema: 'demanda',               // Esquema de PostgreSQL del módulo de demanda
    tableName: 'modelos_prediccion', // Nombre exacto de la tabla en la BD
    timestamps: false                // Desactivar createdAt/updatedAt de Sequelize
  }
);

module.exports = ModeloPrediccion;