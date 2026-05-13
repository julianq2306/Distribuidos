import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "inventario_clinica",
  password: process.env.DB_PASSWORD || "",
  port: parseInt(process.env.DB_PORT) || 5432,
});

pool.on("error", (err) => {
  console.error("Error en pool de PostgreSQL:", err);
});

export default pool;