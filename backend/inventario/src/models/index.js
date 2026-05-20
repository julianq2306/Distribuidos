// Instancia de Sequelize con la conexión configurada a la base de datos
import sequelize from "../db.js";

// Modelos del módulo de inventario que serán sincronizados con la base de datos
import Medicamento from "./Medicamento.js";
import Movimiento from "./Movimiento.js";
import Alerta from "./Alerta.js";

/**
 * syncDatabase
 * Función encargada de inicializar el módulo de inventario en la base de datos.
 *
 * Responsabilidades:
 *   1. Crear el esquema "inventario" si no existe.
 *   2. Sincronizar (crear/actualizar) las tablas a partir de los modelos.
 *   3. Insertar datos semilla (seed) si la tabla de medicamentos está vacía.
 *
 * Se ejecuta normalmente al arrancar el servidor.
 */
export const syncDatabase = async () => {
  try {
    // Crea el esquema "inventario" en PostgreSQL si aún no existe.
    // Útil para mantener las tablas de este módulo separadas de otros esquemas.
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS inventario`);
    console.log("✅ Esquema inventario verificado");

    // sync({ force: false }) crea la tabla SOLO si no existe.
    // Importante: NO se usa force: true porque eso eliminaría las tablas existentes
    // (DROP TABLE) y se perderían todos los datos.
    // El orden importa: primero Medicamento porque Movimiento y Alerta dependen de él (FK).
    await Medicamento.sync({ force: false });
    await Movimiento.sync({ force: false });
    await Alerta.sync({ force: false });

    console.log("✅ Tablas de inventario sincronizadas");

    // Verifica si la tabla de medicamentos está vacía.
    // Si lo está, se inserta un registro inicial para que la app no quede sin datos
    // (útil en entornos de desarrollo o primera ejecución en producción).
    const medCount = await Medicamento.count();
    if (medCount === 0) {
      await Medicamento.create({
        nombre: "Paracetamol 500mg",
        principio_activo: "Paracetamol",
        forma_farmaceutica: "Tableta",
        unidad_medida: "tabletas",
        stock_actual: 150,
        stock_minimo: 20,
        consumo_diario_est: 10,         // Consumo diario estimado (para proyecciones)
        lote: "LT-001",
        fecha_vencimiento: "2026-12-31",
        ubicacion: "A-1",               // Ubicación física en bodega/estantería
      });
      console.log("✅ Medicamento inicial insertado");
    }

  } catch (error) {
    // Si ocurre un error, se registra en consola y se relanza
    // para que quien invoque syncDatabase pueda manejarlo (por ejemplo, detener el servidor).
    console.error("❌ Error al sincronizar inventario:", error);
    throw error;
  }
};

// Re-exporta los modelos para que otros archivos puedan importarlos desde este punto único,
// evitando tener que importar cada modelo por separado.
// Ejemplo de uso: import { Medicamento, Alerta } from './models/index.js'
export { Medicamento, Movimiento, Alerta };