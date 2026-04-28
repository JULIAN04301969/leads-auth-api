// ============================================================
// Módulo de gestión de leads
// Sistema Integral de Gestión de Leads — Frontend
// ============================================================
// Responsabilidades:
//   - Renderizar la tabla de leads con datos reales o de demo
//   - Gestionar el formulario CRUD (crear, editar, eliminar)
//   - Aplicar filtros de búsqueda en tiempo real
//   - Mostrar notificaciones de operación con toasts Materialize
//
// Autor: mgarcia-frontend
// Rama:  feature/frontend-leads
// ============================================================

import { leadsService } from './api.js';

// Mapa de colores CSS por estado del lead
// Cada clase badge-* está definida en style.css
const CLASE_ESTADO = {
  'Nuevo':      'badge-Nuevo',
  'En proceso': 'badge-En-proceso',
  'Calificado': 'badge-Calificado',
  'Cerrado':    'badge-Cerrado',
  'Descartado': 'badge-Descartado'
};

// Mapa de colores de texto por prioridad usando clases Materialize
const CLASE_PRIORIDAD = {
  'Alta':  'red-text text-darken-2',
  'Media': 'orange-text text-darken-1',
  'Baja':  'grey-text'
};

// ============================================================
// renderTablaLeads
// ============================================================
// Dibuja las filas de la tabla de leads en el tbody del DOM.
//
// Entrada:
//   leads     (array)    — lista de objetos lead a mostrar
//   onEditar  (function) — callback que recibe el id_lead al editar
//   onEliminar(function) — callback que recibe el id_lead al eliminar
// ============================================================
export const renderTablaLeads = (leads, onEditar, onEliminar) => {
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;

  // Mensaje vacío cuando no hay leads que mostrar
  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="center-align grey-text" style="padding:40px 0;">
          <i class="material-icons medium grey-text">inbox</i>
          <p>No hay leads registrados. Use el botón "Nuevo Lead" para crear el primero.</p>
        </td>
      </tr>`;
    return;
  }

  // Construye una fila HTML por cada lead del arreglo
  tbody.innerHTML = leads.map(lead => `
    <tr>
      <td><strong>${lead.id_lead}</strong></td>
      <td>${lead.nombre}</td>
      <td>${lead.email}</td>
      <td>
        <span class="badge-estado ${CLASE_ESTADO[lead.estado] || 'badge-Nuevo'}">
          ${lead.estado}
        </span>
      </td>
      <td class="${CLASE_PRIORIDAD[lead.prioridad] || ''}">
        <strong>${lead.prioridad || '—'}</strong>
      </td>
      <td>${lead.fecha_ultimo_contacto}</td>
      <td>
        <button class="btn-accion btn-editar waves-effect waves-light blue"
                data-id="${lead.id_lead}" title="Editar lead">
          <i class="material-icons" style="font-size:16px;line-height:28px;">edit</i>
        </button>
        <button class="btn-accion btn-eliminar waves-effect waves-light red"
                data-id="${lead.id_lead}" title="Eliminar lead">
          <i class="material-icons" style="font-size:16px;line-height:28px;">delete</i>
        </button>
      </td>
    </tr>
  `).join('');

  // Delegación de eventos sobre los botones generados dinámicamente
  tbody.querySelectorAll('.btn-editar').forEach(btn =>
    btn.addEventListener('click', () => onEditar(btn.dataset.id))
  );
  tbody.querySelectorAll('.btn-eliminar').forEach(btn =>
    btn.addEventListener('click', () => onEliminar(btn.dataset.id))
  );
};

// ============================================================
// iniciarModuloLeads
// ============================================================
// Punto de entrada del módulo. Carga los datos, conecta los
// eventos de filtro y renderiza la tabla inicial.
// Se llama desde main.js cada vez que se activa la vista leads.
// ============================================================
export const iniciarModuloLeads = () => {

  // Carga leads de sesión o genera datos demo si no hay ninguno
  let leads = leadsService.obtenerTodos();
  if (leads.length === 0) {
    leads = leadsService.generarDemo();
  }

  // Renderiza la tabla aplicando los filtros activos
  const renderizar = () => {
    const busqueda   = (document.getElementById('buscar-lead')?.value || '').toLowerCase();
    const filtroEst  = document.getElementById('filtro-estado')?.value || '';

    const filtrados = leads.filter(l => {
      const coincideBusqueda = !busqueda ||
        l.nombre.toLowerCase().includes(busqueda) ||
        l.email.toLowerCase().includes(busqueda);
      const coincideEstado = !filtroEst || l.estado === filtroEst;
      return coincideBusqueda && coincideEstado;
    });

    renderTablaLeads(filtrados, abrirEdicion, confirmarEliminacion);

    // Actualiza el contador de leads visible
    const contador = document.getElementById('contador-leads');
    if (contador) {
      contador.textContent = `${filtrados.length} de ${leads.length} leads`;
    }
  };

  // Filtros reactivos — se actualizan mientras el usuario escribe o selecciona
  document.getElementById('buscar-lead')
    ?.addEventListener('input', renderizar);
  document.getElementById('filtro-estado')
    ?.addEventListener('change', renderizar);

  // Botón "Nuevo Lead" — abre el modal con el formulario vacío
  document.getElementById('btn-nuevo-lead')
    ?.addEventListener('click', abrirNuevo);

  renderizar();
};

// ── Funciones internas del módulo ────────────────────────────

// Abre el modal con el formulario vacío para crear un lead nuevo
const abrirNuevo = () => {
  document.getElementById('modal-lead-titulo').textContent = 'Nuevo Lead';
  document.getElementById('form-lead').reset();
  document.getElementById('lead-id-edicion').value = '';
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Modal.getInstance(document.getElementById('modal-lead')).open();
};

// Rellena el formulario del modal con los datos del lead a editar
// Entrada: id (string) — id_lead del lead a editar
const abrirEdicion = (id) => {
  const lead = leadsService.obtenerTodos().find(l => l.id_lead === id);
  if (!lead) return;

  document.getElementById('modal-lead-titulo').textContent = 'Editar Lead';
  document.getElementById('lead-id-edicion').value   = lead.id_lead;
  document.getElementById('lead-nombre').value        = lead.nombre;
  document.getElementById('lead-email').value         = lead.email;
  document.getElementById('lead-estado').value        = lead.estado;
  document.getElementById('lead-prioridad').value     = lead.prioridad;
  document.getElementById('lead-fuente').value        = lead.fuente || '';
  document.getElementById('lead-feedback').value      = lead.feedback_cliente || '';

  // Notifica a Materialize que los selects cambiaron programáticamente
  M.FormSelect.init(document.querySelectorAll('select'));
  M.Modal.getInstance(document.getElementById('modal-lead')).open();
};

// Muestra el modal de confirmación antes de eliminar
// Entrada: id (string) — id_lead del lead a eliminar
const confirmarEliminacion = (id) => {
  document.getElementById('confirm-lead-id').textContent    = id;
  document.getElementById('btn-confirmar-eliminar').dataset.id = id;
  M.Modal.getInstance(document.getElementById('modal-confirmar')).open();
};

// ============================================================
// guardarLead — exportada para ser llamada desde main.js
// ============================================================
// Lee el formulario del modal, valida y crea o actualiza el lead.
// Entrada: ninguna (lee directamente del DOM)
// Salida:  ninguna (actualiza sessionStorage y re-renderiza)
// ============================================================
export const guardarLead = () => {
  const id        = document.getElementById('lead-id-edicion').value;
  const nombre    = document.getElementById('lead-nombre').value.trim();
  const email     = document.getElementById('lead-email').value.trim();
  const estado    = document.getElementById('lead-estado').value;
  const prioridad = document.getElementById('lead-prioridad').value;
  const fuente    = document.getElementById('lead-fuente').value;
  const feedback  = document.getElementById('lead-feedback').value.trim();

  // Validación mínima antes de persistir
  if (!nombre || !email) {
    M.toast({ html: '⚠️ Los campos nombre y email son obligatorios.', classes: 'orange darken-2' });
    return;
  }

  const datos = { nombre, email, estado, prioridad, fuente, feedback_cliente: feedback };

  if (id) {
    // Modo edición — actualiza el lead existente
    leadsService.actualizar(id, datos);
    M.toast({ html: `✅ Lead ${id} actualizado correctamente.`, classes: 'teal darken-2' });
  } else {
    // Modo creación — registra el lead nuevo
    const nuevo = leadsService.guardar(datos);
    M.toast({ html: `✅ Lead ${nuevo.id_lead} creado correctamente.`, classes: 'teal darken-2' });
  }

  M.Modal.getInstance(document.getElementById('modal-lead')).close();
  iniciarModuloLeads();
};

// ============================================================
// eliminarLead — exportada para ser llamada desde main.js
// ============================================================
// Elimina el lead identificado por id y re-renderiza la tabla.
// Entrada: id (string) — id_lead del lead a eliminar
// ============================================================
export const eliminarLead = (id) => {
  leadsService.eliminar(id);
  M.toast({ html: `🗑️ Lead ${id} eliminado.`, classes: 'red darken-1' });
  M.Modal.getInstance(document.getElementById('modal-confirmar')).close();
  iniciarModuloLeads();
};