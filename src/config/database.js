// ============================================================
// Módulo de conexión a la base de datos MySQL
// Sistema Integral de Gestión de Leads
// ============================================================
// Proporciona dos funciones de conectividad:
//
//   testConnection()   → Verifica la conexión al iniciar el servidor.
//                        Detiene el proceso si MySQL no está disponible.
//
//   checkConnection()  → Verifica la conexión en tiempo real sin detener
//                        el proceso. Usada por el endpoint /api/estado
//                        para reportar el estado real de la base de datos.
//
// El pool reutiliza conexiones activas evitando abrir y cerrar
// una conexión por cada petición HTTP entrante.
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones configurado con los parámetros del servidor MySQL.
// Los valores se leen desde variables de entorno definidas en el archivo .env
// para mantener las credenciales fuera del repositorio.
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'leads_db',
  port:               process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0
});

// ------------------------------------------------------------
// testConnection
// Verifica la conectividad con MySQL al iniciar el servidor.
// Si la conexión falla, detiene el proceso para evitar que el
// servidor opere sin base de datos disponible.
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// checkConnection
// Verifica la conectividad en tiempo real ejecutando una consulta
// ligera (SELECT 1). A diferencia de testConnection(), retorna
// el estado en lugar de detener el proceso, siendo apta para
// endpoints de monitoreo que necesitan reportar salud del sistema.
//
// Salida: { conectada: boolean, mensaje: string }
// ------------------------------------------------------------
const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    return { conectada: true, mensaje: 'Conectada' };
  } catch (error) {
    return { conectada: false, mensaje: error.message };
  }
};

module.exports = { pool, testConnection, checkConnection };