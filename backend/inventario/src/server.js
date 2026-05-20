// Framework HTTP minimalista para Node.js — base del servidor.
import express from "express";

// Middleware que habilita CORS (Cross-Origin Resource Sharing).
// Permite que el frontend (en otro dominio/puerto) consuma esta API.
import cors from "cors";

// Función que crea el esquema, sincroniza las tablas e inserta datos semilla.
// Se ejecuta antes de levantar el servidor para garantizar que la BD esté lista.
import { syncDatabase } from "./models/index.js";

// Router con todas las rutas relacionadas a medicamentos.
import medicamentosRoutes from "./routes/medicamentos.routes.js";

// Crea la instancia principal de la aplicación Express.
const app = express();

/**
 * Middlewares globales
 * Se ejecutan en cada request, antes de llegar a las rutas.
 * El orden importa: deben declararse ANTES de las rutas.
 */

// Habilita CORS para TODOS los orígenes (configuración permisiva por defecto).
// En producción conviene restringirlo a dominios específicos por seguridad.
app.use(cors());

// Parsea el body de las peticiones en formato JSON y lo pone en req.body.
// Sin esto, req.body sería undefined en POST/PUT.
app.use(express.json());

/**
 * Ruta raíz (health check básico).
 * Útil para verificar que el servicio está corriendo (por ejemplo desde un load balancer).
 */
app.get("/", (req, res) => {
  res.send("Servicio de inventario funcionando 🚀");
});

// Monta el router de medicamentos bajo el prefijo /medicamentos.
// Todas las rutas definidas en medicamentos.routes.js heredan este prefijo.
// Ejemplo: router.get('/alertas') → GET /medicamentos/alertas
app.use("/medicamentos", medicamentosRoutes);

// Puerto en el que escuchará el servidor.
// Toma el valor de la variable de entorno PORT (asignado por el host en producción)
// y usa 3001 como fallback en desarrollo local.
const PORT = process.env.PORT || 3001;

/**
 * Arranque del servidor.
 *
 * Estrategia: NO se levanta el servidor hasta que la base de datos esté lista.
 * Esto evita que lleguen requests mientras los modelos aún se están sincronizando,
 * lo cual podría provocar errores en las primeras peticiones.
 */
syncDatabase()
  .then(() => {
    // Si la sincronización fue exitosa, se inicia el servidor HTTP.
    app.listen(PORT, () =>
      console.log(`🚀 Inventario en puerto ${PORT}`)
    );
  })
  .catch((err) => {
    // Si falla la conexión/sincronización con la BD, se aborta el arranque.
    // process.exit(1) termina el proceso con código de error, lo que permite
    // que sistemas como PM2, Docker o Kubernetes detecten el fallo y reinicien el contenedor.
    console.error("❌ No se pudo iniciar inventario:", err);
    process.exit(1);
  });