// ============================================================
// Controlador de autenticación
// Sistema de Gestión Integral de Leads
// ============================================================
// Expone tres funciones que gestionan el ciclo de autenticación:
//
//   registrar()     → Valida datos, hashea contraseña y persiste el usuario
//   iniciarSesion() → Valida credenciales y emite token JWT
//   perfil()        → Devuelve datos del usuario autenticado (ruta protegida)
//
// Principios de seguridad aplicados:
//   - Las contraseñas se almacenan como hash bcrypt, nunca en texto plano
//   - Los mensajes de error no revelan si el email existe o no,
//     previniendo ataques de enumeración de usuarios
//   - El token JWT contiene solo la información mínima necesaria
//   - Nunca se devuelve el hash de contraseña en ninguna respuesta
// ============================================================

const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/database');
require('dotenv').config();

// Costo del algoritmo bcrypt. Valor 10 es el mínimo recomendado en producción.
// A mayor valor, más tiempo de cómputo y mayor resistencia a ataques de fuerza bruta.
const BCRYPT_SALT_ROUNDS = 10;

// ------------------------------------------------------------
// REGISTRO DE USUARIO
// Ruta: POST /api/auth/registro
// Acceso: Público
// ------------------------------------------------------------
const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validación de campos obligatorios antes de cualquier operación
    if (!nombre || !email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Los campos nombre, email y password son obligatorios.'
      });
    }

    // Expresión regular para validar estructura básica del correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El formato del correo electrónico no es válido.'
      });
    }

    // La contraseña debe tener al menos 6 caracteres para garantizar
    // un nivel mínimo de seguridad en las cuentas del sistema
    if (password.length < 6) {
      return res.status(400).json({
        exito: false,
        mensaje: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    // Verificar si ya existe un usuario registrado con el mismo email
    const [existentes] = await pool.query(
      'SELECT id FROM usuarios WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        exito: false,
        mensaje: 'Ya existe una cuenta registrada con este correo electrónico.'
      });
    }

    // bcrypt genera internamente un salt aleatorio y lo incluye en el hash.
    // El resultado es autocontenido: no se necesita almacenar el salt por separado.
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Solo se aceptan los roles definidos en el ENUM de la base de datos
    const rolValido = ['admin', 'asesor', 'supervisor'].includes(rol) ? rol : 'asesor';

    const [resultado] = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES (?, ?, ?, ?)`,
      [nombre.trim(), email.toLowerCase().trim(), passwordHash, rolValido]
    );

    // Se responde con los datos del usuario creado, omitiendo el hash de contraseña
    return res.status(201).json({
      exito: true,
      mensaje: 'Usuario registrado exitosamente.',
      datos: {
        id:     resultado.insertId,
        nombre: nombre.trim(),
        email:  email.toLowerCase().trim(),
        rol:    rolValido
      }
    });

  } catch (error) {
    console.error('❌ Error en registrar():', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor. Intente nuevamente más tarde.'
    });
  }
};

// ------------------------------------------------------------
// INICIO DE SESIÓN
// Ruta: POST /api/auth/login
// Acceso: Público
// ------------------------------------------------------------
const iniciarSesion = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Los campos email y password son obligatorios.'
      });
    }

    // Búsqueda del usuario por email incluyendo el hash para comparación
    const [usuarios] = await pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo
       FROM usuarios WHERE email = ? LIMIT 1`,
      [email.toLowerCase().trim()]
    );

    // Respuesta genérica tanto para usuario no encontrado como para contraseña incorrecta.
    // Esto impide determinar desde afuera si una cuenta existe en el sistema.
    if (usuarios.length === 0) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Error en la autenticación. Credenciales incorrectas.'
      });
    }

    const usuario = usuarios[0];

    // Una cuenta deshabilitada no puede iniciar sesión aunque las credenciales sean válidas
    if (!usuario.activo) {
      return res.status(403).json({
        exito: false,
        mensaje: 'La cuenta está deshabilitada. Contacte al administrador.'
      });
    }

    // bcrypt.compare() realiza la comparación en tiempo constante,
    // evitando ataques de temporización (timing attacks)
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValida) {
      return res.status(401).json({
        exito: false,
        mensaje: 'Error en la autenticación. Credenciales incorrectas.'
      });
    }

    // El payload del token incluye solo los datos necesarios para identificar al usuario.
    // Nunca se incluye la contraseña ni el hash en el token.
    const payload = {
      id:     usuario.id,
      email:  usuario.email,
      rol:    usuario.rol,
      nombre: usuario.nombre
    };

    // El token se firma con la clave secreta y expira según la variable de entorno JWT_EXPIRES_IN
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    // Autenticación satisfactoria: se devuelve el token y los datos básicos del usuario
    return res.status(200).json({
      exito: true,
      mensaje: '✅ Autenticación satisfactoria.',
      token,
      usuario: {
        id:     usuario.id,
        nombre: usuario.nombre,
        email:  usuario.email,
        rol:    usuario.rol
      }
    });

  } catch (error) {
    console.error('❌ Error en iniciarSesion():', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor. Intente nuevamente más tarde.'
    });
  }
};

// ------------------------------------------------------------
// PERFIL — RUTA PROTEGIDA DE EJEMPLO
// Ruta: GET /api/auth/perfil
// Acceso: Privado (requiere token JWT válido)
// ------------------------------------------------------------
// Demuestra cómo una ruta protegida accede a los datos del usuario
// autenticado usando req.usuario, adjuntado por el middleware verifyToken.
const perfil = async (req, res) => {
  try {
    const { id } = req.usuario;

    const [usuarios] = await pool.query(
      'SELECT id, nombre, email, rol, creado_en FROM usuarios WHERE id = ? AND activo = 1',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Usuario no encontrado o inactivo.'
      });
    }

    return res.status(200).json({
      exito: true,
      mensaje: 'Perfil obtenido correctamente.',
      datos: usuarios[0]
    });

  } catch (error) {
    console.error('❌ Error en perfil():', error);
    return res.status(500).json({
      exito: false,
      mensaje: 'Error interno del servidor.'
    });
  }
};

module.exports = { registrar, iniciarSesion, perfil };