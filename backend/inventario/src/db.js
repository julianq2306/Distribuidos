// Importa la clase principal de Sequelize, el ORM usado para interactuar con la base de datos.
import { Sequelize } from "sequelize";

/**
 * Configuración de la conexión a la base de datos.
 *
 * Se crea una única instancia de Sequelize que será compartida por toda la aplicación
 * (patrón singleton). Importarla desde otros archivos garantiza usar la misma conexión.
 */
const sequelize = new Sequelize(
  // URL de conexión a la base de datos, leída desde las variables de entorno.
  // Formato esperado: postgres://usuario:contraseña@host:puerto/nombre_basedatos
  // Se usa process.env para no exponer credenciales en el código fuente.
  process.env.DATABASE_URL,
  {
    // Motor de base de datos a utilizar.
    // PostgreSQL en este caso (Sequelize también soporta MySQL, SQLite, MSSQL, etc.)
    dialect: "postgres",

    // Desactiva el logging de todas las consultas SQL en consola.
    // En desarrollo conviene activarlo (logging: console.log) para depuración.
    logging: false,

    // Opciones específicas del driver de PostgreSQL.
    dialectOptions: {
      ssl: {
        // Obliga a usar conexión cifrada SSL/TLS.
        // Requerido por servicios cloud como Heroku, Render, Supabase, Neon, AWS RDS, etc.
        require: true,

        // No rechaza certificados auto-firmados.
        // Necesario en muchos proveedores cloud que usan certificados internos no verificables.
        // ⚠️ En producción ideal sería usar el certificado CA del proveedor en lugar de
        //   desactivar esta validación, ya que abre paso a posibles ataques man-in-the-middle.
        rejectUnauthorized: false,
      },
    },
  }
);

// Exporta la instancia para que sea reutilizada en modelos y otros módulos.
// Ejemplo: import sequelize from "../db.js";
export default sequelize;