export const ROLE_STORAGE_KEY = 'erp_base_module:rol_activo';

export const ROLES = Object.freeze({
  ADMINISTRADOR: 'administrador',
  SUPERVISOR: 'supervisor',
  BARISTA: 'barista'
});

export const ROLE_OPTIONS = Object.freeze([
  Object.freeze({ value: ROLES.ADMINISTRADOR, label: 'Administrador / Gerente de Cafetería' }),
  Object.freeze({ value: ROLES.SUPERVISOR, label: 'Jefe de Turno / Supervisor' }),
  Object.freeze({ value: ROLES.BARISTA, label: 'Barista / Trabajador (Solo lectura)' })
]);

export const AREAS = Object.freeze(['Barra', 'Cocina', 'Salón']);
export const TURNOS = Object.freeze(['Mañana', 'Tarde']);

export function defaultRoleState(){
  return {
    rolActivo: ROLES.ADMINISTRADOR,
    supervisorArea: '',
    supervisorTurno: '',
    baristaEntityId: ''
  };
}

export function normalizeRoleState(raw){
  const source = raw && typeof raw === 'object' ? raw : {};
  const rolActivo = ROLE_OPTIONS.some(option => option.value === source.rolActivo)
    ? source.rolActivo
    : ROLES.ADMINISTRADOR;
  const supervisorArea = AREAS.includes(source.supervisorArea) ? source.supervisorArea : '';
  const supervisorTurno = TURNOS.includes(source.supervisorTurno) ? source.supervisorTurno : '';
  const baristaEntityId = typeof source.baristaEntityId === 'string' ? source.baristaEntityId.trim() : '';
  return { rolActivo, supervisorArea, supervisorTurno, baristaEntityId };
}

export function loadRoleState(){
  try{
    const raw = localStorage.getItem(ROLE_STORAGE_KEY);
    if(!raw) return defaultRoleState();
    return normalizeRoleState(JSON.parse(raw));
  }catch{
    return defaultRoleState();
  }
}

export function saveRoleState(state){
  const normalized = normalizeRoleState(state);
  try{
    localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(normalized));
  }catch{
    return normalized;
  }
  return normalized;
}

export function roleLabel(role){
  return ROLE_OPTIONS.find(option => option.value === role)?.label || ROLE_OPTIONS[0].label;
}

export function allowedModules(state){
  const role = normalizeRoleState(state).rolActivo;
  if(role === ROLES.SUPERVISOR) return ['dashboard', 'documents', 'history', 'evolution'];
  if(role === ROLES.BARISTA) return ['dashboard', 'history', 'evolution'];
  return ['dashboard', 'entities', 'departments', 'assignments', 'documents', 'history', 'evolution', 'search'];
}

export function canPerform(state, action){
  const role = normalizeRoleState(state).rolActivo;
  if(role === ROLES.ADMINISTRADOR) return true;
  if(role === ROLES.SUPERVISOR) return action === 'measurement:write';
  return false;
}

export function isSupervisorContextComplete(state){
  const role = normalizeRoleState(state);
  return role.rolActivo === ROLES.SUPERVISOR
    && AREAS.includes(role.supervisorArea)
    && TURNOS.includes(role.supervisorTurno);
}

export function isBaristaContextComplete(state){
  const role = normalizeRoleState(state);
  return role.rolActivo === ROLES.BARISTA && Boolean(role.baristaEntityId);
}

function departmentNameForAssignment(assignment, departments){
  const departmentId = assignment?.id_departamento || assignment?.departamentoId;
  return departments.find(department => department.id_departamento === departmentId)?.nombre || '';
}

export function isEntityInScope(state, entity, assignments = [], departments = []){
  const role = normalizeRoleState(state);
  if(role.rolActivo === ROLES.ADMINISTRADOR) return true;
  if(role.rolActivo === ROLES.BARISTA){
    return isBaristaContextComplete(role) && entity?.entity_id === role.baristaEntityId;
  }
  if(!isSupervisorContextComplete(role)) return false;
  return assignments.some(assignment =>
    assignment.entity_id === entity?.entity_id
    && departmentNameForAssignment(assignment, departments) === role.supervisorArea
  );
}

export function filterEntities(state, entities = [], assignments = [], departments = []){
  return entities.filter(entity => isEntityInScope(state, entity, assignments, departments));
}

export function isAssignmentInScope(state, assignment, departments = []){
  const role = normalizeRoleState(state);
  if(role.rolActivo === ROLES.ADMINISTRADOR) return true;
  if(role.rolActivo === ROLES.BARISTA){
    return isBaristaContextComplete(role) && assignment?.entity_id === role.baristaEntityId;
  }
  if(!isSupervisorContextComplete(role)) return false;
  return departmentNameForAssignment(assignment, departments) === role.supervisorArea;
}

export function isDocumentInScope(state, document_, departmentName = ''){
  const role = normalizeRoleState(state);
  if(role.rolActivo === ROLES.ADMINISTRADOR) return true;
  if(role.rolActivo === ROLES.BARISTA){
    return isBaristaContextComplete(role) && document_?.entity_id === role.baristaEntityId;
  }
  if(!isSupervisorContextComplete(role)) return false;
  return departmentName === role.supervisorArea && document_?.turno === role.supervisorTurno;
}

export function filterDocuments(state, documents = [], resolveDepartmentName){
  return documents.filter(document_ => {
    const departmentName = typeof resolveDepartmentName === 'function'
      ? resolveDepartmentName(document_)
      : '';
    return isDocumentInScope(state, document_, departmentName);
  });
}

export function assertCanEditDocument(state, payload = {}, dependencies = {}){
  const role = normalizeRoleState(state);
  if(!canPerform(role, 'measurement:write')){
    throw new Error('Tu rol no permite registrar ni corregir evaluaciones.');
  }
  if(role.rolActivo === ROLES.SUPERVISOR){
    if(!isSupervisorContextComplete(role)){
      throw new Error('Selecciona el área de trabajo y el turno antes de registrar una medición.');
    }
    const assignments = Array.isArray(dependencies.assignments) ? dependencies.assignments : [];
    const departments = Array.isArray(dependencies.departments) ? dependencies.departments : [];
    const assignment = assignments.find(item =>
      item && (item.id_historial === payload.asignacionId || item.id === payload.asignacionId)
    );
    if(!isAssignmentInScope(role, assignment, departments)){
      throw new Error('Solo puedes medir personal de tu área de trabajo.');
    }
    if(payload.turno !== role.supervisorTurno){
      throw new Error('Solo puedes medir el turno seleccionado.');
    }
  }
  return true;
}

export function scopeDescription(state, workerName = ''){
  const role = normalizeRoleState(state);
  if(role.rolActivo === ROLES.ADMINISTRADOR) return 'Todas las áreas, turnos y trabajadores';
  if(role.rolActivo === ROLES.SUPERVISOR){
    if(!isSupervisorContextComplete(role)) return 'Selecciona área y turno para ver datos';
    return `${role.supervisorArea} · ${role.supervisorTurno}`;
  }
  if(!isBaristaContextComplete(role)) return 'Selecciona tu trabajador para ver datos';
  return workerName ? `Solo ${workerName}` : 'Solo tu trabajador';
}
