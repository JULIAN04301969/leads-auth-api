// ============================================================
// Middleware de verificación de tokens JWT
// Sistema de Gestión Integral de Leads
// ============================================================
// Intercepta peticiones a rutas protegidas y valida que el
// cliente incluya un token JWT válido en el encabezado
// Authorization bajo el esquema: Bearer <token>
//
// Flujo:
//   1. Leer encabezado Authorization
//   2. Extraer el token del formato Bearer
//   3. Verificar firma y expiración con jwt.verify()
//   4. Adjuntar el payload decodificado a req.usuario
//   5. Ceder el control al siguiente middleware o controlador
//
// Si la verificación falla, responde HTTP 401 sin exponer
// detalles internos que comprometan la seguridad.
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    // Si no llega el encabezado Authorization, la petición se rechaza de inmediato
    if (!authHeader) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Acceso denegado. Se requiere token de autenticación.'
      });
    }

    // El formato esperado es "Bearer <token>"
    // Se divide por espacio para extraer únicamente el token
    const partes = authHeader.split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
      return res.status(401).json({
        exito: false,
        mensaje: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = partes[1];

    // jwt.verify() comprueba la firma digital y la expiración del token.
    // Lanza excepción si el token fue manipulado o ya venció.
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // El payload decodificado queda disponible para los controladores
    // sin necesidad de consultar nuevamente la base de datos
    req.usuario = payload;

    next();

  } catch (error) {
    // Se distingue token vencido de token inválido para mensajes claros al cliente
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        exito: false,
        mensaje: 'El token ha expirado. Por favor inicie sesión nuevamente.'
      });
    }

    return res.status(401).json({
      exito: false,
      mensaje: 'Token inválido. Autenticación rechazada.'
    });
  }
};

module.exports = { verifyToken };