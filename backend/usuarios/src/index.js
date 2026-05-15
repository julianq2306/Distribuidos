const express = require('express');
const sequelize = require('./Config/database');

// Modelos existentes
const User = require('./models/User');

// Modelos nuevos - esquema usuarios
const Rol     = require('./models/Rol');
const Usuario = require('./models/Usuario');

// Modelos nuevos - esquema inventario
const Medicamento = require('./models/Medicamento');
const Movimiento  = require('./models/Movimiento');
const Alerta      = require('./models/Alerta');

// Modelos nuevos - esquema demanda
const SerieHistorica   = require('./models/SerieHistorica');
const ModeloPrediccion = require('./models/ModeloPrediccion');
const Prediccion       = require('./models/Prediccion');

// Rutas
const authRoutes = require('./routes/auth.routes');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servicio de usuarios funcionando 🚀');
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;

const syncDatabase = async () => {
  try {
    // Crear esquemas
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS usuarios`);
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS inventario`);
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS demanda`);
    console.log('✅ Esquemas verificados');

    // Sincronizar tablas en orden
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

    // Datos iniciales de roles
    const rolesCount = await Rol.count();
    if (rolesCount === 0) {
      await Rol.bulkCreate([{ nombre: 'Administrador' }, { nombre: 'Empleado' }]);
      await Usuario.create({ usuario: 'admin', contrasena: 'admin123', rol_id: 1 });
      console.log('✅ Roles y usuario admin insertados');
    }

    // Datos iniciales de medicamentos
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

syncDatabase().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
}).catch((err) => {
  console.error('❌ No se pudo iniciar:', err);
  process.exit(1);
});