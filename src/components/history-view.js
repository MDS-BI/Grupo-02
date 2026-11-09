function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function createHistoryRow(measurement){
  const tr = document.createElement('tr');
  tr.className = 'history-row';
  tr.innerHTML = `<td>${escapeHtml(measurement.period || '')}</td>` +
    `<td>${escapeHtml(measurement.departamento || '')}</td>` +
    `<td>${escapeHtml(measurement.indicador || '')}</td>` +
    `<td>${escapeHtml(String(measurement.resultado ?? ''))}</td>` +
    `<td>${escapeHtml(measurement.unidad || '')}</td>`;
  return tr;
}

export function renderHistoryTable(bodyEl, emptyEl, measurements){
  bodyEl.innerHTML = '';
  if(!measurements || measurements.length === 0){
    if(emptyEl){
      emptyEl.hidden = false;
      emptyEl.textContent = 'Este trabajador aún no tiene mediciones de productividad.';
    }
    return false;
  }
  if(emptyEl) emptyEl.hidden = true;
  for(const measurement of measurements) bodyEl.appendChild(createHistoryRow(measurement));
  return true;
}
