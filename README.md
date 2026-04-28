# leads-auth-api

API REST de autenticación para el Sistema Integral de Gestión de Leads.  
**SENA — Análisis y Desarrollo de Software — Ficha 3118307**  
**Aprendiz:** JULIAN ENRIQUE OCAMPO LOPEZ

---

## Descripción

Servicio web de autenticación desarrollado con Node.js, Express y MySQL.  
Implementa registro de usuarios, inicio de sesión con JWT y rutas protegidas por middleware.

---

## Tecnologías

- Node.js v22 + Express
- MySQL 9.5 + mysql2
- JSON Web Tokens (JWT)
- bcrypt para hash de contraseñas
- dotenv para variables de entorno

---

## Instalación

git clone https://github.com/JULIAN04301969/leads-auth-api.git
cd leads-auth-api
npm install

Crear el archivo .env basado en .env.example y configurar las variables de conexión a MySQL.

npm run dev

El servidor queda disponible en http://localhost:3000

---

## Endpoints disponibles

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | /api/estado | Público | Health check del servidor y base de datos |
| POST | /api/auth/registro | Público | Crea un nuevo usuario |
| POST | /api/auth/login | Público | Valida credenciales y emite token JWT |
| GET | /api/auth/perfil | Privado | Datos del usuario autenticado |

El catálogo detallado está en docs/testing/ENDPOINTS.md

---

## Testing con Postman — GA7-220501096-AA5-EV02

La colección de pruebas está en docs/testing/coleccion_postman.json

### Cómo importar en Postman

1. Abrir Postman
2. Clic en Import
3. Seleccionar docs/testing/coleccion_postman.json
4. Ejecutar las 7 pruebas en orden

| # | Prueba | Resultado esperado |
|---|--------|--------------------|
| 1 | Health check del servidor | HTTP 200 |
| 2 | Registro de usuario nuevo | HTTP 201 |
| 3 | Registro con correo duplicado | HTTP 400 |
| 4 | Login exitoso — obtiene token JWT | HTTP 200 + token |
| 5 | Login con credenciales incorrectas | HTTP 401 |
| 6 | Perfil con token válido | HTTP 200 |
| 7 | Perfil sin token | HTTP 401 |

---

## Evidencias

| Evidencia | Descripción |
|-----------|-------------|
| GA7-220501096-AA5-EV01 | Diseño y desarrollo del servicio web |
| GA7-220501096-AA5-EV02 | Testing de la API con Postman |

---

## Repositorio

https://github.com/JULIAN04301969/leads-auth-api
## M�dulo Frontend - Gesti�n de Leads
M�dulo CRUD de leads con tabla interactiva, filtros en tiempo real y badges de estado. Autor: mgarcia-frontend.
