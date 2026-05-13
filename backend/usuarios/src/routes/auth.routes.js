const express = require('express');
const router = express.Router();
const { register, login, profile, getAllUsers } = require('../controllers/auth.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, profile);
router.get('/users', verifyToken, isAdmin, getAllUsers);

module.exports = router;