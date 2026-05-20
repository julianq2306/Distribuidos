const express = require('express');
const cors = require('cors');                          // Permite peticiones desde otros orígenes (frontend)
const sequelize = require('./Config/database');        // Instancia de conexión a PostgreSQL

// ─── IMPORTACIÓN DE MODELOS ──────────────────────────────────────────────────
// Módulo de usuarios
const User     = require('./models/User');             // Usuario con autenticación JWT
const Rol      = require('./models/Rol');              // Roles del sistema
const Usuario  = require('./models/Usuario');          // Usuario interno con rol_id

// Módulo de inventario
const Medicamento = require('./models/Medicamento');   // Medicamentos en stock
const Movimiento  = require('./models/Movimiento');    // Entradas y salidas de medicamentos
const Alerta      = require('./models/Alerta');        // Alertas de stock bajo o vencimiento

// Módulo de demanda
const SerieHistorica   = require('./models/SerieHistorica');   // Historial de consumo diario
const ModeloPrediccion = require('./models/ModeloPrediccion'); // Modelos ML entrenados
const Prediccion       = require('./models/Prediccion');       // Resultados de predicciones

// ─── RUTAS ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');    // Rutas de autenticación

// ─── CONFIGURACIÓN DE EXPRESS ────────────────────────────────────────────────
const app = express();
app.use(cors());           // Habilitar CORS para todos los orígenes
app.use(express.json());   // Parsear el body de las peticiones como JSON

// Ruta raíz — verificar que el servicio está activo
app.get('/', (req, res) => {
  res.send('Servicio de usuarios funcionando 🚀');
});

// Montar rutas de autenticación bajo el prefijo /auth
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;

// ─── SINCRONIZACIÓN DE BASE DE DATOS ─────────────────────────────────────────
const syncDatabase = async () => {
  try {
    // Crear esquemas si no existen (organización por módulo en PostgreSQL)
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS usuarios`);
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS inventario`);
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS demanda`);
    console.log('✅ Esquemas verificados');

    // Sincronizar tablas en orden (respetando dependencias entre modelos)
    // force: false — no eliminar tablas existentes, solo crear si no existen
    await User.sync({ force: false });
    await Rol.sync({ force: false });
    await Usuario.sync({ force: false });
    await Medicamento.sync({ force: false });
    await Movimiento.sync({ force: false });
    await Alerta.sync({ force: false });
    await SerieHistorica.sync({ force: false });
    await ModeloPrediccion.sync({ force: false });
    await Prediccion.sync({ force: false });

    console.log('✅ Todas las tablas sincronizadas');

    // ─── DATOS INICIALES (SEED) ───────────────────────────────────────────────
    // Insertar roles y usuario admin solo si la tabla está vacía
    const rolesCount = await Rol.count();
    if (rolesCount === 0) {
      await Rol.bulkCreate([{ nombre: 'Administrador' }, { nombre: 'Empleado' }]);
      await Usuario.create({ usuario: 'admin', contrasena: 'admin123', rol_id: 1 });
      console.log('✅ Roles y usuario admin insertados');
    }

    // Insertar medicamento de ejemplo solo si el inventario está vacío
    const medCount = await Medicamento.count();
    if (medCount === 0) {
      await Medicamento.create({
        nombre: 'Paracetamol 500mg',
        principio_activo: 'Paracetamol',
        forma_farmaceutica: 'Tableta',
        unidad_medida: 'tabletas',
        stock_actual: 150,
        stock_minimo: 20,
        consumo_diario_est: 10,
        lote: 'LT-001',
        fecha_vencimiento: '2026-12-31',
        ubicacion: 'A-1',
      });
      console.log('✅ Medicamento inicial insertado');
    }

  } catch (error) {
    console.error('❌ Error al sincronizar:', error);
    throw error;
  }
};

// ─── INICIO DEL SERVIDOR ─────────────────────────────────────────────────────
// Primero sincronizar la BD, luego levantar el servidor
syncDatabase().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
}).catch((err) => {
  console.error('❌ No se pudo iniciar:', err);
  process.exit(1); // Terminar el proceso si la BD no conecta
});