import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import Medicamento from "./Medicamento.js";

const Alerta = sequelize.define(
  "Alerta",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    medicamento_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: Medicamento, key: "id" } },
    tipo_alerta: { type: DataTypes.STRING(30), allowNull: true }, // 'stock_bajo', 'vencimiento', 'sin_stock'
    mensaje: { type: DataTypes.TEXT, allowNull: true },
    prioridad: { type: DataTypes.STRING(10), allowNull: true }, // 'alta', 'media', 'baja'
    activa: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { schema: "inventario", tableName: "alertas", timestamps: false }
);

Alerta.belongsTo(Medicamento, { foreignKey: "medicamento_id", as: "medicamento" });
Medicamento.hasMany(Alerta, { foreignKey: "medicamento_id" });

export default Alerta;