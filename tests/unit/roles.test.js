import { describe, it, expect, beforeEach } from 'vitest';
import {
  ROLE_STORAGE_KEY,
  ROLES,
  ROLE_OPTIONS,
  AREAS,
  TURNOS,
  defaultRoleState,
  normalizeRoleState,
  loadRoleState,
  saveRoleState,
  roleLabel,
  allowedModules,
  canPerform,
  isSupervisorContextComplete,
  isBaristaContextComplete,
  isEntityInScope,
  filterEntities,
  isDocumentInScope,
  filterDocuments,
  isAssignmentInScope
} from '../../src/roles.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

beforeEach(() => {
  store.clear();
});

describe('T106 - estado de rol activo', () => {
  it('ofrece exactamente tres roles con las etiquetas definidas', () => {
    expect(ROLE_OPTIONS.map(option => option.value)).toEqual([
      ROLES.ADMINISTRADOR,
      ROLES.SUPERVISOR,
      ROLES.BARISTA
    ]);
    expect(ROLE_OPTIONS.map(option => option.label)).toEqual([
      'Administrador / Gerente de Cafetería',
      'Jefe de Turno / Supervisor',
      'Barista / Trabajador (Solo lectura)'
    ]);
    expect(roleLabel(ROLES.SUPERVISOR)).toBe('Jefe de Turno / Supervisor');
    expect(AREAS).toEqual(['Barra', 'Cocina', 'Salón']);
    expect(TURNOS).toEqual(['Mañana', 'Tarde']);
  });

  it('usa administrador como valor predeterminado y corrige valores inválidos', () => {
    expect(defaultRoleState()).toEqual({
      rolActivo: ROLES.ADMINISTRADOR,
      supervisorArea: '',
      supervisorTurno: '',
      baristaEntityId: ''
    });
    expect(normalizeRoleState(null).rolActivo).toBe(ROLES.ADMINISTRADOR);
    expect(normalizeRoleState({ rolActivo: 'direccion' }).rolActivo).toBe(ROLES.ADMINISTRADOR);
    expect(normalizeRoleState({ rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' }))
      .toMatchObject({ rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' });
  });

  it('persiste el rol en su propia clave sin alterar datos de negocio', () => {
    store.set('erp_base_module:entities', JSON.stringify([{ entity_id: 'w-1' }]));
    const state = { rolActivo: ROLES.BARISTA, baristaEntityId: 'w-1' };
    saveRoleState(state);

    expect(store.has(ROLE_STORAGE_KEY)).toBe(true);
    expect(loadRoleState()).toMatchObject(state);
    expect(JSON.parse(store.get('erp_base_module:entities'))).toEqual([{ entity_id: 'w-1' }]);
  });

  it('recupera el estado predeterminado si la persistencia está dañada', () => {
    store.set(ROLE_STORAGE_KEY, '{no-es-json');
    expect(loadRoleState()).toEqual(defaultRoleState());
  });

  it('limita permisos de escritura según el rol', () => {
    const admin = normalizeRoleState({ rolActivo: ROLES.ADMINISTRADOR });
    const supervisor = normalizeRoleState({ rolActivo: ROLES.SUPERVISOR });
    const barista = normalizeRoleState({ rolActivo: ROLES.BARISTA });
    const actions = ['entity:write', 'department:write', 'assignment:write', 'global-goal:write', 'measurement:write'];

    expect(actions.every(action => canPerform(admin, action))).toBe(true);
    expect(actions.filter(action => canPerform(supervisor, action))).toEqual(['measurement:write']);
    expect(actions.some(action => canPerform(barista, action))).toBe(false);
  });

  it('define las vistas permitidas para cada rol', () => {
    expect(allowedModules(normalizeRoleState({ rolActivo: ROLES.ADMINISTRADOR }))).toEqual([
      'dashboard', 'entities', 'departments', 'assignments', 'documents', 'history', 'evolution', 'search'
    ]);
    expect(allowedModules(normalizeRoleState({ rolActivo: ROLES.SUPERVISOR }))).toEqual([
      'documents', 'history', 'evolution'
    ]);
    expect(allowedModules(normalizeRoleState({ rolActivo: ROLES.BARISTA }))).toEqual([
      'history', 'evolution'
    ]);
  });
});

describe('T107 - derivación del alcance de datos', () => {
  const departments = [
    { id_departamento: 'barra', nombre: 'Barra' },
    { id_departamento: 'cocina', nombre: 'Cocina' }
  ];
  const assignments = [
    { id_historial: 'a-1', entity_id: 'w-1', id_departamento: 'barra' },
    { id_historial: 'a-2', entity_id: 'w-2', id_departamento: 'cocina' }
  ];
  const entities = [
    { entity_id: 'w-1', name: 'Ana' },
    { entity_id: 'w-2', name: 'Bruno' }
  ];
  const documents = [
    { id: 'd-1', entity_id: 'w-1', asignacionId: 'a-1', turno: 'Mañana' },
    { id: 'd-2', entity_id: 'w-1', asignacionId: 'a-1', turno: 'Tarde' },
    { id: 'd-3', entity_id: 'w-2', asignacionId: 'a-2', turno: 'Mañana' }
  ];
  const resolveDepartment = (doc) => departments.find(d => d.id_departamento === assignments.find(a => a.id_historial === doc.asignacionId)?.id_departamento)?.nombre || '';

  it('exige contexto explícito para supervisor y barista', () => {
    expect(isSupervisorContextComplete(normalizeRoleState({ rolActivo: ROLES.SUPERVISOR }))).toBe(false);
    expect(isSupervisorContextComplete(normalizeRoleState({
      rolActivo: ROLES.SUPERVISOR,
      supervisorArea: 'Barra',
      supervisorTurno: 'Mañana'
    }))).toBe(true);
    expect(isBaristaContextComplete(normalizeRoleState({ rolActivo: ROLES.BARISTA }))).toBe(false);
    expect(isBaristaContextComplete(normalizeRoleState({ rolActivo: ROLES.BARISTA, baristaEntityId: 'w-1' }))).toBe(true);
  });

  it('filtra trabajadores por área histórica del supervisor y por trabajador propio del barista', () => {
    const supervisor = normalizeRoleState({ rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' });
    const barista = normalizeRoleState({ rolActivo: ROLES.BARISTA, baristaEntityId: 'w-1' });

    expect(filterEntities(supervisor, entities, assignments, departments).map(e => e.entity_id)).toEqual(['w-1']);
    expect(filterEntities(barista, entities, assignments, departments).map(e => e.entity_id)).toEqual(['w-1']);
    expect(isAssignmentInScope(supervisor, assignments[1], departments)).toBe(false);
    expect(isAssignmentInScope(supervisor, assignments[0], departments)).toBe(true);
  });

  it('filtra mediciones por área y turno para supervisor y por trabajador para barista', () => {
    const supervisor = normalizeRoleState({ rolActivo: ROLES.SUPERVISOR, supervisorArea: 'Barra', supervisorTurno: 'Mañana' });
    const barista = normalizeRoleState({ rolActivo: ROLES.BARISTA, baristaEntityId: 'w-1' });
    const admin = normalizeRoleState({ rolActivo: ROLES.ADMINISTRADOR });

    expect(filterDocuments(supervisor, documents, resolveDepartment).map(d => d.id)).toEqual(['d-1']);
    expect(filterDocuments(barista, documents, resolveDepartment).map(d => d.id)).toEqual(['d-1', 'd-2']);
    expect(filterDocuments(admin, documents, resolveDepartment)).toHaveLength(3);
    expect(isDocumentInScope(normalizeRoleState({ rolActivo: ROLES.SUPERVISOR }), documents[0], 'Barra')).toBe(false);
  });
});
