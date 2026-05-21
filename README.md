# leads-auth-api

API REST de autenticación para el Sistema Integral de Gestión de Leads.  
**SENA — Análisis y Desarrollo de Software — Ficha 3118307**  
**Aprendiz:** JULIAN ENRIQUE OCAMPO LOPEZ

---

## Descripción

Servicio web de autenticación desarrollado con Node.js, Express y MySQL.  
Implementa registro de usuarios, inicio de sesión con JWT y rutas protegidas por middleware.

El proyecto incluye:
- Backend desplegado en **Railway**
- Frontend estático desplegado en **Vercel**
- Pruebas unitarias e integración con **Jest + Supertest**
- Pruebas end‑to‑end con **Cypress** (local y remoto)
- Gestor de paquetes **pnpm** (más seguro y rápido que npm)

---

## Tecnologías

- Node.js v22 + Express
- MySQL 9.5 + mysql2
- JSON Web Tokens (JWT)
- bcryptjs para hash de contraseñas
- dotenv para variables de entorno
- **pnpm** (gestor de paquetes)
- **Jest** + **Supertest** (pruebas)
- **Cypress** (pruebas E2E)

---

## Scripts de Base de Datos

- `database.sql` – Script principal para crear la base de datos `leads_db` y la tabla `usuarios`.
- `update.sql` – Script para actualizar el hash de la contraseña del usuario administrador en despliegues en la nube (Railway).

---

## Instalación y ejecución local (con pnpm)

```bash
git clone https://github.com/JULIAN04301969/leads-auth-api.git
cd leads-auth-api
pnpm install
Crear el archivo .env basado en .env.example y configurar las variables de conexión a MySQL.

bash
pnpm run dev
El servidor queda disponible en http://localhost:3000

Para ejecutar las pruebas:

bash
pnpm test               # pruebas unitarias e integración (Jest)
pnpm exec cypress open  # pruebas E2E interactivas
pnpm exec cypress run   # pruebas E2E headless
Endpoints disponibles
Método	Ruta	Acceso	Descripción
GET	/api/estado	Público	Health check del servidor y base de datos
POST	/api/auth/registro	Público	Crea un nuevo usuario
POST	/api/auth/login	Público	Valida credenciales y emite token JWT
GET	/api/auth/perfil	Privado	Datos del usuario autenticado
Catálogo detallado en docs/testing/ENDPOINTS.md

Pruebas automatizadas
Unitarias e integración (Jest + Supertest)
20 casos de prueba cubren:

Health check (/api/estado)

Registro de usuarios (campos obligatorios, email duplicado, roles)

Login exitoso/fallido

Ruta protegida /api/auth/perfil

Manejador 404

End‑to‑end (Cypress)
Flujo completo de autenticación: registro → login → cierre de sesión → verificación de perfil protegido.
Se ejecuta tanto en entorno local como remoto (contra despliegue en Vercel + Railway).

Despliegues en la nube
Entorno	Plataforma	URL
Backend	Railway	https://leads-auth-api-production.up.railway.app
Frontend	Vercel	https://leads-auth-api.vercel.app
El frontend se conecta dinámicamente al backend según el entorno (localhost o producción) mediante detección de hostname.

Testing con Postman — GA7-220501096-AA5-EV02
Colección en docs/testing/coleccion_postman.json

Cómo importar en Postman
Abrir Postman

Clic en Import

Seleccionar docs/testing/coleccion_postman.json

Ejecutar las 7 pruebas en orden

#	Prueba	Resultado esperado
1	Health check del servidor	HTTP 200
2	Registro de usuario nuevo	HTTP 201
3	Registro con correo duplicado	HTTP 409
4	Login exitoso — obtiene token JWT	HTTP 200 + token
5	Login con credenciales incorrectas	HTTP 401
6	Perfil con token válido	HTTP 200
7	Perfil sin token	HTTP 401
Estructura del repositorio (ramas colaborativas)
El proyecto simula trabajo en equipo con las siguientes ramas:

master – integración final

feature/backend-auth – desarrollo del backend (jocampo-backend)

feature/frontend-leads – módulo de gestión de leads (mgarcia-frontend)

feature/frontend-auth – UI de autenticación (crodriguez-ui)

Evidencias de aprendizaje
Evidencia	Descripción
GA7-220501096-AA5-EV01	Diseño y desarrollo del servicio web
GA7-220501096-AA5-EV02	Testing de la API con Postman
GA9-220501096-AA1-EV01	Taller sobre codificación de módulos (Cypress)
GA9-220501096-AA1-EV02	Plan de pruebas de software
Repositorio
https://github.com/JULIAN04301969/leads-auth-api

Licencia
Proyecto educativo – SENA ADSO 3118307

