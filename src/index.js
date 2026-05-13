require('dotenv').config();
const express = require('express');
const sequelize = require('./Config/database');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);

sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Base de datos sincronizada');
  app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));
}).catch(err => console.error('❌ Error DB:', err));