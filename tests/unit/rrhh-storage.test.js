import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearAll, addDepartment, updateDepartment, loadDepartments, deleteDepartment,
  addEntity, loadEntities, deleteEntity, addDepartmentAssignment, loadDepartmentHistory,
  updateDepartmentAssignment, deleteDepartmentAssignment, changeDepartment,
  getCurrentAssignment, getAssignmentsForEntity, addDocument, updateDocument,
  loadDocuments, saveDocuments, validateDocument, findDuplicateProductivity,
  getProductivityHistory, getComparableMeasurements, inspectDocumentsForRRHH,
  calcularMetasConsolidadas, loadMetasConsolidadas, saveMetasConsolidadas,
  getDepartmentForAssignment, deleteDocument
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
    expect(() => updateDepartmentAssignment(assignment.id_historial, { fecha_fin: '2026-02-28' })).toThrow(/evaluaciones/);
    expect(() => deleteDepartmentAssignment(assignment.id_historial)).toThrow(/evaluaciones/);
  });
});

describe('productividad', () => {
  it('valida período, indicador, resultado y asignación (unidad es opcional)', () => {
    seed();
    expect(validateDocument(productivity({ period: '2099-01' })).errors.period).toMatch(/futuro/);
    expect(validateDocument(productivity({ period: '2025-12' })).errors.period).toMatch(/ingreso/);
    expect(validateDocument(productivity({ indicador: 'ab' })).errors.indicador).toMatch(/3 y 60/);
    expect(validateDocument(productivity({ resultado: -1 })).errors.resultado).toMatch(/cero/);
    // Unidad ya no es obligatoria: campo vacío no genera error
    expect(validateDocument(productivity({ unidad: '' })).errors.unidad).toBeUndefined();
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
    expect(() => deleteEntity(worker.id)).toThrow(/históricas/);
  });

  it('bloquea guardar productividad si existen documentos incompatibles', () => {
    seed();
    saveDocuments([{ id: 'legacy', entity_id: loadEntities()[0].entity_id, startDate: '2026-01-01', endDate: '2026-01-31' }]);
    expect(inspectDocumentsForRRHH().compatible).toBe(false);
    expect(() => addDocument(productivity())).toThrow(/incompatible/);
  });

  it('valida turno, meta y evaluaciones cualitativas', () => {
    seed();
    const base = productivity();
    expect(validateDocument({ ...base, turno: 'Noche' }).errors.turno).toMatch(/Mañana o Tarde/);
    expect(validateDocument({ ...base, meta: -5 }).errors.meta).toMatch(/cero/);
    expect(validateDocument({ ...base, evaluacionCalidad: 0 }).errors.evaluacionCalidad).toMatch(/1 y 5/);
    expect(validateDocument({ ...base, evaluacionCalidad: 6 }).errors.evaluacionCalidad).toMatch(/1 y 5/);
    expect(validateDocument({ ...base, evaluacionResponsabilidad: 3.5 }).errors.evaluacionResponsabilidad).toMatch(/entero/);
    expect(validateDocument({ ...base, evaluacionCumplimiento: 'abc' }).errors.evaluacionCumplimiento).toMatch(/1 y 5/);
    expect(validateDocument({ ...base, evaluacionColaboracion: 5 }).valid).toBe(true);
  });

  it('guarda y lee todos los nuevos campos de productividad', () => {
    seed();
    const doc = addDocument({
      ...productivity(),
      turno: 'Mañana',
      meta: 100,
      evaluacionCalidad: 4,
      evaluacionResponsabilidad: 5,
      evaluacionCumplimiento: 3,
      evaluacionColaboracion: 4,
      observaciones: 'Buen desempeño en la atención.',
      oportunidadesMejora: 'Acelerar tiempos de preparación.'
    });
    expect(doc.turno).toBe('Mañana');
    expect(doc.meta).toBe(100);
    expect(doc.evaluacionCalidad).toBe(4);
    expect(doc.evaluacionResponsabilidad).toBe(5);
    expect(doc.evaluacionCumplimiento).toBe(3);
    expect(doc.evaluacionColaboracion).toBe(4);
    expect(doc.observaciones).toBe('Buen desempeño en la atención.');
    expect(doc.oportunidadesMejora).toBe('Acelerar tiempos de preparación.');

    const history = getProductivityHistory(loadEntities()[0].entity_id);
    const saved = history.find(h => h.id === doc.id);
    expect(saved.turno).toBe('Mañana');
    expect(saved.meta).toBe(100);
    expect(saved.evaluacionCalidad).toBe(4);
    expect(saved.observaciones).toBe('Buen desempeño en la atención.');
    expect(saved.oportunidadesMejora).toBe('Acelerar tiempos de preparación.');
  });

  it('mantiene compatibilidad con documentos antiguos sin los nuevos campos', () => {
    seed();
    const oldDoc = addDocument(productivity());
    expect(oldDoc.turno).toBeUndefined();
    expect(oldDoc.meta).toBeUndefined();
    expect(oldDoc.evaluacionCalidad).toBeUndefined();

    const history = getProductivityHistory(loadEntities()[0].entity_id);
    const saved = history.find(h => h.id === oldDoc.id);
    expect(saved.turno).toBeUndefined();
    expect(saved.meta).toBeUndefined();
    expect(saved.resultado).toBe(42);
    expect(saved.indicador).toBe('Pedidos procesados');
  });

  it('actualiza solo los campos proporcionados al corregir un registro', () => {
    seed();
    const doc = addDocument({
      ...productivity(),
      turno: 'Tarde',
      meta: 50,
      evaluacionCalidad: 3,
      evaluacionResponsabilidad: 3,
      evaluacionCumplimiento: 3,
      evaluacionColaboracion: 3
    });
    const updated = updateDocument(doc.id, { resultado: 90, turno: 'Mañana' });
    expect(updated.resultado).toBe(90);
    expect(updated.turno).toBe('Mañana');
    expect(updated.meta).toBe(50);
    expect(updated.evaluacionCalidad).toBe(3);
  });

  it('crea y guarda un registro sin unidad ni notes (campos eliminados del formulario)', () => {
    seed();
    const doc = addDocument({
      ...productivity(),
      unidad: undefined,
      notes: undefined,
      turno: 'Mañana',
      meta: 100,
      observaciones: 'Sin unidad ni notas.'
    });
    expect(doc.unidad).toBeUndefined();
    expect(doc.notes).toBeUndefined();
    expect(doc.observaciones).toBe('Sin unidad ni notas.');

    const history = getProductivityHistory(loadEntities()[0].entity_id);
    const saved = history.find(h => h.id === doc.id);
    expect(saved.unidad).toBeUndefined();
    expect(saved.notes).toBeUndefined();
    expect(saved.observaciones).toBe('Sin unidad ni notas.');
  });
});

describe('metas consolidadas por departamento y período', () => {
  function seedCafe(){
    clearAll();
    setActiveConfig(RRHH_CONFIG);

    const deptCafe = addDepartment({ nombre: 'Team cafe' });
    const deptJefatura = addDepartment({ nombre: 'Jefatura' });

    const daniela = addEntity({
      name: 'Daniela', code: 'W-001', cargo: 'Barista',
      fechaIngreso: '2026-01-15', estadoLaboral: 'Activo',
      departamentoId: deptCafe.id_departamento
    });
    const bruno = addEntity({
      name: 'Bruno', code: 'W-002', cargo: 'Cajero',
      fechaIngreso: '2026-01-15', estadoLaboral: 'Activo',
      departamentoId: deptJefatura.id_departamento
    });

    const asignacionDaniela = addDepartmentAssignment({
      entity_id: daniela.entity_id,
      id_departamento: deptCafe.id_departamento,
      fecha_inicio: '2026-01-15'
    });
    const asignacionBruno = addDepartmentAssignment({
      entity_id: bruno.entity_id,
      id_departamento: deptJefatura.id_departamento,
      fecha_inicio: '2026-01-15'
    });

    return { deptCafe, deptJefatura, daniela, bruno, asignacionDaniela, asignacionBruno };
  }

  function addProductividad(entityId, asignacionId, periodo, meta, indicador = 'Calidad de café', resultado = 50){
    const [year, month] = periodo.split('-').map(Number);
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return addDocument({
      entityId,
      period: periodo,
      indicador,
      resultado,
      unidad: 'puntos',
      asignacionId,
      turno: 'Mañana',
      meta,
      evaluacionCalidad: 4,
      evaluacionResponsabilidad: 4,
      evaluacionCumplimiento: 4,
      evaluacionColaboracion: 4,
      startDate: `${periodo}-01`,
      endDate: `${periodo}-${String(lastDay).padStart(2, '0')}`
    });
  }

  it('suma metas de dos trabajadores del mismo departamento y período', () => {
    const { deptCafe, daniela, bruno, asignacionDaniela } = seedCafe();

    // Mover a Bruno a Team cafe para noviembre (cierra su asignación en Jefatura)
    changeDepartment(bruno.entity_id, deptCafe.id_departamento, '2026-11-01');
    const asignacionBrunoCafe = getCurrentAssignment(bruno.entity_id);

    // Ambos registros en noviembre, que está cubierto por las asignaciones vigentes
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-11', 100);
    addProductividad(bruno.entity_id, asignacionBrunoCafe.id_historial, '2026-11', 120);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-11');
    expect(grupo).toBeDefined();
    expect(grupo.metaConsolidada).toBe(220);
  });

  it('no comparte suma entre departamentos diferentes', () => {
    const { deptCafe, deptJefatura, daniela, bruno, asignacionDaniela, asignacionBruno } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);
    addProductividad(bruno.entity_id, asignacionBruno.id_historial, '2026-10', 80);

    const metas = loadMetasConsolidadas();
    const cafe = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const jefatura = metas.find(m => m.departamentoId === deptJefatura.id_departamento && m.periodo === '2026-10');
    expect(cafe.metaConsolidada).toBe(100);
    expect(jefatura.metaConsolidada).toBe(80);
  });

  it('genera variables separadas para el mismo departamento en meses diferentes', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-11', 150);

    const metas = loadMetasConsolidadas();
    const oct = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const nov = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-11');
    expect(oct.metaConsolidada).toBe(100);
    expect(nov.metaConsolidada).toBe(150);
  });

  it('un trabajador con varios registros contribuye a cada grupo correspondiente', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 50);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo.metaConsolidada).toBe(150);
  });

  it('actualiza la suma al crear un nuevo registro', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);
    let metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.metaConsolidada).toBe(100);

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 50);
    metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.metaConsolidada).toBe(150);
  });

  it('actualiza la suma al modificar una meta individual', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    const doc = addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 120);
    let metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.metaConsolidada).toBe(120);

    const updated = updateDocument(doc.id, { meta: 200 });
    expect(updated.meta).toBe(200);

    metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.metaConsolidada).toBe(200);
  });

  it('actualiza los grupos anterior y nuevo al cambiar de departamento', () => {
    const { deptCafe, deptJefatura, daniela, asignacionDaniela } = seedCafe();

    // Registro en Team cafe para octubre (departamento histórico)
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);

    // Cambiar de departamento a partir de noviembre (sin conflicto con registro de octubre)
    changeDepartment(daniela.entity_id, deptJefatura.id_departamento, '2026-11-01');
    const nuevaAsignacion = getCurrentAssignment(daniela.entity_id);

    // Nuevo registro en Jefatura para noviembre
    addProductividad(daniela.entity_id, nuevaAsignacion.id_historial, '2026-11', 50);

    const metas = loadMetasConsolidadas();
    const cafe = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const jefatura = metas.find(m => m.departamentoId === deptJefatura.id_departamento && m.periodo === '2026-11');
    expect(cafe.metaConsolidada).toBe(100);
    expect(jefatura.metaConsolidada).toBe(50);
  });

  it('actualiza los grupos al cambiar de período', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);

    const doc = loadDocuments()[0];
    const updated = updateDocument(doc.id, { period: '2026-11', startDate: '2026-11-01', endDate: '2026-11-30' });

    const metas = loadMetasConsolidadas();
    const oct = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const nov = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-11');
    expect(oct).toBeUndefined();
    expect(nov.metaConsolidada).toBe(100);
  });

  it('recalcula al eliminar un registro', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 50);

    const docs = loadDocuments();
    deleteDocument(docs[0].id);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo.metaConsolidada).toBe(50);
  });

  it('elimina el grupo consolidado si queda sin registros', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    const doc = addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);
    deleteDocument(doc.id);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo).toBeUndefined();
    expect(metas.length).toBe(0);
  });

  it('es idempotente: ejecutar varias veces produce el mismo resultado', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);

    const primera = calcularMetasConsolidadas();
    const segunda = calcularMetasConsolidadas();
    const tercera = calcularMetasConsolidadas();

    expect(primera).toEqual(segunda);
    expect(segunda).toEqual(tercera);
    expect(primera[0].metaConsolidada).toBe(100);
  });

  it('persiste los resultados en localStorage tras recalcular', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);

    const metas = loadMetasConsolidadas();
    expect(metas.length).toBe(1);
    expect(metas[0].metaConsolidada).toBe(100);
    expect(metas[0].departamentoId).toBe(deptCafe.id_departamento);
    expect(metas[0].periodo).toBe('2026-10');
    expect(metas[0].departamentoNombre).toBe('Team cafe');
  });

  it('no altera los registros individuales de productividad', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    const doc = addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100);
    const docsAntes = loadDocuments();
    calcularMetasConsolidadas();
    const docsDespues = loadDocuments();

    expect(docsDespues.length).toBe(docsAntes.length);
    expect(docsDespues[0].meta).toBe(docsAntes[0].meta);
    expect(docsDespues[0].resultado).toBe(docsAntes[0].resultado);
  });

  it('crea grupo con meta 0 cuando solo hay resultado válido', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    // Meta undefined, pero resultado por defecto es 50 (válido)
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', undefined);

    const metas = loadMetasConsolidadas();
    expect(metas.length).toBe(1);
    expect(metas[0].metaConsolidada).toBe(0);
    expect(metas[0].resultadoConsolidado).toBe(50);
  });

  // --- Pruebas para Resultado consolidado ---

  it('suma resultados de dos trabajadores del mismo departamento y período', () => {
    const { deptCafe, daniela, bruno, asignacionDaniela } = seedCafe();

    changeDepartment(bruno.entity_id, deptCafe.id_departamento, '2026-11-01');
    const asignacionBrunoCafe = getCurrentAssignment(bruno.entity_id);

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-11', 100, undefined, 90);
    addProductividad(bruno.entity_id, asignacionBrunoCafe.id_historial, '2026-11', 120, undefined, 110);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-11');
    expect(grupo).toBeDefined();
    expect(grupo.metaConsolidada).toBe(220);
    expect(grupo.resultadoConsolidado).toBe(200);
  });

  it('no comparte resultado entre departamentos diferentes', () => {
    const { deptCafe, deptJefatura, daniela, bruno, asignacionDaniela, asignacionBruno } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);
    addProductividad(bruno.entity_id, asignacionBruno.id_historial, '2026-10', 80, undefined, 70);

    const metas = loadMetasConsolidadas();
    const cafe = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const jefatura = metas.find(m => m.departamentoId === deptJefatura.id_departamento && m.periodo === '2026-10');
    expect(cafe.metaConsolidada).toBe(100);
    expect(cafe.resultadoConsolidado).toBe(90);
    expect(jefatura.metaConsolidada).toBe(80);
    expect(jefatura.resultadoConsolidado).toBe(70);
  });

  it('genera variables separadas para el mismo departamento en meses diferentes', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-11', 150, undefined, 140);

    const metas = loadMetasConsolidadas();
    const oct = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const nov = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-11');
    expect(oct.metaConsolidada).toBe(100);
    expect(oct.resultadoConsolidado).toBe(90);
    expect(nov.metaConsolidada).toBe(150);
    expect(nov.resultadoConsolidado).toBe(140);
  });

  it('un trabajador con varios registros contribuye a cada grupo correspondiente', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 50, undefined, 40);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo.metaConsolidada).toBe(150);
    expect(grupo.resultadoConsolidado).toBe(130);
  });

  it('actualiza el resultado al crear un nuevo registro', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);
    let metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.resultadoConsolidado).toBe(90);

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 50, undefined, 40);
    metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.resultadoConsolidado).toBe(130);
  });

  it('actualiza solo el resultado consolidado al modificar únicamente el resultado individual', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    const doc = addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 120, undefined, 80);
    let metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.metaConsolidada).toBe(120);
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.resultadoConsolidado).toBe(80);

    const updated = updateDocument(doc.id, { resultado: 150 });
    expect(updated.resultado).toBe(150);

    metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo.metaConsolidada).toBe(120);
    expect(grupo.resultadoConsolidado).toBe(150);
  });

  it('actualiza solo la meta consolidada al modificar únicamente la meta individual', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    const doc = addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 120, undefined, 80);
    let metas = loadMetasConsolidadas();
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.metaConsolidada).toBe(120);
    expect(metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10')?.resultadoConsolidado).toBe(80);

    const updated = updateDocument(doc.id, { meta: 200 });
    expect(updated.meta).toBe(200);

    metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo.metaConsolidada).toBe(200);
    expect(grupo.resultadoConsolidado).toBe(80);
  });

  it('actualiza ambos grupos al cambiar de departamento', () => {
    const { deptCafe, deptJefatura, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);

    changeDepartment(daniela.entity_id, deptJefatura.id_departamento, '2026-11-01');
    const nuevaAsignacion = getCurrentAssignment(daniela.entity_id);

    addProductividad(daniela.entity_id, nuevaAsignacion.id_historial, '2026-11', 50, undefined, 40);

    const metas = loadMetasConsolidadas();
    const cafe = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const jefatura = metas.find(m => m.departamentoId === deptJefatura.id_departamento && m.periodo === '2026-11');
    expect(cafe.metaConsolidada).toBe(100);
    expect(cafe.resultadoConsolidado).toBe(90);
    expect(jefatura.metaConsolidada).toBe(50);
    expect(jefatura.resultadoConsolidado).toBe(40);
  });

  it('actualiza ambos grupos al cambiar de período', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);

    const doc = loadDocuments()[0];
    const updated = updateDocument(doc.id, { period: '2026-11', startDate: '2026-11-01', endDate: '2026-11-30' });

    const metas = loadMetasConsolidadas();
    const oct = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    const nov = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-11');
    expect(oct).toBeUndefined();
    expect(nov.metaConsolidada).toBe(100);
    expect(nov.resultadoConsolidado).toBe(90);
  });

  it('recalcula ambos valores al eliminar un registro', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 50, undefined, 40);

    const docs = loadDocuments();
    deleteDocument(docs[0].id);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo.metaConsolidada).toBe(50);
    expect(grupo.resultadoConsolidado).toBe(40);
  });

  it('elimina el grupo consolidado si queda sin registros', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    const doc = addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);
    deleteDocument(doc.id);

    const metas = loadMetasConsolidadas();
    const grupo = metas.find(m => m.departamentoId === deptCafe.id_departamento && m.periodo === '2026-10');
    expect(grupo).toBeUndefined();
    expect(metas.length).toBe(0);
  });

  it('es idempotente para ambos valores', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);

    const primera = calcularMetasConsolidadas();
    const segunda = calcularMetasConsolidadas();
    const tercera = calcularMetasConsolidadas();

    expect(primera).toEqual(segunda);
    expect(segunda).toEqual(tercera);
    expect(primera[0].metaConsolidada).toBe(100);
    expect(primera[0].resultadoConsolidado).toBe(90);
  });

  it('persiste ambos valores en localStorage tras recalcular', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 90);

    const metas = loadMetasConsolidadas();
    expect(metas.length).toBe(1);
    expect(metas[0].metaConsolidada).toBe(100);
    expect(metas[0].resultadoConsolidado).toBe(90);
    expect(metas[0].departamentoId).toBe(deptCafe.id_departamento);
    expect(metas[0].periodo).toBe('2026-10');
    expect(metas[0].departamentoNombre).toBe('Team cafe');
  });

  it('registra resultado 0 cuando el resultado individual es 0', () => {
    const { deptCafe, daniela, asignacionDaniela } = seedCafe();

    // Resultado 0 es válido (>= 0 y finito)
    addProductividad(daniela.entity_id, asignacionDaniela.id_historial, '2026-10', 100, undefined, 0);

    const metas = loadMetasConsolidadas();
    expect(metas.length).toBe(1);
    expect(metas[0].metaConsolidada).toBe(100);
    expect(metas[0].resultadoConsolidado).toBe(0);
  });
});
