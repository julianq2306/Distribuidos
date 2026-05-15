import sequelize from "../db.js";
import Medicamento from "./Medicamento.js";
import Movimiento from "./Movimiento.js";
import Alerta from "./Alerta.js";

export const syncDatabase = async () => {
  try {
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS inventario`);
    console.log("✅ Esquema inventario verificado");

    await Medicamento.sync({ force: false });
    await Movimiento.sync({ force: false });
    await Alerta.sync({ force: false });

    console.log("✅ Tablas de inventario sincronizadas");

    const medCount = await Medicamento.count();
    if (medCount === 0) {
      await Medicamento.create({
        nombre: "Paracetamol 500mg",
        principio_activo: "Paracetamol",
        forma_farmaceutica: "Tableta",
        unidad_medida: "tabletas",
        stock_actual: 150,
        stock_minimo: 20,
        consumo_diario_est: 10,
        lote: "LT-001",
        fecha_vencimiento: "2026-12-31",
        ubicacion: "A-1",
      });
      console.log("✅ Medicamento inicial insertado");
    }

  } catch (error) {
    console.error("❌ Error al sincronizar inventario:", error);
    throw error;
  }
};

export { Medicamento, Movimiento, Alerta };