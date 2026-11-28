import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  addDepartment, addEntity, addDepartmentAssignment, addDocument,
  loadEntities, loadDocuments, ROLE_STORAGE_KEY
} from '../../src/storage.js';
import { RRHH_CONFIG, setActiveConfig } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }
function change(id, value){
  qs(id).value = value;
  qs(id).dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}
function submit(id){ qs(id).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); }
function selectRole(role){ change('role-select', role); }
function storageSnapshot(){
  return {
    entities: localStorage.getItem('erp_base_module:entities'),
    documents: localStorage.getItem('erp_base_module:documents'),
    assignments: localStorage.getItem('erp_base_module:historial_departamentos')
  };
}

function seedCafeteria(){
  const barra = addDepartment({ nombre: 'Barra' });
  const cocina = addDepartment({ nombre: 'Cocina' });
  const ana = addEntity({
    name: 'Ana Torres',
    code: 'W-001',
    cargo: 'Barista',
    fechaIngreso: '2026-01-01',
    estadoLaboral: 'Activo'
  });
  const bruno = addEntity({
    name: 'Bruno Ruiz',
    code: 'W-002',
    cargo: 'Cocinero',
    fechaIngreso: '2026-01-01',
    estadoLaboral: 'Activo'
  });
  const anaBarra = addDepartmentAssignment({
    entity_id: ana.entity_id,
    id_departamento: barra.id_departamento,
    fecha_inicio: '2026-01-01'
  });
  const brunoCocina = addDepartmentAssignment({
    entity_id: bruno.entity_id,
    id_departamento: cocina.id_departamento,
    fecha_inicio: '2026-01-01'
  });
  addDocument({
    entityId: ana.entity_id,
    period: '2026-03',
    indicador: 'Calidad de café',
    resultado: '8',
    unidad: 'puntos',
    asignacionId: anaBarra.id_historial,
    turno: 'Mañana',
    meta: '10'
  });
  addDocument({
    entityId: ana.entity_id,
    period: '2026-04',
    indicador: 'Calidad de café',
    resultado: '9',
    unidad: 'puntos',
    asignacionId: anaBarra.id_historial,
    turno: 'Tarde',
    meta: '10'
  });
  addDocument({
    entityId: bruno.entity_id,
    period: '2026-03',
    indicador: 'Higiene en cocina',
    resultado: '7',
    unidad: 'puntos',
    asignacionId: brunoCocina.id_historial,
    turno: 'Mañana',
    meta: '9'
  });
  return { barra, cocina, ana, bruno, anaBarra, brunoCocina };
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
  setActiveConfig(RRHH_CONFIG);
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot(RRHH_CONFIG, { skipDemoSeed: true });
});

afterEach(() => {
  dom.window.close();
});

describe('T112 - integración del control de acceso por rol', () => {
  it('muestra el selector con tres roles y usa administrador por defecto', () => {
    expect(qs('role-select').hidden).toBe(false);
    expect([...qs('role-select').options].map(option => option.value)).toEqual([
      'administrador', 'supervisor', 'barista'
    ]);
    expect(qs('role-select').value).toBe('administrador');
    expect(qs('nav-entities').hidden).toBe(false);
    expect(qs('nav-documents').hidden).toBe(false);
    expect(qs('global-goal-card').hidden).toBe(false);
  });

  it('limita navegación y formularios del supervisor y exige área y turno', () => {
    selectRole('supervisor');

    expect(qs('role-area').hidden).toBe(false);
    expect(qs('role-turn').hidden).toBe(false);
    expect(qs('role-worker').hidden).toBe(true);
    expect(qs('nav-documents').hidden).toBe(false);
    expect(qs('nav-history').hidden).toBe(false);
    expect(qs('nav-evolution').hidden).toBe(false);
    expect(qs('nav-entities').hidden).toBe(true);
    expect(qs('nav-departments').hidden).toBe(true);
    expect(qs('nav-assignments').hidden).toBe(true);
    expect(qs('nav-search').hidden).toBe(true);
    expect(qs('entity-form').closest('section').hidden).toBe(true);
    expect(qs('global-goal-card').hidden).toBe(true);
    expect(qs('delete-document').hidden).toBe(true);
  });

  it('muestra al supervisor solo mediciones de su área y turno', () => {
    const { ana } = seedCafeteria();
    selectRole('supervisor');
    qs('nav-history').click();
    expect(qs('history-body').textContent).not.toContain('Calidad de café');

    change('role-area', 'Barra');
    change('role-turn', 'Mañana');
    change('history-entity', ana.entity_id);

    expect(qs('history-body').textContent).toContain('Calidad de café');
    expect(qs('history-body').textContent).toContain('2026-03');
    expect(qs('history-body').textContent).not.toContain('2026-04');
    expect(qs('history-body').textContent).not.toContain('Higiene en cocina');
  });

  it('bloquea intentos de gestión del supervisor sin guardar cambios', () => {
    const before = storageSnapshot();
    selectRole('supervisor');
    change('role-area', 'Barra');
    change('role-turn', 'Mañana');

    submit('entity-form');
    submit('department-form');
    submit('assignment-form');
    
    expect(storageSnapshot()).toEqual(before);
    expect(qs('storage-error').hidden).toBe(false);
    expect(qs('storage-error').textContent).toContain('Jefe de Turno / Supervisor');
  });

  it('deja al barista en modo solo lectura con filtro individual', () => {
    const { ana } = seedCafeteria();
    selectRole('barista');

    expect(qs('role-worker').hidden).toBe(false);
    expect(qs('role-area').hidden).toBe(true);
    expect(qs('nav-history').hidden).toBe(false);
    expect(qs('nav-evolution').hidden).toBe(false);
    expect(qs('nav-documents').hidden).toBe(true);
    expect(qs('nav-entities').hidden).toBe(true);
    expect(qs('document-form').closest('section').hidden).toBe(true);
    expect(qs('global-goal-card').hidden).toBe(true);

    const ownOption = [...qs('role-worker').options].some(option => option.value === ana.entity_id && option.textContent === 'Ana Torres');
    expect(ownOption).toBe(true);

    change('role-worker', ana.entity_id);
    qs('nav-history').click();
    expect(qs('history-body').textContent).toContain('Calidad de café');

    const before = loadDocuments().length;
    submit('document-form');
    expect(loadDocuments()).toHaveLength(before);
    expect(qs('storage-error').textContent).toContain('Barista / Trabajador (Solo lectura)');
  });

  it('persiste el rol activo y no modifica datos de negocio al cambiarlo', () => {
    const { ana } = seedCafeteria();
    const before = storageSnapshot();

    selectRole('supervisor');
    change('role-area', 'Barra');
    change('role-turn', 'Mañana');
    selectRole('barista');
    change('role-worker', ana.entity_id);

    expect(storageSnapshot()).toEqual(before);
    expect(JSON.parse(localStorage.getItem(ROLE_STORAGE_KEY))).toMatchObject({
      rolActivo: 'barista',
      baristaEntityId: ana.entity_id
    });
      });
});
