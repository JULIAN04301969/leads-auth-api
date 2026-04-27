// ============================================================
// Pruebas unitarias — Módulo de autenticación
// GA8-220501096-AA1-EV01
// Sistema Integral de Gestión de Leads
// ============================================================
// Framework:  Jest 30 + Supertest 7
//
// Estrategia: Se aplica mocking de mysql2/promise y bcryptjs
// para aislar completamente la lógica del controlador de sus
// dependencias externas. Las pruebas no requieren una base de
// datos activa ni conexión de red — son 100% reproducibles
// en cualquier entorno que tenga Node.js instalado.
//
// Cada grupo describe() agrupa los casos de un endpoint.
// Cada test() verifica un escenario específico: éxito o error.
// beforeEach() restaura los mocks automáticamente entre pruebas.
//
// Cobertura:
//   EP-01  GET  /api/estado        — Health check del servidor
//   EP-02  POST /api/auth/registro — Registro de usuarios
//   EP-03  POST /api/auth/login    — Inicio de sesión con JWT
//   EP-04  GET  /api/auth/perfil   — Perfil protegido con JWT
//   EP-05  Rutas no definidas      — Manejador 404
// ============================================================

// Los módulos externos se reemplazan con implementaciones
// controladas antes de importar la app
jest.mock('mysql2/promise');
jest.mock('bcryptjs');

const request = require('supertest');
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');

// Mock del pool de conexiones MySQL.
// query() devuelve arrays vacíos por defecto.
// Cada prueba sobrescribe este comportamiento según su caso.
const mockQuery   = jest.fn();
const mockRelease = jest.fn();
const mockGetConn = jest.fn(() =>
  Promise.resolve({
    query:   jest.fn(() => Promise.resolve([{}, []])),
    release: mockRelease
  })
);

mysql.createPool.mockReturnValue({
  query:         mockQuery,
  getConnection: mockGetConn
});

// La app se importa DESPUÉS de configurar los mocks
// para que database.js reciba la versión simulada de mysql2
const app = require('../src/index');

// ── Utilidades ────────────────────────────────────────────────

// Genera un token JWT real firmado con la clave de prueba.
// Se usa para simular un cliente autenticado en rutas privadas.
const jwt        = require('jsonwebtoken');
const SECRET_TEST = 'clave_de_prueba_para_jest_minimo_32_caracteres';

const generarToken = (payload = {}) =>
  jwt.sign(
    { id: 1, email: 'admin@leads.com', rol: 'admin', nombre: 'Administrador', ...payload },
    SECRET_TEST,
    { expiresIn: '1h' }
  );

// Configura JWT_SECRET antes de cada prueba y limpia todos los mocks
beforeEach(() => {
  process.env.JWT_SECRET = SECRET_TEST;
  jest.clearAllMocks();
});

// ================================================================
// EP-01 — GET /api/estado
// ================================================================
describe('EP-01: GET /api/estado — Health check', () => {

  test('TC-01-01: Devuelve 200 y baseDeDatos=Conectada cuando MySQL responde', async () => {
    // Simula una conexión exitosa a MySQL
    mockGetConn.mockResolvedValueOnce({
      query:   jest.fn().mockResolvedValueOnce([]),
      release: mockRelease
    });

    const res = await request(app).get('/api/estado');

    expect(res.status).toBe(200);
    expect(res.body.exito).toBe(true);
    expect(res.body.baseDeDatos).toBe('Conectada');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('version');
  });

  test('TC-01-02: Devuelve 503 cuando MySQL no está disponible', async () => {
    // Simula un fallo de conexión a MySQL
    mockGetConn.mockRejectedValueOnce(new Error('Connection refused'));

    const res = await request(app).get('/api/estado');

    expect(res.status).toBe(503);
    expect(res.body.exito).toBe(false);
    expect(res.body.baseDeDatos).toContain('Connection refused');
  });

});

// ================================================================
// EP-02 — POST /api/auth/registro
// ================================================================
describe('EP-02: POST /api/auth/registro — Registro de usuarios', () => {

  test('TC-02-01: Registra un usuario nuevo y devuelve 201 con sus datos', async () => {
    // Sin usuario existente → INSERT exitoso con id 10
    mockQuery
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 10 }, []]);
    bcrypt.hash.mockResolvedValueOnce('$2b$hash_simulado');

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'María García', email: 'mgarcia@leads.com', password: 'segura123', rol: 'asesor' });

    expect(res.status).toBe(201);
    expect(res.body.exito).toBe(true);
    expect(res.body.datos.id).toBe(10);
    expect(res.body.datos.email).toBe('mgarcia@leads.com');
    expect(res.body.datos.rol).toBe('asesor');
    // El hash nunca debe aparecer en la respuesta
    expect(res.body.datos).not.toHaveProperty('password_hash');
  });

  test('TC-02-02: Devuelve 400 si falta el campo nombre', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ email: 'x@x.com', password: 'clave123' });

    expect(res.status).toBe(400);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/obligatorios/i);
  });

  test('TC-02-03: Devuelve 400 si el email tiene formato inválido', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Carlos', email: 'no-es-email', password: 'clave123' });

    expect(res.status).toBe(400);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/correo/i);
  });

  test('TC-02-04: Devuelve 400 si la contraseña tiene menos de 6 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Carlos', email: 'c@c.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/6 caracteres/i);
  });

  test('TC-02-05: Devuelve 409 si el email ya está registrado', async () => {
    // Simula que ya existe un usuario con ese email
    mockQuery.mockResolvedValueOnce([[{ id: 3 }], []]);

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Julián', email: 'admin@leads.com', password: 'clave123' });

    expect(res.status).toBe(409);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/ya existe/i);
  });

  test('TC-02-06: Asigna rol asesor por defecto si el rol enviado es inválido', async () => {
    mockQuery
      .mockResolvedValueOnce([[], []])
      .mockResolvedValueOnce([{ insertId: 11 }, []]);
    bcrypt.hash.mockResolvedValueOnce('$2b$hash_simulado');

    const res = await request(app)
      .post('/api/auth/registro')
      .send({ nombre: 'Pedro', email: 'pedro@test.com', password: 'clave123', rol: 'hacker' });

    expect(res.status).toBe(201);
    expect(res.body.datos.rol).toBe('asesor');
  });

});

// ================================================================
// EP-03 — POST /api/auth/login
// ================================================================
describe('EP-03: POST /api/auth/login — Inicio de sesión', () => {

  // Usuario base que simula un registro existente en la BD
  const usuarioMock = {
    id:            1,
    nombre:        'Administrador Sistema',
    email:         'admin@leads.com',
    password_hash: '$2b$10$hash_simulado_de_bcrypt',
    rol:           'admin',
    activo:        1
  };

  test('TC-03-01: Devuelve 200 con token JWT ante credenciales válidas', async () => {
    mockQuery.mockResolvedValueOnce([[usuarioMock], []]);
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leads.com', password: 'Admin2024!' });

    expect(res.status).toBe(200);
    expect(res.body.exito).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.email).toBe('admin@leads.com');
    // El hash nunca debe aparecer en la respuesta
    expect(res.body.usuario).not.toHaveProperty('password_hash');
  });

  test('TC-03-02: Devuelve 401 si el usuario no existe en la BD', async () => {
    mockQuery.mockResolvedValueOnce([[], []]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@x.com', password: 'clave123' });

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
    // El mensaje no debe revelar si el usuario existe o no
    expect(res.body.mensaje).toMatch(/credenciales incorrectas/i);
  });

  test('TC-03-03: Devuelve 401 si la contraseña es incorrecta', async () => {
    mockQuery.mockResolvedValueOnce([[usuarioMock], []]);
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leads.com', password: 'ClaveErronea' });

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/credenciales incorrectas/i);
  });

  test('TC-03-04: Devuelve 400 si faltan campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leads.com' });

    expect(res.status).toBe(400);
    expect(res.body.exito).toBe(false);
  });

  test('TC-03-05: Devuelve 403 si la cuenta está deshabilitada', async () => {
    mockQuery.mockResolvedValueOnce([[{ ...usuarioMock, activo: 0 }], []]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@leads.com', password: 'Admin2024!' });

    expect(res.status).toBe(403);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/deshabilitada/i);
  });

});

// ================================================================
// EP-04 — GET /api/auth/perfil
// ================================================================
describe('EP-04: GET /api/auth/perfil — Perfil protegido', () => {

  test('TC-04-01: Devuelve 200 con datos del usuario ante token válido', async () => {
    mockQuery.mockResolvedValueOnce([[{
      id: 1, nombre: 'Administrador Sistema',
      email: 'admin@leads.com', rol: 'admin',
      creado_en: '2026-04-11T15:05:35.000Z'
    }], []]);

    const token = generarToken();

    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.exito).toBe(true);
    expect(res.body.datos.email).toBe('admin@leads.com');
    expect(res.body.datos).not.toHaveProperty('password_hash');
  });

  test('TC-04-02: Devuelve 401 si no se envía el header Authorization', async () => {
    const res = await request(app).get('/api/auth/perfil');

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/se requiere token/i);
  });

  test('TC-04-03: Devuelve 401 si el formato del token es incorrecto', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', 'TokenSinBearerPrefix abc123');

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/formato/i);
  });

  test('TC-04-04: Devuelve 401 si el token está expirado', async () => {
    const tokenVencido = jwt.sign(
      { id: 1, email: 'admin@leads.com', rol: 'admin' },
      SECRET_TEST,
      { expiresIn: '0s' }
    );
    // Espera 10ms para garantizar que el token haya vencido
    await new Promise(r => setTimeout(r, 10));

    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${tokenVencido}`);

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/expirado/i);
  });

  test('TC-04-05: Devuelve 401 si el token fue manipulado', async () => {
    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6OTk5fQ.token_falso');

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
  });

  test('TC-04-06: Devuelve 404 si el usuario del token no existe en BD', async () => {
    mockQuery.mockResolvedValueOnce([[], []]);
    const token = generarToken({ id: 999, email: 'fantasma@x.com' });

    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.exito).toBe(false);
  });

});

// ================================================================
// EP-05 — Rutas no definidas
// ================================================================
describe('EP-05: Rutas no definidas — Manejador 404', () => {

  test('TC-05-01: Devuelve 404 para rutas inexistentes', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');

    expect(res.status).toBe(404);
    expect(res.body.exito).toBe(false);
    expect(res.body.mensaje).toMatch(/no encontrada/i);
  });

});