function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function createAssignmentItem(assignment, departmentName, measurementCount = 0){
  const li = document.createElement('li');
  li.className = 'assignment-item';
  li.dataset.id = assignment.id_historial;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const end = assignment.fecha_fin || (assignment.fecha_inicio > today ? 'programada' : 'vigente');
  const period = `${assignment.fecha_inicio} → ${end}`;
  const info = document.createElement('div');
  info.innerHTML = `<strong>${escapeHtml(departmentName || 'Departamento desconocido')}</strong>` +
    `<div class="muted">${escapeHtml(period)}</div>` +
    (measurementCount > 0 ? `<div class="muted">${measurementCount} medición(es) vinculada(s)</div>` : '');
  li.appendChild(info);
  return li;
}

export function renderAssignmentList(listEl, assignments, departmentNameFor, measurementCountFor){
  listEl.innerHTML = '';
  if(!assignments || assignments.length === 0) return false;
  for(const assignment of assignments){
    listEl.appendChild(createAssignmentItem(
      assignment,
      departmentNameFor ? departmentNameFor(assignment) : '',
      measurementCountFor ? measurementCountFor(assignment) : 0
    ));
  }
  return true;
}
