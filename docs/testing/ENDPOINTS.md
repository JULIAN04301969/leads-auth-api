# Catálogo de Endpoints — API Sistema Integral de Gestión de Leads

**Evidencia:** GA7-220501096-AA5-EV02  
**Aprendiz:** JULIAN ENRIQUE OCAMPO LOPEZ  
**Ficha:** 3118307  
**Repositorio:** https://github.com/JULIAN04301969/leads-auth-api  
**Fecha:** Abril 2026  

---

## URL base

http://localhost:3000

**Tecnología:** Node.js v22 + Express + MySQL 9.5 + JWT + bcrypt  
**Formato de respuesta:** application/json

---

## Resumen de endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | /api/estado | Público | Health check del servidor y la base de datos |
| POST | /api/auth/registro | Público | Crea un nuevo usuario con contraseña hasheada con bcrypt |
| POST | /api/auth/login | Público | Valida credenciales y emite token JWT firmado |
| GET | /api/auth/perfil | Privado | Retorna datos del usuario autenticado |

---

## Endpoint 1 — GET /api/estado

| Campo | Detalle |
|-------|---------|
| URL completa | http://localhost:3000/api/estado |
| Método | GET |
| Acceso | Público |
| Autenticación | No requerida |
| Parámetros | Ninguno |
| Content-Type | No requerido |

Respuesta exitosa (200):

{
  "exito": true,
  "mensaje": "API del Sistema de Gestión Integral de Leads operativa.",
  "version": "1.0.0",
  "timestamp": "2026-04-12T19:51:51.765Z"
}

Respuesta de error (500):

{
  "exito": false,
  "mensaje": "Error de conexión con la base de datos."
}

---

## Endpoint 2 — POST /api/auth/registro

| Campo | Detalle |
|-------|---------|
| URL completa | http://localhost:3000/api/auth/registro |
| Método | POST |
| Acceso | Público |
| Autenticación | No requerida |
| Content-Type | application/json |

Cuerpo (Body):

{
  "nombre": "JULIAN OCAMPO",
  "email": "julian.ocampo.sena@gmail.com",
  "password": "123456",
  "rol": "asesor"
}

Campos obligatorios: nombre, email (formato email válido), password (mínimo 6 caracteres)
Campo opcional: rol — valores aceptados: admin, asesor, supervisor. Si se omite o es inválido el sistema asigna asesor por defecto.

Respuesta exitosa (201):

{
  "exito": true,
  "mensaje": "Usuario registrado exitosamente.",
  "datos": {
    "id": 4,
    "nombre": "JULIAN OCAMPO",
    "email": "julian.ocampo.sena@gmail.com",
    "rol": "asesor"
  }
}

Error — campos obligatorios faltantes (400):

{
  "exito": false,
  "mensaje": "Los campos nombre, email y password son obligatorios."
}

Error — formato de email inválido (400):

{
  "exito": false,
  "mensaje": "El formato del correo electrónico no es válido."
}

Error — password menor a 6 caracteres (400):

{
  "exito": false,
  "mensaje": "La contraseña debe tener al menos 6 caracteres."
}

Error — email duplicado (409):

{
  "exito": false,
  "mensaje": "Ya existe una cuenta registrada con este correo electrónico."
}

---

## Endpoint 3 — POST /api/auth/login

| Campo | Detalle |
|-------|---------|
| URL completa | http://localhost:3000/api/auth/login |
| Método | POST |
| Acceso | Público |
| Autenticación | No requerida |
| Content-Type | application/json |

Cuerpo (Body):

{
  "email": "julian.ocampo.sena@gmail.com",
  "password": "123456"
}

Campos obligatorios: email, password

Respuesta exitosa (200):

{
  "exito": true,
  "mensaje": "✅ Autenticación satisfactoria.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 4,
    "nombre": "JULIAN OCAMPO",
    "email": "julian.ocampo.sena@gmail.com",
    "rol": "asesor"
  }
}

Vigencia del token: 1 hora (3600 segundos). Configurado en variable de entorno JWT_EXPIRES_IN.

Error — campos faltantes (400):

{
  "exito": false,
  "mensaje": "Los campos email y password son obligatorios."
}

Error — credenciales incorrectas (401):

{
  "exito": false,
  "mensaje": "Error en la autenticación. Credenciales incorrectas."
}

Error — cuenta deshabilitada (403):

{
  "exito": false,
  "mensaje": "La cuenta está deshabilitada. Contacte al administrador."
}

---

## Endpoint 4 — GET /api/auth/perfil

| Campo | Detalle |
|-------|---------|
| URL completa | http://localhost:3000/api/auth/perfil |
| Método | GET |
| Acceso | Privado |
| Autenticación | Requerida — token JWT vigente |
| Header obligatorio | Authorization: Bearer <token> |
| Parámetros Body | Ninguno |

Cómo obtener el token: ejecutar POST /api/auth/login con credenciales válidas y copiar el valor del campo token de la respuesta.

Respuesta exitosa (200):

{
  "exito": true,
  "mensaje": "Perfil obtenido correctamente.",
  "datos": {
    "id": 4,
    "nombre": "JULIAN OCAMPO",
    "email": "julian.ocampo.sena@gmail.com",
    "rol": "asesor",
    "creado_en": "2026-04-12T20:00:00.000Z"
  }
}

Error — sin token (401):

{
  "exito": false,
  "mensaje": "Acceso denegado. Se requiere token de autenticación."
}

Error — token inválido o expirado (401):

{
  "exito": false,
  "mensaje": "Token inválido o expirado."
}

Error — usuario no encontrado o inactivo (404):

{
  "exito": false,
  "mensaje": "Usuario no encontrado o inactivo."
}