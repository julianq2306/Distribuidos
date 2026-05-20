const bcrypt = require('bcryptjs');  // Para hashear y comparar contraseñas
const jwt = require('jsonwebtoken'); // Para generar y verificar tokens JWT
const User = require('../models/User'); // Modelo de usuario en la base de datos

// ─── REGISTRO ───────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Verificar que el email no esté ya registrado
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email ya registrado' });

    // Hashear la contraseña con bcrypt (10 rondas de sal)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario en la base de datos
    // Si no se especifica rol, se asigna 'user' por defecto
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    res.status(201).json({ message: 'Usuario creado', userId: user.id });
  } catch (err) {
    res.status(500).json({ message: 'Error al registrar', error: err.message });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Comparar contraseña ingresada contra el hash almacenado
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Contraseña incorrecta' });

    // Generar token JWT con id, email y rol del usuario
    // El token expira en 8 horas
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Retornar token y datos básicos del usuario
    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    res.status(500).json({ message: 'Error al hacer login', error: err.message });
  }
};

// ─── PERFIL PROPIO ───────────────────────────────────────────────────────────
// Retorna los datos del usuario autenticado (sin la contraseña)
const profile = async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }, // Excluir contraseña de la respuesta
  });
  res.json(user);
};

// ─── LISTAR TODOS LOS USUARIOS (solo admin) ──────────────────────────────────
// Retorna todos los usuarios registrados (sin contraseñas)
const getAllUsers = async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
};

module.exports = { register, login, profile, getAllUsers };