# Implementation Plan: Módulo de RR. HH. — Historial de Productividad Laboral

**Branch**: `002-rrhh-productividad` | **Date**: 2026-10-20 | **Spec**: specs/002-rrhh-productividad/ (spec.md pendiente)

**Input**: Modelo de datos existente en `specs/001-erp-base-module/data-model.md` y especificación en `specs/001-erp-base-module/spec.md` | **Persona 4 — Planificación y tareas**

**Nota sobre el modelo de datos**: No existe un `data-model.md` específico de Recursos Humanos en el repositorio al momento de escribir este plan (el MER de la Persona 2 aún no se ha incorporado). Por lo tanto, este plan se apoya exclusivamente en el modelo de datos existente y aprobado del módulo base: **Entity**, **Document** y **ModuleConfig**. No se definieron entidades nuevas. Cuando la Persona 2 publique su `data-model.md`/`mer.png`, si introduce cambios, deberán reflejarse aquí como actualización, sin alterar retroactivamente las decisiones de alcance de este documento.

## 1. Problema y solución propuesta

**Problema**: Las organizaciones tienen dificultades para mantener un historial centralizado de la productividad de sus trabajadores y para comprender cómo evoluciona su desempeño cuando cambian de equipo, cargo o responsabilidades. Sin registros históricos organizados y no destructivos, no es posible identificar tendencias ni necesidades de capacitación.

**Solución propuesta**: Un módulo de Recursos Humanos construido sobre el módulo base del ERP, que permita registrar trabajadores y equipos, registrar indicadores de productividad por período, consultar el historial completo de cada trabajador sin sobrescribir resultados anteriores, y visualizar la evolución mediante tablas o gráficos.

**Encaje con el modelo existente**: El módulo base ya define los mecanismos de extensibilidad necesarios (XR-001 a XR-005):

- **Entity** → representa a cada **trabajador**. El `name` y `code` obligatorios del modelo base cubren nombre y código/identificación del trabajador; los campos personalizados (`customFields` de ModuleConfig) aportan cargo, fecha de ingreso, equipo y departamento.
- **Document** → representa cada **registro de productividad de un período**. Cada registro es un documento distinto vinculado al trabajador mediante `entity_id`, con `startDate`/`endDate` como período evaluado. Al ser documentos independientes por período, **la consulta del historial no sobrescribe resultados anteriores**: es una consecuencia directa del modelo, no una lógica especial nueva.
- **ModuleConfig** → declara la identidad del módulo (labels `Trabajador`/`Registro de Productividad`), los campos personalizados del dominio (indicador, resultado, unidad, equipo del período) y el ciclo de vida opcional de estados del registro.

No se crean tablas ni entidades nuevas; no se alteran los nombres ni la semántica de los campos base.

## 2. Usuarios potenciales

- **Usuario principal — Encargado de Recursos Humanos**: necesita registrar trabajadores y equipos, cargar resultados de productividad por período, consultar el historial de cualquier trabajador y ver su evolución. Tiene acceso completo.
- **Usuario secundario — Jefatura de equipo**: necesita consultar la evolución de su equipo con acceso limitado a la información que le corresponde. En el MVP, este control de acceso es una restricción de diseño documentada, no una funcionalidad implementada (ver §8).
- **Usuario potencial futuro — Dirección/gerencia**: consumo de tablas y gráficos agregados; sin alta de datos en el MVP.

## 3. Funciones del MVP (alcance obligatorio)

Las cuatro funciones definidas en el documento del proyecto, con su equivalencia sobre el modelo existente:

1. **Registrar trabajadores y equipos**: alta, edición y listado de trabajadores (Entity) con su nombre, código, cargo y equipo/departamento. La pertenencia a equipo se guarda como campo personalizado del trabajador para la consulta operativa, y **la asignación vigente se conserva junto al registro de productividad correspondiente** (§7) para no perder el contexto histórico.
2. **Registrar productividad por período**: alta de un registro (Document) que asocia trabajador (`entity_id`), período (`startDate`/`endDate`), indicador, resultado y unidad (campos personalizados). Cada período genera un documento nuevo; nunca se reescribe un registro ya guardado.
3. **Consultar el historial sin sobrescribir resultados anteriores**: al seleccionar un trabajador se listan todos sus documentos de productividad ordenados por período, con búsqueda y filtro. La edición de un registro no afecta a los demás; la edición del trabajador no afecta a sus documentos (la integridad referencial `entity_id` los mantiene vinculados).
4. **Visualizar la evolución mediante tablas o gráficos**: vista de tablas con los valores por período y una representación gráfica de la serie temporal individual. La comparación entre equipos queda como ampliación futura (§6).

**Fuera del alcance del MVP** (justificación en §8): implementación completa de contratos y liquidaciones (LIQUIDACION/DETALLE_LIQUIDACION) y de tareas/metas (TAREA/META/REGISTRO_HORAS) como flujos de negocio completos. Su relación con el objetivo de productividad es indirecta: pueden aportar el dato de horas o el contexto contractual que explique un indicador, pero el MVP se sostiene con el registro directo del indicador por período. Integrarlos de forma completa obligaría a construir primero un módulo de nómina completo, lo que excede la meta de "historial de productividad". Si el MER de la Persona 2 los incluye, se conservan como entidades del modelo y se usan opcionalmente como fuente de contexto en ampliaciones.

## 4. Etapas de desarrollo y dependencias

| Etapa | Contenido | Depende de | Estado |
|---|---|---|---|
| E0 — Especificación | Problema, usuarios, historias de usuario y criterios de aceptación (`spec.md`) | — | Persona 1 |
| E1 — Modelo de datos | Entidades, atributos, claves, relaciones y MER (`data-model.md`, `mer.png`) | E0 | Persona 2 (pendiente de incorporar al repo) |
| E2 — Planificación | Alcance, etapas, responsables y riesgos (`plan.md`, `tasks.md`) | E0, E1 | Este archivo |
| E3 — Registro e historial | Formularios de trabajadores y de productividad por período; validaciones; vista de historial | E1 (modelo), E2 (tareas) | Persona 3 |
| E4 — Panel y visualización | Panel principal, contadores, tablas y gráficos de evolución | E3 (necesita datos registrados) | Persona 5 |
| E5 — Integración y pruebas | Integración de E3 y E4, pruebas manuales/automatizadas, documentación de ejecución | E3, E4 | Persona 5 coordina; todo el grupo revisa |

**Regla de dependencias crítica**: no se puede cerrar E3 sin el modelo aprobado de E1; E4 no se puede demostrar sin datos creados en E3; E2 (tareas concretas de implementación, `tasks.md`) se completa una vez cerrados el modelo y este plan.

**Criterios de finalización**: cada etapa se considera terminada cuando su archivo entregable existe en el repositorio, es revisado por otra persona del grupo y satisface las funciones del MVP sin regresiones sobre lo anterior.

## 5. Responsables (cinco personas)

| Persona | Rol | Entregables |
|---|---|---|
| Persona 1 | Problema y especificaciones | `README.md`, `spec.md`: problema, usuarios, funciones del MVP, historias de usuario, criterios de aceptación, riesgos de evaluación |
| Persona 2 | Modelo de datos y MER | `data-model.md`, `mer.png`: entidades, atributos, PK/FK, relaciones, cardinalidades, conservación histórica al cambiar de equipo |
| Persona 3 | Registro e historial | Frontend de registro y consulta (p. ej. `historial.js` según propuesta del proyecto) y sus pruebas; validaciones |
| Persona 4 | Planificación y tareas | `plan.md` (este archivo) y `tasks.md`: alcance, etapas, tareas, dependencias, riesgos |
| Persona 5 | Panel e integración | Panel principal, tablas/gráficos (p. ej. `dashboard.js`), estilos, integración con Persona 3, pruebas de ejecución e instrucciones |

Los nombres de los archivos de código son propuestas del documento del proyecto y deben adaptarse a la estructura real de la plantilla.

## 6. Ampliaciones futuras (fuera del alcance inicial)

- Comparación entre equipos y períodos (el MVP solo muestra evolución individual).
- Análisis de la relación entre capacitación y productividad.
- Filtros por cargo, área y período.
- Indicadores más complejos, índices compuestos y gráficos comparativos.
- Control detallado de permisos de acceso (rol jefatura vs. encargado de RR. HH.) y trazabilidad de modificaciones.
- Integración opcional de contratos, liquidaciones, tareas, metas y registro de horas como fuentes de contexto del indicador.

## 7. Riesgos de privacidad, información laboral sensible y sesgos

**Privacidad y manejo de información sensible**:

- Los datos del módulo (nombres, cargos, ingresos, resultados individuales) son información laboral sensible. El almacenamiento del módulo base es **local (localStorage del navegador)**: no hay servidor, cifrado en reposo ni copias de seguridad. Riesgo de pérdida de datos por limpieza del navegador y de exposición en equipo compartido. Mitigación MVP: documentar este límite en el `README`, usar el módulo en equipos controlados y evitar campos sensibles innecesarios (no registrar documentación, remuneraciones ni datos de salud).
- Sin backend no hay control de acceso real: la distinción encargado de RR. HH. / jefatura es, en el MVP, una decisión de diseño sin enforcement técnico. No debe presentarse como una funcionalidad de seguridad.
- Definir desde el inicio una política de retención y borrado de datos, y quién puede consultar qué.

**Sesgos en los indicadores de productividad**:

- Un indicador puntual ("tareas completadas") no mide el desempeño completo de una persona y puede perjudicar cargos cuyo trabajo no se cuenta en esas unidades. El módulo debe conservar **indicador y unidad** con cada registro y no traducir un número a una evaluación automática.
- Riesgo de comparar entre roles, equipos o períodos sin contexto (carga de trabajo, antigüedad, permisos, disponibilidad de herramientas).
- Los indicadores pueden incentivar el sobreajuste al número y penalizar tareas de apoyo o formación.
- Los cambios de definición del indicador a lo largo del tiempo invalidan comparaciones: registrar la definición/versión del indicador cuando cambie.
- Decisión metodológica: el historial es material de **análisis y conversación**, no de evaluación automática o decisión unipersonal.

## 8. Decisiones metodológicas y de datos, y compatibilidad con el ERP base

**Conservación del historial ante cambios de equipo/departamento**:

- El equipo o departamento del trabajador se almacena como campo del trabajador para consulta operativa; **el contexto del equipo correspondiente a cada período se guarda dentro del registro de productividad (Document)**, no solo en el trabajador. Así, si un trabajador cambia de equipo en marzo, sus registros de enero y febrero conservan el equipo con el que rindió y no se le atribuyen al nuevo equipo.
- Editar o eliminar al trabajador no debe alterar los registros ya guardados (vinculados por `entity_id`). Excepción del modelo base: eliminar una entidad elimina sus documentos en cascada; **decisión del MVP: no ofrecer eliminación de trabajadores con historial** (o archivarlos) para no destruir evidencia histórica.

**Compatibilidad con el ERP base**:

- Se usa únicamente `Entity`, `Document` y `ModuleConfig` con sus nombres y semántica intactos; toda la especialización pasa por `labels`, `customFields` y, opcionalmente, `statusLifecycle`, tal como exigen XR-001 a XR-005.
- Se respeta la validación base: trabajador con `name` y `code` no vacíos; registro con fechas válidas y `endDate >= startDate`; claves de campos personalizados sin choque con nombres base; retroalimentación clara ante datos faltantes.
- El módulo se adapta por configuración sin modificar el código central del módulo base (SC-008).

**Limitaciones del almacenamiento local**:

- localStorage: datos en el equipo del navegador, sin sincronización multiusuario ni respaldo. Si el grupo requiere datos compartidos entre encargados, deberá evaluarse en una ampliación un backend.
- Escala acotada (el base garantiza agilidad hasta ~500 registros de entidad); con muchos trabajadores y períodos se debe verificar el rendimiento de listas y gráficos.
- Permisos: no hay autenticación real; la privacidad depende del control físico del equipo.

**Distinción MVP vs. ampliaciones**: son obligatorias únicamente las cuatro funciones de §3 sobre el modelo existente; todo lo demás (§6) queda explícitamente fuera del alcance inicial.

## Pendiente para tasks.md

Una vez revisado y aprobado este plan, generar `specs/002-rrhh-productividad/tasks.md` con tareas concretas de implementación y pruebas por etapa, mapeadas a las responsabilidades de §5.
