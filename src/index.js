// ============================================================
// Punto de entrada del servidor Express
// Sistema Integral de Gestión de Leads
// ============================================================
// Secuencia de inicio:
//   1. Cargar variables de entorno desde .env
//   2. Configurar middlewares globales de Express
//   3. Registrar las rutas de la API bajo el prefijo /api
//   4. Servir la interfaz web de prueba desde /public
//   5. Verificar la conexión a MySQL
//   6. Levantar el servidor en el puerto configurado
//
// El bloque condicional require.main === module garantiza que
// el servidor solo se levanta cuando el archivo se ejecuta
// directamente (node src/index.js), no cuando Jest lo importa
// para las pruebas unitarias.
// ============================================================

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { testConnection, checkConnection } = require('./config/database');
const authRoutes                          = require('./routes/authRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// cors() permite que clientes en otros dominios consuman la API.
// En producción se deben especificar los orígenes permitidos explícitamente.
app.use(cors());

// express.json() parsea automáticamente el cuerpo de peticiones
// con Content-Type: application/json
app.use(express.json());

// express.urlencoded() permite recibir datos de formularios HTML estándar
app.use(express.urlencoded({ extended: true }));

// ✅ NUEVA LÍNEA: Sirve el frontend real (Materialize, lógica completa)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Sirve los archivos estáticos de la carpeta public (interfaz web de prueba)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Todas las rutas de autenticación quedan bajo el prefijo /api/auth
app.use('/api/auth', authRoutes);

// ----------------------------------------------------------------
// Endpoint de monitoreo — GET /api/estado
// ----------------------------------------------------------------
// Verifica en tiempo real que el servidor está operativo Y que
// la base de datos MySQL responde. No requiere autenticación.
//
// Versión anterior: siempre respondía exito: true sin verificar MySQL.
// Versión actual:   ejecuta checkConnection() que abre una conexión
//                   real y la libera, reportando el estado verdadero.
//
// Entrada:  ninguna
// Salida:   { exito, mensaje, version, baseDeDatos, timestamp }
// HTTP 200 si todo está bien — HTTP 503 si MySQL no responde
// ----------------------------------------------------------------
app.get('/api/estado', async (req, res) => {
  const estadoBD = await checkConnection();

  return res.status(estadoBD.conectada ? 200 : 503).json({
    exito:       estadoBD.conectada,
    mensaje:     estadoBD.conectada
      ? 'API del Sistema de Gestión Integral de Leads operativa.'
      : 'API operativa pero sin conexión a la base de datos.',
    version:     '2.0.0',
    baseDeDatos: estadoBD.mensaje,
    timestamp:   new Date().toISOString()
  });
});

// Captura cualquier ruta no definida y responde con HTTP 404.
// Debe ir siempre después de todas las rutas declaradas.
app.use((req, res) => {
  res.status(404).json({
    exito:   false,
    mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada en esta API.`
  });
});

// Se exporta la app para que Jest pueda importarla en las pruebas
// sin levantar un servidor real en ningún puerto.
module.exports = app;

// El bloque condicional evita que el servidor se levante durante
// la ejecución de las pruebas unitarias con Jest.
if (require.main === module) {
  const iniciarServidor = async () => {
    await testConnection();
    app.listen(PORT, () => {
      console.log('═══════════════════════════════════════════════════');
      console.log('  🚀 Sistema de Gestión Integral de Leads — API   ');
      console.log('═══════════════════════════════════════════════════');
      console.log(`  ✅ Servidor en:  http://localhost:${PORT}`);
      console.log(`  🔐 Registro:     POST /api/auth/registro`);
      console.log(`  🔑 Login:        POST /api/auth/login`);
      console.log(`  👤 Perfil:       GET  /api/auth/perfil`);
      console.log(`  📡 Estado:       GET  /api/estado`);
      console.log('═══════════════════════════════════════════════════');
    });
  };
  iniciarServidor();
}