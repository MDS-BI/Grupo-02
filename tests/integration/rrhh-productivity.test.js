import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  addDepartment, addEntity, addDepartmentAssignment, loadEntities, loadDocuments,
  loadDepartments, loadDepartmentHistory
} from '../../src/storage.js';
import { RRHH_CONFIG } from '../../src/module-config.js';
import { createAssignmentItem } from '../../src/components/assignment-list.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function fire(id, type = 'change'){ qs(id).dispatchEvent(new dom.window.Event(type, { bubbles: true })); }
function submit(id){ qs(id).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }

function seedWorker(){
  const department = addDepartment({ nombre: 'Operaciones' });
  const worker = addEntity({
    name: 'Ana Torres',
    code: 'W-001',
    cargo: 'Analista',
    fechaIngreso: '2026-01-15',
    estadoLaboral: 'Activo',
    departamentoId: department.id_departamento
  });
  const assignment = addDepartmentAssignment({
    entity_id: worker.entity_id,
    id_departamento: department.id_departamento,
    fecha_inicio: '2026-01-15'
  });
  return { department, worker, assignment };
}

function fillProductivity({ period = '2026-03', indicador = 'Pedidos procesados', resultado = '42', unidad = 'pedidos' } = {}){
  qs('document-entity').value = loadEntities()[0].entity_id;
  fire('document-entity');
  qs('productivity-period').value = period;
  fire('productivity-period');
  qs('cf-indicador').value = indicador;
  qs('cf-resultado').value = resultado;
  qs('cf-unidad').value = unidad;
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
  const { boot } = await import('../../src/app.js');
  await boot(RRHH_CONFIG);
});

afterEach(() => {
  dom.window.close();
});

describe('Incremento 002 - RR. HH. y productividad', () => {
  it('muestra una asignación futura sin fecha de término como programada', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const start = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const item = createAssignmentItem({ id_historial: 'future', fecha_inicio: start, fecha_fin: null }, 'Tecnología');
    expect(item.textContent).toContain(`${start} → programada`);
  });

  it('activa la navegación y las etiquetas de RR. HH.', () => {
    expect(document.querySelectorAll('.nav-module').length).toBe(8);
    expect(qs('nav-departments').hidden).toBe(false);
    expect(qs('nav-history').hidden).toBe(false);
    expect(qs('nav-entities-label').textContent).toBe('Trabajadores');
    expect(qs('nav-documents-label').textContent).toBe('Registros de Productividad');
    expect(qs('data-warning').hidden).toBe(false);
    expect(qs('productivity-fields').hidden).toBe(false);
  });

  it('crea departamentos desde la vista de departamentos', () => {
    qs('nav-departments').click();
    qs('department-nombre').value = 'Finanzas';
    qs('department-descripcion').value = 'Área financiera';
    submit('department-form');
    expect(loadDepartments().length).toBe(1);
    expect(loadDepartments()[0].nombre).toBe('Finanzas');
    expect(qs('department-list').textContent).toContain('Finanzas');
  });

  it('crea un trabajador con los campos de RR. HH.', () => {
    addDepartment({ nombre: 'Operaciones' });
    qs('nav-entities').click();
    qs('name').value = 'Ana Torres';
    qs('code').value = 'W-001';
    qs('cf-cargo').value = 'Analista';
    qs('cf-fechaIngreso').value = '2026-01-15';
    qs('cf-departamentoId').value = loadDepartments()[0].id_departamento;
    submit('entity-form');
    expect(loadEntities().length).toBe(1);
    expect(loadEntities()[0].cargo).toBe('Analista');
    expect(loadEntities()[0].estadoLaboral).toBe('Activo');
    expect(loadEntities()[0].departamentoId).toBe(loadDepartments()[0].id_departamento);
  });

  it('registra una medición de productividad y la muestra en historial y evolución', () => {
    seedWorker();
    qs('nav-documents').click();
    fillProductivity();
    submit('document-form');

    expect(loadDocuments().length).toBe(1);
    const doc = loadDocuments()[0];
    expect(doc.entity_id).toBe(loadEntities()[0].entity_id);
    expect(doc.asignacionId).toBe(loadDepartmentHistory()[0].id_historial);
    expect(doc.indicador).toBe('Pedidos procesados');
    expect(doc.resultado).toBe(42);
    expect(doc.startDate).toBe('2026-03-01');
    expect(doc.endDate).toBe('2026-03-31');

    qs('nav-history').click();
    qs('history-entity').value = loadEntities()[0].entity_id;
    fire('history-entity');
    expect(qs('history-body').textContent).toContain('2026-03');
    expect(qs('history-body').textContent).toContain('Pedidos procesados');

    qs('nav-evolution').click();
    qs('evolution-entity').value = loadEntities()[0].entity_id;
    fire('evolution-entity');
    qs('evolution-indicator').value = 'Pedidos procesados';
    fire('evolution-indicator');
    qs('evolution-unit').value = 'pedidos';
    fire('evolution-unit');
    expect(qs('evolution-body').textContent).toContain('42');
  });

  it('advierte sobre mediciones duplicadas y permite guardarlas si se confirma', () => {
    seedWorker();
    qs('nav-documents').click();
    fillProductivity();
    submit('document-form');
    fillProductivity();
    submit('document-form');
    expect(globalThis.confirm).toHaveBeenCalled();
    expect(loadDocuments().length).toBe(2);
  });

  it('protege el historial y permite marcar al trabajador como Inactivo', () => {
    seedWorker();
    qs('nav-documents').click();
    fillProductivity();
    submit('document-form');

    qs('nav-entities').click();
    qs('edit-entity').value = loadEntities()[0].id;
    fire('edit-entity');
    qs('delete-entity').click();
    expect(loadEntities().length).toBe(1);
    expect(qs('error-edit-entity').textContent).toContain('históricos');

    qs('deactivate-entity').click();
    expect(loadEntities()[0].estadoLaboral).toBe('Inactivo');
  });

  it('registra y cierra asignaciones al cambiar de departamento', () => {
    const { worker, department } = seedWorker();
    const nuevo = addDepartment({ nombre: 'Tecnología' });
    qs('nav-assignments').click();
    qs('assignment-entity').value = worker.entity_id;
    qs('assignment-department').value = nuevo.id_departamento;
    qs('assignment-start').value = '2026-04-01';
    qs('assignment-close-previous').checked = true;
    submit('assignment-form');

    const history = loadDepartmentHistory();
    expect(history.length).toBe(2);
    expect(history[0].fecha_fin).toBe('2026-03-31');
    expect(history[1].id_departamento).toBe(nuevo.id_departamento);
    expect(loadEntities()[0].departamentoId).toBe(nuevo.id_departamento);
    expect(loadEntities()[0].departamentoId).not.toBe(department.id_departamento);
  });
});
