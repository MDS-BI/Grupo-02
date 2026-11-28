import { loadModuleConfig, normalizeConfig, setActiveConfig, getConfig, labelFor, isRRHHMode, indicadoresParaCargo } from './module-config.js';
import {
  loadEntities, entityDisplayName, addEntity, updateEntity, deleteEntity, validateEntity, searchEntities, canDeleteEntity,
  loadDocuments, addDocument, updateDocument, deleteDocument, validateDocument, findDuplicateProductivity,
  getDocumentPeriod, getProductivityHistory, getComparableMeasurements, getIndicatorsForEntity, getUnitsForEntity,
  getDepartmentForDocument,
  loadDepartments, addDepartment, updateDepartment, deleteDepartment, validateDepartment,
  loadDepartmentHistory, addDepartmentAssignment, updateDepartmentAssignment, deleteDepartmentAssignment,
  validateDepartmentAssignment, changeDepartment, getAssignmentsForEntity, getAssignmentsOverlapping,
  getCurrentAssignment, monthBounds, saveEntities, loadDemoData,
  needsDemoSeed, seedDemoDataIfEmpty,
  getStorageError, clearStorageError, inspectDocumentsForRRHH,
  loadGlobalGoals, upsertGlobalGoal
} from './storage.js';
import {
  ROLES,
  defaultRoleState,
  loadRoleState,
  saveRoleState,
  normalizeRoleState,
  allowedModules,
  canPerform,
  filterEntities,
  filterDocuments,
  isAssignmentInScope,
  isSupervisorContextComplete,
  assertCanEditDocument,
  scopeDescription,
  roleLabel
} from './roles.js';
import { clearEntityForm, startEntityEdit, collectEntityPayload, showEntityErrors, refreshEntityCustomFields, nextEmployeeCode, rememberEmployeeCode } from './components/entity-form.js';
import { createEntityItem } from './components/entity-list.js';
import { clearDocumentForm, startDocumentEdit, collectDocumentPayload, showDocumentErrors, assertDocumentFormEditable } from './components/document-form.js';
import { folioLabel } from './components/document-list.js';
import { renderLogo, setupSidebarToggle, applyShellLabels, applyRoleShellPermissions, setActiveModule } from './components/shell.js';
import { renderDashboard } from './components/dashboard.js';
import { setupSearchBar, renderSearchResults } from './components/search-bar.js';
import { clearDepartmentForm, startDepartmentEdit, collectDepartmentPayload, showDepartmentErrors } from './components/department-form.js';
import { renderDepartmentList } from './components/department-list.js';
import { clearAssignmentForm, startAssignmentEdit, collectAssignmentPayload, showAssignmentErrors } from './components/assignment-form.js';
import { renderAssignmentList } from './components/assignment-list.js';
import { renderHistoryTable } from './components/history-view.js';
import { renderEvolutionTable } from './components/evolution-view.js';
import { applyHelpText } from './components/help-text.js';

function qs(id){ return document.getElementById(id); }
function normalizeKey(value){ return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }

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
let entitySubTab = 'add';
let roleState = defaultRoleState();
let currentModule = 'dashboard';

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

function setSidebarSubNav(visible){
  const subNav = qs('entities-sub-nav');
  if(subNav) subNav.hidden = !visible;
}

function setEntityEditFormVisible(visible){
  const card = qs('entity-form-card');
  if(card) card.hidden = !visible;
}

function setEntitySubTab(tab, options = {}){
  const target = tab === 'edit' ? 'edit' : 'add';
  const isAdd = target === 'add';
  entitySubTab = target;

  [
    ['nav-entities-add', 'entity-panel-add', isAdd],
    ['nav-entities-edit', 'entity-panel-edit', !isAdd]
  ].forEach(([buttonId, panelId, active]) => {
    const button = qs(buttonId);
    const panel = qs(panelId);
    if(button){
      button.classList.toggle('active', active);
      if(active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    if(panel) panel.hidden = !active;
  });

  const formCard = qs('entity-form-card');
  const addPanel = qs('entity-panel-add');
  const editSlot = qs('entity-edit-form-slot');
  if(isAdd){
    if(formCard && addPanel && formCard.parentElement !== addPanel) addPanel.appendChild(formCard);
    setEntityEditFormVisible(true);
    if(options.reset || qs('entity-id').value){
      clearEntityForm();
      const select = qs('edit-entity');
      if(select) select.value = '';
    }
  } else {
    if(formCard && editSlot && formCard.parentElement !== editSlot) editSlot.appendChild(formCard);
    setEntityEditFormVisible(Boolean(qs('edit-entity').value));
  }
}

function departmentNameForAssignment(assignment){
  return loadDepartments().find(d => d.id_departamento === assignment?.id_departamento)?.nombre || '';
}

function visibleEntities(){
  const entities = loadEntities();
  if(!isRRHHMode()) return entities;
  return filterEntities(roleState, entities, loadDepartmentHistory(), loadDepartments());
}

function visibleDocuments(){
  const documents = loadDocuments();
  if(!isRRHHMode()) return documents;
  return filterDocuments(roleState, documents, document_ => getDepartmentForDocument(document_)?.nombre || '');
}

function visibleDepartments(){
  const departments = loadDepartments();
  if(!isRRHHMode()) return departments;
  if(roleState.rolActivo === ROLES.SUPERVISOR){
    if(!isSupervisorContextComplete(roleState)) return [];
    return departments.filter(department => department.nombre === roleState.supervisorArea);
  }
  if(roleState.rolActivo === ROLES.BARISTA){
    const assignment = loadDepartmentHistory().find(item => item.entity_id === roleState.baristaEntityId);
    const departmentId = assignment?.id_departamento;
    return departments.filter(department => department.id_departamento === departmentId);
  }
  return departments;
}

function visibleAssignments(){
  const assignments = loadDepartmentHistory();
  if(!isRRHHMode()) return assignments;
  return assignments.filter(assignment => isAssignmentInScope(roleState, assignment, loadDepartments()));
}

function showRoleDenied(action){
  const message = `La acción «${action}» no está permitida para ${roleLabel(roleState.rolActivo)}.`;
  const banner = qs('storage-error');
  if(banner){
    banner.textContent = message;
    banner.hidden = false;
  }
  return message;
}

function showModule(name, opts = {}){
  if(!MODULES.includes(name)) name = 'dashboard';
  if(isRRHHMode() && !allowedModules(roleState).includes(name)){
    name = allowedModules(roleState)[0] || 'dashboard';
  }
  currentModule = name;
  MODULES.forEach(m => { qs(VIEWS[m]).hidden = m !== name; });
  setActiveModule(name);
  setSidebarSubNav(name === 'entities');
  if(name === 'dashboard'){
    renderDashboard({
      entities: visibleEntities(),
      documents: visibleDocuments(),
      departments: visibleDepartments(),
      assignments: visibleAssignments()
    });
  }
  if(name === 'entities'){
    setEntitySubTab(opts.entityTab || 'add');
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
    if(opts.focusForm) { const el = qs('document-entity'); if(el){ el.focus(); setTimeout(() => el.focus(), 0); } }
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
  applyHelpText(qs(VIEWS[name]));
  const announcer = qs('route-announcer');
  if(announcer){
    const activeNav = document.querySelector(`.nav-module[data-module="${name}"]`);
    announcer.textContent = `Vista: ${activeNav ? activeNav.textContent.trim() : name}`;
  }
  const reduceMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function populateDocumentEntitySelect(){
  const select = qs('document-entity');
  const prev = select.value;
  const entities = visibleEntities();
  setOptions(select, entities.map(e => ({ value: e.entity_id, label: entityDisplayName(e) })), prev, isRRHHMode() ? '-- Selecciona personal --' : undefined);
}

function populateEditEntitySelect(){
  const select = qs('edit-entity');
  const prev = select.value;
  const entities = visibleEntities();
  setOptions(select, entities.map(e => ({ value: e.id, label: `${entityDisplayName(e)} — ${e.code}` })), prev, `-- Selecciona ${articulo(labelFor('entity'))} ${labelFor('entity').toLowerCase()} --`);
}

function evaluationSummary(doc){
  const indicador = (doc.indicador || '').trim();
  const vals = [doc.evaluacionCalidad, doc.evaluacionResponsabilidad, doc.evaluacionCumplimiento, doc.evaluacionColaboracion]
    .map(v => Number(v)).filter(n => Number.isFinite(n));
  const avg = vals.length === 4 ? (vals.reduce((a,b)=>a+b,0)/4) : null;
  const avgText = avg !== null ? `Promedio: ${Number.isInteger(avg)?String(avg):avg.toFixed(2).replace(/\.?0+$/,'')} / 5` : '';
  if(indicador && avgText) return `${indicador} (${avgText})`;
  return indicador || avgText || '?';
}

function renderDocumentHistoryTable(){
  const body = qs('document-history-body');
  const empty = qs('document-history-empty');
  if(!body) return;
  const entities = loadEntities();
  const query = normalizeKey((qs('document-history-search')?.value || '').trim());
  const docs = visibleDocuments().slice().sort((a,b) => String(getDocumentPeriod(b)||b.startDate||'').localeCompare(String(getDocumentPeriod(a)||a.startDate||'')));
  const filtered = query ? docs.filter(d => {
    const entity = entities.find(e => e.entity_id === d.entity_id);
    return entity && (normalizeKey(entityDisplayName(entity)).includes(query) || normalizeKey(String(entity.code||'')).includes(query));
  }) : docs;
  body.innerHTML = '';
  if(empty){
    empty.hidden = filtered.length > 0;
    empty.textContent = docs.length === 0 ? 'No hay evaluaciones registradas.' : 'No se encontraron evaluaciones para la búsqueda.';
  }
  for(const d of filtered){
    const entity = entities.find(e => e.entity_id === d.entity_id);
    const tr = document.createElement('tr');
    const worker = entity ? `${entityDisplayName(entity)}${entity.code ? ' ('+entity.code+')' : ''}` : 'Personal no identificado';
    const period = getDocumentPeriod(d) || d.startDate || '?';
    tr.innerHTML = `<td>${escapeHtml(worker)}</td><td>${escapeHtml(String(period))}</td><td>${escapeHtml(evaluationSummary(d))}</td><td class="row-actions"></td>`;
    const actions = tr.querySelector('.row-actions');
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'secondary small';
    editBtn.textContent = 'Editar';
    editBtn.dataset.action = 'edit-document';
    editBtn.dataset.id = d.id;
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'danger small';
    delBtn.textContent = 'Eliminar';
    delBtn.dataset.action = 'delete-document';
    delBtn.dataset.id = d.id;
    delBtn.hidden = !canPerform(roleState, 'document:delete');
    actions.append(editBtn, delBtn);
    body.appendChild(tr);
  }
}

function populateEditDocumentSelect(){
  const select = qs('edit-document');
  const prev = select.value;
  const entities = loadEntities();
  const options = visibleDocuments().map(d => {
    const entity = entities.find(e => e.entity_id === d.entity_id);
    const label = isRRHHMode()
      ? `${entity ? entityDisplayName(entity) : 'Personal no identificado'} · ${getDocumentPeriod(d) || ''} · ${d.indicador || ''}`
      : `${entity ? entityDisplayName(entity) : 'Personal no identificado'} · ${folioLabel(d)} · ${d.startDate} · ${d.endDate}`;
    return { value: d.id, label };
  });
  setOptions(select, options, prev, `-- Selecciona ${articulo(labelFor('document'))} ${labelFor('document').toLowerCase()} --`);
  renderDocumentHistoryTable();
}

function populateEditDepartmentSelect(){
  const select = qs('edit-department');
  const prev = select?.value;
  setOptions(select, loadDepartments().map(d => ({ value: d.id_departamento, label: d.nombre })), prev, '-- Selecciona un área de trabajo --');
}

function assignmentEndLabel(assignment){
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return assignment.fecha_fin || (assignment.fecha_inicio > today ? 'programada' : 'vigente');
}

function assignmentLabel(assignment){
  const department = loadDepartments().find(d => d.id_departamento === assignment.id_departamento);
  const entity = loadEntities().find(e => e.entity_id === assignment.entity_id);
  return `${entity ? entityDisplayName(entity) : 'Personal'} · ${department ? department.nombre : 'Área de trabajo'} · ${assignment.fecha_inicio} → ${assignmentEndLabel(assignment)}`;
}

function populateEditAssignmentSelect(){
  const select = qs('edit-assignment');
  const prev = select?.value;
  setOptions(select, loadDepartmentHistory().map(a => ({ value: a.id_historial, label: assignmentLabel(a) })), prev, '-- Selecciona una asignación de área --');
}

function populateAssignmentSelects(){
  const entities = visibleEntities();
  const departments = loadDepartments();
  const entityPrev = qs('assignment-entity')?.value;
  const departmentPrev = qs('assignment-department')?.value;
  const filterPrev = qs('assignment-entity-filter')?.value;

  setOptions(qs('assignment-entity'), entities.map(e => ({ value: e.entity_id, label: entityDisplayName(e) })), entityPrev, '-- Selecciona personal --');
  setOptions(qs('assignment-department'), departments.map(d => ({ value: d.id_departamento, label: d.nombre })), departmentPrev, '-- Selecciona un área de trabajo --');
  setOptions(qs('assignment-entity-filter'), entities.map(e => ({ value: e.entity_id, label: entityDisplayName(e) })), filterPrev, 'Todo el personal');
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
  const all = visibleAssignments();
  const assignments = (filter ? all.filter(a => a.entity_id === filter) : all)
    .slice()
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  renderAssignmentList(
    qs('assignment-list'),
    assignments,
    a => loadDepartments().find(d => d.id_departamento === a.id_departamento)?.nombre || 'Área de trabajo desconocida',
    a => loadDocuments().filter(d => d.asignacionId === a.id_historial).length
  );
  const empty = qs('assignment-empty');
  if(empty) empty.hidden = assignments.length > 0;
}

function refreshSearch(){
  renderSearchResults(qs('search-results-list'), qs('search-empty'), searchEntities(qs('search-input').value), (e) => createEntityItem(e));
}

function onEditEntityChange(){
  setEntitySubTab('edit');
  const id = qs('edit-entity').value;
  if(!id){
    clearEntityForm();
    setEntityEditFormVisible(false);
    return;
  }
  const entity = loadEntities().find(e => e.id === id);
  if(entity){
    startEntityEdit(entity);
    setEntityEditFormVisible(true);
    qs('error-edit-entity').textContent = '';
  }
}

function handleCancelEntityEdit(){
  clearEntityForm();
  qs('edit-entity').value = '';
  setEntityEditFormVisible(false);
  qs('error-edit-entity').textContent = '';
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
  if(!canPerform(roleState, 'entity:write')){ showRoleDenied('crear o editar trabajadores'); return; }
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
    qs('edit-entity').value = '';
    clearEntityForm();
    setEntityEditFormVisible(false);
    afterSaveRefresh();
  }catch(e){
    qs('error-edit-entity').textContent = e.message;
  }
}

function handleDeactivateSelectedEntity(){
  if(!canPerform(roleState, 'entity:write')){ showRoleDenied('marcar trabajadores como Inactivos'); return; }
  const id = qs('edit-entity').value;
  if(!id){ qs('error-edit-entity').textContent = 'Selecciona personal para marcarlo como Inactivo.'; return; }
  try{
    updateEntity(id, { estadoLaboral: 'Inactivo' });
    qs('error-edit-entity').textContent = '';
    startEntityEdit(loadEntities().find(e => e.id === id));
    setEntityEditFormVisible(true);
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
  if(!canPerform(roleState, 'document:delete')){ showRoleDenied('eliminar registros de productividad'); return; }
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
  if(!canPerform(roleState, 'entity:write')){ showRoleDenied('crear o editar trabajadores'); return; }
  const id = qs('entity-id').value;
  const payload = collectEntityPayload();
  if(isRRHHMode() && !id && loadEntities().some(entity => String(entity.code ?? '').trim() === String(payload.code ?? '').trim())){
    qs('code').value = nextEmployeeCode();
    payload.code = qs('code').value;
  }
  const { valid, errors } = validateEntity(payload);
  showEntityErrors(errors);
  if(!valid) return;
  try{
    if(id){
      updateEntity(id, payload);
    }else{
      addEntity(payload);
      if(isRRHHMode()) rememberEmployeeCode(payload.code);
    }
    if(id){
      const saved = loadEntities().find(entity => entity.id === id);
      if(saved) startEntityEdit(saved);
      else clearEntityForm();
      setEntityEditFormVisible(true);
    }else{
      clearEntityForm();
    }
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
    warning.textContent = 'Ya existe una evaluación del mismo personal, período e indicador de desempeño. Puedes guardarla nuevamente si lo confirmas.';
  }
  return true;
}

function handleDocumentSubmit(ev){
  ev.preventDefault();
  try{
    assertDocumentFormEditable(roleState);
  }catch(e){
    showRoleDenied(e.message);
    return;
  }
  const id = qs('document-id').value;
  const payload = collectDocumentPayload();

  if(isRRHHMode()){
    try{
      assertCanEditDocument(roleState, payload, {
        assignments: loadDepartmentHistory(),
        departments: loadDepartments()
      });
    }catch(e){
      showRoleDenied(e.message);
      return;
    }
    const hasDuplicate = showDuplicateWarning(payload, id);
    const { valid, errors } = validateDocument(payload);
    showDocumentErrors(errors);
    if(!valid) return;
    if(hasDuplicate){
      const proceed = typeof confirm === 'function'
        ? confirm('Ya existe una evaluación del mismo personal, período e indicador de desempeño. ¿Deseas guardar otra?')
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

function populateProductivityAreas(preferredDepartmentId){
  if(!isRRHHMode()) return;
  const select = qs('cf-areaTrabajo');
  if(!select) return;
  const prev = preferredDepartmentId || select.value;
  const departments = loadDepartments().slice().sort((a,b) => (a.nombre || '').localeCompare(b.nombre || '', 'es'));
  setOptions(select, departments.map(d => ({ value: d.id_departamento, label: d.nombre })), prev, '-- Selecciona un área de trabajo --');
}

function syncProductivityAreaFromAssignment(){
  const assignmentId = qs('cf-asignacionId')?.value;
  const areaSelect = qs('cf-areaTrabajo');
  if(!areaSelect) return;
  if(!assignmentId) return;
  const assignment = loadDepartmentHistory().find(a => a.id_historial === assignmentId);
  if(assignment && assignment.id_departamento){
    areaSelect.value = assignment.id_departamento;
  }
}

function populateProductivityAssignments(preferredAssignmentId){
  if(!isRRHHMode()) return;
  const select = qs('cf-asignacionId');
  if(!select) return;
  const entityId = qs('document-entity').value;
  const period = qs('productivity-period').value;
  const selectedArea = qs('cf-areaTrabajo')?.value || '';
  const bounds = monthBounds(period);
  const previous = preferredAssignmentId || select.value;
  select.innerHTML = '';
  const blank = document.createElement('option');
  blank.value = '';
    blank.textContent = '-- Selecciona una asignación de área --';
  select.appendChild(blank);
  if(!entityId || !bounds) {
    const err = qs('error-cf-asignacionId');
    if(err) err.textContent = '';
    return;
  }
  let assignments = getAssignmentsOverlapping(entityId, bounds.startDate, bounds.endDate);
  if(selectedArea) assignments = assignments.filter(a => a.id_departamento === selectedArea);
  for(const assignment of assignments){
    const department = loadDepartments().find(d => d.id_departamento === assignment.id_departamento);
    const opt = document.createElement('option');
    opt.value = assignment.id_historial;
      opt.textContent = `${department ? department.nombre : 'Área de trabajo'} · ${assignment.fecha_inicio} · ${assignmentEndLabel(assignment)}`;
    select.appendChild(opt);
  }
  if(assignments.length === 1){
    select.value = assignments[0].id_historial;
  } else if(previous && [...select.options].some(o => o.value === previous)){
    select.value = previous;
  }
  syncProductivityAreaFromAssignment();
  const error = qs('error-cf-asignacionId');
  if(error){
    if(assignments.length === 0){
      error.textContent = selectedArea
        ? 'El personal no tiene una asignación en el área seleccionada para este período.'
        : 'El personal no tiene una asignación de área para este período.';
    } else {
      error.textContent = '';
    }
  }
}

function suggestIndicatorsForEntity(){
  if(!isRRHHMode()) return;
  const entityId = qs('document-entity')?.value;
  if(!entityId) return;
  const entity = loadEntities().find(e => e.entity_id === entityId);
  if(!entity) return;
  const cargo = entity.cargo;
  const indicadores = indicadoresParaCargo(cargo);
  if(indicadores.length === 0) return;
  const indicadorInput = qs('cf-indicador');
  const unidadInput = qs('cf-unidad');
  // Sugerir automáticamente el primer indicador del cargo si el campo está vacío
  if(indicadorInput && !indicadorInput.value){
    indicadorInput.value = indicadores[0].value;
  }
  if(unidadInput && !unidadInput.value){
    unidadInput.value = indicadores[0].unidad;
  }
}

function handleDepartmentSubmit(ev){
  ev.preventDefault();
  if(!canPerform(roleState, 'department:write')){ showRoleDenied('crear o editar departamentos'); return; }
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
  if(!canPerform(roleState, 'department:write')){ showRoleDenied('crear o editar departamentos'); return; }
  const id = qs('edit-department').value;
  if(!id){ qs('error-edit-department').textContent = 'Selecciona un área de trabajo para eliminar.'; return; }
  if(!confirm('¿Eliminar el área de trabajo seleccionada?')) return;
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
  if(!canPerform(roleState, 'assignment:write')){ showRoleDenied('crear o editar asignaciones'); return; }
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
  if(!canPerform(roleState, 'assignment:write')){ showRoleDenied('crear o editar asignaciones'); return; }
  const id = qs('edit-assignment').value;
  if(!id){ qs('error-edit-assignment').textContent = 'Selecciona una asignación de área para eliminar.'; return; }
  if(!confirm('¿Eliminar la asignación de área seleccionada?')) return;
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

function handleGlobalGoalSubmit(ev){
  ev.preventDefault();
  if(!canPerform(roleState, 'global-goal:write')){ showRoleDenied('configurar metas globales por área'); return; }
  const error = qs('global-goal-error');
  if(error){ error.textContent = ''; error.hidden = true; }
  try{
    upsertGlobalGoal({
      area: (qs('gg-area') || qs('global-goal-area')).value,
      periodo: (qs('gg-period') || qs('global-goal-period')).value,
      metaGlobal: (qs('gg-meta') || qs('global-goal-value')).value
    });
    if(error){ error.textContent = 'Meta global guardada correctamente.'; error.hidden = false; }
  }catch(e){
    if(error){ error.textContent = e.message; error.hidden = false; }
    showStorageFailure(e);
  }
  applyHelpText(document);
}

function populateHistoryEntitySelect(){
  const select = qs('history-entity');
  const prev = select?.value;
  setOptions(select, visibleEntities().map(e => ({ value: e.entity_id, label: entityDisplayName(e) })), prev, '-- Selecciona personal --');
  if(roleState.rolActivo === ROLES.BARISTA && roleState.baristaEntityId && [...select.options].some(option => option.value === roleState.baristaEntityId)){
    select.value = roleState.baristaEntityId;
  }
}

function renderHistory(){
  const entityId = qs('history-entity')?.value;
  const measurements = entityId
    ? filterDocuments(roleState, getProductivityHistory(entityId), document_ => document_.departamento || getDepartmentForDocument(document_)?.nombre || '')
    : [];
  renderHistoryTable(qs('history-body'), qs('history-empty'), measurements, roleState);
  if(!entityId && qs('history-empty')){
    qs('history-empty').hidden = false;
    qs('history-empty').textContent = 'Selecciona personal para consultar su historial de evaluaciones.';
  }
  if(measurements.length === 0 && roleState.rolActivo === ROLES.SUPERVISOR && qs('history-empty')){
    qs('history-empty').hidden = false;
    qs('history-empty').textContent = 'Selecciona área y turno para consultar el historial de tu alcance.';
  }
  if(measurements.length === 0 && roleState.rolActivo === ROLES.BARISTA && qs('history-empty')){
    qs('history-empty').hidden = false;
    qs('history-empty').textContent = 'Selecciona tu trabajador para consultar tu desempeño.';
  }
}

function populateEvolutionEntitySelect(){
  const select = qs('evolution-entity');
  const prev = select?.value;
  setOptions(select, visibleEntities().map(e => ({ value: e.entity_id, label: entityDisplayName(e) })), prev, '-- Selecciona personal --');
  if(roleState.rolActivo === ROLES.BARISTA && roleState.baristaEntityId && [...select.options].some(option => option.value === roleState.baristaEntityId)){
    select.value = roleState.baristaEntityId;
  }
}

function populateEvolutionFilters(){
  const entityId = qs('evolution-entity')?.value;
  const indicatorSelect = qs('evolution-indicator');
  const unitSelect = qs('evolution-unit');
  const indicatorPrev = indicatorSelect?.value;
  const unitPrev = unitSelect?.value;
  const source = visibleDocuments();
  const indicators = entityId ? getIndicatorsForEntity(entityId, source) : [];
  setOptions(indicatorSelect, indicators.map(i => ({ value: i, label: i })), indicatorPrev, '-- Indicador de desempeño --');
  const units = entityId ? getUnitsForEntity(entityId, indicatorSelect?.value || '', source) : [];
  setOptions(unitSelect, units.map(u => ({ value: u, label: u })), unitPrev, '-- Unidad --');
  if(units.length === 1) unitSelect.value = units[0];
}

function renderEvolution(){
  const entityId = qs('evolution-entity')?.value;
  const indicator = qs('evolution-indicator')?.value;
  const unit = qs('evolution-unit')?.value;
  const comparable = entityId && indicator && unit
    ? getComparableMeasurements(entityId, indicator, unit)
    : [];
  const measurements = filterDocuments(roleState, comparable, document_ => document_.departamento || getDepartmentForDocument(document_)?.nombre || '');
  renderEvolutionTable(qs('evolution-body'), qs('evolution-message'), measurements, roleState);
  if(!entityId && qs('evolution-message')){
    qs('evolution-message').hidden = false;
    qs('evolution-message').textContent = 'Selecciona personal para visualizar la evolución del desempeño.';
  }
  if(measurements.length === 0 && roleState.rolActivo === ROLES.SUPERVISOR && qs('evolution-message')){
    qs('evolution-message').hidden = false;
    qs('evolution-message').textContent = 'Selecciona área y turno para visualizar la evolución de tu alcance.';
  }
  if(measurements.length === 0 && roleState.rolActivo === ROLES.BARISTA && qs('evolution-message')){
    qs('evolution-message').hidden = false;
    qs('evolution-message').textContent = 'Selecciona tu trabajador para visualizar tu evolución.';
  }
}

function populateRoleWorkerSelect(){
  const select = qs('role-worker');
  if(!select) return;
  const entities = loadEntities();
  setOptions(select, entities.map(entity => ({ value: entity.entity_id, label: entityDisplayName(entity) })), roleState.baristaEntityId, '-- Selecciona tu trabajador --');
}

function applyRoleControls(){
  const controls = qs('role-controls');
  if(!controls) return;
  controls.hidden = !isRRHHMode();
  if(!isRRHHMode()) return;

  const rs=qs('role-select'); if(rs) rs.value = roleState.rolActivo;
  const supervisor = roleState.rolActivo === ROLES.SUPERVISOR;
  const barista = roleState.rolActivo === ROLES.BARISTA;
  for(const id of ['role-area', 'role-area-label', 'role-turn', 'role-turn-label']){ const el=qs(id); if(el) el.hidden=!supervisor; }
  for(const id of ['role-worker', 'role-worker-label']){ const el=qs(id); if(el) el.hidden=!barista; }
  if(supervisor){
    qs('role-area').value = roleState.supervisorArea;
    qs('role-turn').value = roleState.supervisorTurno;
  }
  if(barista){
    populateRoleWorkerSelect();
  }
  const selectedWorker = loadEntities().find(entity => entity.entity_id === roleState.baristaEntityId);
  const workerName = selectedWorker ? entityDisplayName(selectedWorker) : '';
  const scope=qs('role-scope'); if(scope) scope.textContent = `Rol activo: ${roleLabel(roleState.rolActivo)} · ${scopeDescription(roleState, workerName)}`;
  applyHelpText(document);
}

function applyRolePermissions(){
  if(!isRRHHMode()) return;
  const allowed = allowedModules(roleState);
  document.querySelectorAll('.side-nav [data-module]').forEach(button => {
    button.hidden = !allowed.includes(button.dataset.module);
  });
  applyRoleShellPermissions(roleState);

  const canManageEntities = canPerform(roleState, 'entity:write');
  const canManageDepartments = canPerform(roleState, 'department:write');
  const canManageAssignments = canPerform(roleState, 'assignment:write');
  const supervisorReady = roleState.rolActivo !== ROLES.SUPERVISOR || isSupervisorContextComplete(roleState);
  const canWriteMeasurement = canPerform(roleState, 'measurement:write') && supervisorReady;
  const canManageGoals = canPerform(roleState, 'global-goal:write');

  qs('action-new-entity').hidden = !canManageEntities;
  qs('action-open-entities').hidden = !canManageEntities;
  qs('action-new-document').hidden = !canWriteMeasurement;
  qs('action-find').hidden = !allowed.includes('search');
  const historyAction = qs('action-open-history');
  if(historyAction) historyAction.hidden = !allowed.includes('history');
  qs('entity-form').closest('section').hidden = !canManageEntities;
  qs('edit-entity').closest('section').hidden = !canManageEntities;
  qs('document-form').closest('section').hidden = !canWriteMeasurement;
  qs('delete-document').hidden = !canPerform(roleState, 'document:delete');
  qs('deactivate-entity').hidden = !canManageEntities;
  qs('department-form').closest('section').hidden = !canManageDepartments;
  qs('edit-department').closest('section').hidden = !canManageDepartments;
  qs('assignment-form').closest('section').hidden = !canManageAssignments;
  qs('edit-assignment').closest('section').hidden = !canManageAssignments;
  const goalCard = qs('global-goal-card'); if(goalCard) goalCard.hidden = !canManageGoals;
  const incompleteNotice = qs('incomplete-context-notice');
  if(incompleteNotice) incompleteNotice.hidden = supervisorReady;

  const navDocumentsLabel = qs('nav-documents-label');
  const navHistoryLabel = qs('nav-history-label');
  const navEvolutionLabel = qs('nav-evolution-label');
  if(navDocumentsLabel){
    navDocumentsLabel.textContent = roleState.rolActivo === ROLES.SUPERVISOR
      ? 'Medición'
      : roleState.rolActivo === ROLES.BARISTA ? 'Mis evaluaciones' : labelFor('documents');
  }
  if(navHistoryLabel) navHistoryLabel.textContent = roleState.rolActivo === ROLES.BARISTA
    ? 'Mi desempeño'
    : roleState.rolActivo === ROLES.SUPERVISOR ? 'Historial por área/turno' : 'Historial';
  if(navEvolutionLabel) navEvolutionLabel.textContent = roleState.rolActivo === ROLES.BARISTA
    ? 'Mi evolución'
    : roleState.rolActivo === ROLES.SUPERVISOR ? 'Evolución por área/turno' : 'Evolución';

  qs('history-view-heading').textContent = roleState.rolActivo === ROLES.BARISTA
    ? 'Mi desempeño'
    : roleState.rolActivo === ROLES.SUPERVISOR ? 'Historial por área/turno' : 'Historial de Productividad';
  qs('evolution-view-heading').textContent = roleState.rolActivo === ROLES.BARISTA
    ? 'Mi evolución'
    : roleState.rolActivo === ROLES.SUPERVISOR ? 'Evolución por área/turno' : 'Evolución de Productividad';
  qs('documents-view-heading').textContent = roleState.rolActivo === ROLES.SUPERVISOR
    ? 'Medición'
    : roleState.rolActivo === ROLES.BARISTA ? 'Mis evaluaciones' : labelFor('documents');
}

function refreshAfterRoleChange(){
  populateDocumentEntitySelect();
  populateEditEntitySelect();
  populateEditDocumentSelect();
  refreshDepartments();
  refreshAssignments();
  populateHistoryEntitySelect();
  populateEvolutionEntitySelect();
  populateEvolutionFilters();
  showModule(currentModule);
}

function handleRoleChange(){
  const next = defaultRoleState();
  next.rolActivo = qs('role-select').value;
  if(next.rolActivo === ROLES.SUPERVISOR){
    next.supervisorArea = qs('role-area').value;
    next.supervisorTurno = qs('role-turn').value;
  }
  if(next.rolActivo === ROLES.BARISTA){
    next.baristaEntityId = qs('role-worker').value;
  }
  roleState = saveRoleState(normalizeRoleState(next));
  applyRoleControls();
  applyRolePermissions();
  refreshAfterRoleChange();
}

function handleRoleContextChange(){
  const next = { ...roleState };
  if(next.rolActivo === ROLES.SUPERVISOR){
    next.supervisorArea = qs('role-area').value;
    next.supervisorTurno = qs('role-turn').value;
  }
  if(next.rolActivo === ROLES.BARISTA){
    next.baristaEntityId = qs('role-worker').value;
  }
  roleState = saveRoleState(normalizeRoleState(next));
  applyRoleControls();
  applyRolePermissions();
  refreshAfterRoleChange();
}

function applyLabels(config){
  const entity = labelFor('entity');
  const entities = labelFor('entities');
  const document_ = labelFor('document');
  const documents = labelFor('documents');
  const configuredLabels = getConfig().labels;
  const entityText = configuredLabels.entity === entity ? entity : entity.toLowerCase();
  const documentText = configuredLabels.document === document_ ? document_ : document_.toLowerCase();
  const femEntity = esFemenina(entity);
  const femDocument = esFemenina(document_);
  const rrhh = isRRHHMode();

  document.title = config.moduleName;
  qs('brand-name').textContent = config.moduleName;
  applyShellLabels();

  const dashboardHeading = qs('dashboard-heading');
  const dashboardSubtitle = qs('dashboard-subtitle');
  if(dashboardHeading) dashboardHeading.textContent = config.moduleName;
  if(dashboardSubtitle) dashboardSubtitle.textContent = rrhh
    ? `Gestiona ${entities.toLowerCase()}, áreas de trabajo y ${documents.toLowerCase()} en un solo lugar.`
    : `Gestiona tu ${entities.toLowerCase()} y tus ${documents.toLowerCase()} en un solo lugar.`;
  qs('action-new-entity-title').textContent = `${femEntity ? 'Nueva' : 'Nuevo'} ${entityText}`;
  qs('action-new-entity-sub').textContent = `Ingresar ${entity.toLowerCase()} al sistema`;
  qs('action-new-document-title').textContent = `${femDocument ? 'Nueva' : 'Nuevo'} ${documentText}`;
  qs('action-new-document-sub').textContent = `Registrar ${document_.toLowerCase()}`;
  qs('action-open-entities-title').textContent = entities;
  qs('action-open-entities-sub').textContent = `Abrir la gestión de ${entities.toLowerCase()}`;
  qs('action-find-title').textContent = `Buscar ${entities.toLowerCase()}`;
  qs('action-find-sub').textContent = rrhh
    ? `Buscar ${entity.toLowerCase()} por nombre, código, cargo o área de trabajo`
    : `Buscar ${entity.toLowerCase()} por nombre, código o categoría`;

  qs('entities-view-heading').textContent = entities;
  qs('documents-view-heading').textContent = documents;
  qs('entity-form-heading').textContent = rrhh
    ? `Agregar ${entity.toLowerCase()}`
    : `Agregar / Editar ${entity}`;
  qs('code-label').textContent = rrhh ? 'Código de empleado (automático)' : 'Código *';
  qs('code').readOnly = rrhh;
  qs('code').placeholder = rrhh ? 'Se genera automáticamente' : '';
  qs('description-label').textContent = rrhh ? 'Observaciones' : 'Descripción';
  qs('nav-entities-add-label').textContent = 'Agregar';
  qs('nav-entities-edit-label').textContent = `Editar o eliminar ${entity.toLowerCase()}`;
  qs('edit-entity-heading').textContent = `Editar o eliminar ${articulo(entity)} ${entity.toLowerCase()}`;
  qs('edit-entity-label').textContent = `Selecciona ${articulo(entity)} ${entity.toLowerCase()}`;
  qs('document-form-heading').textContent = `Agregar / Editar ${document_}`;
  qs('edit-document-heading').textContent = isRRHHMode() ? 'Historial de evaluaciones' : `Editar o eliminar ${articulo(document_)} ${document_.toLowerCase()}`;
  qs('search-view-heading').textContent = `Buscar ${entities}`;
  qs('search-heading').textContent = `Buscar ${articulo(entity)} ${entity.toLowerCase()}`;
  qs('search-input').placeholder = rrhh ? 'Buscar por nombre, código, cargo o área de trabajo...' : 'Buscar por nombre, código o categoría...';
  qs('search-input').setAttribute('aria-label', `Buscar ${entities.toLowerCase()}`);
  qs('search-empty').textContent = 'Sin coincidencias para tu búsqueda.';
  qs('delete-entity').textContent = `Eliminar ${articulo(entity)} ${entity.toLowerCase()} ${seleccionada(entity)}`;
  qs('delete-document').textContent = `Eliminar ${articulo(document_)} ${document_.toLowerCase()} ${seleccionada(document_)}`;
  qs('document-entity-label').textContent = `${entity} *`;

  qs('data-warning').hidden = !rrhh;
  qs('action-load-demo').hidden = !rrhh;
  qs('deactivate-entity').hidden = !rrhh;
  document.querySelectorAll('.rrhh-nav').forEach(el => {
    el.hidden = !rrhh;
    el.classList.toggle('nav-module', rrhh);
  });
  qs('productivity-fields').hidden = !rrhh;
  qs('document-status-control').hidden = rrhh;
  if(rrhh) qs('document-custom-fields').hidden = true;

  document.querySelectorAll('[data-base-entity]').forEach(el => { el.hidden = rrhh; });
  document.querySelectorAll('[data-base-document]').forEach(el => { el.hidden = rrhh; });
  document.querySelectorAll('[data-rrhh-only]').forEach(el => { el.hidden = !rrhh; });

  if(rrhh){
    const inspection = inspectDocumentsForRRHH();
    if(!inspection.compatible){
      const banner = qs('storage-error');
      if(banner){
        banner.textContent = `Hay ${inspection.legacy.length} evaluación(es) incompatible(s) con el desempeño en el almacenamiento local. Respalda o migra esos datos antes de guardar nuevas evaluaciones.`;
        banner.hidden = false;
      }
    }
  }

  qs('departments-view-heading').textContent = 'Áreas de trabajo';
  qs('assignments-view-heading').textContent = 'Asignaciones de área';
  qs('history-view-heading').textContent = 'Historial de evaluaciones de desempeño';
  qs('evolution-view-heading').textContent = 'Evolución del desempeño';
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

function handleLoadDemoData(){
  try{
    if(!needsDemoSeed() && typeof confirm === 'function'
      && !confirm('Ya existen datos guardados. ¿Reemplazarlos por los datos de demostración ficticios?')) return;
    loadDemoData({ force: true });
    clearEntityForm();
    clearDocumentForm();
    clearDepartmentForm();
    clearAssignmentForm();
    showModule('dashboard');
  }catch(error){
    showStorageFailure(error);
  }
}

function wireEvents(){
  if(wired) return;
  wired = true;
  document.querySelectorAll('.side-nav [data-module]').forEach(btn => {
    btn.addEventListener('click', () => showModule(btn.dataset.module));
  });
  document.querySelectorAll('.nav-sub').forEach(btn => {
    btn.addEventListener('click', () => showModule('entities', { entityTab: btn.dataset.entityTab }));
  });
  qs('role-select')?.addEventListener('change', handleRoleChange);
  qs('role-area')?.addEventListener('change', handleRoleContextChange);
  qs('role-turn')?.addEventListener('change', handleRoleContextChange);
  qs('role-worker')?.addEventListener('change', handleRoleContextChange);
  qs('global-goal-form')?.addEventListener('submit', handleGlobalGoalSubmit);
  qs('action-new-entity').addEventListener('click', () => showModule('entities', { newRecord: true, focusForm: true }));
  qs('action-new-document').addEventListener('click', () => showModule('documents', { newRecord: true, focusForm: true }));
  qs('action-open-entities').addEventListener('click', () => showModule('entities'));
  qs('action-find').addEventListener('click', () => showModule('search', { focusSearch: true }));
  qs('action-open-history')?.addEventListener('click', () => showModule('history'));
  qs('view-dashboard')?.addEventListener('click', (ev) => {
    const card = ev.target.closest('.stat-card-link[data-module-target]');
    if(card){
      const mod = card.dataset.moduleTarget;
      if(mod && (!isRRHHMode() || allowedModules(roleState).includes(mod))) showModule(mod);
      return;
    }
    const activityRow = ev.target.closest('.activity-row[data-document-id]');
    if(activityRow && (!isRRHHMode() || allowedModules(roleState).includes('documents'))){
      showModule('documents', { editDocumentId: activityRow.dataset.documentId, focusForm: true });
    }
  });
  qs('view-dashboard')?.addEventListener('keydown', (ev) => {
    if(ev.key !== 'Enter' && ev.key !== ' ') return;
    const row = ev.target.closest('.activity-row[data-document-id]');
    if(!row) return;
    ev.preventDefault();
    if(!isRRHHMode() || allowedModules(roleState).includes('documents')){
      showModule('documents', { editDocumentId: row.dataset.documentId, focusForm: true });
    }
  });
  qs('view-dashboard')?.addEventListener('keydown', (ev) => {
    if(ev.key !== 'Enter' && ev.key !== ' ') return;
    const card = ev.target.closest('.stat-card-link[data-module-target]');
    if(!card) return;
    ev.preventDefault();
    const mod = card.dataset.moduleTarget;
    if(mod && (!isRRHHMode() || allowedModules(roleState).includes(mod))) showModule(mod);
  });
  qs('action-load-demo').addEventListener('click', handleLoadDemoData);
  qs('entity-form').addEventListener('submit', handleEntitySubmit);
  qs('cancel-edit').addEventListener('click', handleCancelEntityEdit);
  qs('document-form').addEventListener('submit', handleDocumentSubmit);
  qs('document-cancel-edit').addEventListener('click', clearDocumentForm);
  setupSearchBar(qs('search-input'), () => refreshSearch());
  qs('edit-entity').addEventListener('change', onEditEntityChange);
  qs('edit-document').addEventListener('change', onEditDocumentChange);
  qs('document-history-search')?.addEventListener('input', renderDocumentHistoryTable);
  qs('document-history-body')?.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if(!btn) return;
    const id = btn.dataset.id;
    if(btn.dataset.action === 'edit-document'){
      qs('edit-document').value = id;
      onEditDocumentChange();
      qs('document-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if(btn.dataset.action === 'delete-document'){
      qs('edit-document').value = id;
      handleDeleteSelectedDocument();
    }
  });
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
    if(isRRHHMode()){
      populateProductivityAssignments();
      suggestIndicatorsForEntity();
    }
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

export function initApp(resolved, options = {}){
  clearStorageError();
  showConfigErrors(resolved.errors);
  setActiveConfig(resolved.config);
  if(!options.skipDemoSeed && isRRHHMode()) seedDemoDataIfEmpty();
  roleState = loadRoleState();
  applyTheme(resolved.config);
  renderLogo(qs('logo-mark'));
  setupSidebarToggle(qs('logo-mark'));
  applyLabels(resolved.config);
  applyRoleControls();
  applyRolePermissions();
  wireEvents();
  clearEntityForm();
  clearDocumentForm();
  clearDepartmentForm();
  clearAssignmentForm();
  showModule('dashboard');
  showPendingStorageError();
}

export async function boot(overrideConfig, options = {}){
  const resolved = overrideConfig !== undefined ? normalizeConfig(overrideConfig) : await loadModuleConfig();
  initApp(resolved, options);
}
