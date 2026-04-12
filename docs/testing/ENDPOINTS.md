# Catálogo de Endpoints — API Sistema Integral de Gestión de Leads

**Evidencia:** GA7-220501096-AA5-EV02  
**Aprendiz:** JULIAN ENRIQUE OCAMPO LOPEZ  
**Ficha:** 3118307  
**Repositorio:** https://github.com/JULIAN04301969/leads-auth-api  
**Fecha:** Abril 2026  

---

## URL base
```
http://localhost:3000
```

**Tecnología:** Node.js v22 + Express + MySQL 9.5 + JWT + bcrypt  
**Formato de respuesta:** `application/json`

---

## Resumen de endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/estado` | Público | Health check del servidor y la base de datos |
| POST | `/api/auth/registro` | Público | Crea un nuevo usuario con contraseña hasheada |
| POST | `/api/auth/login` | Público | Valida credenciales y emite token JWT |
| GET | `/api/auth/perfil` | Privado | Retorna datos del usuario autenticado |

---

## Endpoint 1 — GET /api/estado

| Campo | Detalle |
|-------|---------|
| URL completa | `http://localhost:3000/api/estado` |
| Método | GET |
| Acceso | Público |
| Autenticación | No requerida |
| Parámetros | Ninguno |

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "API del Sistema de Gestión Integral de Leads operativa.",
  "baseDeDatos": "Conectada"
}
```

**Respuesta de error (500):**
```json
{
  "exito": false,
  "mensaje": "Error de conexión con la base de datos."
}
```

---

## Endpoint 2 — POST /api/auth/registro

| Campo | Detalle |
|-------|---------|
| URL completa | `http://localhost:3000/api/auth/registro` |
| Método | POST |
| Acceso | Público |
| Content-Type | `application/json` |

**Cuerpo (Body):**
```json
{
  "nombre": "JULIAN OCAMPO",
  "correo": "julianenriqueocampolopez@gmail.com",
  "contrasena": "123456",
  "rol": "asesor"
}
```

**Campos obligatorios:** `nombre`, `correo` (email válido), `contrasena` (mín. 6 caracteres), `rol`

**Respuesta exitosa (201):**
```json
{
  "exito": true,
  "mensaje": "Usuario registrado exitosamente.",
  "datos": {
    "id": 3,
    "nombre": "JULIAN OCAMPO",
    "correo": "julianenriqueocampolopez@gmail.com",
    "rol": "asesor"
  }
}
```

**Error correo duplicado (400):**
```json
{
  "exito": false,
  "mensaje": "El correo ya se encuentra registrado."
}
```

**Error campos faltantes (400):**
```json
{
  "exito": false,
  "mensaje": "Todos los campos son obligatorios."
}
```

---

## Endpoint 3 — POST /api/auth/login

| Campo | Detalle |
|-------|---------|
| URL completa | `http://localhost:3000/api/auth/login` |
| Método | POST |
| Acceso | Público |
| Content-Type | `application/json` |

**Cuerpo (Body):**
```json
{
  "correo": "julianenriqueocampolopez@gmail.com",
  "contrasena": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "mensaje": "✅ Autenticación satisfactoria.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 3,
    "nombre": "JULIAN OCAMPO",
    "rol": "asesor"
  }
}
```

**Error credenciales incorrectas (401):**
```json
{
  "exito": false,
  "mensaje": "Error en la autenticación. Credenciales incorrectas."
}
```

**Vigencia del token:** 1 hora (3600 segundos)

---

## Endpoint 4 — GET /api/auth/perfil

| Campo | Detalle |
|-------|---------|
| URL completa | `http://localhost:3000/api/auth/perfil` |
| Método | GET |
| Acceso | Privado |
| Header obligatorio | `Authorization: Bearer <token>` |

**Cómo obtener el token:** ejecutar POST /api/auth/login y copiar el valor del campo `token`.

**Respuesta exitosa (200):**
```json
{
  "exito": true,
  "datos": {
    "id": 3,
    "nombre": "JULIAN OCAMPO",
    "correo": "julianenriqueocampolopez@gmail.com",
    "rol": "asesor",
    "creado_en": "2026-04-10T..."
  }
}
```

**Error sin token (401):**
```json
{
  "exito": false,
  "mensaje": "Token no proporcionado."
}
```

**Error token inválido o expirado (401):**
```json
{
  "exito": false,
  "mensaje": "Token inválido o expirado."
}
```