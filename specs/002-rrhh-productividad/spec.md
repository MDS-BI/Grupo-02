
# Especificación Funcional: Módulo RR. HH. e Historial de Productividad Laboral

**Identificador de funcionalidad**: `002-rrhh-productividad`\
**Rama de trabajo de Git**: `003-roles-acceso-cafeteria`\
**Creada**: 2026-10-20\
**Actualizada**: 2026-11-26\
**Estado**: Implementación completada; suite automatizada aprobada (16 archivos, 180 pruebas) y prueba técnica de 500 registros aprobada (T076). Advertencia sobre datos ficticios aprobada (T072), responsables asignados (T084) y control de acceso por roles FR-052 a FR-065 verificado (T075, T106–T112). Pendientes las mediciones manuales de SC-001 a SC-003 y la evaluación de usuarios de SC-004 (T083).
**Entrada**: Incremento 002 sobre el módulo base ERP (001). Decisiones de alcance aprobadas para esta especificación.

---

## 1. Definición del problema

Las cafeterías enfrentan dificultades para mantener un registro histórico y centralizado del desempeño, la productividad y el cumplimiento de metas de ventas de su personal a lo largo del tiempo.

Cuando un integrante del equipo cambia de área (barra, cocina o salón), de turno (mañana o tarde) o de responsabilidades, la información previa puede dispersarse o perderse, dificultando comprender su evolución, identificar tendencias de rendimiento y detectar necesidades de capacitación y apoyo.

Este módulo busca conservar las mediciones de productividad y las metas de ventas junto con el contexto del área y el turno en que cada trabajador de la cafetería realizó su actividad durante el período registrado.

---

## 2. Usuarios y necesidades

El MVP implementa un **control de acceso por interfaz basado en un rol activo seleccionable**. El selector de rol es una función demostrativa: habilita u oculta vistas, botones y acciones, pero NO verifica la identidad real de quien usa la aplicación.

- **Administrador / Gerente de Cafetería (acceso total):** necesita registrar y editar al personal de Barra, Cocina y Salón; gestionar departamentos, asignaciones históricas y turnos (Mañana o Tarde); administrar las metas de ventas globales; registrar, corregir y consultar mediciones de productividad; y revisar el historial y la evolución de cualquier trabajador. Es el único rol con acceso a todas las vistas y a todas las acciones de gestión.

- **Jefe de Turno / Supervisor (acceso operativo restringido):** corresponde al jefe de barra, jefe de cocina o encargado de salón. Necesita consultar mediciones, historial y evolución **solo de su área (Barra, Cocina o Salón) y de su turno (Mañana o Tarde)**, y puede registrar y corregir mediciones de productividad dentro de ese alcance. NO puede crear ni editar trabajadores, departamentos, asignaciones o turnos, ni modificar metas de ventas globales. Para que el alcance sea reproducible, la interfaz le permite seleccionar explícitamente su área y su turno.

- **Barista / Trabajador (Solo lectura):** necesita consultar únicamente su propio desempeño y su propia evolución. Para que el alcance sea reproducible, la interfaz le permite seleccionar explícitamente el trabajador que representa como "yo". NO tiene acceso a formularios de registro ni corrección, ni a datos de otros trabajadores, departamentos, turnos o metas globales.

La dirección o gerencia de la cafetería queda cubierta por el rol Administrador / Gerente de Cafetería en este MVP; no se incorpora un cuarto rol.

---

## 3. Alcance del MVP de 002

El incremento 002 contempla las siguientes funcionalidades:

1. **Gestión de trabajadores y departamentos:** registrar y editar trabajadores, registrar departamentos y administrar asignaciones históricas por períodos.

2. **Registro de productividad periódica:** registrar indicador, resultado numérico, unidad de medida y período, asociados al trabajador y a su asignación de departamento.

3. **Consulta del historial laboral:** mostrar cronológicamente las mediciones de productividad, conservando el departamento correspondiente a cada período.

4. **Visualización de la evolución:** presentar resultados históricos en tablas o paneles resumidos para facilitar el análisis de la productividad.

5. **Control de acceso por rol activo:** seleccionar uno de tres roles en la interfaz para determinar qué vistas, botones y acciones están disponibles.

---

## 4. Fuera del alcance de 002

Las siguientes funcionalidades no forman parte de este incremento:

- Planilla, remuneraciones, contratos y liquidaciones de sueldo.
- Comparación de productividad entre departamentos o trabajadores.
- Catálogo avanzado de indicadores y fórmulas.
- Cálculo automático de una puntuación única de productividad.
- Autenticación con credenciales, inicio de sesión y verificación de identidad real. La selección de roles y el control de acceso por interfaz SÍ están dentro del alcance.
- Auditoría de modificaciones.
- Exportación, respaldo central y sincronización multiusuario.
- Backend y base de datos remota.
- Uso de información real de trabajadores.

Las funcionalidades de planilla y liquidaciones permanecen documentadas en el modelo 001 y en el MER existente. No se elimina su documentación.

---

## 5. Modelo de datos de referencia

El incremento utiliza como referencia el MER existente de 9 entidades, documentado en `specs/001-erp-base-module/data-model.md`.

No se modifica el MER ni se agregan nuevas entidades al modelo de referencia.

### 5.1. Correspondencia con el MER

| Concepto de 002 | Estructura utilizada | Uso |
|---|---|---|
| Trabajador | `Entity` / Trabajador | Registrar y consultar trabajadores |
| Departamento | `Departamento` | Agrupar trabajadores |
| Asignación histórica | `Historial_Departamento` | Conservar períodos de pertenencia |
| Registro de productividad | `Document` con campos personalizados | Registrar mediciones |
| Evolución | Consulta de registros `Document` | Mostrar resultados históricos |
| Liquidación | Entidades existentes del MER | Fuera del alcance de 002 |

### 5.2. Campos principales

**Trabajador**

- `id`
- `entity_id`
- `name`
- `code`
- `cargo`
- `fechaIngreso`
- `estadoLaboral`
- `departamentoId`

**Departamento**

- `id_departamento`
- `nombre`
- `descripcion`

**Historial_Departamento**

- `id_historial`
- `entity_id`
- `id_departamento`
- `fecha_inicio`
- `fecha_fin`

**Registro de productividad**

- `id`
- `entity_id`
- `startDate`
- `endDate`
- `indicador`
- `resultado`
- `unidad` *(opcional; eliminado del formulario en 002 cafetería, mantenido para compatibilidad)*
- `asignacionId`

Los nombres de campos se verificaron durante la planificación técnica contra las estructuras reales del módulo base. Los campos adicionales se implementaron mediante los mecanismos de extensión previstos en dicho módulo.

### 5.3. Reglas de correspondencia

- El trabajador se representa mediante la entidad Trabajador, vinculada a `Entity`.
- El departamento se representa mediante `Departamento`.
- Las asignaciones históricas se representan mediante `Historial_Departamento`.
- Cada cambio de departamento debe conservar la asignación anterior.
- Los registros de productividad se representan mediante `Document`.
- En el incremento 002, `Document` se utiliza para productividad; las liquidaciones quedan fuera de alcance.
- El período se almacena con `startDate` y `endDate`, correspondientes al primer y último día del mes.
- El período se muestra en formato `AAAA-MM`.
- `asignacionId` referencia la asignación histórica correspondiente.
- El departamento mostrado en una medición debe ser el de su asignación histórica, no necesariamente el departamento actual.
- Si posteriormente conviven documentos de productividad y liquidaciones, deberá definirse cómo distinguir ambos tipos.

---

## 6. Historias de usuario y criterios de aceptación

### Historia de Usuario 1: Registro de medición de productividad (Prioridad: P1)

**Como** Administrador / Gerente de Cafetería o Jefe de Turno / Supervisor con el rol activo correspondiente,\
**quiero** registrar los resultados de productividad y el cumplimiento de metas de ventas de un trabajador de barra, cocina o salón en un período y turno específicos (mañana o tarde),\
**para** mantener actualizado su expediente y poder dar seguimiento al desempeño del equipo dentro de mi alcance.

**Justificación de prioridad:** es la funcionalidad principal del incremento. Sin mediciones no existe información para consultar ni analizar el cumplimiento de las metas de la cafetería.

**Prueba independiente:** registrar un trabajador de la cafetería, asignarlo a un área (barra, cocina o salón) en un turno y guardar una medición que posteriormente aparezca en su historial.

**Responsable:** Daphnne Hidalgo Mundaca.

**Requisitos relacionados:** FR-012 a FR-023 y FR-052 a FR-065.

#### Escenarios de aceptación

1. **Dado** un trabajador con una asignación válida, **cuando** se ingresan período, indicador, resultado y unidad, **entonces** la medición se guarda asociada a la asignación correspondiente.

2. **Dado** un formulario incompleto, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro e informa los campos faltantes.

3. **Dado** un período futuro, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro.

4. **Dado** un período anterior al ingreso del trabajador, **cuando** se intenta guardar, **entonces** el sistema muestra un error.

5. **Dado** un indicador de menos de 3 o más de 60 caracteres, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro.

6. **Dado** un resultado negativo o no numérico, **cuando** se intenta guardar, **entonces** el sistema informa que el resultado no es válido.

7. **Dado** un registro sin unidad, **cuando** se intenta guardar, **entonces** el sistema acepta el registro (unidad ya no es obligatoria en el formulario de cafetería).

8. **Dado** un registro existente con el mismo trabajador, período e indicador, **cuando** se intenta guardar otro, **entonces** el sistema muestra una advertencia y permite continuar.

9. **Dado** un registro nuevo, **cuando** se guarda, **entonces** no se modifican los registros de otros períodos.

10. **Dado** un registro existente, **cuando** se corrige, **entonces** solo se modifica el registro seleccionado y se aplican las validaciones correspondientes.

11. **Dado** un trabajador con cargo definido, **cuando** se selecciona en el formulario de productividad, **entonces** el sistema sugiere automáticamente los indicadores correspondientes a ese cargo.

12. **Dado** un formulario de productividad, **cuando** se registra una medición, **entonces** se puede identificar el turno (Mañana o Tarde) en que se realizó la actividad.

13. **Dado** un formulario de productividad, **cuando** se registra una medición, **entonces** se puede registrar la meta esperada y el resultado obtenido por separado.

14. **Dado** un formulario de productividad, **cuando** se registra una medición, **entonces** se puede registrar una evaluación cualitativa del desempeño en escala de 1 a 5 para calidad, responsabilidad, cumplimiento de procedimientos y colaboración.

15. **Dado** un formulario de productividad, **cuando** se registra una medición, **entonces** se pueden registrar observaciones y oportunidades de mejora asociadas al registro.

16. **Dado** un registro guardado con metas, resultados, evaluaciones, turno, observaciones u oportunidades de mejora, **cuando** se consulta su historial o evolución, **entonces** se muestran esos datos asociados al registro.

17. **Dado** el rol Administrador / Gerente de Cafetería activo, **cuando** abre el formulario de medición, **entonces** puede seleccionar cualquier trabajador de Barra, Cocina o Salón y cualquier turno Mañana o Tarde y guardar la medición.

18. **Dado** el rol Jefe de Turno / Supervisor activo con área Barra y turno Mañana, **cuando** abre el formulario de medición, **entonces** solo puede seleccionar trabajadores asignados a Barra en turno Mañana para ese período; una medición fuera de ese alcance se rechaza.

19. **Dado** el rol Jefe de Turno / Supervisor activo, **cuando** registra una medición permitida, **entonces** el formulario incluye meta esperada individual, resultado, evaluación cualitativa, observaciones y oportunidades de mejora, sin exponer la configuración de metas de ventas globales.

20. **Dado** el rol Barista / Trabajador (Solo lectura) activo, **cuando** consulta las vistas disponibles, **entonces** no encuentra el botón "Nueva medición" ni ningún formulario de registro o corrección, y cualquier intento de registro queda bloqueado sin guardar cambios.

21. **Dado** un formulario abierto con el rol Administrador / Gerente de Cafetería, **cuando** se cambia al rol Barista / Trabajador (Solo lectura), **entonces** el formulario deja de estar disponible de inmediato y no se guardan cambios no confirmados.

---

### Historia de Usuario 2: Consulta del historial de desempeño (Prioridad: P1)

**Como** Administrador / Gerente de Cafetería, Jefe de Turno / Supervisor de su área y turno, o Barista / Trabajador respecto de su propio desempeño,\
**quiero** consultar el historial de productividad y de metas de ventas permitido según mi rol, incluyendo el área y el turno (mañana o tarde),\
**para** analizar cómo han evolucionado los resultados durante distintos períodos sin acceder a información fuera de mi alcance.

**Justificación de prioridad:** permite conservar y consultar la trayectoria de productividad de cada integrante del equipo de la cafetería.

**Prueba independiente:** seleccionar un trabajador de la cafetería con varias mediciones y visualizar sus registros ordenados por período, con el área y el turno correspondientes.

**Responsable:** Bruno Phillipe Cabalin Ferreira.

**Requisitos relacionados:** FR-024 a FR-027 y FR-052 a FR-065.

#### Escenarios de aceptación

1. **Dado** un trabajador con mediciones registradas, **cuando** se consulta su historial, **entonces** se muestran los registros ordenados cronológicamente.

2. **Dado** un trabajador que cambió de departamento, **cuando** se consulta su historial, **entonces** cada medición muestra el departamento correspondiente a su período.

3. **Dado** un trabajador sin mediciones, **cuando** se consulta su historial, **entonces** se informa que no existen registros.

4. **Dado** un registro histórico, **cuando** se muestra, **entonces** se identifican período, departamento, indicador, resultado y unidad.

5. **Dado** un trabajador reasignado, **cuando** se consulta su historial, **entonces** las mediciones anteriores permanecen disponibles sin ser sobrescritas.

6. **Dado** el rol Administrador / Gerente de Cafetería activo, **cuando** consulta el historial, **entonces** puede seleccionar y ver el historial completo de cualquier trabajador de la cafetería.

7. **Dado** el rol Jefe de Turno / Supervisor activo con área Cocina y turno Tarde, **cuando** consulta el historial, **entonces** solo se muestran mediciones cuyo departamento histórico sea Cocina y cuyo turno registrado sea Tarde.

8. **Dado** el rol Barista / Trabajador (Solo lectura) activo, **cuando** consulta su historial, **entonces** solo se muestran sus propias mediciones y no existe lista, buscador ni acceso a historiales de otros trabajadores.

9. **Dado** un cambio de rol activo, **cuando** se abre nuevamente la vista de historial, **entonces** los datos visibles se ajustan de inmediato al nuevo alcance sin conservar registros del rol anterior.

---

### Historia de Usuario 3: Gestión de trabajadores y asignaciones de departamento (Prioridad: P1)

**Como** administrador de la cafetería,\
**quiero** registrar al personal de barra, cocina y salón y administrar sus asignaciones de área y turno (mañana o tarde),\
**para** mantener actualizada su información laboral y conservar el historial de sus cambios de área.

**Justificación de prioridad:** es necesaria para asociar correctamente cada medición al trabajador y al área o turno de su período.

**Prueba independiente:** registrar un trabajador de la cafetería, asignarlo a un área (por ejemplo, barra) en turno de mañana, cambiarlo a otra área o turno y comprobar que la asignación anterior se conserva.

**Responsable:** Consuelo Estefania Hidalgo Salgado.

**Requisitos relacionados:** FR-001 a FR-011 y FR-052 a FR-065.

#### Escenarios de aceptación

1. **Dado** un trabajador nuevo, **cuando** se ingresan nombre, código, cargo y fecha de ingreso, **entonces** se guarda su información.

2. **Dado** un trabajador existente, **cuando** se editan sus datos, **entonces** se guardan los cambios.

3. **Dado** un trabajador existente, **cuando** se registra una asignación a un departamento, **entonces** se guarda con su fecha de inicio.

4. **Dado** un trabajador con una asignación vigente, **cuando** cambia de departamento, **entonces** se cierra la asignación anterior y se crea una nueva.

5. **Dadas** asignaciones con fechas superpuestas, **cuando** se intenta guardar una nueva, **entonces** el sistema rechaza la operación.

6. **Dada** una fecha de término anterior a la fecha de inicio, **cuando** se intenta guardar, **entonces** el sistema informa el error.

7. **Dado** un trabajador con asignaciones históricas, **cuando** se consulta su información, **entonces** se muestran el departamento actual y las asignaciones anteriores.

8. **Dado** un trabajador con registros históricos, **cuando** se intenta eliminarlo físicamente, **entonces** el sistema impide la eliminación y permite marcarlo como Inactivo.

9. **Dado** el rol Administrador / Gerente de Cafetería activo, **cuando** abre la vista de gestión, **entonces** están disponibles los botones para crear y editar trabajadores, crear y editar departamentos Barra, Cocina y Salón, crear y cerrar asignaciones, definir turnos Mañana o Tarde y marcar trabajadores como Inactivos.

10. **Dado** el rol Jefe de Turno / Supervisor activo, **cuando** abre cualquier vista permitida, **entonces** no están disponibles los botones ni formularios para crear o editar trabajadores, departamentos, asignaciones o turnos, y cualquier intento directo de ejecutarlos se bloquea sin modificar datos.

11. **Dado** el rol Barista / Trabajador (Solo lectura) activo, **cuando** consulta la interfaz, **entonces** no encuentra la vista de gestión de trabajadores ni acciones de edición de departamentos, asignaciones, turnos o metas globales.

12. **Dado** el rol Jefe de Turno / Supervisor activo, **cuando** consulta una asignación dentro de una medición de su área y turno, **entonces** puede ver los datos de la asignación como contexto, pero no puede editarlos.

---

### Historia de Usuario 4: Visualización de la evolución de productividad (Prioridad: P2)

**Como** Administrador / Gerente de Cafetería, Jefe de Turno / Supervisor o Barista / Trabajador según su rol activo,\
**quiero** visualizar la evolución de los indicadores de productividad y de las metas de ventas dentro de mi alcance, distinguiendo el área y el turno (mañana o tarde),\
**para** identificar tendencias en el desempeño sin consultar información de otros trabajadores ni de otras áreas o turnos.

**Justificación de prioridad:** permite analizar las mediciones registradas, pero depende de que las funcionalidades anteriores estén disponibles.

**Prueba independiente:** seleccionar un trabajador de la cafetería con mediciones comparables de distintos períodos y observar su evolución por área y turno.

**Responsable:** Bastián Ignacio Reinado Bravo.

**Requisitos relacionados:** FR-028 a FR-031 y FR-052 a FR-065.

#### Escenarios de aceptación

1. **Dado** un trabajador con mediciones, **cuando** se consulta su evolución, **entonces** se muestran sus resultados históricos.

2. **Dado** un conjunto de registros, **cuando** se presenta la evolución, **entonces** se muestra una tabla cronológica con período, indicador, resultado, unidad y departamento.

3. **Dado** un mismo indicador con la misma unidad en varios períodos, **cuando** se consulta su evolución, **entonces** es posible observar las variaciones entre períodos.

4. **Dados** indicadores o unidades diferentes, **cuando** se muestra la evolución, **entonces** el sistema no los compara como si fueran equivalentes.

5. **Dados** registros insuficientes, **cuando** se consulta la evolución, **entonces** se informa que no existen datos suficientes.

6. **Dada** la visualización de productividad, **cuando** se muestran los resultados, **entonces** el sistema no genera una puntuación única automática ni emite juicios de desempeño.

7. **Dado** el rol Administrador / Gerente de Cafetería activo, **cuando** consulta la evolución, **entonces** puede seleccionar cualquier trabajador y ver todas sus mediciones históricas.

8. **Dado** el rol Jefe de Turno / Supervisor activo, **cuando** consulta la evolución, **entonces** solo ve la evolución de las mediciones de su área y turno seleccionados.

9. **Dado** el rol Barista / Trabajador (Solo lectura) activo, **cuando** consulta la evolución, **entonces** solo ve la evolución de su propio desempeño y no puede seleccionar a otro trabajador.

10. **Dado** un rol distinto de Administrador / Gerente de Cafetería, **cuando** consulta la evolución, **entonces** no encuentra botones ni vistas para modificar metas de ventas globales; los valores individuales de meta esperada de las mediciones permitidas permanecen visibles.

---

## 7. Reglas de validación

| Campo o regla | Validación |
|---|---|
| Trabajador | Debe existir y estar seleccionado |
| Departamento | Debe existir y estar seleccionado |
| Asignación histórica | Debe corresponder al trabajador y superponerse con el período |
| Fecha de inicio | Obligatoria y válida |
| Fecha de término | Opcional; no puede ser anterior a la fecha de inicio |
| Superposición de asignaciones | No se permiten asignaciones superpuestas para el mismo trabajador |
| Asignación vigente | Solo puede existir una asignación vigente a la vez por trabajador |
| Vigencia actual | `fecha_inicio` debe ser hoy o anterior y `fecha_fin` nula o hoy o posterior; las fechas futuras son asignaciones programadas |
| Período | Obligatorio y válido, en formato AAAA-MM |
| Período futuro | No permitido |
| Período anterior al ingreso | No permitido |
| Indicador | Obligatorio, entre 3 y 60 caracteres |
| Resultado | Numérico y mayor o igual a cero |
| Unidad | Opcional (eliminada del formulario; se conserva para registros anteriores) |
| Registro duplicado | Permitido con advertencia |
| Corrección de registro | Solo modifica el registro seleccionado |
| Eliminación de trabajador con historial | No permitida; se utiliza estado Inactivo |
| Eliminación de departamento con historial | No permitida mientras existan relaciones históricas |
| Rol activo | Debe ser uno de los tres roles definidos: Administrador / Gerente de Cafetería, Jefe de Turno / Supervisor o Barista / Trabajador (Solo lectura) |
| Área y turno del Supervisor | Deben estar seleccionados para mostrar mediciones, historial y evolución; el alcance se aplica sobre el departamento histórico y el turno del registro |
| Trabajador propio del Barista | Debe estar seleccionado para mostrar únicamente su desempeño y su evolución |
| Acciones por rol | Los botones y acciones no permitidos para el rol activo deben ocultarse o deshabilitarse y no deben ejecutarse ni modificar datos |

Los errores de validación deben comunicarse mediante mensajes claros para el usuario.

---

## 8. Requisitos funcionales

### Gestión de trabajadores y departamentos

- **FR-001:** El sistema DEBE permitir registrar trabajadores con nombre, código, cargo y fecha de ingreso.
- **FR-002:** El sistema DEBE permitir editar trabajadores existentes.
- **FR-003:** El sistema DEBE permitir registrar y editar departamentos.
- **FR-004:** El sistema DEBE permitir asignar trabajadores a departamentos indicando la fecha de inicio.
- **FR-005:** El sistema DEBE conservar la asignación anterior al registrar un cambio de departamento.
- **FR-006:** El sistema DEBE impedir asignaciones con períodos superpuestos.
- **FR-007:** El sistema DEBE impedir fechas de término anteriores a la fecha de inicio.
- **FR-008:** El sistema DEBE conservar las asignaciones históricas.
- **FR-009:** El sistema DEBE mostrar el departamento actual y las asignaciones anteriores.
- **FR-010:** El sistema NO DEBE eliminar físicamente trabajadores con historial; DEBE permitir marcarlos como Inactivos.
- **FR-011:** El sistema NO DEBE eliminar departamentos con relaciones históricas mientras no exista una política de conservación.

### Registro de productividad

- **FR-012:** El sistema DEBE permitir registrar mediciones con trabajador, período, indicador y resultado.
- **FR-013:** El sistema DEBE asociar cada medición a una asignación histórica válida.
- **FR-014:** Si existen varias asignaciones durante un mismo mes, el sistema DEBE permitir seleccionar la correspondiente.
- **FR-015:** El sistema DEBE rechazar períodos futuros.
- **FR-016:** El sistema DEBE rechazar períodos anteriores al ingreso del trabajador.
- **FR-017:** El sistema DEBE rechazar indicadores de menos de 3 o más de 60 caracteres.
- **FR-018:** El sistema DEBE rechazar resultados negativos o no numéricos.
- **FR-020:** El sistema DEBE validar los campos obligatorios antes de guardar.
- **FR-021:** El sistema DEBE advertir sobre registros duplicados y permitir guardarlos si el usuario confirma.
- **FR-022:** El sistema NO DEBE modificar registros de otros períodos al guardar uno nuevo.
- **FR-023:** El sistema DEBE permitir corregir una medición existente sin modificar otras.

### Historial

- **FR-024:** El sistema DEBE mostrar el historial de productividad ordenado cronológicamente.
- **FR-025:** Cada registro DEBE mostrar período, departamento, indicador, resultado y unidad.
- **FR-026:** El departamento mostrado DEBE corresponder a la asignación histórica del registro.
- **FR-027:** Si no existen mediciones, el sistema DEBE informar la ausencia de datos.

### Evolución

- **FR-028:** El sistema DEBE permitir visualizar la evolución de mediciones comparables.
- **FR-029:** El sistema NO DEBE comparar como equivalentes indicadores o unidades diferentes.
- **FR-030:** El sistema DEBE informar cuando no existan datos suficientes.
- **FR-031:** El sistema NO DEBE calcular una puntuación única automática ni emitir juicios de desempeño.

### Requisitos generales

- **FR-032:** El sistema DEBE utilizar almacenamiento local del navegador y funcionar sin backend.
- **FR-033:** El MVP NO DEBE presentar autenticación con credenciales ni verificación de identidad real como funcionalidades implementadas; SÍ DEBE presentar el selector de rol activo y el control de acceso por interfaz descritos en FR-052 a FR-065.
- **FR-034:** El sistema DEBE utilizar datos ficticios para las demostraciones.
- **FR-035:** El sistema DEBE mostrar de forma segura el contenido ingresado por el usuario, evitando la ejecución de scripts introducidos en campos de texto.
- **FR-036:** El sistema DEBE sugerir automáticamente los indicadores correspondientes al cargo del trabajador seleccionado.
- **FR-037:** El sistema DEBE permitir registrar el turno (Mañana o Tarde) en que se realizó la actividad.
- **FR-038:** El sistema DEBE permitir registrar la meta esperada y el resultado obtenido como valores separados.
- **FR-039:** El sistema DEBE permitir registrar una evaluación cualitativa del desempeño en escala de 1 a 5 para calidad, responsabilidad, cumplimiento de procedimientos y colaboración.
- **FR-040:** El sistema DEBE permitir registrar observaciones y oportunidades de mejora asociadas al registro de productividad.
- **FR-041:** El sistema DEBE mostrar los datos de turno, meta, evaluación cualitativa, observaciones y oportunidades de mejora al consultar el historial y la evolución.
- **FR-042:** El sistema DEBE mantener compatibilidad con registros de productividad creados antes de incorporar estos campos.
- **FR-043:** El sistema DEBE calcular internamente la suma de metas esperadas y la suma de resultados agrupadas por departamento y período mensual (AAAA-MM).
- **FR-044:** El sistema DEBE utilizar el departamento histórico asociado al registro (vía asignación), no el departamento actual del trabajador.
- **FR-045:** El sistema DEBE almacenar de forma persistente tanto la meta esperada consolidada como el resultado consolidado en el almacenamiento local del navegador.
- **FR-046:** El sistema DEBE recalcular automáticamente ambas variables consolidadas al crear, modificar o eliminar un registro de productividad.
- **FR-047:** El mecanismo de recálculo DEBE ser idempotente: ejecutarlo varias veces sin modificar los registros individuales produce el mismo resultado.
- **FR-048:** La meta esperada consolidada y el resultado consolidado NO DEBEN mostrarse al usuario en ninguna sección de la interfaz; permanecen almacenados internamente para futuras funcionalidades.
- **FR-049:** La meta esperada consolidada y el resultado consolidado DEBEN calcularse de forma independiente a partir de sus respectivos campos individuales.
- **FR-050:** Al modificar únicamente la meta esperada de un registro, solo debe cambiar la meta esperada consolidada (el resultado consolidado se mantiene).
- **FR-051:** Al modificar únicamente el resultado de un registro, solo debe cambiar el resultado consolidado (la meta esperada consolidada se mantiene).

### Control de acceso por rol activo

- **FR-052:** El sistema DEBE ofrecer un selector de rol activo con exactamente tres opciones: "Administrador / Gerente de Cafetería", "Jefe de Turno / Supervisor" y "Barista / Trabajador (Solo lectura)".

- **FR-053:** El sistema DEBE usar "Administrador / Gerente de Cafetería" como rol activo predeterminado, mostrar el rol activo de forma visible en las vistas y aplicar cualquier cambio de rol de inmediato.

- **FR-054:** Con el rol Administrador / Gerente de Cafetería activo, el sistema DEBE habilitar todas las vistas y todos los botones: gestión de trabajadores, departamentos, asignaciones y turnos; configuración de metas de ventas globales; registro y corrección de mediciones; consulta del historial; y consulta de la evolución de cualquier trabajador.

- **FR-055:** Con el rol Administrador / Gerente de Cafetería activo, el sistema DEBE permitir crear y editar trabajadores, crear y editar los departamentos Barra, Cocina y Salón, crear y cerrar asignaciones históricas, definir los turnos Mañana y Tarde, marcar trabajadores como Inactivos, configurar metas de ventas globales y registrar o corregir mediciones de cualquier área o turno.

- **FR-056:** Con el rol Jefe de Turno / Supervisor activo, el sistema DEBE habilitar únicamente las vistas operativas "Medición", "Historial por área/turno" y "Evolución por área/turno", y DEBE solicitar la selección explícita de un área (Barra, Cocina o Salón) y de un turno (Mañana o Tarde) antes de mostrar datos.

- **FR-057:** Con el rol Jefe de Turno / Supervisor activo, el sistema DEBE habilitar los botones "Nueva medición" y "Corregir medición" solo para trabajadores cuya asignación histórica corresponda al área seleccionada y cuya medición corresponda al turno seleccionado; el formulario DEBE permitir meta esperada individual, resultado, evaluación cualitativa, observaciones y oportunidades de mejora.

- **FR-058:** Con el rol Jefe de Turno / Supervisor activo, el sistema DEBE ocultar o deshabilitar los botones y acciones para crear o editar trabajadores, departamentos, asignaciones y turnos, para marcar trabajadores como Inactivos y para modificar metas de ventas globales; también DEBE impedir el acceso a las vistas de gestión.

- **FR-059:** Con el rol Barista / Trabajador (Solo lectura) activo, el sistema DEBE habilitar únicamente las vistas "Mi desempeño" y "Mi evolución", DEBE solicitar la selección explícita del trabajador propio y DEBE mostrar solo las mediciones y la evolución de ese trabajador.

- **FR-060:** Con el rol Barista / Trabajador (Solo lectura) activo, el sistema DEBE ocultar o deshabilitar el botón "Nueva medición", la acción "Corregir medición", los formularios de registro, la gestión de trabajadores, departamentos, asignaciones y turnos, la configuración de metas de ventas globales y cualquier acceso a datos de otros trabajadores.

- **FR-061:** El sistema DEBE aplicar el alcance de datos según el rol activo: sin filtro para Administrador / Gerente de Cafetería; por departamento histórico de la asignación y turno registrado para Jefe de Turno / Supervisor; y por trabajador propio seleccionado para Barista / Trabajador (Solo lectura).

- **FR-062:** La vista y los botones de configuración de metas de ventas globales DEBEN estar disponibles solo para el rol Administrador / Gerente de Cafetería. Los campos individuales de meta esperada dentro de una medición permitida permanecen disponibles para Administrador / Gerente de Cafetería y Jefe de Turno / Supervisor; las variables consolidadas internas continúan ocultas según FR-048.

- **FR-063:** Al cambiar el rol activo, el sistema DEBE actualizar de inmediato las vistas, botones, acciones y datos visibles, sin modificar trabajadores, asignaciones, mediciones ni metas como consecuencia del cambio de rol.

- **FR-064:** Si se intenta ejecutar una acción no permitida para el rol activo, el sistema DEBE impedirla, mostrar un mensaje claro al usuario y NO DEBE guardar cambios parciales.

- **FR-065:** El selector de rol DEBE entenderse únicamente como un control demostrativo de interfaz; NO DEBE presentarse como autenticación, inicio de sesión ni comprobación de identidad real.

---

## 9. Casos límite y comportamiento esperado

1. **Trabajador sin departamento asignado:** no se permite registrar productividad hasta que exista una asignación válida para el período.

2. **Cambio de departamento durante un mes:** si existen varias asignaciones que se superponen con el período, el usuario debe seleccionar explícitamente la correspondiente.

3. **Período anterior al ingreso:** se rechaza el registro y se informa el motivo.

4. **Período futuro:** se rechaza el registro y se muestra un mensaje de validación.

5. **Registro duplicado:** se advierte que ya existe una medición del mismo trabajador, período e indicador, pero se permite guardar otra si el usuario confirma.

6. **Corrección de una medición:** solo se actualiza el registro seleccionado.

7. **Trabajador sin mediciones:** se muestra un mensaje indicando que no existen registros.

8. **Datos insuficientes para visualizar evolución:** se informa que no hay información suficiente.

9. **Indicadores o unidades diferentes:** no se comparan como equivalentes.

10. **Eliminación de departamento con historial:** se impide la eliminación física mientras existan relaciones históricas asociadas.

11. **Eliminación de trabajador con historial:** se impide la eliminación física y se permite marcarlo como Inactivo.

12. **Indicador inválido:** se rechazan indicadores de menos de 3 o más de 60 caracteres.

13. **Resultado inválido:** se rechazan valores negativos o no numéricos.

14. **Unidad vacía:** unidad ya no es obligatoria en el formulario de cafetería; el registro se acepta sin unidad.

15. **Asignaciones superpuestas:** se rechaza una nueva asignación que se superponga con otra del mismo trabajador.

16. **Fecha de término anterior a la fecha de inicio:** se rechaza la asignación.

17. **Almacenamiento local lleno o no disponible:** el sistema debe informar que no pudo guardar los datos y evitar mostrar una confirmación de guardado exitoso.

18. **Datos eliminados del navegador:** el sistema no garantiza su recuperación, ya que no cuenta con respaldo ni sincronización.

19. **Uso compartido del navegador:** el rol activo es seleccionable y controla vistas y acciones, pero no verifica la identidad real de quien usa la aplicación. Solo deben utilizarse datos ficticios.

20. **Intento de registrar liquidaciones:** las funcionalidades de planilla no forman parte del incremento 002.

21. **Ingreso accidental de datos reales:** el sistema debe mostrar una advertencia de uso exclusivo de datos ficticios. No se garantiza la detección automática de información real. **Texto aprobado (T072):** "Aviso: Este módulo funciona exclusivamente en almacenamiento local con fines académicos. Ingrese únicamente datos ficticios; no registre información personal ni laboral real."

22. **Turno inválido:** si se informa un turno que no sea Mañana o Tarde, se rechaza el registro.

23. **Meta negativa:** si se informa una meta negativa, se rechaza el registro.

24. **Evaluación fuera de rango:** si se informa una evaluación cualitativa fuera de 1 a 5, o no entera, se rechaza el registro.

25. **Registro sin campos nuevos:** un registro creado antes de incorporar los campos de turno, meta, evaluación cualitativa, observaciones y oportunidades de mejora continúa siendo válido y consultable.

26. **Metas consolidadas por departamento y período:** dos registros del mismo departamento y mismo mes suman sus metas esperadas en un solo grupo consolidado.

27. **Departamentos diferentes no comparten suma:** registros de departamentos distintos generan grupos de metas consolidadas separados.

28. **Meses diferentes generan grupos separados:** el mismo departamento en meses distintos genera variables de meta consolidada independientes.

29. **Cambio de departamento:** al cambiar el departamento de un registro, su meta deja de contar en el grupo anterior y se incorpora al nuevo.

30. **Cambio de período:** al cambiar el mes de un registro, su meta deja de contar en el grupo anterior y se incorpora al nuevo.

31. **Eliminación de registro:** al eliminar un registro, su meta esperada y su resultado dejan de formar parte de las sumas consolidadas. Si el grupo queda sin registros, su variable consolidada se elimina.

32. **Recálculo idempotente:** ejecutar el mecanismo de recálculo varias veces sin modificar registros individuales produce el mismo resultado para ambas variables.

33. **Metas y resultados ocultas:** las metas consolidadas y los resultados consolidados no se muestran en ninguna sección de la interfaz de usuario.

34. **Independencia de variables:** la meta esperada consolidada y el resultado consolidado se calculan de forma independiente; modificar uno no afecta al otro.

35. **Resultado 0 válido:** un registro con resultado 0 es válido y contribuye 0 a la suma del resultado consolidado.

36. **Supervisor sin área o turno seleccionados:** no se muestran mediciones, historial ni evolución hasta que seleccione explícitamente su área y su turno.

37. **Barista sin trabajador propio seleccionado:** no se muestra información de desempeño hasta que seleccione explícitamente el trabajador que representa como "yo".

38. **Intento de acción de gestión con rol restringido:** si un Supervisor o un Barista intenta crear o editar trabajadores, departamentos, asignaciones, turnos o metas globales, la acción se bloquea, se informa al usuario y no se modifica ningún dato.

39. **Reasignación de un trabajador:** el Supervisor solo ve las mediciones cuyo departamento histórico y turno coinciden con su alcance; el Administrador conserva acceso al historial completo.

40. **Cambio de rol con formulario abierto:** el formulario deja de estar disponible si el nuevo rol no lo permite y los cambios no confirmados no se guardan.

Los comportamientos adicionales sobre errores de almacenamiento deberán validarse con el grupo antes de cerrar la especificación; la advertencia sobre uso exclusivo de datos ficticios fue aprobada (T072).

---

## 10. Criterios de éxito

- **SC-001:** Un usuario puede registrar un trabajador y asignarle un departamento en menos de 2 minutos.
- **SC-002:** Un usuario puede registrar una medición de productividad en menos de 2 minutos.
- **SC-003:** Un usuario puede consultar el historial de un trabajador en menos de 10 segundos.
- **SC-004:** Al menos el 90% de los usuarios de prueba completa las tareas de registro y consulta sin ayuda.
- **SC-005:** Tras un cambio de departamento, el 100% de los registros históricos anteriores se conserva con el departamento correcto.
- **SC-006:** El sistema continúa siendo utilizable con al menos 500 registros de productividad.
- **SC-007:** El 100% de los registros inválidos se rechaza con un mensaje claro.
- **SC-008:** El 100% de los registros históricos muestra período, departamento, indicador, resultado y unidad.
- **SC-009:** Cuando no hay datos suficientes, el sistema informa la situación sin generar resultados ficticios.
- **SC-010:** El 100% de las combinaciones rol-acción definidas en FR-052 a FR-065 se comporta según el rol activo, sin que se ejecuten acciones no autorizadas.
- **SC-011:** Los datos utilizados en la demostración son ficticios.
- **SC-012:** Los registros se conservan al recargar la aplicación mientras el almacenamiento local siga disponible.
- **SC-013:** Al seleccionar un trabajador con cargo definido, el sistema sugiere automáticamente los indicadores correspondientes.
- **SC-014:** Un registro de productividad puede incluir turno, meta, evaluación cualitativa (1-5), observaciones y oportunidades de mejora, y esos datos se conservan al guardar.
- **SC-015:** Los registros históricos creados antes de incorporar los nuevos campos siguen siendo válidos y consultables sin errores.
- **SC-016:** El 100% de los cambios de rol aplica vistas, botones, acciones y datos visibles en menos de 5 segundos y sin modificar información.
- **SC-017:** En el 100% de las pruebas, el Jefe de Turno / Supervisor no ve mediciones de otras áreas u otros turnos y el Barista / Trabajador (Solo lectura) no ve datos de otros trabajadores.
- **SC-018:** Al menos el 90% de los usuarios de prueba comprende qué rol tiene activo y completa sin ayuda las tareas permitidas para ese rol.

Estos criterios deberán verificarse durante las pruebas de implementación.

---

## 11. Suposiciones

- El módulo funciona localmente, sin backend ni sincronización multiusuario.
- Los datos se almacenan en el almacenamiento local del navegador.
- Se utilizan exclusivamente datos ficticios.
- El MER existente de 9 entidades se mantiene como referencia.
- No se crean entidades nuevas en el MER.
- En 002, `Document` representa un registro de productividad.
- Las liquidaciones permanecen fuera del alcance de este incremento.
- El período se representa mediante `startDate` y `endDate`.
- La interfaz muestra los períodos en formato `AAAA-MM`.
- Las asignaciones históricas se vinculan a las mediciones mediante `asignacionId`.
- El término utilizado para la organización laboral es Departamento.
- Los registros duplicados se permiten con advertencia.
- Si existen varias asignaciones durante un período, el usuario selecciona la correspondiente.
- Las reglas de validación provienen de la documentación existente de productividad.
- Los trabajadores con historial no se eliminan físicamente.
- El sistema no garantiza respaldo ni recuperación de datos eliminados del navegador.
- El selector de rol es una ayuda demostrativa de la interfaz; no sustituye autenticación ni comprueba identidad real.
- El rol activo predeterminado al abrir la aplicación es Administrador / Gerente de Cafetería.
- Para el rol Jefe de Turno / Supervisor, el usuario selecciona explícitamente un área (Barra, Cocina o Salón) y un turno (Mañana o Tarde); esa combinación define su alcance.
- Para el rol Barista / Trabajador (Solo lectura), el usuario selecciona explícitamente el trabajador propio; ese trabajador define su alcance.
- "Meta de ventas global" alude a la configuración administrativa de metas; "meta esperada" es un campo individual de cada medición y forma parte del registro permitido.
- Las variables consolidadas internas de metas y resultados continúan ocultas porque permanecen fuera de la interfaz según FR-048.

---

## 12. Riesgos y consideraciones éticas

### 12.1. Sesgo por cambios de departamento

Comparar resultados de distintos departamentos o responsabilidades puede producir evaluaciones injustas. Por ello, cada medición debe conservar su departamento y unidad correspondiente.

### 12.2. Reducción del desempeño a números

La productividad no debe entenderse como una representación completa del aporte laboral de una persona. Las mediciones son herramientas de apoyo y no juicios automáticos.

### 12.3. Privacidad y confidencialidad

El almacenamiento local no ofrece autenticación, verificación de identidad ni respaldo centralizado.

Los roles activos seleccionables limitan vistas, botones, acciones y datos visibles dentro de la demostración, pero NO impiden que una persona con acceso al navegador cambie el rol activo. Por esta razón, el MVP debe utilizar únicamente datos ficticios.

### 12.4. Pérdida de información

Si se eliminan los datos del navegador o falla el almacenamiento, los registros pueden perderse.

### 12.5. Comparación de indicadores

Los indicadores con unidades o definiciones distintas no deben compararse directamente.

### 12.6. Uso indebido de métricas

Los resultados no deben utilizarse para generar automáticamente sanciones, descuentos salariales ni decisiones laborales.

### 12.7. Uso de datos reales

La aplicación está destinada a demostraciones académicas con datos ficticios. No debe utilizarse para almacenar información laboral real.

---

## 13. Decisiones de alcance aprobadas

| Decisión | Opción seleccionada | Consecuencia |
|---|---|---|
| Modelo de datos | MER existente de 9 entidades | No modificar el MER |
| Alcance | RRHH y productividad | Planilla fuera de 002 |
| Período | `startDate` y `endDate` | Compatibilidad con Document |
| Departamento | Usar término Departamento | Coherencia con el MER |
| Registro de productividad | Document con campos personalizados | Reutilizar el módulo base |
| Duplicados | Permitir con advertencia | No imponer unicidad |
| Cambio durante el mes | Selección de asignación | Evitar asignación automática incorrecta |
| Validaciones | Reglas existentes de productividad | Mantener coherencia documental |
| Control de acceso | Tres roles activos seleccionables | Vistas, botones y acciones distintos por rol |
| Autenticación | Fuera del alcance | El selector de rol no verifica identidad real |
| Alcance del Supervisor | Área y turno seleccionados | Solo medición, historial y evolución de ese ámbito |
| Alcance del Barista | Trabajador propio seleccionado | Solo lectura de su desempeño y evolución |
| Metas de ventas | Configuración global solo para Administrador | La meta esperada individual sigue dentro del registro de medición |

---

## 14. Pendientes de aprobación y cierre

### 14.1. Asignación de responsables

Las cuatro historias de usuario están definidas, implementadas y con responsable asignado por el grupo (T084 cerrado); esto no cambia su alcance ni su estado técnico.

| Historia o tarea | Responsable | Estado |
|---|---|---|
| HU1 — Registro de medición de productividad | Daphnne Hidalgo Mundaca | Implementada; pruebas automatizadas aprobadas |
| HU2 — Consulta del historial de desempeño | Bruno Phillipe Cabalin Ferreira | Implementada; pruebas automatizadas aprobadas |
| HU3 — Gestión de trabajadores y asignaciones de departamento | Consuelo Estefania Hidalgo Salgado | Implementada; pruebas automatizadas aprobadas |
| HU4 — Visualización de la evolución de productividad | Bastián Ignacio Reinado Bravo | Implementada; pruebas automatizadas aprobadas |
| Soporte de integración, pruebas manuales y validación documental (T072, T083, T085) | Lucas Soarzo Mancilla y Emilio Vejar Bravo | Asignado |

La asignación de responsables quedó acordada por el grupo y permite cerrar la planificación.

Los integrantes adicionales se distribuyen las tareas de soporte de integración, pruebas manuales y validación documental sin inventar historias adicionales.

### 14.2. Verificaciones de cierre

- Responsables de cada historia de usuario y tareas de soporte asignados por el grupo (T084 cerrado). La incorporación de roles y control de acceso no modifica esta asignación.
- Verificación automatizada de la matriz de roles y permisos (FR-052 a FR-065) para los tres roles activos, cubierta por T106–T112.
- Texto de la advertencia sobre datos ficticios aprobado por el grupo (T072 cerrado): "Aviso: Este módulo funciona exclusivamente en almacenamiento local con fines académicos. Ingrese únicamente datos ficticios; no registre información personal ni laboral real."
- Completar la prueba manual de extremo a extremo y documentar las mediciones de SC-001 a SC-004 (pendiente; T083).
- Prueba técnica con 500 registros en Edge aislado: verificada (T076); evaluación de usuarios reales para SC-004 pendiente (T083).
- Coherencia previa entre `plan.md`, `data-model.md`, `tasks.md` y esta especificación: completada (T085). La ampliación de roles requiere una revisión posterior de esos documentos, sin modificar los responsables asignados.
- Nombres de campos verificados contra las estructuras reales del módulo base; tareas de implementación registradas en `tasks.md`: completado.
- Mantener los cambios en la rama `003-roles-acceso-cafeteria` hasta su revisión.

---

## 15. Registro de reorganización documental

Durante la revisión de las observaciones docentes se identificaron dos carpetas correspondientes al incremento 002:

- `specs/002-modulo-rrhh-planilla`
- `specs/002-rrhh-productividad`

Para evitar duplicidad y mantener una estructura coherente, se consolidó la documentación correspondiente en `specs/002-rrhh-productividad`.

La reorganización se realizó en la rama `correccion-specs-002`, conservando los cambios en el historial de Git.

Esta reorganización corresponde a documentación y no constituye por sí misma una implementación funcional.

La implementación puede realizarse con ayuda directa de OpenCode, incluyendo la creación y modificación de archivos y la ejecución de pruebas, bajo supervisión del grupo. Los integrantes deben revisar y comprender los cambios generados. No se autorizan commits, push, merge ni cambios de rama automáticos.
