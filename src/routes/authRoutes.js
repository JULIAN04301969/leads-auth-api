// ============================================================
// Enrutador de autenticación
// Sistema de Gestión Integral de Leads
// ============================================================
// Define los endpoints HTTP del servicio de autenticación
// y los conecta con sus respectivos controladores.
// Las rutas privadas pasan primero por el middleware verifyToken
// antes de llegar al controlador correspondiente.
//
// Tabla de endpoints:
//   POST /api/auth/registro  → Público  → registrar()
//   POST /api/auth/login     → Público  → iniciarSesion()
//   GET  /api/auth/perfil    → Privado  → perfil()
// ============================================================

const express      = require('express');
const router       = express.Router();
const { registrar, iniciarSesion, perfil } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Rutas públicas — accesibles sin autenticación previa
router.post('/registro', registrar);
router.post('/login', iniciarSesion);

// Ruta privada — el middleware verifyToken valida el JWT antes de ejecutar perfil()
router.get('/perfil', verifyToken, perfil);

module.exports = router;