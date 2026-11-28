# Contrato de interfaz y persistencia local — Feature `003-cafe-shift-role-ui`

**Feature**: `specs/003-cafe-shift-role-ui/spec.md`  
**Rama**: `004-cafe-shift-role-ui`  
**Fecha**: 2026-11-27  
**Alcance**: reparación del Jefe de Turno, precarga de datos y textos auto-explicativos. No expone API HTTP.

## 1. Claves de `localStorage`

Se conservan las siete claves de `specs/002-rrhh-productividad/contracts/storage.md:5-13`:

| Clave | Uso | Cambio en esta feature |
|---|---|---|
| `erp_base_module:entities` | Trabajadores | Sin cambio de esquema; semilla usa 6 registros. |
| `erp_base_module:documents` | Mediciones | Sin cambio de esquema; semilla usa 12 registros. |
| `erp_base_module:departamentos` | Departamentos | Sin cambio de esquema; semilla usa solo `Barra`, `Cocina`, `Salón`. |
| `erp_base_module:historial_departamentos` | Asignaciones | Sin cambio de esquema; semilla usa 6 registros. |
| `erp_base_module:metas_consolidadas` | Cálculo interno | Sin cambio; no se muestra en UI. |
| `erp_base_module:metas_globales` | Metas de ventas | Sin cambio de esquema; bloqueada para supervisor/barista. |
| `erp_base_module:rol_activo` | Estado demostrativo | Sin cambio de esquema; se valida antes de renderizar. |

No se crean claves nuevas. Los textos de ayuda no se persisten.

## 2. Contrato de precarga

| Operación | Firma propuesta | Comportamiento |
|---|---|---|
| Comprobar necesidad | `needsDemoSeed(): boolean` | `true` solo si las cinco colecciones de negocio están vacías. |
| Precargar al arrancar | `seedDemoDataIfEmpty(): void` | Antes de renderizar el panel; invoca `loadDemoData({ force: false })` si procede. |
| Carga manual | `loadDemoData({ force: true })` | Reemplaza datos; sigue estando disponible solo en RRHH. |
| Limpieza | `clearAll(): void` | Se invoca solo desde `force: true`; nunca toca `rol_activo`. |

**Postcondiciones de la precarga**: 3 departamentos, 6 trabajadores, 6 asignaciones y 12 mediciones en los dos períodos relativos; `rolActivo` se conserva; `metas_consolidadas` se recalcula.

**Invariante**: si existe al menos un registro de negocio, la precarga automática no sobrescribe, elimina ni reordena datos.

## 3. Contrato de identificadores de interfaz

Los identificadores dañados se reparan en `index.html` y se consumen con los mismos nombres limpios en `src/app.js` y componentes:

| ID reparado | Etiqueta visible | Consumidor |
|---|---|---|
| `role-area-label`, `role-area` | «Área de trabajo del supervisor» | `src/app.js:904`, `:907`, `:990`, `:1005`, `:1165` |
| `cf-areaTrabajo`, `error-cf-areaTrabajo` | «Área de trabajo *» | `src/components/document-form.js` |
| `global-goal-card`, `global-goal-form`, `gg-area`, `gg-period`, `gg-meta` | «Metas globales de ventas» | `src/app.js` vía `upsertGlobalGoal()` |
| `data-help` (atributo) | Subtítulo/ayuda por vista | `src/components/help-text.js` |

Ningún ID, `aria-label`, `option` ni texto visible puede contener `?` o `¿` sin ser parte de una pregunta legítima. En esta feature no hay preguntas en la interfaz, por lo que el carácter `?` queda prohibido en marcado fuente.

## 4. Contrato de visibilidad por rol

| Rol | Vistas | Acciones permitidas | Estado inicial |
|---|---|---|---|
| `administrador` | Todas, incluida «Metas globales de ventas» | Crear/editar trabajadores, departamentos, asignaciones, turnos y metas; registrar, corregir y eliminar cualquier medición. | Sin contexto adicional. |
| `supervisor` | Medición, Historial por área/turno y Evolución por área/turno | Registrar y corregir solo mediciones del `supervisorArea` + `supervisorTurno`, incluida `meta`. | Requiere área y turno; si falta alguno, muestra solo la ayuda de contexto incompleto. |
| `barista` | Mi desempeño y Mi evolución | Solo consulta de su propio trabajador. | Requiere `baristaEntityId`; si falta, solo pide selección. |

**Reglas de bloqueo**:

1. `isSupervisorContextComplete(state)` debe devolver `true` antes de habilitar cualquier acción de supervisor.
2. `visibleDocuments()` debe usar la asignación histórica de cada medición; `Entity.departamentoId` no define el alcance.
3. Toda acción de edición/eliminación llama a un guardián antes de mutar `localStorage`; si falla, se muestra aviso superior y no hay cambios parciales.
4. `editDocumentId` solo se honra si la medición es visible para el rol activo.
5. Metas globales: `upsertGlobalGoal()` rechaza cualquier escritura de supervisor o barista aunque el formulario esté oculto.

## 5. Contrato de mensajes y ayudas

Cada vista expone cuatro textos mediante `HELP_TEXT`:

| Clave | Contenido mínimo |
|---|---|
| `purpose` | Para qué sirve la vista. |
| `fields` | Qué datos pide y con qué formato. |
| `action` | Qué ocurre al guardar, corregir o eliminar. |
| `disabled` | Por qué un botón o dato no está disponible para el rol actual. |

Reglas de redacción: español claro, terminología US7, sin `?` corrupto, sin HU7 y sin prometer autenticación. Los estados vacío, parcial y no autorizado siempre tienen texto visible.

## 6. Contrato de verificación

| Comando | Momento | Resultado esperado |
|---|---|---|
| `npm test -- --run` | Antes de implementar y al final de cada historia | Primero corrige los 8 fallos base; luego 0 fallos. |
| `npm run build` | Cierre de feature | Compila y regenera `dist/` sin caracteres `?` en `dist/index.html`. |

Verificación manual mínima en `quickstart.md`: precarga en navegador limpio, supervisor incompleto/completo, edición fuera de alcance, cambio de rol con formulario abierto y lectura de ayudas.

## 7. Trazabilidad

| Requisitos | Contrato |
|---|---|
| FR-001 a FR-007 | §2 |
| FR-008 a FR-022 | §3 y §5 |
| FR-052 a FR-065 | §1, §4 y §5 |
| SC-001 a SC-010 | §2, §4 y §6 |
