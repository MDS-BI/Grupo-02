function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function createHistoryRow(measurement){
  const tr = document.createElement('tr');
  tr.className = 'history-row';
  const evaluaciones = [];
  if(measurement.evaluacionCalidad !== undefined && measurement.evaluacionCalidad !== null) evaluaciones.push(`Cal: ${measurement.evaluacionCalidad}`);
  if(measurement.evaluacionResponsabilidad !== undefined && measurement.evaluacionResponsabilidad !== null) evaluaciones.push(`Resp: ${measurement.evaluacionResponsabilidad}`);
  if(measurement.evaluacionCumplimiento !== undefined && measurement.evaluacionCumplimiento !== null) evaluaciones.push(`Cumpl: ${measurement.evaluacionCumplimiento}`);
  if(measurement.evaluacionColaboracion !== undefined && measurement.evaluacionColaboracion !== null) evaluaciones.push(`Colab: ${measurement.evaluacionColaboracion}`);
  const evaluacionTexto = evaluaciones.length > 0 ? evaluaciones.join(' · ') : '—';
  tr.innerHTML = `<td>${escapeHtml(measurement.period || '')}</td>` +
    `<td>${escapeHtml(measurement.departamento || '')}</td>` +
    `<td>${escapeHtml(measurement.indicador || '')}</td>` +
    `<td>${escapeHtml(String(measurement.resultado ?? ''))}</td>` +
    `<td>${escapeHtml(measurement.unidad || '')}</td>` +
    `<td>${escapeHtml(measurement.turno || '')}</td>` +
    `<td>${escapeHtml(measurement.meta !== undefined && measurement.meta !== null ? String(measurement.meta) : '')}</td>` +
    `<td>${escapeHtml(evaluacionTexto)}</td>`;
  return tr;
}

export function renderHistoryTable(bodyEl, emptyEl, measurements){
  bodyEl.innerHTML = '';
  if(!measurements || measurements.length === 0){
    if(emptyEl){
      emptyEl.hidden = false;
      emptyEl.textContent = 'El personal seleccionado aún no tiene evaluaciones de desempeño.';
    }
    return false;
  }
  if(emptyEl) emptyEl.hidden = true;
  for(const measurement of measurements) bodyEl.appendChild(createHistoryRow(measurement));
  return true;
}
