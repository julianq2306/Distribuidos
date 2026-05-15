import { DataTypes } from "sequelize";
import sequelize from "../db.js";

const Medicamento = sequelize.define(
  "Medicamento",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(150), allowNull: false },
    principio_activo: { type: DataTypes.STRING(150), allowNull: true },
    forma_farmaceutica: { type: DataTypes.STRING(80), allowNull: true },
    unidad_medida: { type: DataTypes.STRING(50), allowNull: false },
    stock_actual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
    stock_maximo: { type: DataTypes.INTEGER, allowNull: true },
    consumo_diario_est: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    lote: { type: DataTypes.STRING(100), allowNull: false },
    fecha_vencimiento: { type: DataTypes.DATEONLY, allowNull: false },
    ubicacion: { type: DataTypes.STRING(150), allowNull: false },
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { schema: "inventario", tableName: "medicamentos", timestamps: false }
);

export default Medicamento;