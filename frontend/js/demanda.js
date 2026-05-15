const BASE = 'http://localhost:8001';
const BASE_INV = 'http://localhost:3001';
let predChart = null;

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Error ' + r.status);
  return r.json();
}

// ── Verificar conexión ────────────────────────────
async function checkConnection() {
  const badge = document.getElementById('badge-live');
  try {
    await fetchJSON(BASE + '/');
    badge.innerHTML = '<span class="dot"></span> Sistema activo';
    badge.className = 'badge-live active';
  } catch (e) {
    badge.innerHTML = '<i class="ti ti-wifi-off" style="font-size:13px;"></i> Sistema inactivo';
    badge.className = 'badge-live inactive';
  }
}

// ── Tabs ──────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });
}

// ── Dashboard ─────────────────────────────────────
async function loadDashboard() {
  try {
    const d = await fetchJSON(BASE + '/dashboard');
    document.getElementById('m-total').textContent = d.total_medicamentos ?? '—';
    document.getElementById('m-stock').textContent = d.stock_bajo?.length ?? 0;
    document.getElementById('m-venc').textContent = d.vencidos?.length ?? 0;
    document.getElementById('m-prox').textContent = d.proximos_vencer?.length ?? 0;
    document.getElementById('m-alertas').textContent = d.alertas?.length ?? 0;

    const al = document.getElementById('alertas-area');
    if (!d.alertas?.length) {
      al.innerHTML = `<div class="empty"><i class="ti ti-check"></i><span>No hay alertas activas en este momento</span></div>`;
    } else {
      al.innerHTML = '<div class="alert-list">' + d.alertas.map(a => `
        <div class="alert-item ${(a.prioridad || '').toLowerCase()}">
          <div class="alert-icon-wrap">
            <i class="ti ${a.prioridad === 'ALTA' ? 'ti-alert-triangle' : a.prioridad === 'MEDIA' ? 'ti-alert-circle' : 'ti-info-circle'}"></i>
          </div>
          <div style="flex:1">
            <div class="alert-msg">${a.mensaje}</div>
            <div class="alert-meta">${a.tipo_alerta}</div>
          </div>
          <span class="alert-prioridad">${a.prioridad}</span>
        </div>`).join('') + '</div>';
    }

    const sb = document.getElementById('stock-resumen');
    if (!d.stock_bajo?.length) {
      sb.innerHTML = `<div class="empty"><i class="ti ti-check"></i><span>Todos los stocks en niveles correctos</span></div>`;
    } else {
      sb.innerHTML = '<table class="data-table"><thead><tr><th>Medicamento</th><th>Stock actual</th><th>Mínimo requerido</th><th>Estado</th></tr></thead><tbody>' +
        d.stock_bajo.map(m => `
          <tr>
            <td><strong>${m.nombre}</strong></td>
            <td>${m.stock_actual} uds</td>
            <td>${m.stock_minimo} uds</td>
            <td><span class="badge danger">⚠ Stock bajo</span></td>
          </tr>`).join('') + '</tbody></table>';
    }

    const vr = document.getElementById('venc-resumen');
    const todos = [...(d.vencidos || []), ...(d.proximos_vencer || [])];
    if (!todos.length) {
      vr.innerHTML = `<div class="empty"><i class="ti ti-check"></i><span>Sin vencimientos próximos</span></div>`;
    } else {
      vr.innerHTML = '<table class="data-table"><thead><tr><th>Medicamento</th><th>Fecha vencimiento</th><th>Estado</th></tr></thead><tbody>' +
        (d.vencidos || []).map(m => `
          <tr>
            <td><strong>${m.nombre}</strong></td>
            <td>${m.fecha_vencimiento}</td>
            <td><span class="badge danger">Vencido</span></td>
          </tr>`).join('') +
        (d.proximos_vencer || []).map(m => `
          <tr>
            <td><strong>${m.nombre}</strong></td>
            <td>${m.fecha_vencimiento}</td>
            <td><span class="badge warning">Próximo a vencer</span></td>
          </tr>`).join('') +
        '</tbody></table>';
    }

  } catch (e) {
    document.getElementById('m-total').textContent = '—';
    document.getElementById('m-stock').textContent = '—';
    document.getElementById('m-venc').textContent = '—';
    document.getElementById('m-prox').textContent = '—';
    document.getElementById('m-alertas').textContent = '—';
    document.getElementById('alertas-area').innerHTML = `<div class="error-msg">No se pudo conectar con el servicio. Verifica que Docker esté corriendo.</div>`;
    document.getElementById('stock-resumen').innerHTML = '';
    document.getElementById('venc-resumen').innerHTML = '';
  }
}

// ── Medicamentos selector ─────────────────────────
async function loadMedicamentos() {
  try {
    const data = await fetchJSON(BASE_INV + '/medicamentos');
    const select = document.getElementById('med-select');
    select.innerHTML = data.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
    select.addEventListener('change', () => {
      const selected = data.find(m => m.id == select.value);
      loadPrediccion(select.value, selected?.nombre || '');
    });
    const first = data[0];
    if (first) loadPrediccion(first.id, first.nombre);
  } catch (e) {
    document.getElementById('pred-area').innerHTML = `<div class="error-msg">No se pudo cargar la lista de medicamentos. Verifica que Docker esté corriendo.</div>`;
  }
}

// ── Predicción ────────────────────────────────────
async function loadPrediccion(medId = 1, nombre = '') {
  const area = document.getElementById('pred-area');
  const titulo = document.getElementById('pred-titulo');
  area.innerHTML = '<div class="loading"><i class="ti ti-loader"></i><span>Calculando predicción...</span></div>';
  if (titulo) titulo.textContent = nombre;

  try {
    const d = await fetchJSON(BASE + '/prediccion/' + medId);

    if (d.error) {
      area.innerHTML = `<div class="error-msg"><i class="ti ti-database-off" style="font-size:18px; display:block; margin-bottom:6px;"></i>${d.error}<br><small style="color:#94a3b8; margin-top:4px; display:block;">Se necesitan mínimo 3 registros históricos de consumo</small></div>`;
      if (predChart) { predChart.destroy(); predChart = null; }
      return;
    }

    const dias = d.prediccion_7_dias;
    const max = Math.max(...dias.map(x => x.prediccion));
    const min = Math.min(...dias.map(x => x.prediccion));
    const tendencia = dias[dias.length - 1].prediccion > dias[0].prediccion ? '↑ Tendencia creciente' : '↓ Tendencia decreciente';

    area.innerHTML = `
      <div style="display:flex; gap:12px; margin-bottom:1.25rem;">
        <div style="flex:1; background:#eff6ff; border-radius:8px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#2563eb; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Máximo estimado</div>
          <div style="font-size:22px; font-weight:700; color:#1e40af;">${max.toFixed(1)}</div>
          <div style="font-size:11px; color:#94a3b8;">unidades/día</div>
        </div>
        <div style="flex:1; background:#f0fdf4; border-radius:8px; padding:12px; text-align:center;">
          <div style="font-size:11px; color:#059669; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Mínimo estimado</div>
          <div style="font-size:22px; font-weight:700; color:#065f46;">${min.toFixed(1)}</div>
          <div style="font-size:11px; color:#94a3b8;">unidades/día</div>
        </div>
        <div style="flex:1; background:#fafafa; border-radius:8px; padding:12px; text-align:center; border:1px solid #e2e8f0;">
          <div style="font-size:11px; color:#64748b; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Tendencia</div>
          <div style="font-size:14px; font-weight:700; color:#1a2332;">${tendencia}</div>
          <div style="font-size:11px; color:#94a3b8;">próximos 7 días</div>
        </div>
      </div>
      <table class="pred-table"><thead><tr><th>Fecha</th><th>Predicción (uds)</th><th style="width:160px">Volumen relativo</th></tr></thead><tbody>` +
      dias.map(x => `
        <tr>
          <td>${x.dia}</td>
          <td><strong>${x.prediccion.toFixed(1)}</strong> unidades</td>
          <td>
            <div class="bar-wrap">
              <div class="bar-mini" style="width:${Math.round(x.prediccion / max * 110)}px"></div>
              <span class="bar-val">${Math.round(x.prediccion / max * 100)}%</span>
            </div>
          </td>
        </tr>`).join('') +
      '</tbody></table>';

    if (predChart) predChart.destroy();
    predChart = new Chart(document.getElementById('predChart'), {
      type: 'line',
      data: {
        labels: dias.map(x => x.dia),
        datasets: [{
          label: 'Unidades predichas',
          data: dias.map(x => parseFloat(x.prediccion.toFixed(2))),
          borderColor: '#1a5276',
          backgroundColor: 'rgba(26,82,118,0.07)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#1a5276',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed.y.toFixed(1)} unidades estimadas`
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 }, color: '#64748b' } },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 11 }, color: '#64748b' },
            beginAtZero: false
          }
        }
      }
    });
  } catch (e) {
    area.innerHTML = '<div class="error-msg">No se pudo conectar con el servicio de demanda en localhost:8001</div>';
  }
}

// ── Riesgo ────────────────────────────────────────
async function loadRiesgo() {
  try {
    const riesgo = await fetchJSON(BASE + '/riesgo-agotamiento');
    const riesgoArea = document.getElementById('riesgo-area');

    if (!riesgo.length) {
      riesgoArea.innerHTML = `<div class="empty"><i class="ti ti-check"></i><span>Sin datos de riesgo disponibles</span></div>`;
      return;
    }

    const criticos   = riesgo.filter(m => typeof m.dias_restantes === 'number' && m.dias_restantes <= 5);
    const advertencia = riesgo.filter(m => typeof m.dias_restantes === 'number' && m.dias_restantes > 5 && m.dias_restantes <= 15);
    const normales   = riesgo.filter(m => typeof m.dias_restantes !== 'number' || m.dias_restantes > 15);

    const renderItem = m => {
      const dias = typeof m.dias_restantes === 'number' ? m.dias_restantes : null;
      const cls = dias === null ? 'ok' : dias <= 5 ? 'critical' : dias <= 15 ? 'warning' : 'ok';
      const label = dias === null ? 'Sin consumo registrado' : `${dias} días restantes`;
      const icon = cls === 'critical' ? 'ti-alert-triangle' : cls === 'warning' ? 'ti-clock' : 'ti-check';
      return `
        <div class="risk-item">
          <div class="risk-left">
            <div class="risk-dot ${cls}"></div>
            <div>
              <div class="risk-name">${m.nombre}</div>
              <div class="risk-stock">Stock: ${m.stock_actual} uds · Consumo diario: ${m.consumo_diario} uds/día</div>
            </div>
          </div>
          <div class="risk-dias ${cls}">
            <i class="ti ${icon}" style="font-size:13px;"></i> ${label}
          </div>
        </div>`;
    };

    riesgoArea.innerHTML =
      (criticos.length ? `<div class="section-title" style="color:#dc2626;">⚠ Crítico — menos de 5 días</div><div class="risk-list">${criticos.map(renderItem).join('')}</div><div class="divider"></div>` : '') +
      (advertencia.length ? `<div class="section-title" style="color:#d97706;">Advertencia — 5 a 15 días</div><div class="risk-list">${advertencia.map(renderItem).join('')}</div><div class="divider"></div>` : '') +
      (normales.length ? `<div class="section-title" style="color:#059669;">Normal — más de 15 días</div><div class="risk-list">${normales.map(renderItem).join('')}</div>` : '');

  } catch (e) {
    document.getElementById('riesgo-area').innerHTML = '<div class="error-msg">No se pudo conectar con el servicio. Verifica que Docker esté corriendo.</div>';
  }
}

// ── Top consumo ───────────────────────────────────
async function loadTop() {
  const area = document.getElementById('top-area');
  try {
    const data = await fetchJSON(BASE + '/top-consumo');
    if (!data.length) {
      area.innerHTML = `<div class="empty"><i class="ti ti-database-off"></i><span>Sin datos históricos de consumo registrados</span></div>`;
      return;
    }
    const max = Math.max(...data.map(x => parseFloat(x.total_consumido)));
    area.innerHTML = data.map((x, i) => `
      <div class="prog-row">
        <div class="prog-header">
          <div>
            <span class="prog-rank">#${i + 1}</span>
            <span class="prog-name">${x.nombre}</span>
          </div>
          <span class="prog-val">${parseFloat(x.total_consumido).toFixed(0)} unidades</span>
        </div>
        <div class="prog-track">
          <div class="prog-fill" style="width:${Math.round(parseFloat(x.total_consumido) / max * 100)}%"></div>
        </div>
      </div>`).join('');
  } catch (e) {
    area.innerHTML = '<div class="error-msg">No se pudo conectar con el servicio. Verifica que Docker esté corriendo.</div>';
  }
}

// ── Init ──────────────────────────────────────────
async function loadAll() {
  await checkConnection();
  await Promise.all([loadDashboard(), loadMedicamentos(), loadRiesgo(), loadTop()]);
}

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  loadAll();
});