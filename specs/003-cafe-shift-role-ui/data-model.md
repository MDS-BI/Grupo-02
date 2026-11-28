# Modelo de Datos — Feature `003-cafe-shift-role-ui`

**Funcionalidad**: `specs/003-cafe-shift-role-ui/spec.md`  
**Rama**: `004-cafe-shift-role-ui`  
**Fecha**: 2026-11-27  
**Estado**: Diseño pendiente de implementación; conserva el MER de nueve entidades de `001` y el modelo operativo de `002`.

## 1. Propósito y alcance

Define los datos, validaciones y estados necesarios para:

1. Reparar el flujo del Jefe de Turno / Supervisor (FR-052 a FR-065).
2. Precargar datos ficticios usando la terminología oficial de US7.
3. Hacer auto-explicativas todas las vistas y formularios.

No se crean entidades nuevas en el MER, no se añaden credenciales y no se modifica HU7. Se reutilizan `Entity` (trabajador), `Document` (medición), `Departamento`, `Historial_Departamento`, `Meta global` y el estado demostrativo de rol descrito en `specs/002-rrhh-productividad/contracts/storage.md`.

## 2. Convenciones obligatorias

| Concepto | Valores permitidos | Uso en interfaz |
|---|---|---|
| Departamento | `Barra`, `Cocina`, `Salón` | Etiqueta «Área de trabajo» |
| Cargo | `Barista`, `Cajero`, `Mesero`, `Cocinero`, `Encargado` | Etiqueta «Cargo» |
| Turno | `Mañana`, `Tarde` | Etiqueta «Turno» |
| Período | `AAAA-MM` válido, calculado con `currentPeriod()`/`shiftPeriod()` | Etiqueta «Período» |
| Rol activo | `administrador`, `supervisor`, `barista` | Etiqueta «Rol activo» |

Los textos `Caja`, `Supervisión` y «cinco áreas de trabajo» quedan prohibidos en datos simulados, etiquetas y documentación de esta feature. La palabra «área» se conserva solo como rótulo de interfaz («Área de trabajo», «Historial por área/turno») y en la cita de la aclaración US7.

## 3. Entidades y campos utilizados

### 3.1. Trabajador — `Entity`

Se mantiene la estructura de `002`. Campos relevantes para la precarga:

| Campo | Tipo | Regla |
|---|---|---|
| `entity_id` | string | Único, inmutable; referenciado por asignaciones y mediciones. |
| `name`, `surname` | string | Requeridos; se muestran juntos en listados. |
| `code` | string | `EMP-001` … `EMP-006` en la semilla. |
| `taxId` | string | Ficticio; solo demostración. |
| `cargo` | string | Debe pertenecer a los cinco cargos oficiales. |
| `fechaIngreso` | string `AAAA-MM-DD` | Igual a `firstPeriodBounds.startDate` en la semilla. |
| `estadoLaboral` | string | `Activo` en la semilla; `Inactivo` permitido por reglas de `002`. |
| `departamentoId` | string | Referencia al `Departamento` actual; informativo, no define alcance de supervisor. |

### 3.2. Departamento

| Campo | Tipo | Regla |
|---|---|---|
| `id_departamento` | string | Generado por `addDepartment()`. |
| `nombre` | string | Uno de `Barra`, `Cocina`, `Salón`. |
| `descripcion` | string | Texto breve y ficticio; no incluye ` Sup.` ni `Caja`. |

La semilla crea exactamente tres departamentos, uno por cada nombre oficial.

### 3.3. Historial de departamento — asignación

| Campo | Tipo | Regla |
|---|---|---|
| `id_historial` | string | Generado por `addDepartmentAssignment()`. |
| `entity_id` | string | Referencia al trabajador. |
| `id_departamento` | string | Referencia al departamento vigente en `fecha_inicio`. |
| `fecha_inicio` | string `AAAA-MM-DD` | `firstPeriodBounds.startDate` en la semilla. |
| `fecha_fin` | string \| null | `null` mientras la asignación esté vigente. |

Cada medición referencia una asignación válida del mismo trabajador mediante `asignacionId`. El alcance del Jefe de Turno se resuelve desde esta asignación, no desde `Entity.departamentoId`.

### 3.4. Medición — `Document`

Se conserva el esquema validado por `validateDocument()` en `src/storage.js`:

| Campo | Tipo | Regla |
|---|---|---|
| `folio` | number | Generado automáticamente por `addDocument()`. |
| `entity_id` | string | Trabajador medido. |
| `periodo` | string | Uno de los dos períodos calculados dinámicamente. |
| `indicador`, `unidad` | string | Obtenidos de `indicadoresParaCargo(cargo)` en `src/module-config.js:58-98`. |
| `asignacionId` | string | Asignación del trabajador, con departamento histórico. |
| `turno` | string | `Mañana` o `Tarde`. |
| `meta`, `resultado` | number | `resultado` derivado de `meta` en la semilla; visible para administrador y supervisor. |
| `evaluacionCalidad`, `evaluacionResponsabilidad`, `evaluacionCumplimiento`, `evaluacionColaboracion` | number | Escala existente de `002`. |
| `observaciones`, `oportunidadesMejora` | string | Textos ficticios en español. |

`findDuplicateProductivity()` sigue bloqueando duplicados por combinación de trabajador/período/indicador/asignación.

### 3.5. Meta global

| Campo | Tipo | Regla |
|---|---|---|
| `area` | string | Uno de los tres departamentos oficiales. |
| `periodo` | string | Período `AAAA-MM`. |
| `metaGlobal` | number | Solo Administrador / Gerente de Cafetería puede crearla o editarla (FR-062). |

Se persiste en `erp_base_module:metas_globales`. La entidad consolidada `erp_base_module:metas_consolidadas` sigue siendo interna y oculta.

### 3.6. Estado de rol activo (no es entidad del MER)

```json
{
  "rolActivo": "supervisor",
  "supervisorArea": "Barra",
  "supervisorTurno": "Mañana",
  "baristaEntityId": ""
}
```

| Campo | Requerido cuando | Regla |
|---|---|---|
| `rolActivo` | siempre | `administrador`, `supervisor` o `barista`; inválido ⇒ `administrador`. |
| `supervisorArea` | `rolActivo === 'supervisor'` | Uno de los tres departamentos oficiales. |
| `supervisorTurno` | `rolActivo === 'supervisor'` | `Mañana` o `Tarde`. |
| `baristaEntityId` | `rolActivo === 'barista'` | Debe referenciar un `Entity.entity_id` existente. |

El selector no autentica identidad. Cambiar de rol no modifica datos de negocio.

### 3.7. Textos de ayuda (UI, no persistidos)

`src/components/help-text.js` exporta un mapa `HELP_TEXT` por vista con cuatro claves: `purpose`, `fields`, `action`, `disabled`. `applyHelpText(scope)` inyecta los textos en elementos con `data-help` dentro del ámbito indicado. No se almacenan en `localStorage`; se generan desde la misma terminología oficial.

## 4. Dataset simulado

Períodos: `periods = [shiftPeriod(currentPeriod(), 2), shiftPeriod(currentPeriod(), 1)]`.  
Ingreso y fecha de asignación: `firstPeriodBounds.startDate`.  
Turno por período: índice `0` ⇒ `Mañana`, índice `1` ⇒ `Tarde`.

| # | Trabajador | Cargo | Departamento | Descripción |
|---|---|---|---|---|
| 1 | Camila Rojas | Barista | Barra | Preparación y control de calidad del café. |
| 2 | Ignacio Fuentes | Cajero | Salón | Atención en caja y cierre de operaciones. |
| 3 | Valentina Soto | Mesero | Salón | Atención a mesas y experiencia del cliente. |
| 4 | Matías Herrera | Cocinero | Cocina | Preparación de platos y control de inventario. |
| 5 | Javiera Muñoz | Encargado | Barra | Coordinación de turnos y cierre del local. |
| 6 | Rodrigo Silva | Barista | Barra | Apoyo en barra y preparación de bebidas. |

Totales: 6 trabajadores, 3 departamentos, 6 asignaciones, 12 mediciones, 2 períodos. `loadDemoData({ force: true })` calcula metas consolidadas al final, igual que la implementación actual.

## 5. Reglas de precarga

1. `needsDemoSeed()` devuelve `true` solo si `entities`, `documents`, `departamentos`, `historial_departamentos` y `metas_consolidadas` están vacíos.
2. `seedDemoDataIfEmpty()` invoca `loadDemoData({ force: false })` antes de renderizar el panel.
3. `force: false` omite `clearAll()`; `force: true` conserva el botón manual de reemplazo.
4. La comprobación de rol `RRHH` se aplica solo a la carga manual; la precarga automática usa la configuración RRHH activa sin exigir que el usuario haya seleccionado `administrador`.
5. Si existe cualquier dato de negocio, no se escribe nada y el usuario ve el estado vacío real correspondiente a sus filtros, con ayuda contextual.
6. `ROLE_STORAGE_KEY` no se borra nunca durante la precarga.

## 6. Transiciones y estados de interfaz

| Estado | Causa | Resultado observable |
|---|---|---|
| Supervisor con contexto incompleto | Rol `supervisor` sin `supervisorArea` o `supervisorTurno` | Solo se muestran los selectores y una ayuda que dice qué falta; no hay listados ni botones de medición. |
| Supervisor con contexto completo | Área y turno elegidos | Vistas Medición, Historial por área/turno y Evolución por área/turno; datos filtrados por `visibleDocuments()`/`visibleEntities()`. |
| Edición de medición del supervisor | `editDocumentId` válido y dentro de alcance | Se abre el formulario con la medición correcta; la meta individual es editable. |
| Edición fuera de alcance | Medición de otra área/turno o acción directa | Se bloquea antes de guardar, se muestra aviso superior y no hay cambios parciales. |
| Cambio de rol con formulario abierto | Usuario cambia `rolActivo` | Se limpia el formulario/no autorizado y se actualizan vistas y ayudas de inmediato. |
| Barista sin trabajador propio | Rol `barista` sin `baristaEntityId` | Solo se pide seleccionar trabajador; no se muestran datos de otros trabajadores. |

## 7. Consultas derivadas

- `visibleEntities(roleState, entities)` y `visibleDocuments(roleState, documents, assignments)` desde `src/roles.js`.
- `getCurrentAssignment(assignments, entityId)` para resolver el departamento histórico.
- `getAssignmentsForEntity()` y `getComparableMeasurements()` para Evolución.
- `loadGlobalGoals()` filtrada por rol en la tarjeta de metas globales.
- `HELP_TEXT` por vista para subtítulos y estados deshabilitados.

## 8. Fuera de alcance

- HU7 y sus tareas `T113`–`T119`.
- Autenticación, usuarios, contraseñas o permisos de servidor.
- Datos reales de trabajadores.
- Cambios en el esquema del MER o nuevas claves de `localStorage`.
