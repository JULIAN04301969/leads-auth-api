// ============================================================
// Módulo de conexión a la base de datos MySQL
// Sistema de Gestión Integral de Leads
// ============================================================
// Establece un pool de conexiones reutilizables con mysql2/promise.
// El pool evita abrir y cerrar una conexión por cada petición,
// mejorando el rendimiento en entornos con múltiples usuarios.
// Las credenciales se leen desde variables de entorno (.env)
// para mantener datos sensibles fuera del repositorio.
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones configurado con los parámetros del servidor MySQL.
// connectionLimit define el máximo de conexiones simultáneas permitidas.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leads_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verifica la conectividad con MySQL al iniciar el servidor.
// Si la conexión falla, detiene el proceso para evitar
// que el servidor funcione sin base de datos disponible.
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente.');
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };