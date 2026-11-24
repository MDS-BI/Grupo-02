function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function createEvolutionRow(measurement){
  const tr = document.createElement('tr');
  tr.className = 'evolution-row';
  tr.innerHTML = `<td>${escapeHtml(measurement.period || '')}</td>` +
    `<td>${escapeHtml(measurement.indicador || '')}</td>` +
    `<td>${escapeHtml(String(measurement.resultado ?? ''))}</td>` +
    `<td>${escapeHtml(measurement.unidad || '')}</td>` +
    `<td>${escapeHtml(measurement.departamento || '')}</td>` +
    `<td>${escapeHtml(measurement.turno || '')}</td>` +
    `<td>${escapeHtml(measurement.meta !== undefined && measurement.meta !== null ? String(measurement.meta) : '')}</td>`;
  return tr;
}

export function renderEvolutionTable(bodyEl, messageEl, measurements){
  bodyEl.innerHTML = '';
  if(!measurements || measurements.length === 0){
    if(messageEl){
      messageEl.hidden = false;
      messageEl.textContent = 'No hay datos suficientes para visualizar la evolución del desempeño de este indicador y unidad.';
    }
    return false;
  }
  if(messageEl){
    messageEl.hidden = measurements.length >= 2;
    messageEl.textContent = measurements.length >= 2
      ? ''
      : 'Solo existe una evaluación comparable; se requiere más de una para observar la evolución del desempeño.';
  }
  for(const measurement of measurements) bodyEl.appendChild(createEvolutionRow(measurement));
  return true;
}
