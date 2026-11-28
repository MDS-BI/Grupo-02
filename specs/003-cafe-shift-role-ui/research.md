# Research: Datos cafetería, rol Jefe de Turno e interfaz auto-explicativa

**Feature**: `specs/003-cafe-shift-role-ui/spec.md`  
**Branch**: `004-cafe-shift-role-ui`  
**Date**: 2026-11-27  
**Input**: `specs/002-rrhh-productividad/spec.md` (US7), `specs/002-rrhh-productividad/contracts/storage.md`, `index.html`, `src/app.js`, `src/roles.js`, `src/storage.js`, `src/module-config.js` y `dist/index.html`.

## Unknowns

Ninguno. La terminología oficial quedó resuelta en US7: tres departamentos (`Barra`, `Cocina`, `Salón`) presentados en la interfaz como «Área de trabajo» y cinco cargos (`Barista`, `Cajero`, `Mesero`, `Cocinero`, `Encargado`). HU7 sigue fuera de alcance con `T113`–`T119` diferidas; solo se adopta la aclaración terminológica.

## Decisions

### Decision 1: Reparar la codificación en `index.html` y módulos fuente, sin copiar `dist/index.html`

**Rationale**: `index.html` contiene 49 líneas y 71 caracteres `?` que destruyen identificadores y etiquetas: `role-?rea-label`, `role-?rea`, `aria-label="?rea del supervisor"`, `cf-?reaTrabajo` y textos como `?rea de trabajo *`. Estos IDs son consumidos por `src/app.js:904`, `:907`, `:990`, `:1005`, `:1165` y por los componentes de formularios. `dist/index.html` está limpio y conserva la tarjeta de metas globales, pero es un artefacto generado y desactualizado: reemplazar la fuente perdería la configuración RRHH actual y volvería a generarse con `npm run build`. La reparación se hace en el marcado fuente con la terminología US7.

**Alternatives considered**:
- Reemplazar `index.html` por `dist/index.html`: rechazado; artefacto desactualizado y git-ignorado.
- Mantener los IDs dañados y buscar por atributos alternativos: rechazado; rompe accessible labels, selectores y contratos de prueba.

### Decision 2: Reutilizar `src/roles.js` como única fuente de verdad del rol Jefe de Turno

**Rationale**: La matriz de permisos (`src/roles.js:62-74`), el cálculo de alcance (`:93-137`) y las etiquetas (`:139-148`) ya implementan FR-052 a FR-065. El fallo reportado no es de lógica de permisos sino de integración: IDs corruptos, botón de edición no protegido, `editDocumentId` no honrado y renderizados sin guardas. Se conserva la semántica existente y se añaden `isSupervisorContextComplete()` y un guardián central antes de operaciones de edición.

**Alternatives considered**:
- Reescribir la matriz de roles en `app.js`: rechazado; duplicaría reglas y provocaría divergencia con filtros y etiquetas.
- Permitir edición y filtrar solo la salida: rechazado; viola FR-056/FR-057 y permitiría guardar fuera de alcance.

### Decision 3: Precarga no destructiva antes del primer renderizado del panel

**Rationale**: `loadDemoData()` (`src/storage.js:1133-1201`) hoy exige rol `RRHH` (`:1133-1136`) y llama a `clearAll()` (`:1138`), que vacía seis claves de negocio (`:1203-1210`) pero no `ROLE_STORAGE_KEY` (`src/roles.js:1`). Para cumplir FR-001/FR-002 se añade `needsDemoSeed()` y `seedDemoDataIfEmpty()` en `src/storage.js`, invocados desde `boot()` en `src/app.js` antes de `dashboard.js`. Solo si todas las colecciones de negocio están vacías se cargan los datos ficticios; si existe cualquier registro, se conserva sin sobrescribir. El botón manual «Cargar datos de demostración» mantiene su comportamiento de reemplazo explícito mediante un parámetro `force`.

**Alternatives considered**:
- Llamar a `loadDemoData()` sin control desde el inicio: rechazado; destruiría datos del usuario y dependía del rol activo.
- Sembrar en `localStorage` antes de cargar la app: rechazado; rompería la inicialización de esquema y validaciones de `storage.js`.

### Decision 4: Datos simulados deterministas con 3 departamentos y 5 cargos oficiales

**Rationale**: Los períodos ya se calculan de forma relativa en `src/storage.js:1140-1141` con `shiftPeriod(currentPeriod(), 2)` y `shiftPeriod(currentPeriod(), 1)` (helpers en `:93-99`, `:105-108`, `:110-115`). Se mantiene ese esquema, pero se sustituyen los departamentos/heredados `Caja`/`Supervisión` por `Barra`, `Cocina` y `Salón`, y los cargos por `Barista`, `Cajero`, `Mesero`, `Cocinero` y `Encargado`. La semilla queda fija (6 trabajadores, 3 departamentos, 6 asignaciones, 12 mediciones) y las fechas de ingreso se derivan de `firstPeriodBounds.startDate` para que toda asignación sea válida.

**Alternatives considered**:
- Usar fechas `hardcodeadas`: rechazado; las pruebas de período fallarían con el tiempo.
- Incorporar departamentos adicionales para «Caja» o «Supervisión»: rechazado; contradice la aclaración US7 y la spec actualizada.

### Decision 5: Centralizar las ayudas contextuales en `src/components/help-text.js`

**Rationale**: La spec exige que cada vista y formulario explique para qué sirve, qué datos pide, qué acción realiza y por qué un botón puede estar deshabilitado. Once vistas con textos repetidos en `index.html` generarían deriva terminológica y difícil mantenimiento. Un módulo pequeño que exporte `HELP_TEXT` por vista y `applyHelpText(scope)` permite actualizar etiquetas y subtítulos desde `src/app.js`, reutilizando `applyLabels()` y `roleLabel()` de `roles.js`.

**Alternatives considered**:
- Escribir textos solo en `index.html`: rechazado; no permite explicar estados por rol ni mensajes de contexto incompleto.
- Mostrar un único tooltip global: rechazado; no satisface la orientación por vista/formulario de FR-020 a FR-022.

### Decision 6: Incorporar la tarjeta de metas globales desde la referencia, con bloqueo para supervisor

**Rationale**: `app.js` ya importa `loadGlobalGoals` y `upsertGlobalGoal` (`src/app.js:12`) y el contrato `storage.md:12` define `erp_base_module:metas_globales` para Administrador. `dist/index.html` conserva el marcado de la tarjeta y el formulario (`global-goal-card`, `global-goal-form`, `gg-area`, `gg-period`, `gg-meta`), ausente en `index.html`. Se reincorpora el marcado con IDs limpios, se oculta para Jefe de Turno y Barista y se bloquea el guardado en `upsertGlobalGoal()` aunque se invoque por consola.

**Alternatives considered**:
- Eliminar la funcionalidad de metas globales por no estar en FR-052–FR-065: rechazado; FR-062 y el contrato 002 siguen vigentes.
- Copiar el bloque sin validación de rol: rechazado; violaría FR-062 y SC-010.

### Decision 7: Verificación con base de pruebas roja y gates explícitos

**Rationale**: La ejecución base `npm test -- --run` dio `Test Files 3 failed | 16 passed (19)` y `Tests 8 failed | 194 passed (202)`, causada por los IDs/textos corruptos. Antes de aceptar las historias nuevas se corrige esa base roja; luego se ejecutan `npm test -- --run` y `npm run build`. `npm run build` se ejecuta solo al final porque `package.json:7` escribe `dist/`.

**Alternatives considered**:
- Reportar la feature con pruebas fallidas: rechazado por el principio `Test-First & Verification`.
- Saltar la compilación para no tocar `dist/`: rechazado; se regenera al final y se verifica que no se reintroducen `?`.

## Phase 1 checkpoints

- Sin `NEEDS CLARIFICATION`: Technical Context completo.
- Constitution Check: PASS en la evaluación inicial y después del diseño.
- No se requiere `Complexity Tracking`.
- Diseño detallado en `data-model.md`, `contracts/ui-storage.md`, `quickstart.md` y `tasks.md`.
