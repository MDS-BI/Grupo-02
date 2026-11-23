---

description: "Task list for feature implementation"
---

# Tasks: 002-rrhh-productividad — RR. HH. e Historial de Productividad Laboral

**Input**: Design documents from `/specs/002-rrhh-productividad/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/storage.md`, `quickstart.md`, `.specify/memory/constitution.md`

**Tests**: Las tareas de prueba se incluyen porque la constitución del proyecto exige cobertura automatizada antes o junto con cada cambio de lógica, y porque `plan.md` define la suite automatizada como criterio de cierre.

**Organization**: Las tareas se agrupan por historia de usuario para permitir implementación y validación independientes. Las historías P1 se ordenan por dependencia; US4 es P2 y se implementa al final.

**Rama de trabajo**: `correccion-specs-002` (no crear, cambiar, commitear ni hacer push de ramas sin autorización explícita).

**Regla de trabajo con IA**: OpenCode puede crear y modificar archivos bajo supervisión del grupo. No realizar commits, push, merge, cambios de rama ni eliminación silenciosa de datos.

## Formato: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo si sus dependencias están resueltas y no modifica el mismo archivo que otra tarea concurrente.
- **[Story]**: etiqueta obligatoria solo en fases de historias de usuario (`[US1]` a `[US7]`).
- Todas las descripciones incluyen la ruta exacta del archivo que debe modificarse o verificarse.

## Path Conventions

Proyecto único: `index.html`, `src/`, `tests/` en la raíz del repositorio.

## Responsables

| Historia o área | Responsable |
|---|---|
| US1 — Registro de medición de productividad | Bruno Phillipe Cabalin Ferreira |
| US2 — Consulta del historial de desempeño | Lucas Omar Soarzo Mancilla |
| US3 — Gestión de trabajadores y asignaciones | Consuelo Estefania Hidalgo Salgado |
| US4 — Visualización de la evolución | Bastián Ignacio Reinado Bravo |
| US5 — Indicadores por cargo y turnos | Daphnne Hidalgo |
| US6 — Validación y protección de registros | Emilio Vejar |
| US7 — Confidencialidad de licencias médicas y ausencias justificadas | Consuelo Hidalgo |
| Especificaciones y documentación | Daphnne Hidalgo Mundaca |
| Implementación, integración y pruebas | Emilio Vejar Bravo |

## Resumen de fases

| Fase | Contenido | Tareas | Cantidad |
|---|---|---|---|
| 1 | Setup | T001–T008 | 8 |
| 2 | Foundational | T009–T023 | 15 |
| 3 | US3 — Gestión de trabajadores y asignaciones (P1) | T024–T038 | 15 |
| 4 | US1 — Registro de medición (P1) | T039–T055 | 17 |
| 5 | US2 — Consulta del historial (P1) | T056–T064 | 9 |
| 6 | US5 — Indicadores por cargo y turnos (P1) | T065–T075 | 11 |
| 7 | US6 — Validación y protección (P1) | T076–T086 | 11 |
| 8 | US7 — Licencias médicas y ausencias justificadas (P1) | T087–T109 | 23 |
| 9 | US4 — Visualización de la evolución (P2) | T110–T119 | 10 |
| 10 | Polish & cross-cutting | T120–T132 | 13 |
| **Total** | | **T001–T132** | **132** |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el módulo base, las dependencias y los documentos de diseño antes de tocar lógica de dominio.

- [ ] T001 Verificar que la rama activa sea `correccion-specs-002` y que `index.html`, `src/`, `tests/` y `specs/002-rrhh-productividad/plan.md` estén presentes y sin cambios accidentales.
- [ ] T002 [P] Confirmar las dependencias y scripts en `package.json` y ejecutar `npm install` para garantizar Vite, Vitest y jsdom disponibles.
- [ ] T003 [P] Verificar la configuración de Vitest y jsdom en `vitest.config.mjs` y el script `test` en `package.json`.
- [ ] T004 [P] Revisar las claves y reglas de persistencia en `specs/002-rrhh-productividad/contracts/storage.md` y `specs/002-rrhh-productividad/data-model.md`.
- [ ] T005 [P] Revisar prioridades, historias y criterios de aceptación en `specs/002-rrhh-productividad/spec.md`, incluida US7.
- [ ] T006 Verificar el arranque de la aplicación en `index.html`, `src/main.js` y `src/app.js` con `npm run dev`.
- [ ] T007 [P] Ejecutar la línea base `npm test -- --run` y `npm run build`, registrando resultados en `specs/002-rrhh-productividad/quickstart.md`.
- [ ] T008 [P] Confirmar que el aviso de datos ficticios en `index.html` y la limitación de autenticación en `README.md` estén visibles antes de cualquier cambio funcional.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preparar almacenamiento, configuración y validaciones compartidas que bloquean el inicio de todas las historias.

**Checkpoint**: La base de datos local, la configuración del módulo y el manejo de errores están listos; las historias pueden comenzar.

- [ ] T009 Declarar y confirmar en `src/storage.js` las claves `erp_base_module:entities`, `erp_base_module:documents`, `erp_base_module:departamentos`, `erp_base_module:historial_departamentos` y `erp_base_module:metas_consolidadas`.
- [ ] T010 Robustecer `readCollection`, `writeCollection` y `StorageError` en `src/storage.js` para informar fallos de lectura/escritura sin confirmaciones falsas.
- [ ] T011 Implementar en `src/storage.js` las validaciones base de trabajador y la protección de eliminación física cuando existan documentos o asignaciones.
- [ ] T012 [P] Configurar etiquetas RR. HH. y campos personalizados de trabajador (`cargo`, `fechaIngreso`, `estadoLaboral`, `departamentoId`) en `src/module-config.js`.
- [ ] T013 [P] Configurar campos personalizados base de productividad (`indicador`, `resultado`, `unidad`, `asignacionId`) en `src/module-config.js`.
- [ ] T014 [P] Verificar o extender `src/components/custom-fields.js` para renderizar los campos personalizados declarados sin romper el módulo base.
- [ ] T015 Implementar en `src/storage.js` el CRUD de departamentos con nombre normalizado único y bloqueo de eliminación con relaciones históricas.
- [ ] T016 Implementar en `src/storage.js` el CRUD de asignaciones con fechas válidas, ausencia de superposición y una sola asignación vigente por trabajador.
- [ ] T017 Implementar en `src/storage.js` la protección de asignaciones con mediciones vinculadas, rechazando cambios que invaliden el historial.
- [ ] T018 Implementar en `src/storage.js` la validación y normalización base de documentos de productividad, incluyendo `entity_id`, período y `asignacionId`.
- [ ] T019 Implementar en `src/storage.js` la generación automática de folio y la inspección segura de documentos previos incompatibles.
- [ ] T020 Implementar en `src/storage.js` el cálculo y recálculo idempotente de metas y resultados consolidados por departamento y período.
- [ ] T021 Conectar `boot(RRHH_CONFIG)`, temas y etiquetas en `src/app.js` y `src/main.js`.
- [ ] T022 Conectar el banner de error de almacenamiento entre `#storage-error` en `index.html` y `src/app.js`.
- [ ] T023 [P] Ejecutar `tests/unit/storage.test.js`, `tests/unit/rrhh-storage.test.js` y `tests/unit/module-config.test.js` para confirmar que la base no introduce regresiones.

---

## Phase 3: User Story 3 — Gestión de trabajadores y asignaciones (Priority: P1)

**Goal**: Registrar y editar personal de barra, cocina y salón; administrar departamentos y conservar asignaciones históricas.

**Independent Test**: Crear un trabajador, asignarlo a un departamento, reasignarlo a otro y comprobar que la asignación anterior permanece visible.

### Tests for User Story 3

- [ ] T024 [P] [US3] Agregar pruebas unitarias de campos personalizados de trabajador en `tests/unit/rrhh-storage.test.js`.
- [ ] T025 [P] [US3] Agregar pruebas unitarias de CRUD y nombre único de departamentos en `tests/unit/rrhh-storage.test.js`.
- [ ] T026 [P] [US3] Agregar pruebas unitarias de fechas, superposición y cierre de asignaciones en `tests/unit/rrhh-storage.test.js`.
- [ ] T027 [P] [US3] Agregar pruebas de integración de formularios de trabajador y departamento en `tests/integration/rrhh-workers.test.js`.
- [ ] T028 [P] [US3] Agregar pruebas de integración de reasignación, historial y bloqueo de eliminación en `tests/integration/rrhh-assignments.test.js`.

### Implementation for User Story 3

- [ ] T029 [P] [US3] Extender `src/components/entity-form.js` con `cargo`, `fechaIngreso`, `estadoLaboral` y `departamentoId`.
- [ ] T030 [P] [US3] Extender `src/components/entity-list.js` para mostrar departamento actual y estado laboral.
- [ ] T031 [P] [US3] Crear `src/components/department-form.js` para alta y edición de departamentos.
- [ ] T032 [P] [US3] Crear `src/components/department-list.js` con estado vacío y bloqueo de eliminación histórica.
- [ ] T033 [P] [US3] Crear `src/components/assignment-form.js` para registrar asignaciones con fecha de inicio y término opcional.
- [ ] T034 [P] [US3] Crear `src/components/assignment-list.js` con filtro por trabajador y estado vacío.
- [ ] T035 [US3] Conectar envíos, filtros y listados de trabajadores, departamentos y asignaciones en `src/app.js`.
- [ ] T036 [US3] Implementar el cambio de departamento cerrando la asignación anterior y actualizando `departamentoId` en `src/app.js`.
- [ ] T037 [US3] Implementar marcado como `Inactivo` y bloqueo de eliminación física en `src/app.js`.
- [ ] T038 [US3] Aplicar estilos en `src/styles.css`, ejecutar la prueba independiente y registrar el resultado en `specs/002-rrhh-productividad/tasks.md`.

**Checkpoint**: US3 es funcional de forma independiente y conserva todo el historial de asignaciones.

---

## Phase 4: User Story 1 — Registro de medición de productividad (Priority: P1)

**Goal**: Guardar mediciones periódicas asociadas al trabajador y a una asignación válida, permitiendo corregir solo el registro seleccionado.

**Independent Test**: Registrar una medición válida para un trabajador con asignación, verificar que aparece en almacenamiento y corregirla sin afectar otros períodos.

### Tests for User Story 1

- [ ] T039 [P] [US1] Agregar pruebas unitarias de período `AAAA-MM`, límites mensuales, períodos futuros y anteriores al ingreso en `tests/unit/rrhh-storage.test.js`.
- [ ] T040 [P] [US1] Agregar pruebas unitarias de indicador de 3 a 60 caracteres, resultado no negativo y unidad opcional en `tests/unit/rrhh-storage.test.js`.
- [ ] T041 [P] [US1] Agregar pruebas unitarias de existencia, pertenencia y superposición de asignaciones en `tests/unit/rrhh-storage.test.js`.
- [ ] T042 [P] [US1] Agregar pruebas unitarias de detección de duplicados y folio entero positivo en `tests/unit/rrhh-storage.test.js`.
- [ ] T043 [P] [US1] Agregar pruebas de integración del flujo completo de alta y corrección en `tests/integration/rrhh-productivity.test.js`.

### Implementation for User Story 1

- [ ] T044 [P] [US1] Extender `src/components/document-form.js` con selección explícita de trabajador y campos de productividad, conservando `entity_id`.
- [ ] T045 [US1] Convertir el período `AAAA-MM` en `startDate` y `endDate` dentro de `src/components/document-form.js`.
- [ ] T046 [US1] Implementar selección automática de asignación única y selección explícita cuando haya varias en `src/app.js`.
- [ ] T047 [US1] Mostrar mensajes de validación claros en `src/components/document-form.js`.
- [ ] T048 [US1] Conectar `#productivity-duplicate-warning` en `index.html` con la confirmación de duplicados en `src/app.js`.
- [ ] T049 [US1] Persistir documentos con `asignacionId`, folio y campos personalizados, sin campos monetarios, en `src/storage.js`.
- [ ] T050 [US1] Bloquear el guardado cuando `inspectDocumentsForRRHH` detecte documentos incompatibles en `src/storage.js`.
- [ ] T051 [US1] Implementar corrección que actualice solo el registro seleccionado y conserve el folio en `src/storage.js`.
- [ ] T052 [US1] Invocar el recálculo de metas y resultados consolidados en `addDocument`, `updateDocument` y `deleteDocument` dentro de `src/storage.js`.
- [ ] T053 [P] [US1] Agregar pruebas unitarias de independencia, idempotencia y ocultamiento de consolidados en `tests/unit/rrhh-storage.test.js`.
- [ ] T054 [US1] Aplicar estilos del formulario y mensajes en `src/styles.css`.
- [ ] T055 [US1] Ejecutar la prueba independiente y registrar el resultado en `specs/002-rrhh-productividad/tasks.md`.

**Checkpoint**: US1 permite registrar y corregir mediciones sin alterar otros períodos ni exponer consolidados internos.

---

## Phase 5: User Story 2 — Consulta del historial de desempeño (Priority: P1)

**Goal**: Mostrar cronológicamente las mediciones de un trabajador con el departamento histórico de cada período.

**Independent Test**: Seleccionar un trabajador con varias mediciones, incluido un cambio de departamento, y verificar orden, departamento por asignación y estado vacío.

### Tests for User Story 2

- [ ] T056 [P] [US2] Agregar pruebas unitarias de filtrado por trabajador y orden por `startDate` en `tests/unit/rrhh-storage.test.js`.
- [ ] T057 [P] [US2] Agregar pruebas unitarias de resolución del departamento desde `asignacionId` en `tests/unit/rrhh-storage.test.js`.
- [ ] T058 [P] [US2] Agregar pruebas de integración de historial, recarga y trabajador sin mediciones en `tests/integration/rrhh-productivity.test.js`.

### Implementation for User Story 2

- [ ] T059 [US2] Implementar `createHistoryRow` en `src/components/history-view.js` con período, departamento, indicador, resultado y unidad.
- [ ] T060 [US2] Implementar `renderHistoryTable` y el mensaje de ausencia de registros en `src/components/history-view.js`.
- [ ] T061 [US2] Conectar `#history-entity` con `renderHistory()` en `src/app.js`.
- [ ] T062 [US2] Garantizar que la consulta no modifique documentos históricos en `src/storage.js`.
- [ ] T063 [US2] Aplicar estilos de tabla y estado vacío en `src/styles.css`.
- [ ] T064 [US2] Ejecutar la prueba independiente y registrar el resultado en `specs/002-rrhh-productividad/tasks.md`.

**Checkpoint**: US2 muestra el historial completo sin sobrescribir datos anteriores.

---

## Phase 6: User Story 5 — Indicadores por cargo y turnos (Priority: P1)

**Goal**: Sugerir indicadores según cargo, registrar turno, meta, evaluación cualitativa, observaciones y oportunidades de mejora.

**Independent Test**: Seleccionar un trabajador con cargo configurado, comprobar la sugerencia de indicadores y guardar una medición con turno y campos nuevos visibles en historial y evolución.

### Tests for User Story 5

- [ ] T065 [P] [US5] Agregar pruebas unitarias de `INDICADORES_POR_CARGO` e `indicadoresParaCargo` en `tests/unit/module-config.test.js`.
- [ ] T066 [P] [US5] Agregar pruebas unitarias de validación de turno, meta y evaluaciones 1-5 en `tests/unit/rrhh-storage.test.js`.
- [ ] T067 [P] [US5] Agregar pruebas de integración de sugerencia y visualización de campos en `tests/integration/rrhh-productivity.test.js`.

### Implementation for User Story 5

- [ ] T068 [US5] Definir `INDICADORES_POR_CARGO` e `indicadoresParaCargo` en `src/module-config.js`.
- [ ] T069 [US5] Declarar los campos personalizados `turno`, `meta`, cuatro evaluaciones, `observaciones` y `oportunidadesMejora` en `src/module-config.js`.
- [ ] T070 [US5] Agregar los controles de los campos nuevos dentro de `#productivity-fields` en `index.html`.
- [ ] T071 [US5] Recolectar, limpiar y validar los campos nuevos en `src/components/document-form.js`.
- [ ] T072 [US5] Implementar `suggestIndicatorsForEntity` en `src/app.js`.
- [ ] T073 [US5] Normalizar y validar los campos nuevos, conservando registros anteriores, en `src/storage.js`.
- [ ] T074 [US5] Mostrar turno, meta, evaluaciones, observaciones y oportunidades en `src/components/history-view.js`, `src/components/evolution-view.js`, `src/components/document-list.js` y `src/components/dashboard.js`.
- [ ] T075 [US5] Aplicar estilos en `src/styles.css` y registrar la prueba independiente en `specs/002-rrhh-productividad/tasks.md`.

**Checkpoint**: US5 conserva el contexto de cargo y turno en registro, historial y evolución.

---

## Phase 7: User Story 6 — Validación y protección de registros (Priority: P1)

**Goal**: Rechazar datos inválidos, advertir duplicados, bloquear documentos incompatibles e informar fallos de almacenamiento sin pérdida silenciosa.

**Independent Test**: Intentar guardar un registro inválido, un duplicado confirmado, un documento incompatible y un fallo simulado de `localStorage`, verificando mensajes claros y ausencia de confirmación falsa.

### Tests for User Story 6

- [ ] T076 [P] [US6] Agregar pruebas unitarias de datos inválidos, duplicados y documentos incompatibles en `tests/unit/rrhh-storage.test.js`.
- [ ] T077 [P] [US6] Agregar pruebas unitarias de fallo de lectura y escritura de `localStorage` en `tests/unit/rrhh-storage.test.js`.
- [ ] T078 [P] [US6] Agregar pruebas de integración de renderizado seguro y mensajes de error en `tests/integration/rrhh-productivity.test.js`.

### Implementation for User Story 6

- [ ] T079 [US6] Centralizar los mensajes de validación de productividad en `src/storage.js`.
- [ ] T080 [US6] Mostrar errores de validación y almacenamiento en `src/app.js` y `#storage-error` de `index.html`.
- [ ] T081 [US6] Bloquear guardados incompatibles detectados por `inspectDocumentsForRRHH` en `src/storage.js`.
- [ ] T082 [US6] Evitar confirmaciones de éxito cuando falle `writeCollection` en `src/app.js`.
- [ ] T083 [US6] Asegurar escape de contenido ingresado en `src/components/history-view.js`, `src/components/evolution-view.js` y `src/components/document-list.js`.
- [ ] T084 [US6] Verificar que `#data-warning` en `index.html` permanezca visible durante errores y flujos de guardado.
- [ ] T085 [US6] Aplicar estilos de errores y advertencias en `src/styles.css`.
- [ ] T086 [US6] Ejecutar la matriz de validación y registrar el resultado en `specs/002-rrhh-productividad/tasks.md`.

**Checkpoint**: US6 impide guardados incorrectos y informa cualquier fallo sin eliminar datos.

---

## Phase 8: User Story 7 — Confidencialidad de licencias médicas y ausencias justificadas (Priority: P1)

**Goal**: Registrar y consultar ausencias justificadas ficticias con trabajador, fechas, tipo de reposo y estado de tramitación, sin diagnósticos ni información clínica.

**Independent Test**: Registrar una licencia médica ficticia de tres días en reposo total y estado pendiente, consultar historial y planificación de turnos, y verificar que aparecen solo trabajador, fechas, tipo de reposo y estado, sin diagnóstico, enfermedad, exámenes, tratamientos ni antecedentes clínicos.

**Restricción MVP**: No existe autenticación real. El filtro por responsable del registro es una ayuda local de demostración y debe documentarse como tal en `README.md`; no debe presentarse como control de acceso.

### Tests for User Story 7

- [ ] T087 [P] [US7] Agregar pruebas unitarias de validación de fechas, tipo de reposo y estados en `tests/unit/medical-leave-storage.test.js`.
- [ ] T088 [P] [US7] Agregar pruebas unitarias de rechazo de términos clínicos y compatibilidad con registros anteriores en `tests/unit/medical-leave-storage.test.js`.
- [ ] T089 [P] [US7] Agregar pruebas de integración de formulario, listado y cambio de estado en `tests/integration/medical-leave.test.js`.
- [ ] T090 [P] [US7] Agregar pruebas de integración de planificación de turnos, ausencia autorizada y ausencia de datos clínicos en `tests/integration/shift-planning.test.js`.

### Implementation for User Story 7

- [ ] T091 [US7] Documentar en `specs/002-rrhh-productividad/data-model.md` el registro de ausencia con `entity_id`, fechas, `tipoReposo`, `estadoTramitacion`, historial de estados y `responsableLocal`, sin agregar entidades al MER.
- [ ] T092 [US7] Documentar la clave `erp_base_module:licencias_medicas` y su contrato en `specs/002-rrhh-productividad/contracts/storage.md`.
- [ ] T093 [US7] Agregar `LICENSES_KEY` y las funciones `loadMedicalLeaves`/`saveMedicalLeaves` en `src/storage.js`.
- [ ] T094 [US7] Implementar `validateMedicalLeave` y `normalizeMedicalLeave` en `src/storage.js` con enums `total|parcial` y `pendiente|autorizada|rechazada|finalizada`.
- [ ] T095 [US7] Implementar un validador de texto clínico en `src/storage.js` y aplicarlo a campos libres de licencias y a `observaciones`/`oportunidadesMejora`.
- [ ] T096 [US7] Implementar `addMedicalLeave`, `updateMedicalLeaveStatus` y supresión local en `src/storage.js`, conservando el registro original y el historial de estados sin afectar asignaciones ni mediciones.
- [ ] T097 [US7] Implementar `getMedicalLeavesForEntity`, `getOverlappingMedicalLeaves` e `isEntityOnAuthorizedLeave` en `src/storage.js`.
- [ ] T098 [US7] Impedir en `validateProductivityDocument` de `src/storage.js` la creación de mediciones que se superpongan con una licencia autorizada.
- [ ] T099 [US7] Incluir `LICENSES_KEY` en `clearAll()` de `src/storage.js` sin eliminar otros datos automáticamente.
- [ ] T100 [US7] Agregar etiquetas de licencias, ausencias y planificación en `src/module-config.js`.
- [ ] T101 [US7] Agregar botones `#nav-medical-leaves` y `#nav-shift-planning` y vistas `#view-medical-leaves` y `#view-shift-planning` en `index.html`.
- [ ] T102 [US7] Agregar en `index.html` solo los campos trabajador, fechas, tipo de reposo, estado y responsable local, sin campos de diagnóstico, enfermedad, exámenes, tratamientos ni antecedentes.
- [ ] T103 [US7] Crear `src/components/medical-leave-form.js` para registrar y corregir ausencias con datos mínimos.
- [ ] T104 [US7] Crear `src/components/medical-leave-list.js` para consultar historial, estados y filtro local por responsable sin comparar trabajadores.
- [ ] T105 [US7] Crear `src/components/shift-planning-view.js` para marcar turnos Mañana/Tarde como ausencia justificada y reflejar reposo parcial solo en las fechas indicadas.
- [ ] T106 [US7] Registrar los módulos `medical-leaves` y `shift-planning` en `MODULES`/`VIEWS` y conectar eventos y renderizados en `src/app.js`.
- [ ] T107 [US7] Mostrar marcadores de ausencia justificada, sin información clínica, en `src/components/history-view.js` y `src/components/evolution-view.js`.
- [ ] T108 [US7] Documentar en `README.md` que el responsable local no es autenticación, que no se tramita ante COMPIN, C.C.A.F., ISAPRE ni SUSESO y que solo se usan datos ficticios.
- [ ] T109 [US7] Aplicar estilos en `src/styles.css`, mantener `#data-warning` visible y registrar la prueba independiente en `specs/002-rrhh-productividad/tasks.md`.

**Checkpoint**: US7 conserva la confidencialidad de la información clínica y mantiene las ausencias fuera de indicadores de productividad.

---

## Phase 9: User Story 4 — Visualización de la evolución de productividad (Priority: P2)

**Goal**: Mostrar la evolución de mediciones comparables del mismo indicador y unidad, sin puntuaciones únicas ni juicios automáticos.

**Independent Test**: Seleccionar un trabajador con dos mediciones del mismo indicador y unidad en períodos distintos y una medición de otro indicador; verificar que solo se comparen las dos primeras y que se informen datos insuficientes cuando corresponda.

### Tests for User Story 4

- [ ] T110 [P] [US4] Agregar pruebas unitarias de filtrado por indicador y unidad en `tests/unit/rrhh-storage.test.js`.
- [ ] T111 [P] [US4] Agregar pruebas de integración de evolución, mensajes y exclusión de comparaciones inválidas en `tests/integration/rrhh-productivity.test.js`.

### Implementation for User Story 4

- [ ] T112 [US4] Implementar `getComparableMeasurements` en `src/storage.js` ordenando por período.
- [ ] T113 [US4] Implementar `createEvolutionRow` en `src/components/evolution-view.js`.
- [ ] T114 [US4] Implementar `renderEvolutionTable` y mensajes de datos insuficientes en `src/components/evolution-view.js`.
- [ ] T115 [US4] Conectar `#evolution-entity`, `#evolution-indicator` y `#evolution-unit` con `renderEvolution()` en `src/app.js`.
- [ ] T116 [US4] Mostrar departamento histórico, turno y meta en `src/components/evolution-view.js`.
- [ ] T117 [US4] Verificar que `src/components/evolution-view.js` no calcule puntuaciones únicas ni emita juicios de desempeño.
- [ ] T118 [US4] Aplicar estilos de tabla y mensajes en `src/styles.css`.
- [ ] T119 [US4] Ejecutar la prueba independiente y registrar el resultado en `specs/002-rrhh-productividad/tasks.md`.

**Checkpoint**: US4 permite analizar tendencias comparables sin inducir evaluaciones automáticas.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar calidad, documentación, seguridad, rendimiento y verificación completa.

- [ ] T120 [P] Actualizar `README.md` con el alcance de US1–US7, almacenamiento local, datos ficticios y ausencia de autenticación.
- [ ] T121 [P] Verificar el texto del aviso de datos ficticios en `index.html` según caso límite 21 de `specs/002-rrhh-productividad/spec.md`.
- [ ] T122 [P] Auditar escape de contenido en todos los archivos de `src/components/` y corregir entradas sin sanitizar.
- [ ] T123 [P] Auditar `StorageError`, `#storage-error` y ausencia de confirmaciones falsas en `src/storage.js` y `src/app.js`.
- [ ] T124 Verificar que `index.html` y `README.md` no presenten autenticación, roles ni control de acceso como funcionalidades implementadas.
- [ ] T125 [P] Configurar linting, formato y análisis estático en `package.json`, `.eslintrc.cjs` y `.prettierrc.json`, o documentar la desviación en `specs/002-rrhh-productividad/plan.md` si no se agregan dependencias.
- [ ] T126 Ejecutar los comandos de lint, formato y análisis configurados en `package.json` y corregir los hallazgos que afecten corrección o mantenibilidad.
- [ ] T127 [P] Validar rendimiento con al menos 500 registros ficticios en Historial, Evolución y navegación, registrando tiempos en `specs/002-rrhh-productividad/tasks.md`.
- [ ] T128 [P] Verificar accesibilidad y diseño responsivo de formularios, tablas y estados vacíos en `index.html` y `src/styles.css`.
- [ ] T129 Actualizar `specs/002-rrhh-productividad/plan.md` para reflejar siete historias, dependencias y estado real de US7.
- [ ] T130 Actualizar `specs/002-rrhh-productividad/quickstart.md` con el flujo de licencias médicas y los comandos `npm run dev` y `npm test -- --run`.
- [ ] T131 Revisar coherencia entre `specs/002-rrhh-productividad/spec.md`, `plan.md`, `data-model.md`, `research.md`, `contracts/storage.md`, `quickstart.md` y `tasks.md`.
- [ ] T132 Ejecutar `npm test -- --run` y `npm run build`, registrar resultados finales en `specs/002-rrhh-productividad/tasks.md` y dejar la revisión del grupo pendiente sin commits automáticos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias.
- **User Stories (Phases 3–9)**: dependen de Foundational.
- **Polish (Phase 10)**: depende de todas las historias incluidas en el alcance.

### User Story Dependencies

- **US3 (P1)**: comienza después de Foundational; habilita los datos de trabajador, departamento y asignación.
- **US1 (P1)**: depende de US3 para asignaciones válidas, aunque puede implementarse con datos sembrados si US3 avanza en paralelo.
- **US2 (P1)**: depende de US1 para tener mediciones que consultar.
- **US5 (P1)**: puede avanzar en paralelo con US2 una vez cerrado el esquema de documentos de US1.
- **US6 (P1)**: transversal; sus validaciones deben integrarse antes de cerrar US1, US5 y US7.
- **US7 (P1)**: puede avanzar en paralelo con US5 y US6; su almacenamiento es propio y no usa entidades nuevas del MER.
- **US4 (P2)**: depende de US1, US2 y US5.

### Within Each User Story

1. Ejecutar primero las tareas de pruebas marcadas `[P]`.
2. Implementar modelos y persistencia.
3. Implementar componentes y vistas.
4. Conectar eventos en `src/app.js`.
5. Aplicar estilos y registrar la prueba independiente.

### Parallel Opportunities

- 50 tareas están marcadas `[P]`.
- Setup: T002–T005, T007 y T008 pueden ejecutarse en paralelo.
- Foundational: T012–T014 y T023 pueden ejecutarse en paralelo; las tareas que editan `src/storage.js` deben coordinarse.
- US3: T024–T034 pueden distribuirse en paralelo siempre que no editen el mismo archivo.
- US1: T039–T044 y T053 son paralelizables.
- US2: T056–T058 son paralelizables.
- US5: T065–T067 son paralelizables.
- US6: T076–T078 son paralelizables.
- US7: T087–T090 son paralelizables.
- US4: T110–T111 son paralelizables.
- Polish: T120–T123, T125, T127 y T128 son paralelizables.

---

## Parallel Examples by User Story

```text
# US3
Task: T024 worker custom field tests in tests/unit/rrhh-storage.test.js
Task: T025 department tests in tests/unit/rrhh-storage.test.js
Task: T026 assignment tests in tests/unit/rrhh-storage.test.js
Task: T029 extend src/components/entity-form.js
Task: T031 create src/components/department-form.js
Task: T033 create src/components/assignment-form.js

# US1
Task: T039 period tests in tests/unit/rrhh-storage.test.js
Task: T040 indicator/result/unit tests in tests/unit/rrhh-storage.test.js
Task: T041 assignment selection tests in tests/unit/rrhh-storage.test.js
Task: T042 duplicate/folio tests in tests/unit/rrhh-storage.test.js
Task: T044 extend src/components/document-form.js

# US2
Task: T056 filter/sort tests in tests/unit/rrhh-storage.test.js
Task: T057 historical department tests in tests/unit/rrhh-storage.test.js
Task: T058 integration tests in tests/integration/rrhh-productivity.test.js

# US5
Task: T065 config tests in tests/unit/module-config.test.js
Task: T066 field validation tests in tests/unit/rrhh-storage.test.js
Task: T067 integration tests in tests/integration/rrhh-productivity.test.js

# US6
Task: T076 invalid/duplicate/incompatible tests in tests/unit/rrhh-storage.test.js
Task: T077 storage failure tests in tests/unit/rrhh-storage.test.js
Task: T078 safe rendering tests in tests/integration/rrhh-productivity.test.js

# US7
Task: T087 leave validation tests in tests/unit/medical-leave-storage.test.js
Task: T088 clinical-text and legacy tests in tests/unit/medical-leave-storage.test.js
Task: T089 form/list integration tests in tests/integration/medical-leave.test.js
Task: T090 planning integration tests in tests/integration/shift-planning.test.js

# US4
Task: T110 comparable filtering tests in tests/unit/rrhh-storage.test.js
Task: T111 evolution integration tests in tests/integration/rrhh-productivity.test.js
```

---

## Implementation Strategy

### MVP First

1. Completar Phase 1 y Phase 2.
2. Implementar US3 para disponer de trabajadores y asignaciones.
3. Implementar US1 y validar el flujo trabajador → asignación → medición.
4. Detenerse y ejecutar la prueba independiente de US1 antes de continuar.

### Incremental Delivery

1. Setup + Foundational.
2. US3 → validación independiente.
3. US1 → validación independiente.
4. US2 y US5 → validación independiente.
5. US6 como compuerta de calidad transversal.
6. US7 → validación de privacidad y ausencias.
7. US4 → validación de evolución comparable.
8. Polish con suite completa y compilación.

### Parallel Team Strategy

- Un integrante puede tomar US3 y otro US7 porque sus componentes son distintos; las ediciones en `src/storage.js` deben coordinarse.
- Otro integrante puede preparar pruebas de US1, US2, US5, US6 y US4 en paralelo.
- La integración en `src/app.js` debe hacerse de forma secuencial para evitar conflictos de eventos.

---

## Notes

- No crear entidades nuevas en el MER de nueve entidades; `Departamento` e `Historial_Departamento` son extensiones documentadas.
- No implementar backend, autenticación, roles, control de acceso, auditoría, exportación ni sincronización.
- No comparar productividad entre trabajadores o departamentos ni calcular una puntuación única automática.
- No registrar información real ni datos clínicos; todas las demostraciones usan datos ficticios.
- `#data-warning` debe permanecer visible en todos los flujos.
- Los consolidados `erp_base_module:metas_consolidadas` son internos y no deben mostrarse en la interfaz.
- `[P]` significa archivos distintos y dependencias resueltas; no editar simultáneamente el mismo archivo.
- Cada checkpoint debe validarse antes de avanzar a la siguiente historia.
