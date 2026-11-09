# Implementation Plan: Módulo de RR. HH. — Historial de Productividad Laboral

**Rama**: `correccion-specs-002` | **Fecha**: 2026-11-09 | **Especificación**: `specs/002-rrhh-productividad/spec.md` | **Estado**: Implementación y prueba técnica con 500 registros completadas; suite automatizada aprobada (14 archivos, 132 pruebas). Pendientes las mediciones manuales de SC-001 a SC-003, usuarios reales para SC-004 y decisiones del grupo

**Entrada**: Especificación 002 con sus 4 historias de usuario y decisiones aprobadas, y MER de 9 entidades documentado en `specs/001-erp-base-module/data-model.md` como referencia. **Rol de planificación y tareas**.

**Nota sobre el modelo de datos**: El MER de 9 entidades de 001 se conserva sin modificaciones y se utiliza como referencia. El incremento 002 se apoya en `Entity`/Trabajador, `Departamento`, `Historial_Departamento` y `Document`. `specs/002-rrhh-productividad/data-model.md` está completado y verificado contra el MER; sirvió de entrada para generar `tasks.md`. No se crean entidades nuevas.

## 1. Problema y solución propuesta

**Problema**: Las organizaciones tienen dificultades para mantener un historial centralizado de la productividad de sus trabajadores y para comprender cómo evoluciona su desempeño cuando cambian de departamento, de jefatura o de responsabilidades. Sin registros históricos organizados y no destructivos, no es posible identificar tendencias ni necesidades de capacitación.

**Solución propuesta**: Un módulo de Recursos Humanos construido sobre el módulo base del ERP, que permita registrar trabajadores, departamentos y asignaciones históricas; registrar indicadores de productividad por período; consultar el historial completo de cada trabajador sin sobrescribir resultados anteriores; y visualizar la evolución mediante tablas o paneles resumidos.

**Encaje con el modelo existente**:

- **Trabajador** → se representa con `Entity`. El `name` y `code` obligatorios del modelo base cubren nombre y código/identificación; los campos personalizados (`customFields` de `ModuleConfig`) aportan cargo, fecha de ingreso, estado laboral y departamento actual.
- **Departamento** → se representa con la entidad existente `Departamento` (`id_departamento`, `nombre`, `descripcion`).
- **Asignación histórica** → se representa con la entidad existente `Historial_Departamento` (`id_historial`, `entity_id`, `id_departamento`, `fecha_inicio`, `fecha_fin`).
- **Registro de productividad** → se representa con `Document`, vinculado al trabajador mediante `entity_id`, con período `startDate`/`endDate`, indicador, resultado, unidad y `asignacionId`.
- **ModuleConfig** → declara la identidad del módulo (labels `Trabajador` y `Registro de Productividad`), los campos personalizados del dominio y, opcionalmente, el ciclo de vida de estados del registro.

No se crean tablas ni entidades nuevas; no se alteran los nombres ni la semántica de los campos base. En 002, `Document` se utiliza para productividad y las liquidaciones quedan fuera de alcance. Si posteriormente conviven documentos de productividad y liquidaciones, deberá definirse cómo distinguir ambos tipos.

## 2. Usuarios potenciales

- **Encargado de Recursos Humanos**: necesita registrar trabajadores, gestionar departamentos y asignaciones históricas, ingresar mediciones periódicas de productividad y consultar el historial de cada trabajador.
- **Jefatura de departamento**: necesita consultar la productividad de los integrantes de su departamento para dar seguimiento a su desempeño. En el MVP, esta distinción es una necesidad de diseño y no un control de acceso implementado.
- **Dirección o gerencia (usuario potencial futuro)**: podría consultar información resumida para apoyar la toma de decisiones.

**Limitación del MVP**: no se implementa autenticación, inicio de sesión, roles ni control de acceso. La distinción entre tipos de usuarios describe sus necesidades, pero no representa una restricción de seguridad implementada. Solo deben utilizarse datos ficticios.

## 3. Funciones del MVP (alcance obligatorio)

1. **Gestión de trabajadores y departamentos**: registrar y editar trabajadores con nombre, código, cargo, fecha de ingreso y estado laboral; registrar y editar departamentos; administrar asignaciones históricas por períodos. El departamento actual del trabajador se conserva para consulta operativa y las asignaciones históricas se conservan en `Historial_Departamento`. No se eliminan físicamente trabajadores con historial; se permite marcarlos como Inactivos. No se eliminan departamentos con relaciones históricas mientras no exista una política de conservación.

2. **Registro de productividad periódica**: alta de un registro (`Document`) que asocia trabajador (`entity_id`), período (`startDate`/`endDate` correspondientes al primer y último día del mes, mostrado como `AAAA-MM`), indicador, resultado numérico, unidad y `asignacionId`. La asignación debe existir, corresponder al trabajador y superponerse con el período. Si existen varias asignaciones durante un mismo mes, el usuario debe seleccionar la correspondiente. Los registros duplicados del mismo trabajador, período e indicador se permiten con advertencia. Un registro nuevo no modifica los registros de otros períodos; la corrección solo modifica el registro seleccionado y aplica las validaciones correspondientes.

3. **Consulta del historial laboral**: al seleccionar un trabajador se listan sus registros de productividad ordenados cronológicamente. Cada registro muestra período, departamento correspondiente a su asignación histórica, indicador, resultado y unidad. La edición del trabajador no afecta a sus documentos. Si no existen mediciones, se informa la ausencia de datos. No se sobrescriben resultados anteriores.

4. **Visualización de la evolución**: presentar los resultados históricos en tablas o paneles resumidos. Solo se comparan mediciones del mismo indicador y la misma unidad. No se comparan como equivalentes indicadores o unidades diferentes. Si no existen datos suficientes, se informa la situación. No se calcula una puntuación única automática ni se emiten juicios de desempeño. La comparación entre departamentos o trabajadores queda fuera del alcance.

**Fuera del alcance de 002**: planilla, remuneraciones, contratos y liquidaciones de sueldo; comparación de productividad entre departamentos o trabajadores; catálogo avanzado de indicadores y fórmulas; cálculo automático de una puntuación única de productividad; autenticación, inicio de sesión, roles y control de acceso; auditoría de modificaciones; exportación, respaldo central y sincronización multiusuario; backend y base de datos remota; uso de información real de trabajadores.

Las funcionalidades de planilla y liquidaciones permanecen documentadas en el modelo 001 y en el MER existente; no se elimina su documentación. Las entidades `Tarea`, `Meta` y `Registro_Horas` permanecen en el MER, pero no se utilizan como flujos de negocio en 002. Su integración completa queda fuera del alcance de este incremento.

## 4. Etapas de desarrollo y dependencias

| Etapa | Contenido | Depende de | Estado |
|---|---|---|---|
| E0 - Recuperación/verificación del módulo base | Restaurado y verificado en el árbol de trabajo; `src/`, `index.html` y `tests/` están operativos. | - | Completada |
| E1 - Especificación funcional | `spec.md` con problema, usuarios, alcance, 4 historias de usuario, criterios de aceptación, reglas de validación y criterios de éxito. | - | Completada |
| E2 - Modelo de datos 002 | `data-model.md` alineado con el MER de 9 entidades de 001; sin entidades nuevas; verificación de campos y relaciones. | E1 | Completada |
| E3 - Planificación y tareas | `plan.md` y `tasks.md` con alcance, etapas, dependencias, tareas, pruebas y riesgos. | E1, E2 | Completada |
| E4 - Gestión de trabajadores, departamentos y asignaciones | Formularios de trabajadores y departamentos, asignaciones históricas, validaciones y vista del departamento actual con asignaciones anteriores. | E0, E2, E3 | Completada |
| E5 - Registro e historial de productividad | Formulario de medición por período, selección de asignación, validaciones y consulta cronológica del historial. | E4 | Completada |
| E6 - Visualización de la evolución | Tablas o paneles resumidos de resultados históricos comparables. | E5 | Completada |
| E7 - Integración, pruebas y documentación de ejecución | Integración de E4, E5 y E6; suite automatizada aprobada e instrucciones de ejecución. La validación manual de cierre sigue pendiente. | E4, E5, E6 | Implementación y pruebas automatizadas completadas; validación manual pendiente |

**Regla de dependencias cumplida**: E0, E2 y E3 habilitaron E4; E4 habilitó E5; E5 habilitó E6; E7 integró el incremento y aprobó la suite automatizada. La validación manual final permanece pendiente.

**Criterios de finalización**: las etapas de implementación quedaron terminadas cuando sus entregables existen, fueron revisados y satisfacen las funciones del MVP sin regresiones. La recuperación del código base quedó completada; las verificaciones manuales y aprobaciones de cierre pendientes se detallan en §10.

## 5. Roles de trabajo (sin asignación nominal)

| Rol | Responsabilidad | Entregables |
|---|---|---|
| Rol 1 — Especificación y documentación funcional | Problema, usuarios, alcance, historias de usuario, criterios de aceptación y alineación de la documentación general. | `spec.md` y alineación de `README.md` |
| Rol 2 — Modelo de datos | Verificación y documentación del modelo 002 contra el MER de 9 entidades de 001, sin modificarlo. | `specs/002-rrhh-productividad/data-model.md` |
| Rol 3 — Registro e historial | Formularios de trabajadores, departamentos, asignaciones y productividad; validaciones; vista de historial. | Código de registro y consulta, y sus pruebas |
| Rol 4 — Planificación y tareas | Alcance, etapas, dependencias, tareas, pruebas y riesgos. | `plan.md` y `tasks.md` |
| Rol 5 — Visualización e integración | Tablas o paneles resumidos, integración con el registro, pruebas de ejecución e instrucciones. | Código de visualización, integración y documentación de ejecución |

La asignación de estos roles a integrantes del grupo y la responsabilidad de cada historia de usuario quedan pendientes de confirmación, según `spec.md` §14.1. No se inventan nombres de responsables ni archivos existentes. Los nombres de archivos de código se confirmaron después de E0, según la estructura real del módulo base.

## 6. Ampliaciones futuras (fuera del alcance de 002)

- Comparación de productividad entre departamentos o trabajadores.
- Catálogo avanzado de indicadores y fórmulas.
- Cálculo automático de una puntuación única de productividad.
- Autenticación, inicio de sesión, roles y control de acceso.
- Auditoría de modificaciones.
- Exportación, respaldo central y sincronización multiusuario.
- Backend y base de datos remota.
- Uso de información real de trabajadores.
- Integración opcional de contratos, liquidaciones, tareas, metas y registro de horas como fuentes de contexto del indicador.

## 7. Riesgos de privacidad, información laboral sensible y sesgos

**Privacidad y manejo de información sensible**:

- Los datos del módulo (nombres, cargos, ingresos y resultados individuales) son información laboral sensible. El almacenamiento del módulo base es local (`localStorage` del navegador): no hay servidor, cifrado en reposo ni copias de seguridad. Existe riesgo de pérdida de datos por limpieza del navegador y de exposición en equipos compartidos. Mitigación del MVP: documentar este límite en el `README`, usar el módulo en equipos controlados y evitar campos sensibles innecesarios. No se registran documentos, remuneraciones ni datos de salud.
- Sin backend no hay control de acceso real: la distinción entre encargado de RR. HH. y jefatura de departamento es, en el MVP, una decisión de diseño sin enforcement técnico. No debe presentarse como una funcionalidad de seguridad.
- La política de retención y borrado de datos queda pendiente de definición. El sistema no garantiza respaldo ni recuperación de datos eliminados del navegador.
- Si el almacenamiento local está lleno o no disponible, el sistema debe informar que no pudo guardar los datos y evitar mostrar una confirmación de guardado exitoso. Este comportamiento debe validarse con el grupo.
- La aplicación debe mostrar una advertencia de uso exclusivo de datos ficticios. No se garantiza la detección automática de información real. Este comportamiento debe validarse con el grupo.

**Sesgos en los indicadores de productividad**:

- Un indicador puntual no mide el desempeño completo de una persona y puede perjudicar cargos cuyo trabajo no se cuenta en esas unidades. El módulo debe conservar indicador y unidad con cada registro y no traducir un número a una evaluación automática.
- Existe riesgo de comparar entre roles, departamentos o períodos sin contexto (carga de trabajo, antigüedad, permisos, disponibilidad de herramientas).
- Los indicadores pueden incentivar el sobreajuste al número y penalizar tareas de apoyo o formación.
- Los cambios de definición del indicador a lo largo del tiempo invalidan comparaciones. En 002 se documenta esta limitación y no se agrega un campo de versión del indicador.
- Decisión metodológica: el historial es material de análisis y conversación, no de evaluación automática ni de decisión unipersonal.

## 8. Decisiones metodológicas y de datos, y compatibilidad con el ERP base

**Conservación del historial ante cambios de departamento**:

- El departamento actual del trabajador se almacena como campo del trabajador para consulta operativa.
- Las asignaciones históricas se almacenan en `Historial_Departamento`, con `entity_id`, `id_departamento`, `fecha_inicio` y `fecha_fin`.
- Cada registro de productividad guarda `asignacionId`, que referencia la asignación histórica correspondiente.
- El departamento mostrado en una medición se obtiene de su asignación histórica, no necesariamente del departamento actual del trabajador. Así, si un trabajador cambia de departamento en marzo, sus registros de enero y febrero conservan la asignación y el departamento con los que se registraron.
- No se duplica el departamento como una copia independiente dentro del registro de productividad; se conserva la referencia a la asignación.
- Editar un trabajador no debe alterar los registros ya guardados. No se ofrece eliminación física de trabajadores con historial; se permite marcarlos como Inactivos. No se elimina físicamente un departamento con relaciones históricas mientras no exista una política de conservación.

**Compatibilidad con el ERP base**:

- Se usan únicamente `Entity`, `Document`, `ModuleConfig`, `Departamento` y `Historial_Departamento` con sus nombres y semántica intactos. Toda la especialización pasa por `labels`, `customFields` y, opcionalmente, `statusLifecycle`. 
Se permiten extensiones aditivas de los archivos existentes del módulo ERP base, incluyendo almacenamiento, configuración, interfaz y componentes, siempre que se conserven los contratos, las funciones existentes y la compatibilidad con el módulo original. No se deben eliminar ni reemplazar funcionalidades base innecesariamente. Las estructuras de Departamento e Historial_Departamento se implementarán como extensiones del incremento 002, sin modificar el MER de nueve entidades.

- Se respeta la validación base: trabajador con `name` y `code` no vacíos; fechas válidas y `endDate >= startDate`; claves de campos personalizados sin choque con nombres base; retroalimentación clara ante datos faltantes.
- Validaciones específicas de 002: el trabajador y el departamento deben existir; la asignación debe corresponder al trabajador y superponerse con el período; la fecha de inicio es obligatoria y válida; la fecha de término es opcional y no puede ser anterior a la fecha de inicio; no se permiten asignaciones superpuestas para el mismo trabajador; solo puede existir una asignación vigente a la vez por trabajador; el período es obligatorio y válido en formato `AAAA-MM`; no se permiten períodos futuros ni anteriores a la fecha de ingreso; el indicador es obligatorio y debe tener entre 3 y 60 caracteres; el resultado debe ser numérico y mayor o igual a cero; la unidad es obligatoria y no vacía; los registros duplicados se permiten con advertencia; la corrección solo modifica el registro seleccionado; un trabajador sin asignación válida para el período no puede registrar productividad; si existen varias asignaciones que se superponen con el período, el usuario debe seleccionar la correspondiente.
- En 002, `Document` representa un registro de productividad. Las liquidaciones quedan fuera de alcance. Si posteriormente conviven documentos de productividad y liquidaciones, deberá definirse cómo distinguir ambos tipos.
- El contenido ingresado por el usuario debe mostrarse de forma segura, evitando la ejecución de scripts introducidos en campos de texto.

**Limitaciones del almacenamiento local**:

- `localStorage`: datos en el equipo del navegador, sin sincronización multiusuario ni respaldo. Si el grupo requiere datos compartidos entre encargados, deberá evaluarse un backend en una ampliación futura.
- Escala acotada: el módulo base garantiza agilidad hasta aproximadamente 500 registros de entidad. Con muchos trabajadores y períodos se debe verificar el rendimiento de listas y tablas.
- Permisos: no hay autenticación real; la privacidad depende del control físico del equipo.

**Distinción MVP vs. ampliaciones**: son obligatorias únicamente las cuatro funciones de §3 sobre el modelo existente; todo lo demás queda explícitamente fuera del alcance inicial.

## 9. Documentación de implementación

- `data-model.md` completado y alineado con el MER de 9 entidades, sin modificar el MER ni crear entidades nuevas.
- Nombres de campos verificados contra las estructuras reales del módulo base.
- `README.md` actualizado con el alcance de 002, datos ficticios, almacenamiento local y ausencia de autenticación.
- Confirmar los responsables de las 4 historias de usuario y registrarlos en `spec.md` §14.1 y en `tasks.md` (pendiente de asignación por el grupo; T084).
- Manejo de errores de almacenamiento implementado y probado automáticamente; aprobación del texto de advertencia sobre datos ficticios pendiente con el grupo (T072).
- Coherencia entre `spec.md`, `plan.md`, `data-model.md` y `tasks.md` revisada (T085).
- `tasks.md` generado y actualizado con el estado real de implementación.
- Instrucciones de ejecución y prueba documentadas en `README.md` y `tasks.md`.
- Mantener los cambios en la rama `correccion-specs-002` hasta su revisión.

## 10. Estado de tasks.md

`tasks.md` fue generado con tareas concretas de implementación y pruebas por etapa, mapeadas a los roles de §5. La implementación, las pruebas automatizadas y la prueba técnica T076 están completadas. Pendientes de cierre: T072 (aprobación de advertencia), T083 (mediciones manuales de SC-001 a SC-003 y evaluación de usuarios de SC-004) y T084 (asignación de responsables). T085 y T086 están completadas; la revisión final del grupo sigue pendiente.
