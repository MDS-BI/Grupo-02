import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { RRHH_CONFIG } from '../../src/module-config.js';
import {
  addDepartmentAssignment,
  loadDepartmentHistory,
  loadDocuments,
  loadEntities
} from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let department;

function qs(id){ return document.getElementById(id); }
function nextVisibleSibling(el){
  let current = el.nextElementSibling;
  while(current && current.hidden) current = current.nextElementSibling;
  return current;
}
function change(id){ qs(id).dispatchEvent(new dom.window.Event('change', { bubbles: true })); }
function submit(id){ qs(id).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }

function createWorker({ name = 'Ana', surname = 'Torres', code = 'W-001', cargo = 'Barista' } = {}){
  qs('nav-entities').click();
  qs('nav-entities-add').click();
  qs('name').value = name;
  qs('surname').value = surname;
  qs('code').value = code;
  qs('cf-cargo').value = cargo;
  qs('cf-fechaIngreso').value = '2026-01-15';
  qs('cf-departamentoId').value = department.id_departamento;
  submit('entity-form');
  return loadEntities().find(entity => entity.code === code);
}

function selectWorkerForEdit(worker){
  qs('nav-entities').click();
  qs('nav-entities-edit').click();
  qs('edit-entity').value = worker.id;
  change('edit-entity');
}

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();

  vi.resetModules();
  const configModule = await import('../../src/module-config.js');
  configModule.setActiveConfig(configModule.normalizeConfig(RRHH_CONFIG).config);
  const { addDepartment } = await import('../../src/storage.js');
  department = addDepartment({ nombre: 'Team cafe' });

  const { boot } = await import('../../src/app.js');
  await boot(RRHH_CONFIG, { skipDemoSeed: true });
});

afterEach(() => {
  dom.window.close();
});

describe('Reorganización de navegación - módulo Trabajadores', () => {
  it('A: Panel queda intacto y Trabajadores despliega dos subpestañas con icono y estado activo', () => {
    const dashboardIcon = qs('nav-dashboard').querySelector('svg').outerHTML;
    const workersIcon = qs('nav-entities').querySelector('svg').outerHTML;

    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('entities-sub-nav').hidden).toBe(true);

    qs('nav-entities').click();
    expect(qs('entities-sub-nav').hidden).toBe(false);
    expect(qs('nav-entities').classList.contains('active')).toBe(true);
    expect(qs('nav-entities-add').classList.contains('active')).toBe(true);
    expect(qs('nav-entities-edit').classList.contains('active')).toBe(false);
    expect(qs('entity-panel-add').hidden).toBe(false);
    expect(qs('entity-panel-edit').hidden).toBe(true);
    expect(qs('entity-form-card').parentElement.id).toBe('entity-panel-add');

    const subButtons = [qs('nav-entities-add'), qs('nav-entities-edit')];
    expect(subButtons.every(btn => btn.querySelector('svg'))).toBe(true);
    expect(qs('nav-entities-add-label').textContent).toBe('Agregar');
    expect(qs('nav-entities-edit-label').textContent).toBe('Editar o eliminar personal');

    qs('nav-entities-edit').click();
    expect(qs('nav-entities-add').classList.contains('active')).toBe(false);
    expect(qs('nav-entities-edit').classList.contains('active')).toBe(true);
    expect(qs('nav-entities-edit').getAttribute('aria-current')).toBe('true');
    expect(qs('entity-panel-add').hidden).toBe(true);
    expect(qs('entity-panel-edit').hidden).toBe(false);
    expect(qs('entity-form-card').parentElement.id).toBe('entity-edit-form-slot');

    qs('nav-entities-add').click();
    expect(qs('entity-panel-add').hidden).toBe(false);
    expect(qs('entity-form-card').parentElement.id).toBe('entity-panel-add');

    qs('nav-dashboard').click();
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('view-entities').hidden).toBe(true);
    expect(qs('entities-sub-nav').hidden).toBe(true);
    expect(qs('nav-dashboard').querySelector('svg').outerHTML).toBe(dashboardIcon);
    expect(qs('nav-entities').querySelector('svg').outerHTML).toBe(workersIcon);
  });

  it('B: la subpestaña Agregar registró trabajadores con el encabezado y campos correctos', () => {
    qs('nav-entities').click();
    expect(qs('entity-form-heading').textContent).toBe('Agregar personal');

    const worker = createWorker();
    expect(worker).toBeTruthy();
    expect(loadEntities()).toHaveLength(1);
    expect(worker.name).toBe('Ana');
    expect(worker.surname).toBe('Torres');
    expect(worker.cargo).toBe('Barista');
    expect(worker.estadoLaboral).toBe('Activo');
    expect(worker.departamentoId).toBe(department.id_departamento);
    expect(qs('entity-form-card').parentElement.id).toBe('entity-panel-add');
  });

  it('C: al seleccionar un trabajador se rellenan todos los campos y se edita sin duplicar', () => {
    const worker = createWorker();

    selectWorkerForEdit(worker);
    expect(qs('entity-form-card').hidden).toBe(false);
    expect(qs('entity-form-card').parentElement.id).toBe('entity-edit-form-slot');
    expect(qs('entity-id').value).toBe(worker.id);
    expect(qs('name').value).toBe('Ana');
    expect(qs('surname').value).toBe('Torres');
    expect(qs('code').value).toBe('W-001');
    expect(qs('cf-cargo').value).toBe('Barista');
    expect(qs('cf-fechaIngreso').value).toBe('2026-01-15');
    expect(qs('cf-estadoLaboral').value).toBe('Activo');
    expect(qs('cf-departamentoId').value).toBe(department.id_departamento);
    expect(qs('submit-button').textContent).toBe('Actualizar');
    expect(qs('cancel-edit').hidden).toBe(false);

    qs('name').value = 'Ana Actualizada';
    qs('surname').value = 'Torres Actualizada';
    qs('cf-cargo').value = 'Supervisora';
    submit('entity-form');

    const entities = loadEntities();
    expect(entities).toHaveLength(1);
    expect(entities[0].id).toBe(worker.id);
    expect(entities[0].name).toBe('Ana Actualizada');
    expect(entities[0].surname).toBe('Torres Actualizada');
    expect(entities[0].cargo).toBe('Supervisora');
  });

  it('D: cancelar conserva los datos, eliminar pide confirmación y respeta el historial', () => {
    const worker = createWorker();

    selectWorkerForEdit(worker);
    qs('name').value = 'Cambio descartado';
    qs('surname').value = 'Cambio descartado';
    qs('cancel-edit').click();
    expect(qs('name').value).toBe('');
    expect(qs('surname').value).toBe('');
    expect(qs('edit-entity').value).toBe('');
    expect(loadEntities()[0].name).toBe('Ana');
    expect(loadEntities()[0].surname).toBe('Torres');

    selectWorkerForEdit(worker);
    globalThis.confirm.mockReturnValueOnce(false);
    qs('delete-entity').click();
    expect(globalThis.confirm).toHaveBeenCalled();
    expect(loadEntities()).toHaveLength(1);

    selectWorkerForEdit(worker);
    qs('delete-entity').click();
    expect(loadEntities()).toHaveLength(0);

    const withHistory = createWorker({ name: 'Bruno', surname: 'Díaz', code: 'W-002', cargo: 'Cajero' });
    addDepartmentAssignment({
      entity_id: withHistory.entity_id,
      id_departamento: department.id_departamento,
      fecha_inicio: '2026-01-15'
    });
    selectWorkerForEdit(withHistory);
    qs('delete-entity').click();
    expect(loadEntities()).toHaveLength(1);
    expect(qs('error-edit-entity').textContent).toMatch(/históricas|Inactivo/i);
  });

  it('E: marcar como inactivo conserva el registro, su historial y se refleja en el Panel', () => {
    const worker = createWorker();
    addDepartmentAssignment({
      entity_id: worker.entity_id,
      id_departamento: department.id_departamento,
      fecha_inicio: '2026-01-15'
    });
    const historyBefore = loadDepartmentHistory().length;
    const documentsBefore = loadDocuments().length;

    selectWorkerForEdit(worker);
    qs('deactivate-entity').click();

    const updated = loadEntities().find(entity => entity.id === worker.id);
    expect(updated).toBeTruthy();
    expect(updated.estadoLaboral).toBe('Inactivo');
    expect(qs('cf-estadoLaboral').value).toBe('Inactivo');
    expect(loadEntities()).toHaveLength(1);
    expect(loadDepartmentHistory()).toHaveLength(historyBefore);
    expect(loadDocuments()).toHaveLength(documentsBefore);

    qs('nav-dashboard').click();
    expect(qs('stat-active').textContent).toBe('0');
  });

  it('F: la sección laboral usa los campos personalizados existentes en el orden solicitado', () => {
    qs('nav-entities').click();

    expect(qs('code-label').textContent).toBe('Código de empleado (automático)');
    expect(qs('code').readOnly).toBe(true);

    const laboral = qs('entity-laboral-custom-fields');
    expect(qs('code').parentElement.nextElementSibling).toBe(laboral);
    expect([...laboral.querySelectorAll('label')].map(label => label.textContent)).toEqual([
      'Cargo *',
      'Área de trabajo *',
      'Fecha de ingreso *',
      'Estado laboral *'
    ]);
    expect(nextVisibleSibling(laboral).textContent).toBe('Información adicional');
  });

  it('G: genera códigos EMP consecutivos, evita duplicados y conserva el código al editar', () => {
    function fillWorker(){
      qs('name').value = 'Ana';
      qs('surname').value = 'Torres';
      qs('cf-cargo').value = 'Barista';
      qs('cf-departamentoId').value = department.id_departamento;
      qs('cf-fechaIngreso').value = '2026-01-15';
      qs('cf-estadoLaboral').value = 'Activo';
    }

    qs('nav-entities').click();
    expect(qs('code').value).toBe('EMP-001');

    fillWorker();
    submit('entity-form');
    const first = loadEntities().find(entity => entity.code === 'EMP-001');
    expect(first).toBeTruthy();
    expect(qs('code').value).toBe('EMP-002');

    fillWorker();
    submit('entity-form');
    expect(loadEntities().map(entity => entity.code)).toEqual(['EMP-001', 'EMP-002']);

    qs('code').value = 'EMP-002';
    fillWorker();
    submit('entity-form');
    expect(loadEntities().map(entity => entity.code)).toEqual(['EMP-001', 'EMP-002', 'EMP-003']);
    const third = loadEntities().find(entity => entity.code === 'EMP-003');

    selectWorkerForEdit(first);
    expect(qs('code').value).toBe('EMP-001');
    qs('name').value = 'Ana Editada';
    submit('entity-form');
    expect(loadEntities().find(entity => entity.id === first.id).code).toBe('EMP-001');

    selectWorkerForEdit(third);
    qs('delete-entity').click();
    expect(qs('code').value).toBe('EMP-004');
  });

  it('H: la sección adicional guarda contacto y observaciones, y los recupera al editar', () => {
    qs('nav-entities').click();

    const additional = qs('entity-additional-custom-fields');
    expect([...additional.querySelectorAll('label')].map(label => label.textContent)).toEqual([
      'Nombre del contacto de emergencia',
      'Teléfono del contacto de emergencia'
    ]);
    expect(qs('description-label').textContent).toBe('Observaciones');
    expect(nextVisibleSibling(additional).querySelector('textarea')).toBe(qs('description'));
    ['category', 'targetDate', 'creditLimit', 'paymentTerms'].forEach(id => {
      expect(qs(id).closest('[data-base-entity]').hidden).toBe(true);
    });

    qs('name').value = 'Ana';
    qs('surname').value = 'Torres';
    qs('cf-cargo').value = 'Barista';
    qs('cf-departamentoId').value = department.id_departamento;
    qs('cf-fechaIngreso').value = '2026-01-15';
    qs('cf-estadoLaboral').value = 'Activo';
    qs('cf-contactoEmergenciaNombre').value = 'Laura';
    qs('cf-contactoEmergenciaTelefono').value = '+56 9 1234 5678';
    qs('description').value = 'Alergia a la lactosa';
    submit('entity-form');

    const worker = loadEntities()[0];
    expect(worker.contactoEmergenciaNombre).toBe('Laura');
    expect(worker.contactoEmergenciaTelefono).toBe('+56 9 1234 5678');
    expect(worker.description).toBe('Alergia a la lactosa');

    selectWorkerForEdit(worker);
    expect(qs('cf-contactoEmergenciaNombre').value).toBe('Laura');
    expect(qs('cf-contactoEmergenciaTelefono').value).toBe('+56 9 1234 5678');
    expect(qs('description').value).toBe('Alergia a la lactosa');
  });

  it('muestra ayuda contextual en la vista de trabajadores y en el formulario', () => {
    qs('nav-entities').click();
    expect(qs('view-entities').getAttribute('title')).toContain('Trabajadores');
    expect(qs('view-entities').nextElementSibling.classList.contains('help-text')).toBe(true);
    expect(qs('entity-form').getAttribute('title')).toContain('personal');
    expect(qs('entity-form').nextElementSibling.textContent).toContain('cafetería');
  });
});
