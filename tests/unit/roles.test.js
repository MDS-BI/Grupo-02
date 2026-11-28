import { describe, it, expect, beforeEach } from 'vitest';
import { setActiveConfig, RRHH_CONFIG } from '../../src/module-config.js';
import {
  addDepartment, addEntity, addDepartmentAssignment
} from '../../src/storage.js';
import {
  ROLES, defaultRoleState, normalizeRoleState, saveRoleState, loadRoleState,
  allowedModules, canPerform, isSupervisorContextComplete, isBaristaContextComplete,
  isDocumentInScope, filterDocuments, assertCanEditDocument, scopeDescription, roleLabel
} from '../../src/roles.js';

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
});

function seedWorkers(){
  const barra = addDepartment({ nombre: 'Barra' });
  const cocina = addDepartment({ nombre: 'Cocina' });
  const ana = addEntity({
    name: 'Ana', surname: 'Torres', code: 'W-001', cargo: 'Barista',
    fechaIngreso: '2026-01-10', estadoLaboral: 'Activo', departamentoId: barra.id_departamento
  });
  const bruno = addEntity({
    name: 'Bruno', surname: 'Díaz', code: 'W-002', cargo: 'Cocinero',
    fechaIngreso: '2026-01-10', estadoLaboral: 'Activo', departamentoId: cocina.id_departamento
  });
  const anaAssignment = addDepartmentAssignment({
    entity_id: ana.entity_id, id_departamento: barra.id_departamento, fecha_inicio: '2026-01-10'
  });
  const brunoAssignment = addDepartmentAssignment({
    entity_id: bruno.entity_id, id_departamento: cocina.id_departamento, fecha_inicio: '2026-01-10'
  });
  return { barra, cocina, ana, bruno, anaAssignment, brunoAssignment };
}

describe('T015-T024 - control de acceso por rol', () => {
  it('usa administrador por defecto y persiste el estado normalizado', () => {
    const state = defaultRoleState();
    expect(state.rolActivo).toBe(ROLES.ADMINISTRADOR);
    expect(normalizeRoleState({ rolActivo: 'invalido', supervisorArea: 'Caja' })).toEqual(state);
    saveRoleState({ rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' });
    expect(loadRoleState().supervisorArea).toBe('Barra');
    expect(roleLabel(ROLES.SUPERVISOR)).toContain('Jefe de Turno');
  });

  it('limita módulos del supervisor y exige área y turno completos', () => {
    const state = { rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: '' };
    expect(allowedModules(state)).toEqual(['dashboard', 'documents', 'history', 'evolution']);
    expect(canPerform(state, 'measurement:write')).toBe(true);
    expect(isSupervisorContextComplete(state)).toBe(false);
    expect(scopeDescription(state)).toBe('Selecciona área y turno para ver datos');
    expect(isSupervisorContextComplete({ ...state, supervisorTurno: 'Tarde' })).toBe(true);
  });

  it('filtra mediciones del supervisor por área y turno', () => {
    const { ana } = seedWorkers();
    const state = { rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' };
    const documents = [
      { entity_id: ana.entity_id, area: 'Barra', turno: 'Mañana', resultado: 90 },
      { entity_id: ana.entity_id, area: 'Barra', turno: 'Tarde', resultado: 80 }
    ];
    expect(isDocumentInScope(state, documents[0], 'Barra')).toBe(true);
    expect(isDocumentInScope(state, documents[1], 'Barra')).toBe(false);
    expect(filterDocuments(state, documents, () => 'Barra')).toHaveLength(1);
  });

  it('deja al barista en modo solo lectura con su propio trabajador', () => {
    const { ana } = seedWorkers();
    const state = { rolActivo: ROLES.BARISTA, baristaEntityId: ana.entity_id };
    expect(allowedModules(state)).toEqual(['dashboard', 'history', 'evolution']);
    expect(canPerform(state, 'measurement:write')).toBe(false);
    expect(isBaristaContextComplete(state)).toBe(true);
    expect(isDocumentInScope(state, { entity_id: ana.entity_id }, 'Barra')).toBe(true);
    expect(isDocumentInScope(state, { entity_id: 'otro' }, 'Barra')).toBe(false);
    expect(scopeDescription(state, 'Ana Torres')).toBe('Solo Ana Torres');
  });

  it('impide registrar mediciones fuera del alcance del supervisor', () => {
    const { ana, bruno, anaAssignment, brunoAssignment } = seedWorkers();
    const dependencies = { assignments: [anaAssignment, brunoAssignment], departments: loadDepartmentsSafe() };
    const incomplete = { rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: '' };
    expect(() => assertCanEditDocument(incomplete, { asignacionId: anaAssignment.id_historial, turno: 'Mañana' }, dependencies)).toThrow('área de trabajo y el turno');

    const state = { rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' };
    expect(assertCanEditDocument(state, { asignacionId: anaAssignment.id_historial, turno: 'Mañana' }, dependencies)).toBe(true);
    expect(() => assertCanEditDocument(state, { asignacionId: brunoAssignment.id_historial, turno: 'Mañana' }, dependencies)).toThrow('área de trabajo');
    expect(() => assertCanEditDocument(state, { asignacionId: anaAssignment.id_historial, turno: 'Tarde' }, dependencies)).toThrow('turno');
    expect(ana.entity_id).not.toBe(bruno.entity_id);
  });
});

function loadDepartmentsSafe(){
  return JSON.parse(localStorage.getItem('erp_base_module:departamentos') || '[]');
}
