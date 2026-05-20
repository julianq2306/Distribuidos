const express = require('express');
const router = express.Router(); // Crear instancia del enrutador de Express
const { register, login, profile, getAllUsers } = require('../controllers/auth.controller'); // Controladores de autenticación
const { verifyToken, isAdmin } = require('../middlewares/auth'); // Middlewares de seguridad

// ─── RUTAS DE AUTENTICACIÓN ──────────────────────────────────────────────────

// POST /auth/register — Crear nuevo usuario
// Acceso: público (sin autenticación requerida)
router.post('/register', register);

// POST /auth/login — Iniciar sesión y obtener token JWT
// Acceso: público (sin autenticación requerida)
router.post('/login', login);

// GET /auth/profile — Ver perfil del usuario autenticado
// Acceso: cualquier usuario con token válido
router.get('/profile', verifyToken, profile);

// GET /auth/users — Listar todos los usuarios del sistema
// Acceso: solo administradores (verifyToken + isAdmin)
router.get('/users', verifyToken, isAdmin, getAllUsers);

module.exports = router;