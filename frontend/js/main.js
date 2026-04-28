// ============================================================
// Orquestador principal — Aplicación frontend
// Sistema Integral de Gestión de Leads
// ============================================================
// Responsabilidades:
//   - Verificar sesión activa al cargar la página
//   - Gestionar el formulario de login conectado al backend real
//   - Gestionar el formulario de registro de usuarios
//   - Controlar la navegación entre vistas (leads, seguimientos, config)
//   - Inicializar los módulos según la vista activa
//   - Manejar el cierre de sesión
//
// Autor: jocampo-backend
// Rama:  feature/backend-auth
// ============================================================

import { authService, session }                    from './modules/api.js';
import { iniciarModuloLeads, guardarLead, eliminarLead } from './modules/leads.js';

// ============================================================
// Inicialización al cargar el DOM
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

  // Inicializa todos los componentes Materialize del documento
  M.Modal.init(document.querySelectorAll('.modal'));
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Sidenav.init(document.querySelectorAll('.sidenav'));

  // Si ya hay sesión activa (recarga de página) va directo al dashboard
  // Evita que el usuario vea el login si ya está autenticado
  if (session.estaAutenticado()) {
    mostrarApp();
  } else {
    mostrarLogin();
  }

  // ----------------------------------------------------------
  // Formulario de inicio de sesión
  // Conectado al endpoint real POST /api/auth/login
  // ----------------------------------------------------------
  document.getElementById('form-login')
    .addEventListener('submit', async (e) => {
      e.preventDefault();

      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btnLogin = document.getElementById('btn-login');
      const msgError = document.getElementById('login-error');

      // Estado de carga — evita doble envío
      btnLogin.disabled     = true;
      btnLogin.textContent  = 'Verificando...';
      msgError.style.display = 'none';

      const { ok, datos } = await authService.login({ email, password });

      btnLogin.disabled    = false;
      btnLogin.textContent = 'Iniciar Sesión';

      if (ok && datos.exito) {
        // Persiste el token y los datos del usuario en sessionStorage
        session.guardarToken(datos.token);
        session.guardarUsuario(datos.usuario);
        mostrarApp();
      } else {
        // Muestra el mensaje de error devuelto por el backend
        msgError.textContent    = datos.mensaje || 'Error de autenticación.';
        msgError.style.display  = 'block';
      }
    });

  // ----------------------------------------------------------
  // Formulario de registro de usuario (modal — solo admin)
  // Conectado al endpoint real POST /api/auth/registro
  // ----------------------------------------------------------
  document.getElementById('form-registro')
    ?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const datos = {
        nombre:   document.getElementById('reg-nombre').value.trim(),
        email:    document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        rol:      document.getElementById('reg-rol').value
      };

      const { ok, datos: respuesta } = await authService.registro(datos);

      if (ok && respuesta.exito) {
        M.toast({
          html:    `✅ Usuario ${respuesta.datos.nombre} registrado correctamente.`,
          classes: 'teal darken-2'
        });
        M.Modal.getInstance(document.getElementById('modal-registro')).close();
        document.getElementById('form-registro').reset();
      } else {
        M.toast({
          html:    `⚠️ ${respuesta.mensaje || 'Error al registrar.'}`,
          classes: 'red darken-1'
        });
      }
    });

  // ----------------------------------------------------------
  // Cierre de sesión
  // ----------------------------------------------------------
  document.querySelectorAll('.btn-cerrar-sesion').forEach(btn =>
    btn.addEventListener('click', () => {
      session.cerrarSesion();
      mostrarLogin();
    })
  );

  // ----------------------------------------------------------
  // Navegación entre vistas
  // ----------------------------------------------------------
  document.querySelectorAll('[data-vista]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const vista = btn.dataset.vista;

      // Marca el ítem activo en la barra lateral
      document.querySelectorAll('[data-vista]')
        .forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');

      mostrarVista(vista);

      // Cierra la barra lateral en móvil al navegar
      const sidenav = document.querySelector('.sidenav');
      if (sidenav) M.Sidenav.getInstance(sidenav)?.close();
    });
  });

  // ----------------------------------------------------------
  // Formulario de lead — botón guardar del modal
  // ----------------------------------------------------------
  document.getElementById('btn-guardar-lead')
    ?.addEventListener('click', guardarLead);

  // ----------------------------------------------------------
  // Confirmación de eliminación de lead
  // ----------------------------------------------------------
  document.getElementById('btn-confirmar-eliminar')
    ?.addEventListener('click', (e) => {
      eliminarLead(e.currentTarget.dataset.id);
    });

  // ----------------------------------------------------------
  // Health check — vista de configuración
  // ----------------------------------------------------------
  document.getElementById('btn-health-check')
    ?.addEventListener('click', async () => {
      const resultado = document.getElementById('health-resultado');
      resultado.innerHTML = '<span class="grey-text">Verificando...</span>';

      const { ok, datos } = await authService.estado();

      resultado.innerHTML = ok
        ? `<span class="teal-text darken-2">
             <i class="material-icons tiny">check_circle</i>
             Servidor operativo &nbsp;|&nbsp;
             Base de datos: <strong>${datos.baseDeDatos}</strong> &nbsp;|&nbsp;
             v${datos.version}
           </span>`
        : `<span class="red-text">
             <i class="material-icons tiny">error</i>
             ${datos.mensaje}
           </span>`;
    });
});

// ============================================================
// mostrarLogin
// Muestra la pantalla de autenticación y oculta la app
// ============================================================
const mostrarLogin = () => {
  document.getElementById('vista-login').style.display = 'flex';
  document.getElementById('vista-app').style.display   = 'none';
  // Limpia el formulario de login al mostrarlo
  document.getElementById('form-login').reset();
  document.getElementById('login-error').style.display = 'none';
};

// ============================================================
// mostrarApp
// Muestra la aplicación principal tras autenticación exitosa
// ============================================================
const mostrarApp = () => {
  const usuario = session.obtenerUsuario();

  document.getElementById('vista-login').style.display = 'none';
  document.getElementById('vista-app').style.display   = 'block';

  // Muestra nombre y rol del usuario en la barra lateral
  if (usuario) {
    const elNombre = document.getElementById('usuario-nombre');
    const elRol    = document.getElementById('usuario-rol');
    if (elNombre) elNombre.textContent = usuario.nombre;
    if (elRol)    elRol.textContent    = usuario.rol.toUpperCase();

    // La opción de registro solo es visible para administradores
    const menuRegistro = document.getElementById('menu-registro');
    if (menuRegistro) {
      menuRegistro.style.display = usuario.rol === 'admin' ? 'block' : 'none';
    }
  }

  // Activa la vista de leads por defecto al entrar
  mostrarVista('leads');
};

// ============================================================
// mostrarVista
// Alterna la sección visible dentro de la aplicación
// Entrada: nombre (string) — 'leads' | 'seguimientos' | 'config'
// ============================================================
const mostrarVista = (nombre) => {
  // Oculta todas las secciones
  document.querySelectorAll('.vista-seccion')
    .forEach(s => s.style.display = 'none');

  // Muestra la sección solicitada
  const seccion = document.getElementById(`seccion-${nombre}`);
  if (seccion) seccion.style.display = 'block';

  // Carga el módulo correspondiente
  if (nombre === 'leads') {
    iniciarModuloLeads();
  }
};