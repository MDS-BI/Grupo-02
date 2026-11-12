import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAll, addDepartment, updateDepartment, loadDepartments, deleteDepartment,
  addEntity, loadEntities, deleteEntity, addDepartmentAssignment, loadDepartmentHistory,
  updateDepartmentAssignment, deleteDepartmentAssignment, changeDepartment,
  getCurrentAssignment, getAssignmentsForEntity, addDocument, updateDocument,
  loadDocuments, saveDocuments, validateDocument, findDuplicateProductivity,
  getProductivityHistory, getComparableMeasurements, inspectDocumentsForRRHH
} from '../../src/storage.js';
import { setActiveConfig, RRHH_CONFIG } from '../../src/module-config.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};

function seed(){
  const department = addDepartment({ nombre: 'Operaciones' });
  const worker = addEntity({
    name: 'Ana Torres', code: 'W-001', cargo: 'Analista',
    fechaIngreso: '2026-01-15', estadoLaboral: 'Activo',
    departamentoId: department.id_departamento
  });
  const assignment = addDepartmentAssignment({
    entity_id: worker.entity_id,
    id_departamento: department.id_departamento,
    fecha_inicio: '2026-01-15'
  });
  return { department, worker, assignment };
}

function productivity(overrides = {}){
  return {
    entityId: loadEntities()[0].entity_id,
    period: '2026-03',
    indicador: 'Pedidos procesados',
    resultado: 42,
    unidad: 'pedidos',
    ...overrides
  };
}

function localDate(offsetDays = 0){
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

beforeEach(() => {
  store.clear();
  setActiveConfig(RRHH_CONFIG);
});

describe('departamentos y asignaciones', () => {
  it('valida nombres de departamento normalizados y únicos', () => {
    addDepartment({ nombre: '  Operaciones  ' });
    expect(loadDepartments()[0].nombre).toBe('Operaciones');
    expect(() => addDepartment({ nombre: 'operaciones' })).toThrow(/existe/);
    expect(() => updateDepartment(loadDepartments()[0].id_departamento, { nombre: '' })).toThrow(/obligatorio/);
  });

  it('bloquea la eliminación de departamentos con trabajadores o historial', () => {
    const { department } = seed();
    expect(() => deleteDepartment(department.id_departamento)).toThrow(/asignaciones/);
  });

  it('impide superponer asignaciones y permite solo una vigente', () => {
    const { worker, department } = seed();
    expect(() => addDepartmentAssignment({
      entity_id: worker.entity_id,
      id_departamento: department.id_departamento,
      fecha_inicio: '2026-02-01'
    })).toThrow(/vigente|superpone/);
    expect(() => addDepartmentAssignment({
      entity_id: worker.entity_id,
      id_departamento: department.id_departamento,
      fecha_inicio: '2026-03-01',
      fecha_fin: '2026-02-01'
    })).toThrow(/anterior/);
  });

  it('cambia de departamento cerrando la asignación anterior y conservando el historial', () => {
    const { worker, department } = seed();
    const technology = addDepartment({ nombre: 'Tecnología' });
    changeDepartment(worker.entity_id, technology.id_departamento, '2026-04-01');

    const history = getAssignmentsForEntity(worker.entity_id);
    expect(history.length).toBe(2);
    expect(history[0].id_departamento).toBe(department.id_departamento);
    expect(history[0].fecha_fin).toBe('2026-03-31');
    expect(history[1].id_departamento).toBe(technology.id_departamento);
    expect(getCurrentAssignment(worker.entity_id).id_historial).toBe(history[1].id_historial);
    expect(loadEntities()[0].departamentoId).toBe(technology.id_departamento);
  });

  it('no considera vigente una asignación futura ni adelanta el departamento actual', () => {
    const today = localDate();
    const tomorrow = localDate(1);
    const department = addDepartment({ nombre: 'Operaciones' });
    const worker = addEntity({
      name: 'Ana Torres', code: 'W-FUTURE', cargo: 'Analista',
      fechaIngreso: today, estadoLaboral: 'Activo', departamentoId: department.id_departamento
    });
    const current = addDepartmentAssignment({
      entity_id: worker.entity_id, id_departamento: department.id_departamento, fecha_inicio: today
    });
    const nextDepartment = addDepartment({ nombre: 'Tecnología' });

    changeDepartment(worker.entity_id, nextDepartment.id_departamento, tomorrow);

    expect(getCurrentAssignment(worker.entity_id).id_historial).toBe(current.id_historial);
    expect(loadEntities().find(e => e.entity_id === worker.entity_id).departamentoId).toBe(department.id_departamento);

    const futureWorker = addEntity({
      name: 'Luis Soto', code: 'W-FUTURE-2', cargo: 'Analista',
      fechaIngreso: today, estadoLaboral: 'Activo', departamentoId: nextDepartment.id_departamento
    });
    addDepartmentAssignment({
      entity_id: futureWorker.entity_id, id_departamento: nextDepartment.id_departamento, fecha_inicio: tomorrow
    });
    expect(getCurrentAssignment(futureWorker.entity_id)).toBeNull();
  });

  it('rechaza cambios de asignación que dejan mediciones fuera del período', () => {
    const { worker, assignment } = seed();
    addDocument(productivity());
    expect(() => updateDepartmentAssignment(assignment.id_historial, { fecha_fin: '2026-02-28' })).toThrow(/mediciones/);
    expect(() => deleteDepartmentAssignment(assignment.id_historial)).toThrow(/mediciones/);
  });
});

describe('productividad', () => {
  it('valida período, indicador, resultado, unidad y asignación', () => {
    seed();
    expect(validateDocument(productivity({ period: '2099-01' })).errors.period).toMatch(/futuro/);
    expect(validateDocument(productivity({ period: '2025-12' })).errors.period).toMatch(/ingreso/);
    expect(validateDocument(productivity({ indicador: 'ab' })).errors.indicador).toMatch(/3 y 60/);
    expect(validateDocument(productivity({ resultado: -1 })).errors.resultado).toMatch(/cero/);
    expect(validateDocument(productivity({ unidad: '' })).errors.unidad).toMatch(/obligatoria/);
    expect(validateDocument(productivity({ asignacionId: 'no-existe' })).errors.asignacionId).toMatch(/no existe/);
  });

  it('genera folio automático y guarda el período como primer y último día del mes', () => {
    seed();
    const first = addDocument(productivity());
    const second = addDocument(productivity({ indicador: 'Llamadas atendidas', resultado: 7, unidad: 'llamadas' }));
    expect(first.folio).toBe(1);
    expect(second.folio).toBe(2);
    expect(first.startDate).toBe('2026-03-01');
    expect(first.endDate).toBe('2026-03-31');
    expect(first.totalAmount).toBeUndefined();
    expect(first.currency).toBeUndefined();
  });

  it('detecta duplicados y conserva el folio al corregir solo un registro', () => {
    seed();
    const doc = addDocument(productivity());
    expect(findDuplicateProductivity(productivity()).length).toBe(1);
    const updated = updateDocument(doc.id, { resultado: 50 });
    expect(updated.folio).toBe(doc.folio);
    expect(loadDocuments().length).toBe(1);
    expect(loadDocuments()[0].resultado).toBe(50);
  });

  it('exige selección explícita cuando hay dos asignaciones en el mes', () => {
    const { worker } = seed();
    const technology = addDepartment({ nombre: 'Tecnología' });
    changeDepartment(worker.entity_id, technology.id_departamento, '2026-03-16');
    const assignments = getAssignmentsForEntity(worker.entity_id);
    expect(validateDocument(productivity()).errors.asignacionId).toMatch(/Selecciona/);
    expect(validateDocument(productivity({ asignacionId: assignments[1].id_historial })).valid).toBe(true);
  });

  it('muestra el departamento histórico de cada medición y filtra mediciones comparables', () => {
    const { worker } = seed();
    addDocument(productivity());
    addDocument(productivity({ period: '2026-04', resultado: 50 }));
    addDocument(productivity({ period: '2026-05', indicador: 'Llamadas', resultado: 8, unidad: 'llamadas' }));

    const history = getProductivityHistory(worker.entity_id);
    expect(history.length).toBe(3);
    expect(history[0].departamento).toBe('Operaciones');
    const comparable = getComparableMeasurements(worker.entity_id, 'pedidos procesados', 'PEDIDOS');
    expect(comparable.length).toBe(2);
    expect(comparable.map(d => d.resultado)).toEqual([42, 50]);
  });

  it('bloquea eliminaciones de trabajadores con historial', () => {
    const { worker } = seed();
    addDocument(productivity());
    expect(() => deleteEntity(worker.id)).toThrow(/históricos/);
  });

  it('bloquea guardar productividad si existen documentos incompatibles', () => {
    seed();
    saveDocuments([{ id: 'legacy', entity_id: loadEntities()[0].entity_id, startDate: '2026-01-01', endDate: '2026-01-31' }]);
    expect(inspectDocumentsForRRHH().compatible).toBe(false);
    expect(() => addDocument(productivity())).toThrow(/incompatible/);
  });
});
