// ============================================================
// Punto de entrada del servidor Express
// Sistema de Gestión Integral de Leads
// ============================================================
// Secuencia de inicio:
//   1. Cargar variables de entorno desde .env
//   2. Configurar middlewares globales de Express
//   3. Registrar las rutas de la API bajo el prefijo /api
//   4. Servir la interfaz web de prueba desde /public
//   5. Verificar la conexión a MySQL
//   6. Levantar el servidor en el puerto configurado
// ============================================================

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { testConnection } = require('./config/database');
const authRoutes         = require('./routes/authRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// cors() permite que clientes en otros dominios consuman la API.
// En producción se deben especificar los orígenes permitidos explícitamente.
app.use(cors());

// express.json() parsea automáticamente el cuerpo de peticiones con Content-Type: application/json
app.use(express.json());

// express.urlencoded() permite recibir datos de formularios HTML estándar
app.use(express.urlencoded({ extended: true }));

// Sirve los archivos estáticos de la carpeta public (interfaz web de prueba)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Todas las rutas de autenticación quedan bajo el prefijo /api/auth
app.use('/api/auth', authRoutes);

// Endpoint de monitoreo: verifica que el servidor está operativo
// No requiere autenticación y es útil para herramientas de monitoreo
app.get('/api/estado', (req, res) => {
  res.status(200).json({
    exito: true,
    mensaje: 'API del Sistema de Gestión Integral de Leads operativa.',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Captura cualquier ruta no definida y responde con HTTP 404.
// Debe ir siempre después de todas las rutas declaradas.
app.use((req, res) => {
  res.status(404).json({
    exito: false,
    mensaje: `Ruta ${req.method} ${req.originalUrl} no encontrada en esta API.`
  });
});

// Se verifica la conexión a MySQL antes de abrir el puerto al tráfico
const iniciarServidor = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log('═══════════════════════════════════════════════════');
    console.log('  🚀 Sistema de Gestión Integral de Leads — API   ');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  ✅ Servidor en: http://localhost:${PORT}`);
    console.log(`  🔐 Registro:    POST /api/auth/registro`);
    console.log(`  🔑 Login:       POST /api/auth/login`);
    console.log(`  👤 Perfil:      GET  /api/auth/perfil`);
    console.log('═══════════════════════════════════════════════════');
  });
};

iniciarServidor();