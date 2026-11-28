---

description: "Task list for feature 003-cafe-shift-role-ui"
---

# Tasks: Datos cafetería, rol Jefe de Turno e interfaz auto-explicativa

**Input**: Design documents from `/specs/003-cafe-shift-role-ui/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`

**Tests**: Incluidas porque `spec.md:172` exige verificación automática de precarga, matriz de roles, flujo del Jefe de Turno y presencia de ayudas, y `.specify/memory/constitution.md:18-19` exige cobertura antes/al lado de la implementación.

**Organization**: Tareas agrupadas por user story para permitir implementación y validación independiente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias).
- **[Story]**: Requerido solo en fases de user story (`US1` a `US4`).
- Toda descripción incluye una ruta de archivo exacta.

## Path Conventions

- **Single project**: `src/` y `tests/` en la raíz del repositorio, según `specs/003-cafe-shift-role-ui/plan.md:67-87`.
- No se crean paquetes, backend ni nuevas dependencias.
- `dist/` se regenera solo en T046.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar el estado inicial y la configuración existente antes de tocar código.

- [X] T001 Verificar en `.specify/feature.json` que `feature_directory` apunta a `specs/003-cafe-shift-role-ui`.
- [X] T002 [P] Confirmar en `package.json:6-9` que los scripts `dev`, `build` y `test` están disponibles para Vite y Vitest.
- [X] T003 Ejecutar `npm test -- --run` desde `package.json:9` y registrar la base roja documentada en `specs/003-cafe-shift-role-ui/research.md:62-68`: 3 archivos y 8 pruebas fallidas.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reparar la corrupción de texto/IDs que bloquea cualquier historia de usuario.

**⚠️ CRITICAL**: Ninguna historia puede comenzar hasta completar esta fase.

- [X] T004 Reparar en `index.html` los IDs y etiquetas dañados `role-?rea-label`, `role-?rea`, `cf-?reaTrabajo`, `error-cf-areaTrabajo` y `aria-label="?rea del supervisor"` usando `specs/003-cafe-shift-role-ui/contracts/ui-storage.md:37-48`.
- [X] T005 [P] Reparar los textos corruptos en `src/components/dashboard.js` con la terminología oficial de `specs/003-cafe-shift-role-ui/data-model.md:18-28`.
- [X] T006 [P] Reparar los textos y etiquetas corruptos en `src/components/document-form.js` usando `cf-areaTrabajo` y «Área de trabajo *».
- [X] T007 Actualizar los selectores de `src/app.js:904`, `:907`, `:990`, `:1005` y `:1165` para usar los IDs limpios de `index.html`.
- [X] T008 Ejecutar `npm test -- --run` desde `package.json:9` y confirmar que los 8 fallos base quedan resueltos antes de iniciar US1.

**Checkpoint**: `index.html`, `src/components/dashboard.js`, `src/components/document-form.js` y `src/app.js` sin caracteres `?` corruptos; suite base en verde.

---

## Phase 3: User Story 1 - Datos simulados listos desde el primer ingreso (Priority: P1) MVP

**Goal**: Precargar datos ficticios válidos solo en una instalación vacía y conservar siempre los datos existentes.

**Independent Test**: Abrir la app con `localStorage` vacío, sin pulsar «Cargar datos de demostración», y comprobar 3 departamentos, 6 trabajadores, 6 asignaciones y 12 mediciones; recargar y verificar que no se duplican.

### Tests for User Story 1

> **NOTE**: Escribir primero y confirmar que FALLAN antes de implementar.

- [X] T009 [P] [US1] Añadir en `tests/unit/storage.test.js` pruebas de `needsDemoSeed()` y `seedDemoDataIfEmpty()`: vacío siembra, parcial conserva, dos llamadas no duplican.
- [X] T010 [P] [US1] Añadir en `tests/integration/dashboard.test.js` la prueba de primera apertura con el dataset de `specs/003-cafe-shift-role-ui/data-model.md:121-136`.
- [X] T011 [P] [US1] Añadir en `tests/integration/rrhh-productivity.test.js` la prueba de recarga manual con confirmación: aceptar reemplaza, cancelar no modifica `erp_base_module:entities`.

### Implementation for User Story 1

- [X] T012 [US1] Refactorizar `loadDemoData()` en `src/storage.js:1133-1201` para aceptar `{ force = true }`, omitiendo `clearAll()` cuando `force` sea `false`.
- [X] T013 [US1] Sustituir el dataset de `src/storage.js:1142-1149` por los 6 trabajadores de `specs/003-cafe-shift-role-ui/data-model.md:127-134`, sin `Caja` ni `Supervisión`.
- [X] T014 [US1] Implementar `needsDemoSeed()` y `seedDemoDataIfEmpty()` en `src/storage.js` según `specs/003-cafe-shift-role-ui/contracts/ui-storage.md:24-35`.
- [X] T015 [US1] Invocar `seedDemoDataIfEmpty()` desde `boot()` en `src/app.js` antes de renderizar `src/components/dashboard.js`.
- [X] T016 [US1] Añadir en `index.html` y `src/app.js` la confirmación de reemplazo del botón de datos de demostración, con aviso y cancelación sin cambios (FR-004).
- [X] T017 [P] [US1] Añadir en `src/components/dashboard.js` el mensaje de datos parciales que explica por qué no se completó el conjunto simulado (FR-005, FR-023).

**Checkpoint**: US1 cumple SC-001 y SC-007; ejecutar `npm test -- --run` desde `package.json:9`.

---

## Phase 4: User Story 2 - Jefe de Turno opera sin bloqueos dentro de su alcance (Priority: P1)

**Goal**: Registrar y corregir mediciones dentro del departamento/turno elegidos, sin ver ni mutar datos ajenos.

**Independent Test**: Elegir Jefe de Turno, Barra y Mañana; registrar y corregir una medición; ver 0 registros de Cocina/Salón/Tarde; intentar una acción fuera de alcance y comprobar bloqueo sin cambios parciales.

### Tests for User Story 2

> **NOTE**: Escribir primero y confirmar que FALLAN antes de implementar.

- [X] T018 [P] [US2] Añadir en `tests/unit/roles.test.js` pruebas de `isSupervisorContextComplete()` para contexto faltante, inválido y completo.
- [X] T019 [P] [US2] Ampliar `tests/integration/role-access.test.js` para contexto incompleto, filtrado por asignación histórica y turno, y ocultamiento de gestión (FR-008, FR-009, FR-013).
- [X] T020 [P] [US2] Ampliar `tests/integration/add-document.test.js` para alta de medición dentro de alcance y rechazo fuera de alcance sin cambios parciales.
- [X] T021 [P] [US2] Ampliar `tests/integration/manage-document.test.js` para corrección de medición conservando folio/período y bloqueo de medición ajena.

### Implementation for User Story 2

- [X] T022 [US2] Añadir `isSupervisorContextComplete()` en `src/roles.js` y usarla como guardián en `filterEntities()` y `filterDocuments()`.
- [X] T023 [US2] Conectar el selector `role-area` de `index.html` en `src/app.js`: cambio, validación, guardado en `supervisorArea` y re-render inmediato.
- [X] T024 [US2] Añadir el guardián `assertCanEditDocument()` en `src/app.js` y honrar `editDocumentId` solo si la medición es visible para el rol activo.
- [X] T025 [US2] Proteger el guardado/corrección en `src/components/document-form.js` para impedir escrituras parciales con aviso comprensible.
- [X] T026 [P] [US2] Ocultar y bloquear gestión de trabajadores, departamentos, asignaciones, turnos y marcar inactivos en `src/components/shell.js`.
- [X] T027 [US2] Filtrar históricos y evolución por departamento histórico y turno en `src/components/history-view.js` y `src/components/evolution-view.js`.

**Checkpoint**: US2 cumple SC-002 a SC-006 y SC-010; ejecutar `npm test -- --run` desde `package.json:9`.

---

## Phase 5: User Story 3 - Matriz de roles y metas globales coherente (Priority: P2)

**Goal**: Administrador gestiona todo; Barista solo consulta lo propio; metas globales solo Administrador.

**Independent Test**: Recorrer los tres roles y comprobar vistas, botones, datos visibles y bloqueo de metas globales.

### Tests for User Story 3

> **NOTE**: Escribir primero y confirmar que FALLAN antes de implementar.

- [X] T028 [P] [US3] Ampliar `tests/integration/relabeling.test.js` para tres opciones de rol, valor inicial `administrador`, rol activo visible y aviso demostrativo (FR-006).
- [X] T029 [P] [US3] Ampliar `tests/unit/storage.test.js` para que `upsertGlobalGoal()` rechace escrituras de supervisor y barista.
- [X] T030 [P] [US3] Ampliar `tests/integration/dashboard.test.js` para visibilidad de `global-goal-card` solo con rol administrador.

### Implementation for User Story 3

- [X] T031 [US3] Restaurar en `index.html` el marcado de metas globales con IDs limpios `global-goal-card`, `global-goal-form`, `gg-area`, `gg-period` y `gg-meta`.
- [X] T032 [US3] Añadir validación de rol en `upsertGlobalGoal()` en `src/storage.js` según `specs/003-cafe-shift-role-ui/contracts/ui-storage.md:58-64`.
- [X] T033 [US3] Ocultar la tarjeta de metas globales para supervisor/barista en `src/app.js` y ajustar etiquetas en `src/components/shell.js`.
- [X] T034 [P] [US3] Mantener `meta` individual visible para administrador/supervisor y ocultar totales consolidados en `src/components/dashboard.js` y `src/components/history-view.js`.

**Checkpoint**: US1–US3 funcionan de forma independiente; ejecutar `npm test -- --run` desde `package.json:9`.

---

## Phase 6: User Story 4 - Interfaz auto-explicativa en cada vista y formulario (Priority: P2)

**Goal**: Toda vista/formulario explica propósito, campos, acción y estados deshabilitados con terminología coherente.

**Independent Test**: Recorrer las 11 vistas de `spec.md:81` y comprobar subtítulo y ayuda contextual visible sin abandonar la pantalla.

### Tests for User Story 4

> **NOTE**: Escribir primero y confirmar que FALLAN antes de implementar.

- [X] T035 [P] [US4] Ampliar `tests/integration/relabeling.test.js` para comprobar `data-help` y textos de propósito en las 11 vistas de `specs/003-cafe-shift-role-ui/spec.md:81`.
- [X] T036 [P] [US4] Ampliar `tests/integration/workers-subtabs.test.js` para la ayuda de campos y terminología de cargos de `specs/003-cafe-shift-role-ui/contracts/ui-storage.md:66-77`.
- [X] T037 [P] [US4] Ampliar `tests/integration/chart-selector.test.js` para la ayuda de métricas: indicador/unidad, meta individual, resultado, evaluaciones, observaciones, mejoras, comparación y ausencia de calificación automática.

### Implementation for User Story 4

- [X] T038 [US4] Crear `src/components/help-text.js` con `HELP_TEXT` y `applyHelpText(scope)` según `specs/003-cafe-shift-role-ui/data-model.md:117-119`.
- [X] T039 [US4] Añadir atributos `data-help` y aviso académico/datos ficticios en `index.html` para las 11 vistas enumeradas en `specs/003-cafe-shift-role-ui/spec.md:81`.
- [X] T040 [US4] Invocar `applyHelpText()` desde `src/app.js` tras cada render y cambio de rol.
- [X] T041 [US4] Redactar en `src/components/help-text.js` los estados vacío, parcial, no autorizado y contexto incompleto con siguiente paso permitido (FR-023).

**Checkpoint**: SC-005, SC-008 y SC-009 verificados; ejecutar `npm test -- --run` desde `package.json:9`.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentación, verificación final y regeneración de artefactos.

- [X] T042 [P] Actualizar `README.md` con 3 departamentos oficiales, 5 cargos, precarga automática, rol demostrativo, metas globales y aviso de datos ficticios.
- [X] T043 [P] Verificar ausencia de `?` corruptos en `index.html` y `src/components/dashboard.js` usando la regla de `specs/003-cafe-shift-role-ui/contracts/ui-storage.md:48`.
- [X] T044 Ejecutar `npm test -- --run` desde `package.json:9` con 0 fallos y ningún archivo de prueba omitido.
- [X] T045 Validar en navegador los escenarios de `specs/003-cafe-shift-role-ui/quickstart.md:30-86`, incluida precarga, supervisor y cambio de rol.
- [X] T046 Ejecutar `npm run build` desde `package.json:7` y verificar que `dist/index.html` no contiene `?` corruptos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; verifica `.specify/feature.json` y `package.json`.
- **Foundational (Phase 2)**: Depende de Phase 1; BLOCKS todas las historias.
- **User Stories (Phase 3–6)**: Dependen de Phase 2. Orden recomendado: US1 → US2 → US3 → US4.
- **Polish (Phase 7)**: Depende de US1–US4.

### User Story Dependencies / Graph

```text
Phase 1 Setup (T001-T003)
        |
        v
Phase 2 Foundational (T004-T008)
        |
        +---> US1 P1 (T009-T017) ---+
        |                           |
        +---> US2 P1 (T018-T027) <--+ (datos demo para prueba aislada)
        |                           |
        +---> US3 P2 (T028-T034) <--+
        |                           |
        +---> US4 P2 (T035-T041) <--+ (textos finales de roles/estados)
                                    |
                                    v
                          Phase 7 Polish (T042-T046)
```

- **US1 (P1)**: Sin dependencias de otras historias; provee el dataset base.
- **US2 (P1)**: Puede iniciar tras Phase 2; usa el dataset de US1 solo para demostración, pero es testeable de forma aislada.
- **US3 (P2)**: Puede iniciar tras Phase 2; integra con US2 en su checkpoint.
- **US4 (P2)**: Puede iniciar tras Phase 2; sus textos deben reflejar el estado final de US1–US3.

### Within Each User Story

- Las tareas de tests se escriben primero y deben FALLAR antes de la implementación.
- En US1: `src/storage.js` antes de `src/app.js` antes de `src/components/dashboard.js`.
- En US2: `src/roles.js` antes de `src/app.js` antes de `src/components/document-form.js`.
- En US3: `index.html` y `src/storage.js` antes de `src/app.js`.
- En US4: `src/components/help-text.js` antes de `index.html` antes de `src/app.js`.

### Parallel Opportunities

- Phase 1: T002 es paralela con T001; T003 espera a T002.
- Phase 2: T004, T005 y T006 son paralelas; T007 espera a T004; T008 espera a T004–T007.
- US1: T009, T010 y T011 son paralelas; T017 es paralela con T015/T016.
- US2: T018–T021 son paralelas; T026 es paralela con T023/T024.
- US3: T028–T030 son paralelas; T034 es paralela con T033.
- US4: T035–T037 son paralelas.
- Polish: T042 y T043 son paralelas; T044–T046 secuenciales.

---

## Parallel Example: User Story 1

```bash
# Ejecutar juntas las pruebas de US1:
Task: "Añadir en tests/unit/storage.test.js pruebas de needsDemoSeed() y seedDemoDataIfEmpty()"
Task: "Añadir en tests/integration/dashboard.test.js la prueba de primera apertura"
Task: "Añadir en tests/integration/rrhh-productivity.test.js la prueba de recarga manual con confirmación"

# Ejecutar juntas las implementaciones independientes de US1:
Task: "Invocar seedDemoDataIfEmpty() desde boot() en src/app.js"
Task: "Añadir en src/components/dashboard.js el mensaje de datos parciales"
```

## Parallel Example: User Story 2

```bash
# Ejecutar juntas las pruebas de US2:
Task: "Añadir en tests/unit/roles.test.js pruebas de isSupervisorContextComplete()"
Task: "Ampliar tests/integration/role-access.test.js para contexto/filtrado/gestión"
Task: "Ampliar tests/integration/add-document.test.js para alta dentro/fuera de alcance"
Task: "Ampliar tests/integration/manage-document.test.js para corrección y bloqueo"

# Ejecutar juntas las implementaciones independientes de US2:
Task: "Conectar el selector role-area en src/app.js"
Task: "Ocultar y bloquear gestión en src/components/shell.js"
```

## Parallel Example: User Story 3

```bash
# Ejecutar juntas las pruebas de US3:
Task: "Ampliar tests/integration/relabeling.test.js para el selector de rol"
Task: "Ampliar tests/unit/storage.test.js para upsertGlobalGoal() por rol"
Task: "Ampliar tests/integration/dashboard.test.js para global-goal-card"

# Ejecutar juntas las implementaciones independientes de US3:
Task: "Ocultar la tarjeta en src/app.js y ajustar src/components/shell.js"
Task: "Ocultar totales consolidados en src/components/dashboard.js y src/components/history-view.js"
```

## Parallel Example: User Story 4

```bash
# Ejecutar juntas las pruebas de US4:
Task: "Ampliar tests/integration/relabeling.test.js para data-help en 11 vistas"
Task: "Ampliar tests/integration/workers-subtabs.test.js para ayuda de campos"
Task: "Ampliar tests/integration/chart-selector.test.js para ayuda de métricas"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup en `.specify/feature.json` y `package.json`.
2. Completar Phase 2: Foundational en `index.html`, `src/app.js` y componentes.
3. Completar Phase 3: US1 en `src/storage.js`, `src/app.js` y `src/components/dashboard.js`.
4. **STOP and VALIDATE**: `npm test -- --run` en verde y dataset demo visible sin carga manual.

### Incremental Delivery

1. Setup + Foundational → base legible y pruebas verdes.
2. US1 → datos listos al abrir → MVP demostrable.
3. US2 → operación del Jefe de Turno → MVP operativo.
4. US3 → matriz de roles y metas globales coherente.
5. US4 → interfaz auto-explicativa.
6. Polish → documentación, navegador y build.

### Parallel Team Strategy

- Desarrollador A: US1 y US2 (`src/storage.js`, `src/roles.js`, `src/app.js`).
- Desarrollador B: US3 (`index.html`, `src/storage.js`, `src/components/shell.js`).
- Desarrollador C: US4 (`src/components/help-text.js`, `index.html`).
- Phase 7 se ejecuta de forma conjunta.

---

## Notes

- `[P]` = archivos distintos, sin dependencias; no se marca `[P]` cuando dos tareas escriben el mismo archivo.
- `[Story]` = trazabilidad directa con `spec.md:13`, `:32`, `:53` y `:71`.
- No se crean claves de `localStorage` ni dependencias nuevas.
- HU7 y sus tareas `T113`–`T119` en `specs/002-rrhh-productividad/tasks.md` permanecen fuera de alcance.
- Cada checkpoint debe ejecutar `npm test -- --run` desde `package.json:9` antes de continuar.
