import { loadModuleConfig, normalizeConfig, setActiveConfig, labelFor, isRRHHMode } from './module-config.js';
import {
  loadEntities, addEntity, updateEntity, deleteEntity, validateEntity, searchEntities, canDeleteEntity,
  loadDocuments, addDocument, updateDocument, deleteDocument, validateDocument, findDuplicateProductivity,
  getDocumentPeriod, getProductivityHistory, getComparableMeasurements, getIndicatorsForEntity, getUnitsForEntity,
  loadDepartments, addDepartment, updateDepartment, deleteDepartment, validateDepartment,
  loadDepartmentHistory, addDepartmentAssignment, updateDepartmentAssignment, deleteDepartmentAssignment,
  validateDepartmentAssignment, changeDepartment, getAssignmentsForEntity, getAssignmentsOverlapping,
  getCurrentAssignment, monthBounds, saveEntities,
  getStorageError, clearStorageError, inspectDocumentsForRRHH
} from './storage.js';
import { clearEntityForm, startEntityEdit, collectEntityPayload, showEntityErrors, refreshEntityCustomFields } from './components/entity-form.js';
import { createEntityItem } from './components/entity-list.js';
import { clearDocumentForm, startDocumentEdit, collectDocumentPayload, showDocumentErrors } from './components/document-form.js';
import { folioLabel } from './components/document-list.js';
import { renderLogo, applyShellLabels, setActiveModule } from './components/shell.js';
import { renderDashboard } from './components/dashboard.js';
import { setupSearchBar, renderSearchResults } from './components/search-bar.js';
import { clearDepartmentForm, startDepartmentEdit, collectDepartmentPayload, showDepartmentErrors } from './components/department-form.js';
import { renderDepartmentList } from './components/department-list.js';
import { clearAssignmentForm, startAssignmentEdit, collectAssignmentPayload, showAssignmentErrors } from './components/assignment-form.js';
import { renderAssignmentList } from './components/assignment-list.js';
import { renderHistoryTable } from './components/history-view.js';
import { renderEvolutionTable } from './components/evolution-view.js';

function qs(id){ return document.getElementById(id); }

// Ayudantes de género gramatical para etiquetas configurables en español.
// El género se deduce de la primera palabra (p. ej., "Pedido de Venta" → masculino)
// usando terminaciones femeninas comunes (-a, -dad, -ción, ...).
const palabraClave = (word) => String(word).trim().split(/\s+/)[0] || '';
const esFemenina = (word) => /(a|dad|tad|ción|sión|tud|umbre|ie)$/i.test(palabraClave(word));
const articulo = (word) => esFemenina(word) ? 'la' : 'el';
const demostrativo = (word) => esFemenina(word) ? 'esta' : 'este';
const seleccionada = (word) => esFemenina(word) ? 'seleccionada' : 'seleccionado';

const MODULES = ['dashboard', 'entities', 'departments', 'assignments', 'documents', 'history', 'evolution', 'search'];
const VIEWS = {
  dashboard: 'view-dashboard',
  entities: 'view-entities',
  departments: 'view-departments',
  assignments: 'view-assignments',
  documents: 'view-documents',
  history: 'view-history',
  evolution: 'view-evolution',
  search: 'view-search'
};

let wired = false;

function setOptions(select, options, previousValue, placeholder){
  if(!select) return;
  select.innerHTML = '';
  if(placeholder !== undefined){
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    select.appendChild(opt);
  }
  for(const item of options){
    const opt = document.createElement('option');
    opt.value = item.value;
    opt.textContent = item.label;
    select.appendChild(opt);
  }
  if(previousValue && [...select.options].some(o => o.value === previousValue)){
    select.value = previousValue;
  }
}

function showModule(name, opts = {}){
  if(!MODULES.includes(name)) name = 'dashboard';
  MODULES.forEach(m => { qs(VIEWS[m]).hidden = m !== name; });
  setActiveModule(name);
  if(name === 'dashboard'){
    renderDashboard();
  }
  if(name === 'entities'){
    populateDocumentEntitySelect();
    populateEditEntitySelect();
    if(opts.newRecord || !qs('entity-id').value) clearEntityForm();
    else refreshEntityCustomFields(collectEntityPayload());
    if(opts.focusForm) qs('name').focus();
  }
  if(name === 'departments'){
    refreshDepartments();
    if(opts.newRecord) clearDepartmentForm();
    if(opts.focusForm) qs('department-nombre').focus();
  }
  if(name === 'assignments'){
    refreshAssignments();
    if(opts.newRecord) clearAssignmentForm();
    if(opts.focusForm) qs('assignment-entity').focus();
  }
  if(name === 'documents'){
    populateDocumentEntitySelect();
    populateEditDocumentSelect();
    if(opts.newRecord) clearDocumentForm();
    if(isRRHHMode()) populateProductivityAssignments();
    if(opts.focusForm) qs('document-entity').focus();
  }
  if(name === 'history'){
    populateHistoryEntitySelect();
    renderHistory();
  }
  if(name === 'evolution'){
    populateEvolutionEntitySelect();
    populateEvolutionFilters();
    renderEvolution();
  }
  if(name === 'search'){
    refreshSearch();
    if(opts.focusSearch) qs('search-input').focus();
  }
  showPendingStorageError();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateDocumentEntitySelect(){
  const select = qs('document-entity');
  const prev = select.value;
  const entities = loadEntities();
  setOptions(select, entities.map(e => ({ value: e.entity_id, label: e.name })), prev, isRRHHMode() ? '-- Selecciona un trabajador --' : undefined);
}

function populateEditEntitySelect(){
  const select = qs('edit-entity');
  const prev = select.value;
  const entities = loadEntities();
  setOptions(select, entities.map(e => ({ value: e.id, label: `${e.name} — ${e.code}` })), prev, `-- Selecciona ${articulo(labelFor('entity'))} ${labelFor('entity').toLowerCase()} --`);
}

function populateEditDocumentSelect(){
  const select = qs('edit-document');
  const prev = select.value;
  const entities = loadEntities();
  const options = loadDocuments().map(d => {
    const entity = entities.find(e => e.entity_id === d.entity_id);
    const label = isRRHHMode()
      ? `${entity ? entity.name : 'Trabajador desconocido'} · ${getDocumentPeriod(d) || ''} · ${d.indicador || ''}`
      : `${entity ? entity.name : 'Entidad desconocida'} · ${folioLabel(d)} · ${d.startDate} → ${d.endDate}`;
    return { value: d.id, label };
  });
  setOptions(select, options, prev, `-- Selecciona ${articulo(labelFor('document'))} ${labelFor('document').toLowerCase()} --`);
}

function populateEditDepartmentSelect(){
  const select = qs('edit-department');
  const prev = select?.value;
  setOptions(select, loadDepartments().map(d => ({ value: d.id_departamento, label: d.nombre })), prev, '-- Selecciona un departamento --');
}

function assignmentEndLabel(assignment){
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return assignment.fecha_fin || (assignment.fecha_inicio > today ? 'programada' : 'vigente');
}

function assignmentLabel(assignment){
  const department = loadDepartments().find(d => d.id_departamento === assignment.id_departamento);
  const entity = loadEntities().find(e => e.entity_id === assignment.entity_id);
  return `${entity ? entity.name : 'Trabajador'} · ${department ? department.nombre : 'Departamento'} · ${assignment.fecha_inicio} → ${assignmentEndLabel(assignment)}`;
}

function populateEditAssignmentSelect(){
  const select = qs('edit-assignment');
  const prev = select?.value;
  setOptions(select, loadDepartmentHistory().map(a => ({ value: a.id_historial, label: assignmentLabel(a) })), prev, '-- Selecciona una asignación --');
}

function populateAssignmentSelects(){
  const entities = loadEntities();
  const departments = loadDepartments();
  const entityPrev = qs('assignment-entity')?.value;
  const departmentPrev = qs('assignment-department')?.value;
  const filterPrev = qs('assignment-entity-filter')?.value;

  setOptions(qs('assignment-entity'), entities.map(e => ({ value: e.entity_id, label: e.name })), entityPrev, '-- Selecciona un trabajador --');
  setOptions(qs('assignment-department'), departments.map(d => ({ value: d.id_departamento, label: d.nombre })), departmentPrev, '-- Selecciona un departamento --');
  setOptions(qs('assignment-entity-filter'), entities.map(e => ({ value: e.entity_id, label: e.name })), filterPrev, 'Todos los trabajadores');
  populateEditAssignmentSelect();
}

function refreshDepartments(){
  renderDepartmentList(qs('department-list'), loadDepartments());
  const empty = qs('department-empty');
  if(empty) empty.hidden = loadDepartments().length > 0;
  populateEditDepartmentSelect();
  populateAssignmentSelects();
  if(qs('view-entities') && !qs('view-entities').hidden){
    if(qs('entity-id').value) refreshEntityCustomFields(collectEntityPayload());
    else clearEntityForm();
  }
}

function refreshAssignments(){
  populateAssignmentSelects();
  const filter = qs('assignment-entity-filter')?.value || '';
  const all = loadDepartmentHistory();
  const assignments = (filter ? all.filter(a => a.entity_id === filter) : all)
    .slice()
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  renderAssignmentList(
    qs('assignment-list'),
    assignments,
    a => loadDepartments().find(d => d.id_departamento === a.id_departamento)?.nombre || 'Departamento desconocido',
    a => loadDocuments().filter(d => d.asignacionId === a.id_historial).length
  );
  const empty = qs('assignment-empty');
  if(empty) empty.hidden = assignments.length > 0;
}

function refreshSearch(){
  renderSearchResults(qs('search-results-list'), qs('search-empty'), searchEntities(qs('search-input').value), (e) => createEntityItem(e));
}

function onEditEntityChange(){
  const id = qs('edit-entity').value;
  if(!id){ clearEntityForm(); return; }
  const entity = loadEntities().find(e => e.id === id);
  if(entity) startEntityEdit(entity);
}

function syncEntityCurrentDepartment(entityId){
  const current = getCurrentAssignment(entityId);
  const entities = loadEntities();
  const idx = entities.findIndex(e => e.entity_id === entityId);
  if(idx === -1) return;
  entities[idx] = {
    ...entities[idx],
    departamentoId: current ? current.id_departamento : undefined,
    updatedAt: new Date().toISOString()
  };
  saveEntities(entities);
}

function handleDeleteSelectedEntity(){
  const id = qs('edit-entity').value;
  if(!id){ qs('error-edit-entity').textContent = `Selecciona ${articulo(labelFor('entity'))} ${labelFor('entity').toLowerCase()} para eliminar.`; return; }
  const check = canDeleteEntity(id);
  if(!check.allowed){
    qs('error-edit-entity').textContent = check.reason;
    return;
  }
  const message = isRRHHMode()
    ? `¿Eliminar ${demostrativo(labelFor('entity'))} ${labelFor('entity').toLowerCase()}?`
    : `¿Eliminar ${demostrativo(labelFor('entity'))} ${labelFor('entity').toLowerCase()}? Sus ${labelFor('documents').toLowerCase()} también se eliminarán.`;
  if(!confirm(message)) return;
  try{
    deleteEntity(id);
    qs('error-edit-entity').textContent = '';
    clearEntityForm();
    afterSaveRefresh();
  }catch(e){
    qs('error-edit-entity').textContent = e.message;
  }
}

function handleDeactivateSelectedEntity(){
  const id = qs('edit-entity').value;
  if(!id){ qs('error-edit-entity').textContent = 'Selecciona un trabajador para marcarlo como Inactivo.'; return; }
  try{
    updateEntity(id, { estadoLaboral: 'Inactivo' });
    qs('error-edit-entity').textContent = '';
    startEntityEdit(loadEntities().find(e => e.id === id));
    afterSaveRefresh();
  }catch(e){
    qs('error-edit-entity').textContent = e.message;
  }
}

function onEditDocumentChange(){
  const id = qs('edit-document').value;
  if(!id){ clearDocumentForm(); return; }
  const doc = loadDocuments().find(d => d.id === id);
  if(doc){
    startDocumentEdit(doc);
    if(isRRHHMode()) populateProductivityAssignments(doc.asignacionId);
  }
}

function handleDeleteSelectedDocument(){
  const id = qs('edit-document').value;
  if(!id){ qs('error-edit-document').textContent = `Selecciona ${articulo(labelFor('document'))} ${labelFor('document').toLowerCase()} para eliminar.`; return; }
  if(!confirm(`¿Eliminar ${demostrativo(labelFor('document'))} ${labelFor('document').toLowerCase()}?`)) return;
  try{
    deleteDocument(id);
    qs('error-edit-document').textContent = '';
    clearDocumentForm();
    afterSaveRefresh();
  }catch(e){
    qs('error-edit-document').textContent = e.message;
  }
}

function afterSaveRefresh(){
  populateDocumentEntitySelect();
  populateEditEntitySelect();
  populateEditDocumentSelect();
  refreshDepartments();
  refreshAssignments();
  populateHistoryEntitySelect();
  populateEvolutionEntitySelect();
  populateEvolutionFilters();
}

function handleEntitySubmit(ev){
  ev.preventDefault();
  const id = qs('entity-id').value;
  const payload = collectEntityPayload();
  const { valid, errors } = validateEntity(payload);
  showEntityErrors(errors);
  if(!valid) return;
  try{
    if(id){
      updateEntity(id, payload);
    }else{
      addEntity(payload);
    }
    clearEntityForm();
    afterSaveRefresh();
  }catch(e){
    showStorageFailure(e);
  }
}

function showDuplicateWarning(payload, id){
  const duplicates = findDuplicateProductivity(payload, id || undefined);
  const warning = qs('productivity-duplicate-warning');
  if(duplicates.length === 0){
    if(warning){ warning.hidden = true; warning.textContent = ''; }
    return false;
  }
  if(warning){
    warning.hidden = false;
    warning.textContent = 'Ya existe una medición del mismo trabajador, período e indicador. Puedes guardarla nuevamente si lo confirmas.';
  }
  return true;
}

function handleDocumentSubmit(ev){
  ev.preventDefault();
  const id = qs('document-id').value;
  const payload = collectDocumentPayload();

  if(isRRHHMode()){
    const hasDuplicate = showDuplicateWarning(payload, id);
    const { valid, errors } = validateDocument(payload);
    showDocumentErrors(errors);
    if(!valid) return;
    if(hasDuplicate){
      const proceed = typeof confirm === 'function'
        ? confirm('Ya existe una medición del mismo trabajador, período e indicador. ¿Deseas guardar otra?')
        : true;
      if(!proceed) return;
    }
    try{
      if(id) updateDocument(id, payload);
      else addDocument(payload);
      clearDocumentForm();
      afterSaveRefresh();
      if(isRRHHMode()) populateProductivityAssignments();
    }catch(e){
      showStorageFailure(e);
    }
    return;
  }

  const existing = id ? loadDocuments().find(d => d.id === id) : undefined;
  const { valid, errors } = validateDocument(payload, existing ? existing.status : undefined);
  showDocumentErrors(errors);
  if(!valid) return;
  try{
    if(id){
      updateDocument(id, payload);
    }else{
      addDocument(payload);
    }
    clearDocumentForm();
    afterSaveRefresh();
  }catch(e){
    showStorageFailure(e);
    showDocumentErrors({ status: e.message });
  }
}

function populateProductivityAssignments(preferredAssignmentId){
  if(!isRRHHMode()) return;
  const select = qs('cf-asignacionId');
  if(!select) return;
  const entityId = qs('document-entity').value;
  const period = qs('productivity-period').value;
  const bounds = monthBounds(period);
  const previous = preferredAssignmentId || select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
  blank.textContent = '-- Selecciona una asignación --';
  select.appendChild(blank);
  if(!entityId || !bounds) return;
  const assignments = getAssignmentsOverlapping(entityId, bounds.startDate, bounds.endDate);
  for(const assignment of assignments){
    const department = loadDepartments().find(d => d.id_departamento === assignment.id_departamento);
    const opt = document.createElement('option');
    opt.value = assignment.id_historial;
    opt.textContent = `${department ? department.nombre : 'Departamento'} · ${assignment.fecha_inicio} → ${assignmentEndLabel(assignment)}`;
    select.appendChild(opt);
  }
  if(assignments.length === 1){
    select.value = assignments[0].id_historial;
  } else if(previous && [...select.options].some(o => o.value === previous)){
    select.value = previous;
  }
  const error = qs('error-cf-asignacionId');
  if(error){
    error.textContent = assignments.length === 0
      ? 'El trabajador no tiene una asignación de departamento para este período.'
      : '';
  }
}

function handleDepartmentSubmit(ev){
  ev.preventDefault();
  const id = qs('department-id').value;
  const payload = collectDepartmentPayload();
  const { valid, errors } = validateDepartment(payload, id || undefined);
  showDepartmentErrors(errors);
  if(!valid) return;
  try{
    if(id) updateDepartment(id, payload);
    else addDepartment(payload);
    clearDepartmentForm();
    refreshDepartments();
    afterSaveRefresh();
  }catch(e){
    showStorageFailure(e);
    qs('error-department-nombre').textContent = e.message;
  }
}

function onEditDepartmentChange(){
  const id = qs('edit-department').value;
  if(!id){ clearDepartmentForm(); return; }
  const department = loadDepartments().find(d => d.id_departamento === id);
  if(department) startDepartmentEdit(department);
}

function handleDeleteSelectedDepartment(){
  const id = qs('edit-department').value;
  if(!id){ qs('error-edit-department').textContent = 'Selecciona un departamento para eliminar.'; return; }
  if(!confirm('¿Eliminar el departamento seleccionado?')) return;
  try{
    deleteDepartment(id);
    qs('error-edit-department').textContent = '';
    clearDepartmentForm();
    refreshDepartments();
    afterSaveRefresh();
  }catch(e){
    qs('error-edit-department').textContent = e.message;
  }
}

function handleAssignmentSubmit(ev){
  ev.preventDefault();
  const id = qs('assignment-id').value;
  const payload = collectAssignmentPayload();

  if(id){
    const { valid, errors } = validateDepartmentAssignment(payload, id);
    showAssignmentErrors(errors);
    if(!valid) return;
    try{
      updateDepartmentAssignment(id, payload);
      syncEntityCurrentDepartment(payload.entity_id);
      clearAssignmentForm();
      refreshAssignments();
      afterSaveRefresh();
    }catch(e){
      showStorageFailure(e);
      qs('error-assignment-start').textContent = e.message;
    }
    return;
  }

  const closePrevious = qs('assignment-close-previous')?.checked;
  if(closePrevious && !payload.fecha_fin){
    try{
      changeDepartment(payload.entity_id, payload.id_departamento, payload.fecha_inicio);
      clearAssignmentForm();
      refreshAssignments();
      afterSaveRefresh();
    }catch(e){
      qs('error-assignment-start').textContent = e.message;
    }
    return;
  }

  const { valid, errors } = validateDepartmentAssignment(payload);
  showAssignmentErrors(errors);
  if(!valid) return;
  try{
    addDepartmentAssignment(payload);
    if(!payload.fecha_fin) syncEntityCurrentDepartment(payload.entity_id);
    clearAssignmentForm();
    refreshAssignments();
    afterSaveRefresh();
  }catch(e){
    showStorageFailure(e);
    qs('error-assignment-start').textContent = e.message;
  }
}

function onEditAssignmentChange(){
  const id = qs('edit-assignment').value;
  if(!id){ clearAssignmentForm(); return; }
  const assignment = loadDepartmentHistory().find(a => a.id_historial === id);
  if(assignment) startAssignmentEdit(assignment);
}

function handleDeleteSelectedAssignment(){
  const id = qs('edit-assignment').value;
  if(!id){ qs('error-edit-assignment').textContent = 'Selecciona una asignación para eliminar.'; return; }
  if(!confirm('¿Eliminar la asignación seleccionada?')) return;
  try{
    deleteDepartmentAssignment(id);
    qs('error-edit-assignment').textContent = '';
    clearAssignmentForm();
    refreshAssignments();
    afterSaveRefresh();
  }catch(e){
    qs('error-edit-assignment').textContent = e.message;
  }
}

function populateHistoryEntitySelect(){
  const select = qs('history-entity');
  const prev = select?.value;
  setOptions(select, loadEntities().map(e => ({ value: e.entity_id, label: e.name })), prev, '-- Selecciona un trabajador --');
}

function renderHistory(){
  const entityId = qs('history-entity')?.value;
  const measurements = entityId ? getProductivityHistory(entityId) : [];
  renderHistoryTable(qs('history-body'), qs('history-empty'), measurements);
  if(!entityId && qs('history-empty')){
    qs('history-empty').hidden = false;
    qs('history-empty').textContent = 'Selecciona un trabajador para consultar su historial.';
  }
}

function populateEvolutionEntitySelect(){
  const select = qs('evolution-entity');
  const prev = select?.value;
  setOptions(select, loadEntities().map(e => ({ value: e.entity_id, label: e.name })), prev, '-- Selecciona un trabajador --');
}

function populateEvolutionFilters(){
  const entityId = qs('evolution-entity')?.value;
  const indicatorSelect = qs('evolution-indicator');
  const unitSelect = qs('evolution-unit');
  const indicatorPrev = indicatorSelect?.value;
  const unitPrev = unitSelect?.value;
  const indicators = entityId ? getIndicatorsForEntity(entityId) : [];
  setOptions(indicatorSelect, indicators.map(i => ({ value: i, label: i })), indicatorPrev, '-- Indicador --');
  const units = entityId ? getUnitsForEntity(entityId, indicatorSelect?.value || '') : [];
  setOptions(unitSelect, units.map(u => ({ value: u, label: u })), unitPrev, '-- Unidad --');
  if(units.length === 1) unitSelect.value = units[0];
}

function renderEvolution(){
  const entityId = qs('evolution-entity')?.value;
  const indicator = qs('evolution-indicator')?.value;
  const unit = qs('evolution-unit')?.value;
  const measurements = entityId && indicator && unit
    ? getComparableMeasurements(entityId, indicator, unit)
    : [];
  renderEvolutionTable(qs('evolution-body'), qs('evolution-message'), measurements);
  if(!entityId && qs('evolution-message')){
    qs('evolution-message').hidden = false;
    qs('evolution-message').textContent = 'Selecciona un trabajador para visualizar su evolución.';
  }
}

function applyLabels(config){
  const entity = config.labels.entity;
  const entities = config.labels.entities;
  const document_ = config.labels.document;
  const documents = config.labels.documents;
  const femEntity = esFemenina(entity);
  const femDocument = esFemenina(document_);
  const rrhh = isRRHHMode();

  document.title = config.moduleName;
  qs('brand-name').textContent = config.moduleName;
  applyShellLabels();

  qs('dashboard-heading').textContent = config.moduleName;
  qs('dashboard-subtitle').textContent = rrhh
    ? `Gestiona ${entities.toLowerCase()}, departamentos y ${documents.toLowerCase()} en un solo lugar.`
    : `Gestiona tus ${entities.toLowerCase()} y ${documents.toLowerCase()} en un solo lugar.`;
  qs('action-new-entity-title').textContent = `${femEntity ? 'Nueva' : 'Nuevo'} ${entity}`;
  qs('action-new-entity-sub').textContent = `Crear un registro de ${entity.toLowerCase()}`;
  qs('action-new-document-title').textContent = `${femDocument ? 'Nueva' : 'Nuevo'} ${document_}`;
  qs('action-new-document-sub').textContent = `Registrar un registro de ${document_.toLowerCase()}`;
  qs('action-open-entities-title').textContent = entities;
  qs('action-open-entities-sub').textContent = `Abrir la gestión de ${entities.toLowerCase()}`;
  qs('action-find-title').textContent = 'Buscar registros';
  qs('action-find-sub').textContent = `Buscar ${entities.toLowerCase()}`;

  qs('entities-view-heading').textContent = entities;
  qs('documents-view-heading').textContent = documents;
  qs('entity-form-heading').textContent = `Agregar / Editar ${entity}`;
  qs('edit-entity-heading').textContent = `Editar o eliminar ${articulo(entity)} ${entity.toLowerCase()}`;
  qs('document-form-heading').textContent = `Agregar / Editar ${document_}`;
  qs('edit-document-heading').textContent = `Editar o eliminar ${articulo(document_)} ${document_.toLowerCase()}`;
  qs('search-view-heading').textContent = `Buscar ${entities}`;
  qs('search-heading').textContent = `Buscar ${articulo(entity)} ${entity.toLowerCase()}`;
  qs('search-input').placeholder = rrhh ? 'Buscar por nombre, código, cargo, departamento...' : 'Buscar por nombre, código, categoría...';
  qs('search-input').setAttribute('aria-label', `Buscar ${entities.toLowerCase()}`);
  qs('search-empty').textContent = 'Sin coincidencias para tu búsqueda.';
  qs('delete-entity').textContent = `Eliminar ${articulo(entity)} ${entity.toLowerCase()} ${seleccionada(entity)}`;
  qs('delete-document').textContent = `Eliminar ${articulo(document_)} ${document_.toLowerCase()} ${seleccionada(document_)}`;
  qs('document-entity-label').textContent = `${entity} *`;

  qs('data-warning').hidden = !rrhh;
  qs('deactivate-entity').hidden = !rrhh;
  document.querySelectorAll('.rrhh-nav').forEach(el => {
    el.hidden = !rrhh;
    el.classList.toggle('nav-module', rrhh);
  });
  qs('productivity-fields').hidden = !rrhh;
  qs('document-status-control').hidden = rrhh;
  if(rrhh) qs('document-custom-fields').hidden = true;

  document.querySelectorAll('[data-base-document]').forEach(el => { el.hidden = rrhh; });

  if(rrhh){
    const inspection = inspectDocumentsForRRHH();
    if(!inspection.compatible){
      const banner = qs('storage-error');
      if(banner){
        banner.textContent = `Hay ${inspection.legacy.length} documento(s) incompatible(s) con productividad en el almacenamiento local. Respalda o migra esos datos antes de guardar nuevos registros.`;
        banner.hidden = false;
      }
    }
  }

  qs('departments-view-heading').textContent = 'Departamentos';
  qs('assignments-view-heading').textContent = 'Asignaciones de Departamento';
  qs('history-view-heading').textContent = 'Historial de Productividad';
  qs('evolution-view-heading').textContent = 'Evolución de Productividad';
  qs('deactivate-entity').textContent = 'Marcar como Inactivo';
}

function applyTheme(config){
  document.documentElement.style.setProperty('--accent', config.theme.accentColor);
}

function showConfigErrors(errors){
  const banner = qs('config-errors');
  if(errors && errors.length > 0){
    banner.textContent = `Problema de configuración del módulo: ${errors.join(' ')}`;
    banner.hidden = false;
  } else {
    banner.hidden = true;
    banner.textContent = '';
  }
}

function showPendingStorageError(){
  const message = getStorageError();
  if(!message) return;
  const banner = qs('storage-error');
  if(banner){
    banner.textContent = message;
    banner.hidden = false;
  }
}

function showStorageFailure(error){
  const message = error && error.message ? error.message : getStorageError() || 'No se pudo guardar la información.';
  const banner = qs('storage-error');
  if(banner){
    banner.textContent = message;
    banner.hidden = false;
  }
  if(typeof alert === 'function') alert(message);
}

function wireEvents(){
  if(wired) return;
  wired = true;
  document.querySelectorAll('.nav-module').forEach(btn => {
    btn.addEventListener('click', () => showModule(btn.dataset.module));
  });
  qs('action-new-entity').addEventListener('click', () => showModule('entities', { newRecord: true, focusForm: true }));
  qs('action-new-document').addEventListener('click', () => showModule('documents', { newRecord: true, focusForm: true }));
  qs('action-open-entities').addEventListener('click', () => showModule('entities'));
  qs('action-find').addEventListener('click', () => showModule('search', { focusSearch: true }));
  qs('entity-form').addEventListener('submit', handleEntitySubmit);
  qs('cancel-edit').addEventListener('click', clearEntityForm);
  qs('document-form').addEventListener('submit', handleDocumentSubmit);
  qs('document-cancel-edit').addEventListener('click', clearDocumentForm);
  setupSearchBar(qs('search-input'), () => refreshSearch());
  qs('edit-entity').addEventListener('change', onEditEntityChange);
  qs('edit-document').addEventListener('change', onEditDocumentChange);
  qs('delete-entity').addEventListener('click', handleDeleteSelectedEntity);
  qs('deactivate-entity').addEventListener('click', handleDeactivateSelectedEntity);
  qs('delete-document').addEventListener('click', handleDeleteSelectedDocument);

  qs('department-form').addEventListener('submit', handleDepartmentSubmit);
  qs('department-cancel-edit').addEventListener('click', clearDepartmentForm);
  qs('edit-department').addEventListener('change', onEditDepartmentChange);
  qs('delete-department').addEventListener('click', handleDeleteSelectedDepartment);

  qs('assignment-form').addEventListener('submit', handleAssignmentSubmit);
  qs('assignment-cancel-edit').addEventListener('click', clearAssignmentForm);
  qs('edit-assignment').addEventListener('change', onEditAssignmentChange);
  qs('delete-assignment').addEventListener('click', handleDeleteSelectedAssignment);
  qs('assignment-entity-filter').addEventListener('change', () => refreshAssignments());

  qs('document-entity').addEventListener('change', () => {
    if(isRRHHMode()) populateProductivityAssignments();
  });
  qs('productivity-period').addEventListener('change', () => {
    if(isRRHHMode()) populateProductivityAssignments();
  });

  qs('history-entity').addEventListener('change', renderHistory);
  qs('evolution-entity').addEventListener('change', () => {
    populateEvolutionFilters();
    renderEvolution();
  });
  qs('evolution-indicator').addEventListener('change', () => {
    populateEvolutionFilters();
    renderEvolution();
  });
  qs('evolution-unit').addEventListener('change', renderEvolution);
}

export function initApp(resolved){
  clearStorageError();
  showConfigErrors(resolved.errors);
  setActiveConfig(resolved.config);
  applyTheme(resolved.config);
  renderLogo(qs('logo-mark'));
  applyLabels(resolved.config);
  wireEvents();
  clearEntityForm();
  clearDocumentForm();
  clearDepartmentForm();
  clearAssignmentForm();
  showModule('dashboard');
  showPendingStorageError();
}

export async function boot(overrideConfig){
  const resolved = overrideConfig !== undefined ? normalizeConfig(overrideConfig) : await loadModuleConfig();
  initApp(resolved);
}
