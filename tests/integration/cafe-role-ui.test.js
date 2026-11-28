import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { RRHH_CONFIG } from '../../src/module-config.js';
import { HELP_TEXT } from '../../src/components/help-text.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function fire(id, type = 'change'){ qs(id).dispatchEvent(new dom.window.Event(type, { bubbles: true })); }
function submit(id){ qs(id).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
});

afterEach(() => {
  dom.window.close();
});

async function setup({ skipDemoSeed = true, prepare } = {}){
  vi.resetModules();
  const configModule = await import('../../src/module-config.js');
  configModule.setActiveConfig(RRHH_CONFIG);
  const storage = await import('../../src/storage.js');
  if(typeof prepare === 'function') prepare(storage, configModule);
  const { initApp, boot } = await import('../../src/app.js');
  if(skipDemoSeed) await initApp(configModule.normalizeConfig(RRHH_CONFIG), { skipDemoSeed: true });
  else await boot(RRHH_CONFIG);
  return storage;
}

function seedCafeteria(storage){
  storage.clearAll();
  const barra = storage.addDepartment({ nombre: 'Barra' });
  const cocina = storage.addDepartment({ nombre: 'Cocina' });
  const ana = storage.addEntity({
    name: 'Camila', surname: 'Rojas', code: 'EMP-001', cargo: 'Barista',
    fechaIngreso: '2026-01-01', estadoLaboral: 'Activo', departamentoId: barra.id_departamento
  });
  const matias = storage.addEntity({
    name: 'Matías', surname: 'Herrera', code: 'EMP-004', cargo: 'Cocinero',
    fechaIngreso: '2026-01-01', estadoLaboral: 'Activo', departamentoId: cocina.id_departamento
  });
  const anaAssignment = storage.addDepartmentAssignment({
    entity_id: ana.entity_id, id_departamento: barra.id_departamento, fecha_inicio: '2026-01-01'
  });
  const matiasAssignment = storage.addDepartmentAssignment({
    entity_id: matias.entity_id, id_departamento: cocina.id_departamento, fecha_inicio: '2026-01-01'
  });
  const base = {
    period: '2026-03', resultado: 85, unidad: '%', meta: 90,
    evaluacionCalidad: 4, evaluacionResponsabilidad: 4,
    evaluacionCumplimiento: 4, evaluacionColaboracion: 4
  };
  storage.addDocument({
    ...base, entityId: ana.entity_id, indicador: 'Calidad de café',
    asignacionId: anaAssignment.id_historial, turno: 'Mañana'
  });
  storage.addDocument({
    ...base, entityId: ana.entity_id, indicador: 'Tiempo de espera',
    asignacionId: anaAssignment.id_historial, turno: 'Tarde'
  });
  storage.addDocument({
    ...base, entityId: matias.entity_id, indicador: 'Higiene en cocina',
    asignacionId: matiasAssignment.id_historial, turno: 'Mañana'
  });
  return { ana, matias };
}

function changeRole(role){
  qs('role-select').value = role;
  fire('role-select', 'change');
}

describe('T006 - arranque con datos de demostración', () => {
  it('precarga el dataset oficial cuando el almacenamiento está vacío', async () => {
    const storage = await setup({ skipDemoSeed: false });
    expect(storage.loadEntities()).toHaveLength(6);
    expect(storage.loadDepartments()).toHaveLength(3);
    expect(storage.loadDocuments()).toHaveLength(12);
  });

  it('no reemplaza datos ya guardados al arrancar', async () => {
    const storage = await setup({
      skipDemoSeed: false,
      prepare: (module) => module.saveEntities([{ entity_id: 'existente', name: 'Existente' }])
    });
    expect(storage.loadEntities().map(entity => entity.entity_id)).toEqual(['existente']);
  });
});

describe('T007/T008/T022 - panel y filtros por rol', () => {
  it('muestra la fecha real de la evaluación en la actividad reciente', async () => {
    const storage = await setup();
    const { ana } = seedCafeteria(storage);
    storage.saveDocuments([{
      id: 'fecha', entity_id: ana.entity_id, startDate: '2026-03-15',
      indicador: 'Calidad de café', resultado: 88, unidad: '%', turno: 'Mañana', meta: 90
    }]);
    qs('nav-dashboard').click();
    expect(qs('dashboard-activity').textContent).toContain('15/03/2026');
  });

  it('limita el panel del Jefe de Turno a su área y turno', async () => {
    const storage = await setup();
    seedCafeteria(storage);
    changeRole('supervisor');
    expect(qs('global-goal-card').hidden).toBe(true);
    expect(qs('document-form').closest('section').hidden).toBe(true);
    expect(qs('stat-documents').textContent).toBe('0');

    qs('role-area').value = 'Barra';
    fire('role-area', 'change');
    qs('role-turn').value = 'Mañana';
    fire('role-turn', 'change');

    expect(qs('stat-documents').textContent).toBe('1');
    expect(qs('dashboard-activity').textContent).toContain('Calidad de café');
    expect(qs('dashboard-activity').textContent).not.toContain('Tiempo de espera');
    expect(qs('dashboard-activity').textContent).not.toContain('Higiene en cocina');
  });
});

describe('T020/T021 - protección de escritura y corrección', () => {
  it('bloquea el registro de mediciones a un Barista', async () => {
    const storage = await setup();
    const { ana } = seedCafeteria(storage);
    changeRole('barista');
    qs('role-worker').value = ana.entity_id;
    fire('role-worker', 'change');
    qs('document-entity').value = ana.entity_id;
    qs('productivity-period').value = '2026-04';
    qs('cf-indicador').value = 'Calidad de café';
    qs('cf-resultado').value = '80';
    const before = storage.loadDocuments().length;
    submit('document-form');
    expect(storage.loadDocuments()).toHaveLength(before);
    expect(qs('storage-error').textContent).toContain('no está permitida');
  });

  it('bloquea corregir mediciones si el Jefe de Turno no completó área y turno', async () => {
    const storage = await setup();
    seedCafeteria(storage);
    changeRole('supervisor');
    qs('document-entity').value = storage.loadEntities()[0].entity_id;
    qs('productivity-period').value = '2026-04';
    qs('cf-indicador').value = 'Calidad de café';
    qs('cf-resultado').value = '80';
    const before = storage.loadDocuments().length;
    submit('document-form');
    expect(storage.loadDocuments()).toHaveLength(before);
    expect(qs('storage-error').textContent).toContain('área de trabajo y turno');
  });
});

describe('T028/T029 - metas globales por rol', () => {
  it('permite al administrador guardar una meta global', async () => {
    const storage = await setup();
    qs('gg-area').value = 'Barra';
    qs('gg-period').value = '2026-06';
    qs('gg-meta').value = '90';
    submit('global-goal-form');
    expect(storage.loadGlobalGoals()).toHaveLength(1);
    expect(storage.loadGlobalGoals()[0]).toMatchObject({ area: 'Barra', periodo: '2026-06', metaGlobal: 90 });
  });
});

describe('T041 - ayudas para estados especiales', () => {
  it('explica estados vacío, parcial, no autorizado y contexto incompleto', async () => {
    const storage = await setup();
    seedCafeteria(storage);
    qs('nav-dashboard').click();
    expect(qs('partial-data-notice').hidden).toBe(false);
    expect(qs('partial-data-notice').textContent).toContain('no se completó el conjunto simulado');

    changeRole('supervisor');
    expect(qs('incomplete-context-notice').hidden).toBe(false);
    expect(HELP_TEXT['state-incomplete-context']).toContain('área de trabajo y turno');

    changeRole('barista');
    submit('global-goal-form');
    expect(qs('storage-error').textContent).toContain('no está permitida');
    expect(HELP_TEXT['state-unauthorized']).toContain('no permite esta acción');

    expect(HELP_TEXT['state-empty']).toContain('Todavía no hay datos');
    expect(HELP_TEXT['fictitious-data']).toContain('No ingreses datos personales');
  });
});

describe('T040-T043 - ayudas contextuales', () => {
  it('muestra ayuda visible y accesible en los controles principales', async () => {
    await setup();
    const helped = [...document.querySelectorAll('[data-help]')];
    expect(helped.length).toBeGreaterThanOrEqual(10);
    helped.forEach(node => {
      expect(node.getAttribute('title')).toBeTruthy();
      expect(node.nextElementSibling?.classList.contains('help-text')).toBe(true);
    });
    expect(qs('role-select').nextElementSibling.textContent).toContain('demostrativo');
    expect(qs('document-form').nextElementSibling.textContent).toContain('evaluación');
  });
});
