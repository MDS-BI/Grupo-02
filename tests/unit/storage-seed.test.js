import { describe, it, expect, beforeEach } from 'vitest';
import {
  ENTITIES_KEY,
  clearAll,
  loadEntities,
  loadDocuments,
  loadDepartments,
  loadDepartmentHistory,
  loadGlobalGoals,
  needsDemoSeed,
  seedDemoDataIfEmpty,
  loadDemoData,
  saveEntities,
  upsertGlobalGoal
} from '../../src/storage.js';
import { setActiveConfig, RRHH_CONFIG } from '../../src/module-config.js';
import { defaultRoleState, saveRoleState, ROLES } from '../../src/roles.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

beforeEach(() => {
  localStorage.clear();
  setActiveConfig(RRHH_CONFIG);
  saveRoleState(defaultRoleState());
});

describe('T004/T005/T006 - precarga automática de datos de cafetería', () => {
  it('detecta almacenamiento vacío y no sobrescribe datos existentes', () => {
    expect(needsDemoSeed()).toBe(true);
    saveEntities([{ entity_id: 'custom', name: 'Existente' }]);
    expect(needsDemoSeed()).toBe(false);
    expect(seedDemoDataIfEmpty()).toBeNull();
    expect(loadEntities().map(entity => entity.entity_id)).toEqual(['custom']);
  });

  it('precarga seis trabajadores, tres áreas, doce evaluaciones y dos períodos', () => {
    seedDemoDataIfEmpty();
    const entities = loadEntities();
    const departments = loadDepartments();
    const documents = loadDocuments();
    const periods = [...new Set(documents.map(document => document.startDate.slice(0, 7)))];

    expect(entities).toHaveLength(6);
    expect(loadDepartmentHistory()).toHaveLength(6);
    expect(documents).toHaveLength(12);
    expect(periods).toHaveLength(2);
    expect([...departments.map(department => department.nombre)].sort((a, b) => a.localeCompare(b, 'es'))).toEqual(['Barra', 'Cocina', 'Salón']);
  });

  it('usa solo nombres, cargos y terminología oficiales', () => {
    seedDemoDataIfEmpty();
    expect(loadEntities().map(entity => `${entity.name} ${entity.surname}`)).toEqual([
      'Camila Rojas', 'Ignacio Fuentes', 'Valentina Soto',
      'Matías Herrera', 'Javiera Muñoz', 'Rodrigo Silva'
    ]);
    expect(new Set(loadEntities().map(entity => entity.cargo))).toEqual(new Set([
      'Barista', 'Cajero', 'Mesero', 'Cocinero', 'Encargado'
    ]));
    expect(loadDepartments().map(department => department.nombre)).not.toContain('Caja');
    expect(loadDepartments().map(department => department.nombre)).not.toContain('Supervisión');
    expect(new Set(loadDocuments().map(document => document.turno))).toEqual(new Set(['Mañana', 'Tarde']));
  });

  it('reemplaza los datos solo con force y conserva el rol activo', () => {
    saveRoleState({ rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' });
    seedDemoDataIfEmpty();
    localStorage.setItem(ENTITIES_KEY, JSON.stringify([{ entity_id: 'temporal' }]));

    loadDemoData({ force: true });

    expect(loadEntities()).toHaveLength(6);
    expect(localStorage.getItem('erp_base_module:rol_activo')).toContain('supervisor');
  });

  it('bloquea metas globales para roles que no son administrador', () => {
    const goal = { area: 'Barra', periodo: '2026-06', metaGlobal: 90 };
    expect(upsertGlobalGoal(goal).metaGlobal).toBe(90);

    saveRoleState({ rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' });
    expect(() => upsertGlobalGoal({ ...goal, metaGlobal: 10 })).toThrow('Administrador');
    expect(loadGlobalGoals()).toHaveLength(1);
    expect(loadGlobalGoals()[0].metaGlobal).toBe(90);
  });
});
