// DataTypes: tipos de datos de Sequelize para definir las columnas del modelo
import { DataTypes } from "sequelize";

// Instancia de Sequelize ya configurada con la conexión a la base de datos
import sequelize from "../db.js";

/**
 * Modelo Medicamento
 * Representa un medicamento dentro del inventario.
 * Contiene información farmacéutica, de stock, ubicación y control de vencimiento.
 *
 * Tabla: inventario.medicamentos
 */
const Medicamento = sequelize.define(
  "Medicamento",
  {
    // Identificador único del medicamento (PK autoincremental)
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // Nombre comercial del medicamento (ej: "Paracetamol 500mg")
    // Es obligatorio porque es el campo principal de identificación.
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    // Sustancia activa del medicamento (ej: "Paracetamol", "Ibuprofeno")
    // Permite null por si se desconoce o no aplica.
    principio_activo: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    // Presentación farmacéutica (ej: "Tableta", "Jarabe", "Cápsula", "Inyectable")
    forma_farmaceutica: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },

    // Unidad de medida usada para contabilizar el stock (ej: "tabletas", "ml", "ampolletas")
    // Obligatorio porque sin esta unidad el stock no tendría sentido.
    unidad_medida: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    // Cantidad disponible actualmente en inventario.
    // Empieza en 0 por defecto si no se especifica al crear el registro.
    stock_actual: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    // Umbral mínimo de stock. Si stock_actual <= stock_minimo, se genera alerta.
    // Valor por defecto: 5 unidades.
    stock_minimo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },

    // Umbral máximo de stock recomendado (opcional).
    // Útil para evitar sobrecompra o caducidad por exceso de inventario.
    stock_maximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Consumo diario estimado del medicamento.
    // DECIMAL(10,2) permite valores con decimales (ej: 2.5 tabletas/día promedio).
    // Útil para proyectar duración del stock y planificar compras.
    consumo_diario_est: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // Número de lote del fabricante (obligatorio para trazabilidad regulatoria).
    // Permite identificar lotes en caso de recall o problemas de calidad.
    lote: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    // Fecha de vencimiento del lote.
    // DATEONLY: solo guarda la fecha (YYYY-MM-DD) sin la hora.
    // Es obligatorio porque es crítico para alertas de vencimiento.
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    // Ubicación física dentro de la bodega o farmacia (ej: "Estante A-1", "Refrigerador 2")
    ubicacion: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    // Bandera para soft delete: true = activo, false = eliminado/dado de baja.
    // Permite ocultar el medicamento sin borrarlo físicamente de la base de datos.
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // Fecha de creación del registro. Se asigna automáticamente al hacer INSERT.
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    // Fecha de última actualización.
    // Nota: con timestamps: false, este campo NO se actualiza automáticamente
    // en cada update; habría que asignarlo manualmente o usar un hook.
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: "inventario",        // Esquema de PostgreSQL donde vive la tabla
    tableName: "medicamentos",   // Nombre exacto de la tabla (sin pluralización automática)
    timestamps: false,           // Desactiva el manejo automático de createdAt/updatedAt
                                 // (ya se definieron manualmente como created_at/updated_at)
  }
);

// Exporta el modelo para ser usado en controladores, asociaciones, etc.
export default Medicamento;