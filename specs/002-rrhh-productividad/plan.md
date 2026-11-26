# Implementation Plan: Módulo de RR. HH. — Historial de Productividad Laboral

**Rama**: `003-roles-acceso-cafeteria` | **Fecha**: 2026-11-26 | **Especificación**: `specs/002-rrhh-productividad/spec.md` | **Estado**: Implementación y prueba técnica con 500 registros completadas; suite automatizada aprobada (16 archivos, 180 pruebas). Roles activos FR-052 a FR-065 verificados. Pendientes las mediciones manuales de SC-001 a SC-003 y usuarios reales para SC-004.

**Entrada**: Especificación 002 con sus 4 historias de usuario, los requisitos FR-052 a FR-065 de control de acceso por rol activo y decisiones aprobadas; MER de 9 entidades documentado en `specs/001-erp-base-module/data-model.md` como referencia. **Rol de planificación y tareas**.

**Nota sobre el modelo de datos**: El MER de 9 entidades de 001 se conserva sin modificaciones y se utiliza como referencia. El incremento 002 se apoya en `Entity`/Trabajador, `Departamento`, `Historial_Departamento` y `Document`. `specs/002-rrhh-productividad/data-model.md` está completado y verificado contra el MER; sirvió de entrada para generar `tasks.md`. No se crean entidades nuevas; el rol activo es un estado de interfaz, no una entidad del MER.

## Summary

El incremento 002 conserva el contexto de cafetería, los turnos Mañana/Tarde y las metas de ventas, y añade un selector de rol activo con tres perfiles: Administrador / Gerente de Cafetería, Jefe de Turno / Supervisor y Barista / Trabajador (Solo lectura). El enfoque técnico reutiliza el ERP base, conserva el MER de nueve entidades, mantiene el almacenamiento local y deriva el alcance de datos de las estructuras ya existentes. El rol no autentica identidad: habilita u oculta vistas, botones y acciones.

## Technical Context

**Language/Version**: JavaScript del proyecto base, ejecutado con Vite.

**Primary Dependencies**: Vite, Vitest y jsdom, ya presentes en `package.json`; no se incorporan dependencias nuevas.

**Storage**: almacenamiento local del navegador mediante las colecciones ya documentadas en `contracts/storage.md`, más el estado de rol activo como dato demostrativo de interfaz.

**Testing**: Vitest con pruebas unitarias y de integración; verificación manual guiada por `quickstart.md`.

**Target Platform**: navegador de escritorio, aplicación local sin backend.

**Project Type**: aplicación web de una sola página, implementada como extensión aditiva del módulo ERP base.

**Performance Goals**: SC-003 (consulta de historial en menos de 10 segundos), SC-006 (utilizable con 500 registros) y SC-016 (cambio de rol aplicado en menos de 5 segundos).

**Constraints**: sin backend, sin autenticación con credenciales, sin datos reales de trabajadores, sin modificaciones al MER y sin reemplazo de contratos del módulo base.

**Scale/Scope**: una cafetería, tres departamentos (Barra, Cocina, Salón), dos turnos (Mañana, Tarde), tres roles activos y hasta 500 registros de productividad verificados.

No hay aspectos pendientes de clarificación. El alcance del Supervisor se resuelve con la selección explícita de área y turno; el alcance del Barista con la selección explícita de su trabajador.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación | Evidencia en el plan |
|---|---|---|
| I. Code Quality & Maintainability | Pasa | Extensiones aditivas, contratos base intactos, estado de rol documentado sin nueva entidad del MER. |
| II. Test-First & Verification | Pasa | T107 y T112 preparan pruebas antes o junto con la implementación de roles; T081 ejecuta la suite completa. |
| III. User Experience Consistency | Pasa | Mismo selector visible en todas las vistas, cambio inmediato, botones ocultos o deshabilitados y mensajes claros ante acciones bloqueadas. |
| IV. Performance & Reliability | Pasa | SC-016 limita el cambio de rol a 5 segundos; SC-006 cubre 500 registros; FR-063 prohíbe mutar datos al cambiar de rol. |
| Quality Standards | Pasa | `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md` y README se actualizan en este incremento documental. |
| Development Workflow | Pasa | Cambio pequeño y revisable, con criterios de aceptación por rol y verificación pendiente en T083 y T112. |

No se identifican violaciones que requieran justificación.

## Project Structure

### Documentation (this feature)

```text
specs/002-rrhh-productividad/
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas, incluida la selección de roles
├── data-model.md        # Estado de rol activo, alcance y validaciones
├── quickstart.md        # Guía de validación por rol
├── contracts/
│   └── storage.md       # Contrato de persistencia local y estado de rol
├── tasks.md             # Tareas, incluida la Fase 10 de control de acceso
└── checklists/
    └── requirements.md  # Checklist de calidad de la especificación
```

### Source Code (repository root)

```text
src/
├── app.js
├── main.js
├── storage.js
├── module-config.js
├── components/
│   ├── entity-form.js
│   ├── entity-list.js
│   ├── custom-fields.js
│   ├── document-form.js
│   ├── document-list.js
│   ├── history-view.js
│   ├── evolution-view.js
│   └── dashboard.js
tests/
├── unit/
└── integration/
```

**Structure Decision**: se mantienen los archivos reales recuperados del módulo base. El selector de rol y las reglas de alcance se integran en `app.js`, `main.js`, `module-config.js` y `storage.js` según corresponda, sin crear un módulo autónomo ni modificar el MER.

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

- **Administrador / Gerente de Cafetería**: necesita registrar y editar trabajadores de Barra, Cocina y Salón; gestionar departamentos, asignaciones históricas y turnos Mañana/Tarde; administrar metas de ventas globales; registrar, corregir y consultar mediciones; y revisar historial y evolución de cualquier trabajador. Accede a todas las vistas y acciones.
- **Jefe de Turno / Supervisor**: corresponde al jefe de barra, jefe de cocina o encargado de salón. Consulta mediciones, historial y evolución solo de su área y turno seleccionados, y puede registrar y corregir mediciones dentro de ese alcance. No crea ni edita trabajadores, departamentos, asignaciones o turnos, ni modifica metas de ventas globales.
- **Barista / Trabajador (Solo lectura)**: consulta únicamente su propio desempeño y evolución, usando el trabajador propio seleccionado en la interfaz. No accede a formularios de registro ni a datos de otros trabajadores.

**Alcance del MVP**: el selector de rol activo habilita u oculta vistas, botones y acciones, pero NO autentica ni verifica identidad real. Cualquier persona con acceso al navegador puede cambiar el rol activo; por ello solo deben utilizarse datos ficticios. La dirección o gerencia queda representada por el rol Administrador / Gerente de Cafetería.

## 3. Funciones del MVP (alcance obligatorio)

1. **Gestión de trabajadores y departamentos**: registrar y editar trabajadores con nombre, código, cargo, fecha de ingreso y estado laboral; registrar y editar departamentos; administrar asignaciones históricas por períodos. El departamento actual del trabajador se conserva para consulta operativa y las asignaciones históricas se conservan en `Historial_Departamento`. No se eliminan físicamente trabajadores con historial; se permite marcarlos como Inactivos. No se eliminan departamentos con relaciones históricas mientras no exista una política de conservación.

2. **Registro de productividad periódica**: alta de un registro (`Document`) que asocia trabajador (`entity_id`), período (`startDate`/`endDate` correspondientes al primer y último día del mes, mostrado como `AAAA-MM`), indicador, resultado numérico, unidad y `asignacionId`. La asignación debe existir, corresponder al trabajador y superponerse con el período. Si existen varias asignaciones durante un mismo mes, el usuario debe seleccionar la correspondiente. Los registros duplicados del mismo trabajador, período e indicador se permiten con advertencia. Un registro nuevo no modifica los registros de otros períodos; la corrección solo modifica el registro seleccionado y aplica las validaciones correspondientes. Además, el sistema sugiere automáticamente los indicadores según el cargo del trabajador, permite registrar el turno (Mañana o Tarde), la meta esperada por separado del resultado, una evaluación cualitativa en escala 1-5 (calidad, responsabilidad, cumplimiento de procedimientos, colaboración), y campos de observaciones y oportunidades de mejora. Estos nuevos campos son opcionales para mantener compatibilidad con registros anteriores.

3. **Consulta del historial laboral**: al seleccionar un trabajador se listan sus registros de productividad ordenados cronológicamente. Cada registro muestra período, departamento correspondiente a su asignación histórica, indicador, resultado y unidad. La edición del trabajador no afecta a sus documentos. Si no existen mediciones, se informa la ausencia de datos. No se sobrescriben resultados anteriores.

4. **Visualización de la evolución**: presentar los resultados históricos en tablas o paneles resumidos. Solo se comparan mediciones del mismo indicador y la misma unidad. No se comparan como equivalentes indicadores o unidades diferentes. Si no existen datos suficientes, se informa la situación. No se calcula una puntuación única automática ni se emiten juicios de desempeño. La comparación entre departamentos o trabajadores queda fuera del alcance.

5. **Control de acceso por rol activo**: selector con tres roles que regula vistas, botones, acciones y alcance de datos. El Administrador accede a todo; el Supervisor queda limitado a medición, historial y evolución de su área y turno; el Barista solo consulta su propio desempeño y evolución. La configuración de metas de ventas globales es administrativa, sin exponer las variables consolidadas internas.

**Fuera del alcance de 002**: planilla, remuneraciones, contratos y liquidaciones de sueldo; comparación de productividad entre departamentos o trabajadores; catálogo avanzado de indicadores y fórmulas; cálculo automático de una puntuación única de productividad; autenticación con credenciales, inicio de sesión y verificación de identidad real; auditoría de modificaciones; exportación, respaldo central y sincronización multiusuario; backend y base de datos remota; uso de información real de trabajadores.

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
| E8 - Control de acceso por rol activo | Selector de tres roles, vistas y botones por rol, alcance de datos por departamento histórico/turno/trabajador propio y bloqueo de acciones no permitidas (FR-052 a FR-065). | E7 | Completado; tareas T106–T112 cerradas |

**Regla de dependencias cumplida**: E0, E2 y E3 habilitaron E4; E4 habilitó E5; E5 habilitó E6; E7 integró el incremento y aprobó la suite automatizada; E8 depende de E7 porque las reglas de alcance se aplican sobre vistas y datos ya existentes. La validación manual final y la verificación de roles permanecen pendientes.

**Criterios de finalización**: las etapas de implementación quedaron terminadas cuando sus entregables existen, fueron revisados y satisfacen las funciones del MVP sin regresiones. La recuperación del código base quedó completada; las verificaciones manuales y aprobaciones de cierre pendientes se detallan en §10.

## 5. Roles de trabajo del equipo (distintos de los roles de acceso de la aplicación)

| Rol | Responsabilidad | Entregables |
|---|---|---|
| Rol 1 — Especificación y documentación funcional | Problema, usuarios, alcance, historias de usuario, criterios de aceptación y alineación de la documentación general. | `spec.md` y alineación de `README.md` |
| Rol 2 — Modelo de datos | Verificación y documentación del modelo 002 contra el MER de 9 entidades de 001, sin modificarlo. | `specs/002-rrhh-productividad/data-model.md` |
| Rol 3 — Registro e historial | Formularios de trabajadores, departamentos, asignaciones y productividad; validaciones; vista de historial. | Código de registro y consulta, y sus pruebas |
| Rol 4 — Planificación y tareas | Alcance, etapas, dependencias, tareas, pruebas y riesgos. | `plan.md` y `tasks.md` |
| Rol 5 — Visualización e integración | Tablas o paneles resumidos, integración con el registro, pruebas de ejecución e instrucciones. | Código de visualización, integración y documentación de ejecución |

Estos roles de trabajo no deben confundirse con los tres roles activos de la aplicación. La responsabilidad de cada historia de usuario quedó asignada por el grupo y se conserva en `spec.md` §14.1: Daphnne Hidalgo Mundaca (HU1), Bruno Phillipe Cabalin Ferreira (HU2), Consuelo Estefania Hidalgo Salgado (HU3) y Bastián Ignacio Reinado Bravo (HU4). Lucas Soarzo Mancilla y Emilio Vejar Bravo conservan el soporte de integración, pruebas manuales y validación documental, incluida la verificación de FR-052 a FR-065. No se inventan nombres ni archivos adicionales.

## 6. Ampliaciones futuras (fuera del alcance de 002)

- Comparación de productividad entre departamentos o trabajadores.
- Catálogo avanzado de indicadores y fórmulas.
- Cálculo automático de una puntuación única de productividad.
- Autenticación con credenciales, inicio de sesión y verificación de identidad real. El selector de roles y el control de acceso por interfaz ya están dentro del alcance de 002.
- Auditoría de modificaciones.
- Exportación, respaldo central y sincronización multiusuario.
- Backend y base de datos remota.
- Uso de información real de trabajadores.
- Integración opcional de contratos, liquidaciones, tareas, metas y registro de horas como fuentes de contexto del indicador.

## 7. Riesgos de privacidad, información laboral sensible y sesgos

**Privacidad y manejo de información sensible**:

- Los datos del módulo (nombres, cargos, ingresos y resultados individuales) son información laboral sensible. El almacenamiento del módulo base es local (`localStorage` del navegador): no hay servidor, cifrado en reposo ni copias de seguridad. Existe riesgo de pérdida de datos por limpieza del navegador y de exposición en equipos compartidos. Mitigación del MVP: documentar este límite en el `README`, usar el módulo en equipos controlados y evitar campos sensibles innecesarios. No se registran documentos, remuneraciones ni datos de salud.
- Sin backend no hay autenticación ni verificación de identidad real: el selector de rol activo limita vistas, botones, acciones y datos visibles, pero cualquier persona con acceso al navegador puede cambiar de rol. No debe presentarse como una funcionalidad de seguridad.
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
- Validaciones específicas de 002: el trabajador y el departamento deben existir; la asignación debe corresponder al trabajador y superponerse con el período; la fecha de inicio es obligatoria y válida; la fecha de término es opcional y no puede ser anterior a la fecha de inicio; no se permiten asignaciones superpuestas para el mismo trabajador; solo puede existir una asignación vigente a la vez por trabajador; el período es obligatorio y válido en formato `AAAA-MM`; no se permiten períodos futuros ni anteriores a la fecha de ingreso; el indicador es obligatorio y debe tener entre 3 y 60 caracteres; el resultado debe ser numérico y mayor o igual a cero; la unidad es opcional en el formulario de cafetería y se conserva solo para registros anteriores; los registros duplicados se permiten con advertencia; el rol activo debe ser uno de los tres definidos; el Supervisor debe tener área y turno seleccionados para ver datos; el Barista debe tener un trabajador propio seleccionado; las acciones no permitidas por rol se bloquean sin modificar datos; la corrección solo modifica el registro seleccionado; un trabajador sin asignación válida para el período no puede registrar productividad; si existen varias asignaciones que se superponen con el período, el usuario debe seleccionar la correspondiente.
- En 002, `Document` representa un registro de productividad. Las liquidaciones quedan fuera de alcance. Si posteriormente conviven documentos de productividad y liquidaciones, deberá definirse cómo distinguir ambos tipos.
- El contenido ingresado por el usuario debe mostrarse de forma segura, evitando la ejecución de scripts introducidos en campos de texto.

**Limitaciones del almacenamiento local**:

- `localStorage`: datos en el equipo del navegador, sin sincronización multiusuario ni respaldo. Si el grupo requiere datos compartidos entre encargados, deberá evaluarse un backend en una ampliación futura.
- Escala acotada: el módulo base garantiza agilidad hasta aproximadamente 500 registros de entidad. Con muchos trabajadores y períodos se debe verificar el rendimiento de listas y tablas.
- Permisos: no hay autenticación real; el rol activo acota la interfaz y los datos visibles, pero la privacidad final depende del control físico del equipo y del uso exclusivo de datos ficticios.

**Distinción MVP vs. ampliaciones**: son obligatorias únicamente las cuatro funciones de §3 sobre el modelo existente; todo lo demás queda explícitamente fuera del alcance inicial.

## 9. Documentación de implementación

- `data-model.md` completado y alineado con el MER de 9 entidades, sin modificar el MER ni crear entidades nuevas.
- Nombres de campos verificados contra las estructuras reales del módulo base.
- `README.md` actualizado con el alcance de 002, datos ficticios, almacenamiento local, selector de roles demostrativo y ausencia de autenticación.
- Responsables de las 4 historias de usuario asignados y registrados en `spec.md` §14.1 y `tasks.md` (T084 cerrado); no se modifica esa asignación al incorporar roles.
- Manejo de errores de almacenamiento implementado y probado automáticamente; texto de advertencia sobre datos ficticios aprobado por el grupo (T072).
- Coherencia entre `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md` y `tasks.md` revisada e influida por FR-052 a FR-065 (T085).
- `tasks.md` generado y actualizado con el estado real de implementación, incluida la Fase 10 pendiente de control de acceso por rol.
- Instrucciones de ejecución y validación por rol documentadas en `README.md`, `quickstart.md` y `tasks.md`.
- Mantener los cambios en la rama `003-roles-acceso-cafeteria` hasta su revisión.

## 10. Estado de tasks.md

`tasks.md` fue generado con tareas concretas de implementación y pruebas por etapa, mapeadas a los roles de trabajo de §5. La implementación, las pruebas automatizadas (16 archivos, 180 pruebas) y la prueba técnica T076 están completadas. T072, T084, T075 y T106–T112 están cerrados. Pendiente de cierre: T083 (mediciones manuales de SC-001 a SC-003 y evaluación de usuarios de SC-004). T085 y T086 quedan actualizadas con la documentación de roles; la revisión final del grupo sigue pendiente.

## Complexity Tracking

No se requieren excepciones: la constitución se cumple sin violaciones. El control de acceso se resuelve con extensiones aditivas y estado de interfaz, sin nueva entidad del MER ni dependencias nuevas.
