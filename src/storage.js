import { getConfig, isRRHHMode } from './module-config.js';

export const ENTITIES_KEY = 'erp_base_module:entities';
export const DOCUMENTS_KEY = 'erp_base_module:documents';
export const DEPARTMENTS_KEY = 'erp_base_module:departamentos';
export const HISTORY_KEY = 'erp_base_module:historial_departamentos';

const OPEN_END = '9999-12-31';

export class StorageError extends Error {
  constructor(message){
    super(message);
    this.name = 'StorageError';
  }
}

let lastStorageError = null;

export function getStorageError(){
  return lastStorageError;
}

export function clearStorageError(){
  lastStorageError = null;
}

function reportStorageError(message, error){
  lastStorageError = message;
  if(error) console.error(message, error);
  return message;
}

function readCollection(key, label){
  try{
    const raw = localStorage.getItem(key);
    lastStorageError = null;
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){
    reportStorageError(`No se pudo leer ${label} del almacenamiento local.`, e);
    return [];
  }
}

function writeCollection(key, label, value){
  try{
    localStorage.setItem(key, JSON.stringify(value));
    lastStorageError = null;
    return value;
  }catch(e){
    const message = `No se pudo guardar ${label}. Revisa el espacio y los permisos del almacenamiento local.`;
    reportStorageError(message, e);
    throw new StorageError(message);
  }
}

function generateId(){
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
}

function declaredFields(target){
  return getConfig().customFields.filter(f => f.target === target);
}

function isEmpty(v){ return v === undefined || v === null || (typeof v === 'string' && !v.trim()); }

function normalizeText(value){
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeKey(value){
  return normalizeText(value).toLocaleLowerCase('es');
}

function pad(value){
  return String(value).padStart(2, '0');
}

export function isValidDate(value){
  if(!value) return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function monthBounds(period){
  if(!/^\d{4}-\d{2}$/.test(String(period || ''))) return null;
  const [year, month] = String(period).split('-').map(Number);
  if(month < 1 || month > 12) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { startDate: `${year}-${pad(month)}-01`, endDate: `${year}-${pad(month)}-${pad(lastDay)}` };
}

export function periodFromDates(startDate){
  return isValidDate(startDate) ? startDate.slice(0, 7) : null;
}

export function currentPeriod(){
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

function dayBefore(date){
  if(!isValidDate(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day - 1));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

function intervalsOverlap(aStart, aEnd, bStart, bEnd){
  return aStart <= (bEnd || OPEN_END) && bStart <= (aEnd || OPEN_END);
}

function normalizeCustomValue(field, value){
  if(isEmpty(value)) return undefined;
  if(field.type === 'number') return Number(value);
  return String(value).trim();
}

function collectCustomErrors(target, data){
  const errs = {};
  for(const f of declaredFields(target)){
    const v = data ? data[f.key] : undefined;
    if(f.required && isEmpty(v)){ errs[f.key] = `${f.label} es obligatorio`; continue; }
    if(!isEmpty(v)){
      if(f.type === 'number' && !Number.isFinite(Number(v))){ errs[f.key] = `${f.label} debe ser un número`; continue; }
      if(f.type === 'date' && !isValidDate(v)){ errs[f.key] = `${f.label} debe ser una fecha válida (YYYY-MM-DD)`; continue; }
      if(f.type === 'select' && !f.options.includes(String(v).trim())){ errs[f.key] = `${f.label} debe ser uno de: ${f.options.join(', ')}`; }
    }
  }
  return errs;
}

function validateLifecycleStatus(status, currentStatus, errors){
  const lc = getConfig().statusLifecycle;
  if(!lc) return;
  if(currentStatus === undefined || currentStatus === null){
    if(!isEmpty(status) && !lc.statuses.includes(status)){
      errors.status = `El estado debe ser uno de: ${lc.statuses.join(', ')}`;
    }
    return;
  }
  if(status === currentStatus) return;
  const allowed = lc.transitions[currentStatus] || [];
  if(!allowed.includes(status)){
    errors.status = `Transición de estado inválida de "${currentStatus}" a "${status}"`;
  }
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function pickCustomFields(target, data){
  const out = {};
  for(const f of declaredFields(target)){
    const n = normalizeCustomValue(f, data[f.key]);
    if(n !== undefined) out[f.key] = n;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Trabajadores / entidades
// ---------------------------------------------------------------------------

export function loadEntities(){
  return readCollection(ENTITIES_KEY, 'los trabajadores');
}

export function saveEntities(entities){
  return writeCollection(ENTITIES_KEY, 'los trabajadores', entities);
}

export function validateEntity({name, code, email, targetDate, creditLimit, ...rest}){
  const errors = {};
  if(!name || !name.trim()) errors.name = 'El nombre es obligatorio';
  if(!code || !code.trim()) errors.code = 'El código es obligatorio';
  if(!isEmpty(email) && !isValidEmail(email)) errors.email = 'El correo electrónico no es válido';
  if(!isEmpty(targetDate) && !isValidDate(targetDate)) errors.targetDate = 'La fecha objetivo debe ser una fecha válida (YYYY-MM-DD)';
  if(!isEmpty(creditLimit)){
    const c = Number(creditLimit);
    if(Number.isNaN(c) || c < 0) errors.creditLimit = 'El límite de crédito debe ser un número no negativo';
  }
  Object.assign(errors, collectCustomErrors('entity', rest));
  if(isRRHHMode() && !isEmpty(rest.departamentoId)){
    const departments = loadDepartments();
    if(!departments.some(d => d.id_departamento === rest.departamentoId)){
      errors.departamentoId = 'El departamento seleccionado no existe';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addEntity(payload){
  const now = new Date().toISOString();
  const entity = {
    id: generateId(),
    entity_id: generateId(),
    name: (payload.name||'').trim(),
    code: (payload.code||'').trim(),
    taxId: (payload.taxId||'').trim() || undefined,
    email: (payload.email||'').trim() || undefined,
    phone: (payload.phone||'').trim() || undefined,
    address: (payload.address||'').trim() || undefined,
    category: (payload.category||'').trim() || undefined,
    description: (payload.description||'').trim() || undefined,
    targetDate: (payload.targetDate||'').trim() || undefined,
    creditLimit: isEmpty(payload.creditLimit) ? undefined : Number(payload.creditLimit),
    paymentTerms: (payload.paymentTerms||'').trim() || undefined,
    ...pickCustomFields('entity', payload),
    createdAt: now,
    updatedAt: now
  };
  const list = loadEntities();
  list.push(entity);
  saveEntities(list);
  return entity;
}

export function updateEntity(id, updates){
  const list = loadEntities();
  const idx = list.findIndex(e => e.id === id);
  if(idx === -1) throw new Error('Entidad no encontrada');
  const merged = { ...list[idx], ...updates };
  list[idx] = {
    ...list[idx],
    name: (merged.name||'').trim(),
    code: (merged.code||'').trim(),
    taxId: (merged.taxId||'').trim() || undefined,
    email: (merged.email||'').trim() || undefined,
    phone: (merged.phone||'').trim() || undefined,
    address: (merged.address||'').trim() || undefined,
    category: (merged.category||'').trim() || undefined,
    description: (merged.description||'').trim() || undefined,
    targetDate: (merged.targetDate||'').trim() || undefined,
    creditLimit: isEmpty(merged.creditLimit) ? undefined : Number(merged.creditLimit),
    paymentTerms: (merged.paymentTerms||'').trim() || undefined,
    ...pickCustomFields('entity', merged),
    updatedAt: new Date().toISOString()
  };
  saveEntities(list);
  return list[idx];
}

export function entityHasHistory(entityId){
  return loadDepartmentHistory().some(h => h.entity_id === entityId);
}

export function entityHasDocuments(entityId){
  return loadDocuments().some(d => d.entity_id === entityId);
}

export function canDeleteEntity(id){
  const entity = loadEntities().find(e => e.id === id);
  if(!entity) return { allowed: false, reason: 'Trabajador no encontrado' };
  if(isRRHHMode()){
    if(entityHasDocuments(entity.entity_id) || entityHasHistory(entity.entity_id)){
      return { allowed: false, reason: 'El trabajador tiene registros históricos. Márcalo como Inactivo en lugar de eliminarlo.' };
    }
  }
  return { allowed: true };
}

export function deleteEntity(id){
  const list = loadEntities();
  const entity = list.find(e => e.id === id);
  if(isRRHHMode() && entity){
    const check = canDeleteEntity(id);
    if(!check.allowed) throw new Error(check.reason);
  }
  const newList = list.filter(e => e.id !== id);
  saveEntities(newList);
  if(entity) deleteDocumentsForEntity(entity.entity_id);
  return newList;
}

export function searchEntities(term){
  const q = (term||'').trim().toLowerCase();
  if(!q) return loadEntities();
  const departments = loadDepartments();
  const fields = ['name', 'code', 'taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'paymentTerms', ...declaredFields('entity').map(f => f.key)];
  return loadEntities().filter(e => {
    if(fields.some(f => String(e[f] ?? '').toLowerCase().includes(q))) return true;
    const dept = departments.find(d => d.id_departamento === e.departamentoId);
    return dept ? dept.nombre.toLowerCase().includes(q) : false;
  });
}

// ---------------------------------------------------------------------------
// Departamentos
// ---------------------------------------------------------------------------

export function loadDepartments(){
  return readCollection(DEPARTMENTS_KEY, 'los departamentos');
}

export function saveDepartments(departments){
  return writeCollection(DEPARTMENTS_KEY, 'los departamentos', departments);
}

export function validateDepartment(payload = {}, currentId){
  const errors = {};
  const nombre = normalizeText(payload.nombre);
  if(!nombre){
    errors.nombre = 'El nombre del departamento es obligatorio';
  } else {
    const duplicated = loadDepartments().some(d =>
      d.id_departamento !== currentId && normalizeKey(d.nombre) === normalizeKey(nombre)
    );
    if(duplicated) errors.nombre = 'Ya existe un departamento con ese nombre';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function addDepartment(payload = {}){
  const check = validateDepartment(payload);
  if(!check.valid) throw new Error(Object.values(check.errors)[0]);
  const now = new Date().toISOString();
  const department = {
    id_departamento: generateId(),
    nombre: normalizeText(payload.nombre),
    descripcion: normalizeText(payload.descripcion) || undefined,
    createdAt: now,
    updatedAt: now
  };
  const list = loadDepartments();
  list.push(department);
  saveDepartments(list);
  return department;
}

export function updateDepartment(id, updates = {}){
  const list = loadDepartments();
  const idx = list.findIndex(d => d.id_departamento === id);
  if(idx === -1) throw new Error('Departamento no encontrado');
  const merged = { ...list[idx], ...updates };
  const check = validateDepartment(merged, id);
  if(!check.valid) throw new Error(Object.values(check.errors)[0]);
  list[idx] = {
    ...list[idx],
    nombre: normalizeText(merged.nombre),
    descripcion: normalizeText(merged.descripcion) || undefined,
    updatedAt: new Date().toISOString()
  };
  saveDepartments(list);
  return list[idx];
}

export function canDeleteDepartment(id){
  if(loadDepartmentHistory().some(h => h.id_departamento === id)){
    return { allowed: false, reason: 'El departamento tiene asignaciones históricas y no puede eliminarse.' };
  }
  if(loadEntities().some(e => e.departamentoId === id)){
    return { allowed: false, reason: 'El departamento tiene trabajadores asignados y no puede eliminarse.' };
  }
  return { allowed: true };
}

export function deleteDepartment(id){
  const check = canDeleteDepartment(id);
  if(!check.allowed) throw new Error(check.reason);
  const list = loadDepartments();
  const newList = list.filter(d => d.id_departamento !== id);
  saveDepartments(newList);
  return newList;
}

export function searchDepartments(term){
  const q = normalizeKey(term);
  if(!q) return loadDepartments();
  return loadDepartments().filter(d =>
    normalizeKey(d.nombre).includes(q) || normalizeKey(d.descripcion).includes(q)
  );
}

// ---------------------------------------------------------------------------
// Historial_Departamento / asignaciones
// ---------------------------------------------------------------------------

function normalizeAssignment(payload = {}){
  return {
    entity_id: payload.entity_id || payload.entityId || '',
    id_departamento: payload.id_departamento || payload.departamentoId || '',
    fecha_inicio: payload.fecha_inicio || payload.fechaInicio || payload.startDate || '',
    fecha_fin: payload.fecha_fin || payload.fechaFin || payload.endDate || null
  };
}

export function loadDepartmentHistory(){
  return readCollection(HISTORY_KEY, 'el historial de departamentos');
}

export function saveDepartmentHistory(history){
  return writeCollection(HISTORY_KEY, 'el historial de departamentos', history);
}

export const loadHistorialDepartamentos = loadDepartmentHistory;
export const saveHistorialDepartamentos = saveDepartmentHistory;

function linkedDocumentsForAssignment(assignmentId){
  return loadDocuments().filter(d => d.asignacionId === assignmentId);
}

export function validateDepartmentAssignment(payload = {}, currentId){
  const errors = {};
  const normalized = normalizeAssignment(payload);
  const entities = loadEntities();
  const departments = loadDepartments();
  const entity = entities.find(e => e.entity_id === normalized.entity_id);

  if(!normalized.entity_id || !entity) errors.entity_id = 'Selecciona un trabajador válido';
  if(!normalized.id_departamento || !departments.some(d => d.id_departamento === normalized.id_departamento)){
    errors.id_departamento = 'Selecciona un departamento válido';
  }
  if(!normalized.fecha_inicio){
    errors.fecha_inicio = 'La fecha de inicio es obligatoria';
  } else if(!isValidDate(normalized.fecha_inicio)){
    errors.fecha_inicio = 'La fecha de inicio debe ser válida (YYYY-MM-DD)';
  }
  if(!isEmpty(normalized.fecha_fin) && !isValidDate(normalized.fecha_fin)){
    errors.fecha_fin = 'La fecha de término debe ser válida (YYYY-MM-DD)';
  } else if(!isEmpty(normalized.fecha_fin) && isValidDate(normalized.fecha_inicio) && normalized.fecha_fin < normalized.fecha_inicio){
    errors.fecha_fin = 'La fecha de término no puede ser anterior a la fecha de inicio';
  }

  if(isValidDate(normalized.fecha_inicio) && !errors.fecha_fin){
    const others = loadDepartmentHistory().filter(h =>
      h.id_historial !== currentId && h.entity_id === normalized.entity_id
    );
    for(const other of others){
      if(intervalsOverlap(normalized.fecha_inicio, normalized.fecha_fin, other.fecha_inicio, other.fecha_fin)){
        errors.fecha_inicio = 'La asignación se superpone con otro período del mismo trabajador';
        break;
      }
    }
    if(!normalized.fecha_fin && others.some(h => !h.fecha_fin)){
      errors.fecha_fin = 'Solo puede existir una asignación vigente por trabajador';
    }
  }

  if(currentId){
    const linked = linkedDocumentsForAssignment(currentId);
    if(linked.some(d => d.entity_id !== normalized.entity_id)){
      errors.entity_id = 'No se puede cambiar el trabajador de una asignación con mediciones vinculadas';
    }
    if(!errors.fecha_inicio && !errors.fecha_fin && isValidDate(normalized.fecha_inicio)){
      const end = normalized.fecha_fin || OPEN_END;
      if(linked.some(d => d.startDate < normalized.fecha_inicio || (d.endDate || OPEN_END) > end)){
        errors.fecha_fin = 'Las fechas dejarían mediciones históricas fuera de la asignación';
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function addDepartmentAssignment(payload = {}){
  const check = validateDepartmentAssignment(payload);
  if(!check.valid) throw new Error(Object.values(check.errors)[0]);
  const normalized = normalizeAssignment(payload);
  const now = new Date().toISOString();
  const assignment = {
    id_historial: generateId(),
    entity_id: normalized.entity_id,
    id_departamento: normalized.id_departamento,
    fecha_inicio: normalized.fecha_inicio,
    fecha_fin: isEmpty(normalized.fecha_fin) ? null : normalized.fecha_fin,
    createdAt: now,
    updatedAt: now
  };
  const history = loadDepartmentHistory();
  history.push(assignment);
  saveDepartmentHistory(history);
  return assignment;
}

export function updateDepartmentAssignment(id, updates = {}){
  const history = loadDepartmentHistory();
  const idx = history.findIndex(h => h.id_historial === id);
  if(idx === -1) throw new Error('Asignación no encontrada');
  const merged = normalizeAssignment({ ...history[idx], ...updates });
  const check = validateDepartmentAssignment(merged, id);
  if(!check.valid) throw new Error(Object.values(check.errors)[0]);
  history[idx] = {
    ...history[idx],
    entity_id: merged.entity_id,
    id_departamento: merged.id_departamento,
    fecha_inicio: merged.fecha_inicio,
    fecha_fin: isEmpty(merged.fecha_fin) ? null : merged.fecha_fin,
    updatedAt: new Date().toISOString()
  };
  saveDepartmentHistory(history);
  return history[idx];
}

export function closeDepartmentAssignment(id, fechaFin){
  return updateDepartmentAssignment(id, { fecha_fin: fechaFin });
}

export function canDeleteDepartmentAssignment(id){
  if(linkedDocumentsForAssignment(id).length > 0){
    return { allowed: false, reason: 'La asignación tiene mediciones de productividad vinculadas y no puede eliminarse.' };
  }
  return { allowed: true };
}

export function deleteDepartmentAssignment(id){
  const check = canDeleteDepartmentAssignment(id);
  if(!check.allowed) throw new Error(check.reason);
  const history = loadDepartmentHistory().filter(h => h.id_historial !== id);
  saveDepartmentHistory(history);
  return history;
}

export function getAssignmentsForEntity(entityId){
  return loadDepartmentHistory()
    .filter(h => h.entity_id === entityId)
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
}

export function getCurrentAssignment(entityId){
  const now = new Date();
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const active = getAssignmentsForEntity(entityId).filter(h =>
    h.fecha_inicio <= today && (!h.fecha_fin || h.fecha_fin >= today)
  );
  return active.length > 0 ? active[active.length - 1] : null;
}

export function getAssignmentsOverlapping(entityId, startDate, endDate){
  if(!isValidDate(startDate) || !isValidDate(endDate)) return [];
  return getAssignmentsForEntity(entityId).filter(h =>
    intervalsOverlap(startDate, endDate, h.fecha_inicio, h.fecha_fin)
  );
}

export function getDepartmentForAssignment(assignmentId){
  const assignment = loadDepartmentHistory().find(h => h.id_historial === assignmentId);
  if(!assignment) return null;
  return loadDepartments().find(d => d.id_departamento === assignment.id_departamento) || null;
}

export function changeDepartment(entityId, departmentId, startDate, options = {}){
  if(!isValidDate(startDate)) throw new Error('La fecha de inicio debe ser válida (YYYY-MM-DD)');
  const entity = loadEntities().find(e => e.entity_id === entityId);
  if(!entity) throw new Error('Trabajador no encontrado');
  if(!loadDepartments().some(d => d.id_departamento === departmentId)){
    throw new Error('El departamento seleccionado no existe');
  }
  const current = getCurrentAssignment(entityId);
  if(current){
    if(startDate <= current.fecha_inicio){
      throw new Error('La nueva asignación debe comenzar después de la asignación vigente');
    }
    const previousEnd = dayBefore(startDate);
    if(!previousEnd || previousEnd < current.fecha_inicio){
      throw new Error('No hay un día disponible para cerrar la asignación anterior');
    }
    const linked = linkedDocumentsForAssignment(current.id_historial);
    if(linked.some(d => d.startDate > previousEnd || d.endDate > previousEnd)){
      throw new Error('No se puede cerrar la asignación anterior porque tiene mediciones posteriores a la nueva fecha');
    }
    updateDepartmentAssignment(current.id_historial, { fecha_fin: previousEnd });
  }

  const assignment = addDepartmentAssignment({
    entity_id: entityId,
    id_departamento: departmentId,
    fecha_inicio: startDate,
    fecha_fin: options.fecha_fin || null
  });

  const entities = loadEntities();
  const idx = entities.findIndex(e => e.entity_id === entityId);
  if(idx !== -1){
    entities[idx] = {
      ...entities[idx],
      departamentoId: getCurrentAssignment(entityId)?.id_departamento,
      updatedAt: new Date().toISOString()
    };
    saveEntities(entities);
  }
  return assignment;
}

export const assignDepartment = changeDepartment;
export const assignWorkerToDepartment = changeDepartment;

// ---------------------------------------------------------------------------
// Registros de productividad / documentos
// ---------------------------------------------------------------------------

export function loadDocuments(){
  return readCollection(DOCUMENTS_KEY, 'los registros de productividad');
}

export function saveDocuments(documents){
  return writeCollection(DOCUMENTS_KEY, 'los registros de productividad', documents);
}

function isProductivityRecord(document_){
  return Boolean(document_)
    && !isEmpty(document_.indicador)
    && !isEmpty(document_.unidad)
    && !isEmpty(document_.asignacionId)
    && isValidDate(document_.startDate)
    && isValidDate(document_.endDate);
}

export function inspectDocumentsForRRHH(){
  const documents = loadDocuments();
  const legacy = documents.filter(d => !isProductivityRecord(d));
  return { compatible: legacy.length === 0, legacy, total: documents.length };
}

function resolveProductivityPeriod(payload = {}){
  const period = payload.period || payload.periodo || periodFromDates(payload.startDate);
  const bounds = monthBounds(period);
  return { period: bounds ? period : null, bounds };
}

function resolveAssignmentId(payload, entityId, startDate, endDate){
  const explicit = payload.asignacionId || payload.id_historial || '';
  if(!isEmpty(explicit)) return String(explicit).trim();
  if(!entityId || !isValidDate(startDate) || !isValidDate(endDate)) return '';
  const candidates = getAssignmentsOverlapping(entityId, startDate, endDate);
  return candidates.length === 1 ? candidates[0].id_historial : '';
}

export function validateProductivityDocument(payload = {}){
  const errors = {};
  const entityId = payload.entityId || payload.entity_id || '';
  const entity = loadEntities().find(e => e.entity_id === entityId);
  if(!entityId || !entity) errors.entityId = 'Selecciona un trabajador válido';

  const { period, bounds } = resolveProductivityPeriod(payload);
  if(!period || !bounds){
    errors.period = 'Selecciona un período válido en formato AAAA-MM';
  } else {
    if(payload.startDate && payload.startDate !== bounds.startDate){
      errors.startDate = 'El período debe iniciar el primer día del mes';
    }
    if(payload.endDate && payload.endDate !== bounds.endDate){
      errors.endDate = 'El período debe terminar el último día del mes';
    }
    if(period > currentPeriod()){
      errors.period = 'No se permiten períodos futuros';
    }
    const ingreso = entity && entity.fechaIngreso;
    if(isValidDate(ingreso) && period < ingreso.slice(0, 7)){
      errors.period = 'El período no puede ser anterior a la fecha de ingreso del trabajador';
    }
  }

  const indicador = normalizeText(payload.indicador);
  if(!indicador){
    errors.indicador = 'El indicador es obligatorio';
  } else if(indicador.length < 3 || indicador.length > 60){
    errors.indicador = 'El indicador debe tener entre 3 y 60 caracteres';
  }

  if(isEmpty(payload.resultado)){
    errors.resultado = 'El resultado es obligatorio';
  } else {
    const resultado = Number(payload.resultado);
    if(!Number.isFinite(resultado) || resultado < 0){
      errors.resultado = 'El resultado debe ser un número mayor o igual a cero';
    }
  }

  const unidad = normalizeText(payload.unidad);
  if(!unidad) errors.unidad = 'La unidad es obligatoria';

  if(!isEmpty(payload.folio)){
    const folio = Number(payload.folio);
    if(!Number.isInteger(folio) || folio <= 0) errors.folio = 'El folio debe ser un entero positivo';
  }

  if(bounds){
    const asignacionId = resolveAssignmentId(payload, entityId, bounds.startDate, bounds.endDate);
    if(!asignacionId){
      const candidates = entityId ? getAssignmentsOverlapping(entityId, bounds.startDate, bounds.endDate) : [];
      errors.asignacionId = candidates.length > 1
        ? 'Selecciona la asignación de departamento correspondiente al período'
        : 'El trabajador no tiene una asignación de departamento válida para el período';
    } else {
      const assignment = loadDepartmentHistory().find(h => h.id_historial === asignacionId);
      if(!assignment){
        errors.asignacionId = 'La asignación de departamento no existe';
      } else if(assignment.entity_id !== entityId){
        errors.asignacionId = 'La asignación no pertenece al trabajador seleccionado';
      } else if(!intervalsOverlap(bounds.startDate, bounds.endDate, assignment.fecha_inicio, assignment.fecha_fin)){
        errors.asignacionId = 'La asignación no corresponde al período indicado';
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function normalizeProductivityDocument(payload = {}){
  const entityId = payload.entityId || payload.entity_id || '';
  const { period, bounds } = resolveProductivityPeriod(payload);
  const startDate = bounds ? bounds.startDate : payload.startDate;
  const endDate = bounds ? bounds.endDate : payload.endDate;
  return {
    entityId,
    entity_id: entityId,
    period,
    startDate,
    endDate,
    indicador: normalizeText(payload.indicador),
    resultado: isEmpty(payload.resultado) ? undefined : Number(payload.resultado),
    unidad: normalizeText(payload.unidad),
    asignacionId: resolveAssignmentId(payload, entityId, startDate, endDate),
    folio: isEmpty(payload.folio) ? undefined : Number(payload.folio),
    notes: normalizeText(payload.notes) || undefined
  };
}

export function validateDocument(payload, currentStatus){
  if(isRRHHMode()) return validateProductivityDocument(payload);

  const {entityId, series, folio, startDate, endDate, quantity, subtotal, discount, taxAmount, totalAmount, status} = payload;
  const errors = {};
  const entities = loadEntities();
  if(!entityId || !entities.some(e => e.entity_id === entityId)){
    errors.entityId = 'Selecciona una entidad para el documento';
  }
  if(isEmpty(folio)){ errors.folio = 'El folio es obligatorio'; }
  else {
    const f = Number(folio);
    if(!Number.isInteger(f) || f <= 0) errors.folio = 'El folio debe ser un entero positivo';
  }
  if(!startDate){ errors.startDate = 'La fecha de inicio es obligatoria'; }
  else if(!isValidDate(startDate)) errors.startDate = 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)';
  if(!endDate){ errors.endDate = 'La fecha de fin es obligatoria'; }
  else if(!isValidDate(endDate)) errors.endDate = 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)';
  if(startDate && endDate && isValidDate(startDate) && isValidDate(endDate) && endDate < startDate){
    errors.endDate = 'La fecha de fin debe ser igual o posterior a la fecha de inicio';
  }
  if(quantity !== undefined && quantity !== null && quantity !== ''){
    const n = Number(quantity);
    if(!Number.isInteger(n) || n <= 0) errors.quantity = 'La cantidad debe ser un entero positivo';
  }
  for(const [key, label] of [['subtotal', 'El subtotal'], ['discount', 'El descuento'], ['taxAmount', 'El impuesto'], ['totalAmount', 'El importe total']]){
    const v = payload[key];
    if(v === undefined || v === null || v === '') continue;
    const n = Number(v);
    if(Number.isNaN(n) || n < 0) errors[key] = `${label} debe ser un número no negativo`;
  }
  if(!errors.subtotal && !errors.discount
    && subtotal !== undefined && subtotal !== null && subtotal !== ''
    && discount !== undefined && discount !== null && discount !== ''
    && Number(discount) > Number(subtotal)){
    errors.discount = 'El descuento no puede superar el subtotal';
  }
  validateLifecycleStatus((status||'').trim(), currentStatus, errors);
  Object.assign(errors, collectCustomErrors('document', payload));
  return { valid: Object.keys(errors).length === 0, errors };
}

export function nextFolio(){
  const valid = loadDocuments()
    .map(d => Number(d.folio))
    .filter(n => Number.isInteger(n) && n > 0);
  return valid.length === 0 ? 1 : Math.max(...valid) + 1;
}

export function findDuplicateProductivity(payload, excludeId){
  const normalized = normalizeProductivityDocument(payload);
  if(!normalized.entityId || !normalized.startDate || !normalized.indicador) return [];
  return loadDocuments().filter(d =>
    d.id !== excludeId
    && d.entity_id === normalized.entityId
    && d.startDate === normalized.startDate
    && d.endDate === normalized.endDate
    && normalizeKey(d.indicador) === normalizeKey(normalized.indicador)
  );
}

export function addDocument(payload){
  if(isRRHHMode()){
    const inspection = inspectDocumentsForRRHH();
    if(!inspection.compatible){
      throw new Error(`La colección de documentos contiene ${inspection.legacy.length} registro(s) incompatible(s) con productividad. Respalda o migra esos datos antes de continuar.`);
    }
    const check = validateProductivityDocument(payload);
    if(!check.valid) throw new Error(Object.values(check.errors)[0]);
    const normalized = normalizeProductivityDocument(payload);
    const now = new Date().toISOString();
    const document = {
      id: generateId(),
      entity_id: normalized.entityId,
      folio: normalized.folio || nextFolio(),
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      notes: normalized.notes,
      ...pickCustomFields('document', normalized),
      createdAt: now,
      updatedAt: now
    };
    const list = loadDocuments();
    list.push(document);
    saveDocuments(list);
    return document;
  }

  const now = new Date().toISOString();
  const check = validateDocument(payload);
  if(!check.valid){
    throw new Error(Object.values(check.errors)[0]);
  }
  const document = {
    id: generateId(),
    entity_id: payload.entityId,
    series: (payload.series||'').trim() || undefined,
    folio: Number(payload.folio),
    startDate: payload.startDate,
    endDate: payload.endDate,
    quantity: (isEmpty(payload.quantity)) ? undefined : Number(payload.quantity),
    subtotal: (isEmpty(payload.subtotal)) ? undefined : Number(payload.subtotal),
    discount: (isEmpty(payload.discount)) ? undefined : Number(payload.discount),
    taxAmount: (isEmpty(payload.taxAmount)) ? undefined : Number(payload.taxAmount),
    totalAmount: (isEmpty(payload.totalAmount)) ? undefined : Number(payload.totalAmount),
    currency: (payload.currency||'').trim() || undefined,
    paymentTerms: (payload.paymentTerms||'').trim() || undefined,
    notes: (payload.notes||'').trim() || undefined,
    status: (payload.status||'').trim() || undefined,
    ...pickCustomFields('document', payload),
    createdAt: now,
    updatedAt: now
  };
  const list = loadDocuments();
  list.push(document);
  saveDocuments(list);
  return document;
}

export function updateDocument(id, updates){
  const list = loadDocuments();
  const idx = list.findIndex(d => d.id === id);
  if(idx === -1) throw new Error('Documento no encontrado');
  const prev = list[idx];

  if(isRRHHMode()){
    const merged = { ...prev, ...updates };
    const check = validateProductivityDocument(merged);
    if(!check.valid) throw new Error(Object.values(check.errors)[0]);
    const normalized = normalizeProductivityDocument(merged);
    list[idx] = {
      id: prev.id,
      entity_id: normalized.entityId,
      folio: prev.folio,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      notes: normalized.notes,
      ...pickCustomFields('document', normalized),
      createdAt: prev.createdAt,
      updatedAt: new Date().toISOString()
    };
    saveDocuments(list);
    return list[idx];
  }

  const merged = { ...prev, ...updates };
  const check = validateDocument({
    entityId: merged.entity_id,
    series: merged.series,
    folio: merged.folio,
    startDate: merged.startDate,
    endDate: merged.endDate,
    quantity: merged.quantity,
    subtotal: merged.subtotal,
    discount: merged.discount,
    taxAmount: merged.taxAmount,
    totalAmount: merged.totalAmount,
    status: updates.status !== undefined ? (updates.status||'').trim() : merged.status
  }, prev.status);
  if(!check.valid){
    throw new Error(Object.values(check.errors)[0]);
  }
  list[idx] = {
    ...prev,
    series: (merged.series||'').trim() || undefined,
    folio: Number(merged.folio),
    startDate: merged.startDate,
    endDate: merged.endDate,
    quantity: (isEmpty(merged.quantity)) ? undefined : Number(merged.quantity),
    subtotal: (isEmpty(merged.subtotal)) ? undefined : Number(merged.subtotal),
    discount: (isEmpty(merged.discount)) ? undefined : Number(merged.discount),
    taxAmount: (isEmpty(merged.taxAmount)) ? undefined : Number(merged.taxAmount),
    totalAmount: (isEmpty(merged.totalAmount)) ? undefined : Number(merged.totalAmount),
    currency: (merged.currency||'').trim() || undefined,
    paymentTerms: (merged.paymentTerms||'').trim() || undefined,
    notes: (merged.notes||'').trim() || undefined,
    status: updates.status !== undefined ? (updates.status||'').trim() : merged.status,
    ...pickCustomFields('document', { ...prev, ...updates }),
    updatedAt: new Date().toISOString()
  };
  saveDocuments(list);
  return list[idx];
}

export function deleteDocument(id){
  const list = loadDocuments();
  const newList = list.filter(d => d.id !== id);
  saveDocuments(newList);
  return newList;
}

export function deleteDocumentsForEntity(entityId){
  const list = loadDocuments();
  const newList = list.filter(d => d.entity_id !== entityId);
  saveDocuments(newList);
  return newList;
}

export function getDocumentPeriod(doc){
  return periodFromDates(doc && doc.startDate);
}

export function getDepartmentForDocument(doc){
  return doc && doc.asignacionId ? getDepartmentForAssignment(doc.asignacionId) : null;
}

export function getProductivityHistory(entityId){
  return loadDocuments()
    .filter(d => d.entity_id === entityId && isProductivityRecord(d))
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    .map(d => ({
      ...d,
      period: getDocumentPeriod(d),
      departamento: getDepartmentForDocument(d)?.nombre || 'Sin departamento'
    }));
}

export function getComparableMeasurements(entityId, indicador, unidad){
  const keyIndicator = normalizeKey(indicador);
  const keyUnit = normalizeKey(unidad);
  if(!keyIndicator || !keyUnit) return [];
  return getProductivityHistory(entityId).filter(d =>
    normalizeKey(d.indicador) === keyIndicator && normalizeKey(d.unidad) === keyUnit
  );
}

export function getIndicatorsForEntity(entityId){
  return [...new Set(loadDocuments()
    .filter(d => d.entity_id === entityId && !isEmpty(d.indicador))
    .map(d => normalizeText(d.indicador)))]
    .sort((a, b) => a.localeCompare(b, 'es'));
}

export function getUnitsForEntity(entityId, indicador){
  const keyIndicator = normalizeKey(indicador);
  return [...new Set(loadDocuments()
    .filter(d => d.entity_id === entityId && !isEmpty(d.unidad) && (!keyIndicator || normalizeKey(d.indicador) === keyIndicator))
    .map(d => normalizeText(d.unidad)))]
    .sort((a, b) => a.localeCompare(b, 'es'));
}

export function clearAll(){
  saveEntities([]);
  saveDocuments([]);
  saveDepartments([]);
  saveDepartmentHistory([]);
}
