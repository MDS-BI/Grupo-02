# Contrato de persistencia local y control por rol — Incremento 002

El MVP no expone una API HTTP. Su contrato de datos local reutiliza las colecciones JSON del almacenamiento local del navegador e incorpora un estado demostrativo de rol.

| Clave | Registro almacenado | Referencias principales |
|---|---|---|
| `erp_base_module:entities` | `Entity` / trabajador | `entity_id`; `departamentoId` identifica el departamento actual |
| `erp_base_module:documents` | `Document` / medición | `entity_id`; campos `indicador`, `resultado`, `meta`, `turno` y `asignacionId` |
| `erp_base_module:departamentos` | `Departamento` | `id_departamento`; Barra, Cocina y Salón en la cafetería |
| `erp_base_module:historial_departamentos` | `Historial_Departamento` | `id_historial`, `entity_id`, `id_departamento`, `fecha_inicio`, `fecha_fin` |
| `erp_base_module:metas_consolidadas` | Meta consolidada calculada internamente | `departamentoId`, `periodo`, `metaConsolidada`, `resultadoConsolidado`; suma por departamento y período, no se muestra en la interfaz (FR-043 a FR-051) |
| `erp_base_module:metas_globales` | Metas globales de ventas configurables | `area`, `periodo`, `metaGlobal`; solo Administrador / Gerente de Cafetería (FR-062) |
| `erp_base_module:rol_activo` | Estado de interfaz del rol activo | `rolActivo`, `supervisorArea`, `supervisorTurno`, `baristaEntityId`; no es una entidad del MER (FR-052 a FR-065) |

## Estado de rol activo

```json
{
  "rolActivo": "supervisor",
  "supervisorArea": "Barra",
  "supervisorTurno": "Mañana",
  "baristaEntityId": ""
}
```

- `rolActivo` acepta `administrador`, `supervisor` o `barista`. Si falta o es inválido, se aplica `administrador`.
- `supervisorArea` y `supervisorTurno` son obligatorios solo cuando `rolActivo` es `supervisor`.
- `baristaEntityId` es obligatorio solo cuando `rolActivo` es `barista` y referencia `Entity.entity_id`.
- El cambio de rol es inmediato y no modifica los datos de negocio.
- El selector no autentica identidad real.

## Contrato de vistas y acciones por rol

| Rol activo | Vistas habilitadas | Botones y acciones habilitados | Vistas y acciones ocultas o bloqueadas |
|---|---|---|---|
| `administrador` | Todas | Gestión de trabajadores, departamentos, asignaciones y turnos; metas de ventas globales; registro y corrección de mediciones; historial y evolución de cualquier trabajador | Ninguna dentro de 002 |
| `supervisor` | Medición, Historial por área/turno y Evolución por área/turno | Nueva medición y corregir medición solo dentro del área y turno seleccionados | Gestión de trabajadores, departamentos, asignaciones y turnos; metas de ventas globales; datos de otras áreas o turnos |
| `barista` | Mi desempeño y Mi evolución | Solo consulta del trabajador propio seleccionado | Formularios de registro y corrección; gestión; metas globales; datos de otros trabajadores |

El alcance del Supervisor usa el departamento histórico resuelto desde `asignacionId`, no el departamento actual del trabajador. El campo individual `meta` de una medición permitida permanece visible para administrador y supervisor; las variables consolidadas de `erp_base_module:metas_consolidadas` permanecen ocultas.

Los campos y reglas completos se describen en `../data-model.md`. Una medición referencia una asignación del mismo trabajador; no se agregan entidades ni campos laborales al MER.
