# Contrato de persistencia local — Incremento 002

El MVP no expone una API HTTP. Su contrato de datos local reutiliza las colecciones JSON de `localStorage`:

| Clave | Registro almacenado | Referencias principales |
|---|---|---|
| `erp_base_module:entities` | `Entity` / trabajador | `entity_id`; `departamentoId` identifica el departamento actual |
| `erp_base_module:documents` | `Document` / medición | `entity_id`; campos `indicador`, `resultado`, `unidad` y `asignacionId` |
| `erp_base_module:departamentos` | `Departamento` | `id_departamento` |
| `erp_base_module:historial_departamentos` | `Historial_Departamento` | `id_historial`, `entity_id`, `id_departamento`, `fecha_inicio`, `fecha_fin` |

Los campos y reglas completos se describen en `../data-model.md`. Una medición referencia una asignación del mismo trabajador; no se agregan campos ni entidades al MER.
