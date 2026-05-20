const jwt = require('jsonwebtoken'); // Para verificar tokens JWT

// ─── MIDDLEWARE: VERIFICAR TOKEN ─────────────────────────────────────────────
// Se ejecuta antes de rutas protegidas para validar que el usuario está autenticado
const verifyToken = (req, res, next) => {
  // Leer el header Authorization (formato esperado: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extraer solo el token

  // Si no hay token, rechazar la petición
  if (!token) {
    return res.status(401).json({
      message: 'Token requerido'
    });
  }

  try {
    // Verificar y decodificar el token usando la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar los datos del usuario en req.user para usarlos en el siguiente middleware
    req.user = decoded;
    next(); // Continuar al siguiente middleware o controlador
  } catch {
    // Si el token es inválido o expiró, rechazar la petición
    return res.status(403).json({
      message: 'Token inválido o expirado'
    });
  }
};

// ─── MIDDLEWARE: VERIFICAR ROL ADMIN ─────────────────────────────────────────
// Se usa después de verifyToken para restringir rutas solo a administradores
const isAdmin = (req, res, next) => {
  // Verificar que el rol del usuario autenticado sea 'admin'
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Acceso denegado: solo admins'
    });
  }

  next(); // El usuario es admin, continuar
};

// Exportar ambos middlewares para usarlos en las rutas
module.exports = { verifyToken, isAdmin };