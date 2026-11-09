function qs(id){ return document.getElementById(id); }

export function clearDepartmentForm(){
  qs('department-id').value = '';
  qs('department-nombre').value = '';
  qs('department-descripcion').value = '';
  clearDepartmentErrors();
  qs('department-cancel-edit').hidden = true;
  qs('department-submit-button').textContent = 'Guardar Departamento';
}

export function clearDepartmentErrors(){
  ['nombre', 'descripcion'].forEach(f => {
    const el = qs(`error-department-${f}`);
    if(el) el.textContent = '';
  });
}

export function startDepartmentEdit(department){
  qs('department-id').value = department.id_departamento;
  qs('department-nombre').value = department.nombre || '';
  qs('department-descripcion').value = department.descripcion || '';
  clearDepartmentErrors();
  qs('department-cancel-edit').hidden = false;
  qs('department-submit-button').textContent = 'Actualizar Departamento';
}

export function collectDepartmentPayload(){
  return {
    nombre: qs('department-nombre').value,
    descripcion: qs('department-descripcion').value
  };
}

export function showDepartmentErrors(errors){
  ['nombre', 'descripcion'].forEach(f => {
    const el = qs(`error-department-${f}`);
    if(el) el.textContent = errors[f] || '';
  });
}
