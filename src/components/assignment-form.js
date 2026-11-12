function qs(id){ return document.getElementById(id); }

export function clearAssignmentForm(){
  qs('assignment-id').value = '';
  qs('assignment-start').value = '';
  qs('assignment-end').value = '';
  const entity = qs('assignment-entity');
  if(entity) entity.value = '';
  const department = qs('assignment-department');
  if(department) department.value = '';
  const close = qs('assignment-close-previous');
  if(close) close.checked = true;
  clearAssignmentErrors();
  qs('assignment-cancel-edit').hidden = true;
  qs('assignment-submit-button').textContent = 'Registrar Asignación';
}

export function clearAssignmentErrors(){
  ['entity', 'department', 'start', 'end'].forEach(f => {
    const el = qs(`error-assignment-${f}`);
    if(el) el.textContent = '';
  });
}

export function startAssignmentEdit(assignment){
  qs('assignment-id').value = assignment.id_historial;
  qs('assignment-entity').value = assignment.entity_id;
  qs('assignment-department').value = assignment.id_departamento;
  qs('assignment-start').value = assignment.fecha_inicio || '';
  qs('assignment-end').value = assignment.fecha_fin || '';
  const close = qs('assignment-close-previous');
  if(close) close.checked = false;
  clearAssignmentErrors();
  qs('assignment-cancel-edit').hidden = false;
  qs('assignment-submit-button').textContent = 'Actualizar Asignación';
}

export function collectAssignmentPayload(){
  return {
    entity_id: qs('assignment-entity').value,
    id_departamento: qs('assignment-department').value,
    fecha_inicio: qs('assignment-start').value,
    fecha_fin: qs('assignment-end').value
  };
}

export function showAssignmentErrors(errors){
  const map = {
    entity: errors.entity_id,
    department: errors.id_departamento,
    start: errors.fecha_inicio,
    end: errors.fecha_fin
  };
  Object.entries(map).forEach(([field, message]) => {
    const el = qs(`error-assignment-${field}`);
    if(el) el.textContent = message || '';
  });
}
