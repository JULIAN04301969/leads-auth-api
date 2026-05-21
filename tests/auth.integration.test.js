// ============================================================
// PRUEBAS DE INTEGRACIÓN - API REAL con Base de Datos Real
// ============================================================
// Ejecutar con: pnpm test -- auth.integration.test.js
// Requiere: Base de datos MySQL activa (local o remota)
// ============================================================
// Forzar uso de base de datos de pruebas
process.env.DB_NAME = 'leads_test';
process.env.JWT_SECRET = 'leads_sistema_gestion_clave_secreta_2024';

const request = require('supertest');
const app = require('../src/index');// ajusta ruta si es necesario

// NO se hace mock de mysql2 ni bcrypt – se usa la BD real

describe('Pruebas de integración - Autenticación (BD real)', () => {
  let usuarioTestEmail = `test_integracion_${Date.now()}@leads.com`;

  test('01 - Registro exitoso (201)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Integración Test',
        email: usuarioTestEmail,
        password: 'Test1234',
        rol: 'asesor'
      });
    expect(res.status).toBe(201);
    expect(res.body.exito).toBe(true);
    expect(res.body.datos.email).toBe(usuarioTestEmail);
  });

  test('02 - Registro con email duplicado (400/409)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Duplicado',
        email: usuarioTestEmail, // mismo email del registro anterior
        password: 'Test1234'
      });
    expect(res.status).toBe(409); // o 400 según tu API
    expect(res.body.exito).toBe(false);
  });

  test('03 - Registro con contraseña débil (400)', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send({
        nombre: 'Débil',
        email: `debil${Date.now()}@leads.com`,
        password: '123'
      });
    expect(res.status).toBe(400);
    expect(res.body.mensaje).toMatch(/6 caracteres|contraseña/i);
  });

  test('04 - Login exitoso (200) con token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: usuarioTestEmail, password: 'Test1234' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.email).toBe(usuarioTestEmail);
  });

  test('05 - Login con credenciales inválidas (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: usuarioTestEmail, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('06 - Perfil protegido con token válido (200)', async () => {
    // Primero hacer login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: usuarioTestEmail, password: 'Test1234' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/auth/perfil')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.datos.email).toBe(usuarioTestEmail);
  });

  test('07 - Perfil protegido sin token (401)', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
  });

  test('08 - Health check con BD conectada (200)', async () => {
    const res = await request(app).get('/api/estado');
    expect(res.status).toBe(200);
    expect(res.body.baseDeDatos).toBe('Conectada');
  });
});