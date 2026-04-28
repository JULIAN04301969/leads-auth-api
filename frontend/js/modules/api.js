// ============================================================
// Módulo de comunicación con la API REST
// Sistema Integral de Gestión de Leads — Frontend
// ============================================================
// Centraliza todas las llamadas HTTP al backend leads-auth-api.
// Adjunta automáticamente el token JWT en cada petición privada.
// Maneja errores de red devolviendo un objeto uniforme { ok, datos }
// para que los módulos consumidores no necesiten try/catch propios.
//
// Autor: crodriguez-ui
// Rama:  feature/frontend-auth
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// Claves de sessionStorage.
// sessionStorage se vacía al cerrar la pestaña — más seguro
// que localStorage para tokens de sesión de corta duración.
const TOKEN_KEY  = 'leads_jwt_token';
const USUARIO_KEY = 'leads_usuario';

// ============================================================
// session — Gestión de sesión local
// ============================================================
// Agrupa las operaciones de lectura y escritura del token y los
// datos del usuario en sessionStorage. Centralizar esto evita
// que otros módulos accedan directamente a sessionStorage y
// facilita cambiar el mecanismo de almacenamiento en el futuro.
// ============================================================
export const session = {

  // Persiste el token JWT recibido tras un login exitoso
  guardarToken: (token) =>
    sessionStorage.setItem(TOKEN_KEY, token),

  // Retorna el token almacenado o null si no hay sesión activa
  obtenerToken: () =>
    sessionStorage.getItem(TOKEN_KEY),

  // Persiste los datos básicos del usuario (id, nombre, email, rol)
  guardarUsuario: (usuario) =>
    sessionStorage.setItem(USUARIO_KEY, JSON.stringify(usuario)),

  // Retorna el objeto usuario o null si no hay sesión activa
  obtenerUsuario: () => {
    const datos = sessionStorage.getItem(USUARIO_KEY);
    return datos ? JSON.parse(datos) : null;
  },

  // Indica si hay una sesión activa verificando la existencia del token
  estaAutenticado: () =>
    !!sessionStorage.getItem(TOKEN_KEY),

  // Elimina el token y los datos del usuario cerrando la sesión local
  cerrarSesion: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USUARIO_KEY);
  }
};

// ============================================================
// peticion — Función base de comunicación HTTP
// ============================================================
// Entrada:
//   endpoint (string) — ruta relativa, ej: '/auth/login'
//   opciones  (object) — opciones fetch: method, body, headers
//
// Salida:
//   { ok: boolean, status: number, datos: object }
//
// Si hay token en sesión lo adjunta automáticamente en el header
// Authorization bajo el esquema Bearer requerido por el backend.
// Si el servidor no está disponible retorna ok: false con mensaje
// descriptivo en lugar de lanzar una excepción no controlada.
// ============================================================
const peticion = async (endpoint, opciones = {}) => {
  const token = session.obtenerToken();

  const headers = {
    'Content-Type': 'application/json',
    // Se adjunta el token solo si existe — las rutas públicas no lo necesitan
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...opciones.headers
  };

  try {
    const respuesta = await fetch(`${API_BASE}${endpoint}`, {
      ...opciones,
      headers
    });

    const datos = await respuesta.json();
    return { ok: respuesta.ok, status: respuesta.status, datos };

  } catch (error) {
    // Error de red: el servidor no está disponible o CORS bloqueó la petición
    return {
      ok:     false,
      status: 0,
      datos: {
        exito:   false,
        mensaje: 'No se pudo conectar con el servidor. Verifique que el backend esté activo en http://localhost:3000'
      }
    };
  }
};

// ============================================================
// authService — Operaciones de autenticación
// ============================================================
// Cada función retorna { ok, status, datos } para que el módulo
// llamador decida qué hacer según el resultado sin conocer los
// detalles de la comunicación HTTP.
// ============================================================
export const authService = {

  // Inicio de sesión
  // Entrada:  { email, password }
  // Salida:   { ok, datos: { exito, token, usuario } }
  login: (credenciales) =>
    peticion('/auth/login', {
      method: 'POST',
      body:   JSON.stringify(credenciales)
    }),

  // Registro de usuario nuevo
  // Entrada:  { nombre, email, password, rol? }
  // Salida:   { ok, datos: { exito, datos: { id, nombre, email, rol } } }
  registro: (datos) =>
    peticion('/auth/registro', {
      method: 'POST',
      body:   JSON.stringify(datos)
    }),

  // Perfil del usuario autenticado (requiere token en sesión)
  // Salida:   { ok, datos: { exito, datos: { id, nombre, email, rol, creado_en } } }
  perfil: () =>
    peticion('/auth/perfil'),

  // Health check del servidor y la base de datos
  // Salida:   { ok, datos: { exito, baseDeDatos, version, timestamp } }
  estado: () =>
    peticion('/estado')
};

// ============================================================
// leadsService — Gestión local de leads (demo)
// ============================================================
// Implementa el CRUD de leads usando sessionStorage como
// almacenamiento temporal. Esto permite demostrar la interfaz
// completa mientras se desarrollan los endpoints de leads
// en el backend sobre el schema sistema_gestion_leads.
//
// Cuando los endpoints de leads estén disponibles, solo hay que
// reemplazar cada función por una llamada a peticion() sin
// cambiar nada en los módulos que consumen este servicio.
// ============================================================
export const leadsService = {

  // Retorna todos los leads almacenados en sesión
  obtenerTodos: () => {
    const datos = sessionStorage.getItem('leads_datos');
    return datos ? JSON.parse(datos) : [];
  },

  // Persiste un lead nuevo generando su ID automáticamente
  // Entrada:  { nombre, email, estado, prioridad, fuente, feedback_cliente }
  // Salida:   objeto lead creado con id_lead y fechas generadas
  guardar: (lead) => {
    const leads = leadsService.obtenerTodos();
    const nuevo = {
      ...lead,
      id_lead:               `L-${String(leads.length + 1).padStart(3, '0')}`,
      fecha_registro:        new Date().toISOString().split('T')[0],
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0]
    };
    leads.unshift(nuevo);
    sessionStorage.setItem('leads_datos', JSON.stringify(leads));
    return nuevo;
  },

  // Actualiza los campos de un lead existente por su id_lead
  // Entrada:  id (string), cambios (object con campos a actualizar)
  // Salida:   objeto lead actualizado o null si no se encontró
  actualizar: (id, cambios) => {
    const leads = leadsService.obtenerTodos();
    const indice = leads.findIndex(l => l.id_lead === id);
    if (indice === -1) return null;
    leads[indice] = {
      ...leads[indice],
      ...cambios,
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0]
    };
    sessionStorage.setItem('leads_datos', JSON.stringify(leads));
    return leads[indice];
  },

  // Elimina un lead por su id_lead
  // Entrada:  id (string)
  // Salida:   true si se eliminó, false si no se encontró
  eliminar: (id) => {
    const leads    = leadsService.obtenerTodos();
    const filtrado = leads.filter(l => l.id_lead !== id);
    sessionStorage.setItem('leads_datos', JSON.stringify(filtrado));
    return filtrado.length < leads.length;
  },

  // Genera 8 leads de demostración para poblar la tabla inicial
  // Solo se llama si no hay leads almacenados en sesión
  generarDemo: () => {
    const estados    = ['Nuevo', 'En proceso', 'Calificado', 'Cerrado', 'Descartado'];
    const prioridades = ['Alta', 'Media', 'Baja'];
    const fuentes    = ['Web', 'Referido', 'Redes sociales', 'Llamada entrante', 'Evento'];
    const nombres    = [
      'Laura Jiménez', 'Carlos Méndez', 'Sofía Ruiz', 'Andrés Mora',
      'Valentina Ríos', 'Diego Salcedo', 'Camila Torres', 'Felipe Castro'
    ];

    const leads = nombres.map((nombre, i) => ({
      id_lead:               `L-${String(i + 1).padStart(3, '0')}`,
      nombre,
      email:                 `${nombre.toLowerCase().replace(/ /g, '.')}@empresa.com`,
      estado:                estados[i % estados.length],
      prioridad:             prioridades[i % prioridades.length],
      fuente:                fuentes[i % fuentes.length],
      feedback_cliente:      'Lead generado para demostración del sistema.',
      fecha_registro:        '2026-04-01',
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0]
    }));

    sessionStorage.setItem('leads_datos', JSON.stringify(leads));
    return leads;
  }
};