<<<<<<< HEAD
cat > src/middlewares/auth.js << 'EOF'
=======
>>>>>>> cbc3a25 (base de datos y usuarios subida)
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: solo admins' });
  }
  next();
};

<<<<<<< HEAD
module.exports = { verifyToken, isAdmin };
EOF
=======
module.exports = { verifyToken, isAdmin };
>>>>>>> cbc3a25 (base de datos y usuarios subida)
