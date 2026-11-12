function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function createDepartmentItem(department){
  const li = document.createElement('li');
  li.className = 'department-item';
  li.dataset.id = department.id_departamento;
  const info = document.createElement('div');
  info.innerHTML = `<strong>${escapeHtml(department.nombre)}</strong>` +
    (department.descripcion ? `<div class="muted">${escapeHtml(department.descripcion)}</div>` : '');
  li.appendChild(info);
  return li;
}

export function renderDepartmentList(listEl, departments){
  listEl.innerHTML = '';
  if(!departments || departments.length === 0) return false;
  for(const department of departments) listEl.appendChild(createDepartmentItem(department));
  return true;
}
