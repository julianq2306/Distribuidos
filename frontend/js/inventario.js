const API = 'http://localhost:3001/medicamentos';
const DEMANDA_API = 'http://localhost:8001';

let medicamentos = [];
let editandoId = null;


// ── Iniciar ──
document.addEventListener('DOMContentLoaded', () => {
  cargarMedicamentos();
});

// ── Cerrar sesión ──
function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  window.location.href = 'login.html';
}

// ── Cargar medicamentos ──
async function cargarMedicamentos() {
  const area = document.getElementById('tabla-area');
  area.innerHTML = '<div class="loading"><i class="ti ti-loader"></i><span>Cargando medicamentos...</span></div>';

  try {
    const res = await fetch(API);
    medicamentos = await res.json();
    actualizarMetricas();
    renderTabla(medicamentos);
  } catch (err) {
    area.innerHTML = '<div class="loading" style="color:#dc2626"><i class="ti ti-wifi-off"></i><span>No se pudo conectar al servidor</span></div>';
  }
}

// ── Métricas ──
function actualizarMetricas() {
  const stockBajo = medicamentos.filter(m => m.stock_actual <= m.stock_minimo).length;
  const vencidos  = medicamentos.filter(m => diasRestantes(m.fecha_vencimiento) < 0).length;
  const proximos  = medicamentos.filter(m => {
    const d = diasRestantes(m.fecha_vencimiento);
    return d >= 0 && d <= 30;
  }).length;
  const ok = medicamentos.filter(m => {
    return m.stock_actual > m.stock_minimo && diasRestantes(m.fecha_vencimiento) > 30;
  }).length;

  document.getElementById('m-total').textContent    = medicamentos.length;
  document.getElementById('m-stock').textContent    = stockBajo;
  document.getElementById('m-vencidos').textContent = vencidos;
  document.getElementById('m-proximos').textContent = proximos;
  document.getElementById('m-ok').textContent       = ok;
}

// ── Días restantes ──
function diasRestantes(fecha) {
  const hoy  = new Date();
  const venc = new Date(fecha);
  return Math.floor((venc - hoy) / (1000 * 60 * 60 * 24));
}

// ── Render tabla ──
function renderTabla(lista) {
  const area = document.getElementById('tabla-area');

  if (lista.length === 0) {
    area.innerHTML = '<div class="empty"><i class="ti ti-clipboard-x"></i><span>No hay medicamentos registrados</span></div>';
    return;
  }

  const filas = lista.map(m => {
    const dias     = diasRestantes(m.fecha_vencimiento);
    const vencido  = dias < 0;
    const proximo  = dias >= 0 && dias <= 30;
    const stockBajo = m.stock_actual <= m.stock_minimo;

    let estadoFecha = '';
    if (vencido)      estadoFecha = '<span class="badge danger">Vencido</span>';
    else if (proximo) estadoFecha = '<span class="badge warning">Próx. vencer</span>';
    else              estadoFecha = '<span class="badge ok">Vigente</span>';

    let estadoStock = '';
    if (m.stock_actual === 0) estadoStock = '<span class="badge danger">Sin stock</span>';
    else if (stockBajo)       estadoStock = '<span class="badge warning">Stock bajo</span>';
    else                      estadoStock = '<span class="badge ok">OK</span>';

    const rowClass = vencido ? 'row-vencido' : proximo ? 'row-proximo' : '';

    return `
      <tr class="${rowClass}">
        <td><strong>${m.nombre}</strong><br><span style="font-size:11px;color:#94a3b8">${m.principio_activo || ''}</span></td>
        <td>${m.forma_farmaceutica || '—'}</td>
        <td>${m.stock_actual} ${m.unidad_medida}<br>${estadoStock}</td>
        <td>${m.stock_minimo}</td>
        <td>${m.lote}</td>
        <td>${new Date(m.fecha_vencimiento).toLocaleDateString('es-CO')}<br>${estadoFecha}</td>
        <td>${m.ubicacion}</td>
        <td>${m.consumo_diario_est > 0 ? m.consumo_diario_est + '/día' : '—'}</td>
        <td>
          <div class="acciones">
            <button class="btn-edit" onclick="abrirEditar(${m.id})"><i class="ti ti-edit"></i> Editar</button>
            <button class="btn-delete" onclick="eliminarMedicamento(${m.id})"><i class="ti ti-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  area.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Medicamento</th>
          <th>Forma</th>
          <th>Stock actual</th>
          <th>Stock mín.</th>
          <th>Lote</th>
          <th>Vencimiento</th>
          <th>Ubicación</th>
          <th>Consumo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
  `;
}

// ── Filtrar ──
function filtrarTabla() {
  const texto = document.getElementById('buscador').value.toLowerCase();
  const filtrados = medicamentos.filter(m =>
    m.nombre.toLowerCase().includes(texto) ||
    (m.lote && m.lote.toLowerCase().includes(texto)) ||
    (m.ubicacion && m.ubicacion.toLowerCase().includes(texto))
  );
  renderTabla(filtrados);
}

// ── Modal ──
function abrirModal() {
  editandoId = null;
  document.getElementById('modal-titulo').textContent = 'Nuevo medicamento';
  document.getElementById('btn-guardar-texto').textContent = 'Guardar';
  limpiarForm();
  document.getElementById('modal-error').style.display = 'none';
  document.getElementById('modal').style.display = 'flex';
}

function abrirEditar(id) {
  const m = medicamentos.find(x => x.id === id);
  if (!m) return;

  editandoId = id;
  document.getElementById('modal-titulo').textContent = 'Editar medicamento';
  document.getElementById('btn-guardar-texto').textContent = 'Guardar cambios';
  document.getElementById('modal-error').style.display = 'none';

  document.getElementById('f-nombre').value    = m.nombre || '';
  document.getElementById('f-principio').value = m.principio_activo || '';
  document.getElementById('f-forma').value     = m.forma_farmaceutica || '';
  document.getElementById('f-stock').value     = m.stock_actual || 0;
  document.getElementById('f-stock-min').value = m.stock_minimo || 0;
  document.getElementById('f-stock-max').value = m.stock_maximo || 0;
  document.getElementById('f-unidad').value    = m.unidad_medida || 'tabletas';
  document.getElementById('f-consumo').value   = m.consumo_diario_est || 0;
  document.getElementById('f-lote').value      = m.lote || '';
  document.getElementById('f-fecha').value     = m.fecha_vencimiento ? m.fecha_vencimiento.split('T')[0] : '';
  document.getElementById('f-ubicacion').value = m.ubicacion || '';

  document.getElementById('modal').style.display = 'flex';
}

function cerrarModal() {
  document.getElementById('modal').style.display = 'none';
  editandoId = null;
  limpiarForm();
}

function limpiarForm() {
  ['f-nombre','f-principio','f-forma','f-stock','f-stock-min',
   'f-stock-max','f-consumo','f-lote','f-fecha','f-ubicacion'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-unidad').value = 'tabletas';
}

// ── Guardar ──
async function guardarMedicamento() {
  const nombre    = document.getElementById('f-nombre').value.trim();
  const stock     = document.getElementById('f-stock').value;
  const stockMin  = document.getElementById('f-stock-min').value;
  const lote      = document.getElementById('f-lote').value.trim();
  const fecha     = document.getElementById('f-fecha').value;
  const ubicacion = document.getElementById('f-ubicacion').value.trim();

  if (!nombre || !stock || !stockMin || !lote || !fecha || !ubicacion) {
    mostrarError('Completa todos los campos obligatorios (*)');
    return;
  }

  const data = {
    nombre,
    principio_activo:   document.getElementById('f-principio').value.trim(),
    forma_farmaceutica: document.getElementById('f-forma').value.trim(),
    stock_actual:       parseInt(stock),
    stock_minimo:       parseInt(stockMin),
    stock_maximo:       parseInt(document.getElementById('f-stock-max').value) || null,
    unidad_medida:      document.getElementById('f-unidad').value,
    consumo_diario_est: parseFloat(document.getElementById('f-consumo').value) || 0,
    lote,
    fecha_vencimiento:  fecha,
    ubicacion,
  };

  try {
    const url    = editandoId ? `${API}/${editandoId}` : API;
    const method = editandoId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      mostrarError(err.message || 'Error al guardar');
      return;
    }

    // Generar alertas automáticamente después de guardar
    try {
      await fetch(`${DEMANDA_API}/generar-alertas`, { method: 'POST' });
    } catch (e) {
      console.warn('No se pudieron generar alertas:', e);
    }

    cerrarModal();
    cargarMedicamentos();
  } catch (err) {
    mostrarError('No se pudo conectar al servidor');
  }
}

// ── Eliminar ──
async function eliminarMedicamento(id) {
  if (!confirm('¿Seguro que deseas eliminar este medicamento?')) return;

  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });

    // Desactivar alertas del medicamento eliminado
    try {
      await fetch(`${DEMANDA_API}/desactivar-alertas/${id}`, { method: 'POST' });
    } catch (e) {
      console.warn('No se pudieron desactivar alertas:', e);
    }

    cargarMedicamentos();
  } catch (err) {
    alert('No se pudo eliminar el medicamento');
  }
}

// ── Error modal ──
function mostrarError(msg) {
  const el = document.getElementById('modal-error');
  el.textContent = msg;
  el.style.display = 'block';
}