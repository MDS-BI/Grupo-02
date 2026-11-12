
# Especificación Funcional: Módulo RR. HH. e Historial de Productividad Laboral

**Identificador de funcionalidad**: `002-rrhh-productividad`  
**Rama de trabajo de Git**: `correccion-specs-002`  
**Creada**: 2026-10-20  
**Actualizada**: 2026-11-09  
**Estado**: Implementación completada; suite automatizada aprobada (14 archivos, 132 pruebas) y prueba técnica de 500 registros aprobada (T076). Pendientes las mediciones manuales de SC-001 a SC-003, la evaluación de usuarios de SC-004 (T083), la aprobación de la advertencia (T072) y la asignación de responsables (T084).
**Entrada**: Incremento 002 sobre el módulo base ERP (001). Decisiones de alcance aprobadas para esta especificación.

---

## 1. Definición del problema

Las organizaciones enfrentan dificultades para mantener un registro histórico y centralizado del desempeño y la productividad de sus trabajadores a lo largo del tiempo.

Cuando un trabajador cambia de departamento, de jefatura o de responsabilidades, la información previa puede dispersarse o perderse, dificultando comprender su evolución profesional, identificar tendencias de rendimiento y detectar necesidades de capacitación y apoyo.

Este módulo busca conservar las mediciones de productividad junto con el contexto del departamento al que pertenecía cada trabajador durante el período registrado.

---

## 2. Usuarios y necesidades

- **Encargado de RR. HH. (usuario principal):** necesita registrar trabajadores, gestionar asignaciones de departamento, ingresar mediciones periódicas de productividad y consultar el historial de cada trabajador.

- **Jefatura de departamento (usuario secundario):** necesita consultar la productividad de los integrantes de su departamento para dar seguimiento a su desempeño.

- **Dirección o gerencia (usuario potencial futuro):** podría consultar información resumida para apoyar la toma de decisiones.

**Limitación del MVP:** no se implementa autenticación ni control de acceso. La distinción entre tipos de usuarios describe sus necesidades, pero no representa una restricción de seguridad implementada.

---

## 3. Alcance del MVP de 002

El incremento 002 contempla las siguientes funcionalidades:

1. **Gestión de trabajadores y departamentos:** registrar y editar trabajadores, registrar departamentos y administrar asignaciones históricas por períodos.

2. **Registro de productividad periódica:** registrar indicador, resultado numérico, unidad de medida y período, asociados al trabajador y a su asignación de departamento.

3. **Consulta del historial laboral:** mostrar cronológicamente las mediciones de productividad, conservando el departamento correspondiente a cada período.

4. **Visualización de la evolución:** presentar resultados históricos en tablas o paneles resumidos para facilitar el análisis de la productividad.

---

## 4. Fuera del alcance de 002

Las siguientes funcionalidades no forman parte de este incremento:

- Planilla, remuneraciones, contratos y liquidaciones de sueldo.
- Comparación de productividad entre departamentos o trabajadores.
- Catálogo avanzado de indicadores y fórmulas.
- Cálculo automático de una puntuación única de productividad.
- Autenticación, inicio de sesión, roles y control de acceso.
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
- `unidad`
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

**Como** encargado de RR. HH.,  
**quiero** registrar los resultados de productividad de un trabajador en un período específico,  
**para** mantener actualizado su expediente laboral.

**Justificación de prioridad:** es la funcionalidad principal del incremento. Sin mediciones no existe información para consultar ni analizar.

**Prueba independiente:** registrar un trabajador, asignarle un departamento y guardar una medición que posteriormente aparezca en su historial.

**Responsable:** Por confirmar.

**Requisitos relacionados:** FR-012 a FR-023.

#### Escenarios de aceptación

1. **Dado** un trabajador con una asignación válida, **cuando** se ingresan período, indicador, resultado y unidad, **entonces** la medición se guarda asociada a la asignación correspondiente.

2. **Dado** un formulario incompleto, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro e informa los campos faltantes.

3. **Dado** un período futuro, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro.

4. **Dado** un período anterior al ingreso del trabajador, **cuando** se intenta guardar, **entonces** el sistema muestra un error.

5. **Dado** un indicador de menos de 3 o más de 60 caracteres, **cuando** se intenta guardar, **entonces** el sistema rechaza el registro.

6. **Dado** un resultado negativo o no numérico, **cuando** se intenta guardar, **entonces** el sistema informa que el resultado no es válido.

7. **Dado** un registro sin unidad, **cuando** se intenta guardar, **entonces** el sistema solicita completar ese campo.

8. **Dado** un registro existente con el mismo trabajador, período e indicador, **cuando** se intenta guardar otro, **entonces** el sistema muestra una advertencia y permite continuar.

9. **Dado** un registro nuevo, **cuando** se guarda, **entonces** no se modifican los registros de otros períodos.

10. **Dado** un registro existente, **cuando** se corrige, **entonces** solo se modifica el registro seleccionado y se aplican las validaciones correspondientes.

---

### Historia de Usuario 2: Consulta del historial de desempeño (Prioridad: P1)

**Como** encargado de RR. HH.,  
**quiero** consultar el historial de productividad de un trabajador,  
**para** analizar cómo han evolucionado sus resultados durante distintos períodos.

**Justificación de prioridad:** permite conservar y consultar la trayectoria de productividad de cada trabajador.

**Prueba independiente:** seleccionar un trabajador con varias mediciones y visualizar sus registros ordenados por período.

**Responsable:** Por confirmar.

**Requisitos relacionados:** FR-024 a FR-027.

#### Escenarios de aceptación

1. **Dado** un trabajador con mediciones registradas, **cuando** se consulta su historial, **entonces** se muestran los registros ordenados cronológicamente.

2. **Dado** un trabajador que cambió de departamento, **cuando** se consulta su historial, **entonces** cada medición muestra el departamento correspondiente a su período.

3. **Dado** un trabajador sin mediciones, **cuando** se consulta su historial, **entonces** se informa que no existen registros.

4. **Dado** un registro histórico, **cuando** se muestra, **entonces** se identifican período, departamento, indicador, resultado y unidad.

5. **Dado** un trabajador reasignado, **cuando** se consulta su historial, **entonces** las mediciones anteriores permanecen disponibles sin ser sobrescritas.

---

### Historia de Usuario 3: Gestión de trabajadores y asignaciones de departamento (Prioridad: P1)

**Como** encargado de RR. HH.,  
**quiero** registrar trabajadores y administrar sus asignaciones a departamentos,  
**para** mantener actualizada su información laboral y conservar el historial de sus cambios de departamento.

**Justificación de prioridad:** es necesaria para asociar correctamente cada medición al trabajador y al departamento de su período.

**Prueba independiente:** registrar un trabajador, asignarlo a un departamento, cambiarlo a otro y comprobar que la asignación anterior se conserva.

**Responsable:** Por confirmar.

**Requisitos relacionados:** FR-001 a FR-011.

#### Escenarios de aceptación

1. **Dado** un trabajador nuevo, **cuando** se ingresan nombre, código, cargo y fecha de ingreso, **entonces** se guarda su información.

2. **Dado** un trabajador existente, **cuando** se editan sus datos, **entonces** se guardan los cambios.

3. **Dado** un trabajador existente, **cuando** se registra una asignación a un departamento, **entonces** se guarda con su fecha de inicio.

4. **Dado** un trabajador con una asignación vigente, **cuando** cambia de departamento, **entonces** se cierra la asignación anterior y se crea una nueva.

5. **Dadas** asignaciones con fechas superpuestas, **cuando** se intenta guardar una nueva, **entonces** el sistema rechaza la operación.

6. **Dada** una fecha de término anterior a la fecha de inicio, **cuando** se intenta guardar, **entonces** el sistema informa el error.

7. **Dado** un trabajador con asignaciones históricas, **cuando** se consulta su información, **entonces** se muestran el departamento actual y las asignaciones anteriores.

8. **Dado** un trabajador con registros históricos, **cuando** se intenta eliminarlo físicamente, **entonces** el sistema impide la eliminación y permite marcarlo como Inactivo.

---

### Historia de Usuario 4: Visualización de la evolución de productividad (Prioridad: P2)

**Como** encargado de RR. HH.,  
**quiero** visualizar la evolución de los indicadores de productividad de un trabajador a lo largo del tiempo,  
**para** identificar tendencias en su desempeño y apoyar la toma de decisiones.

**Justificación de prioridad:** permite analizar las mediciones registradas, pero depende de que las funcionalidades anteriores estén disponibles.

**Prueba independiente:** seleccionar un trabajador con mediciones comparables de distintos períodos y observar su evolución.

**Responsable:** Por confirmar.

**Requisitos relacionados:** FR-028 a FR-031.

#### Escenarios de aceptación

1. **Dado** un trabajador con mediciones, **cuando** se consulta su evolución, **entonces** se muestran sus resultados históricos.

2. **Dado** un conjunto de registros, **cuando** se presenta la evolución, **entonces** se muestra una tabla cronológica con período, indicador, resultado, unidad y departamento.

3. **Dado** un mismo indicador con la misma unidad en varios períodos, **cuando** se consulta su evolución, **entonces** es posible observar las variaciones entre períodos.

4. **Dados** indicadores o unidades diferentes, **cuando** se muestra la evolución, **entonces** el sistema no los compara como si fueran equivalentes.

5. **Dados** registros insuficientes, **cuando** se consulta la evolución, **entonces** se informa que no existen datos suficientes.

6. **Dada** la visualización de productividad, **cuando** se muestran los resultados, **entonces** el sistema no genera una puntuación única automática ni emite juicios de desempeño.

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
| Unidad | Obligatoria y no vacía |
| Registro duplicado | Permitido con advertencia |
| Corrección de registro | Solo modifica el registro seleccionado |
| Eliminación de trabajador con historial | No permitida; se utiliza estado Inactivo |
| Eliminación de departamento con historial | No permitida mientras existan relaciones históricas |

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

- **FR-012:** El sistema DEBE permitir registrar mediciones con trabajador, período, indicador, resultado y unidad.
- **FR-013:** El sistema DEBE asociar cada medición a una asignación histórica válida.
- **FR-014:** Si existen varias asignaciones durante un mismo mes, el sistema DEBE permitir seleccionar la correspondiente.
- **FR-015:** El sistema DEBE rechazar períodos futuros.
- **FR-016:** El sistema DEBE rechazar períodos anteriores al ingreso del trabajador.
- **FR-017:** El sistema DEBE rechazar indicadores de menos de 3 o más de 60 caracteres.
- **FR-018:** El sistema DEBE rechazar resultados negativos o no numéricos.
- **FR-019:** El sistema DEBE rechazar registros sin unidad.
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
- **FR-033:** El MVP NO DEBE presentar autenticación o control de acceso como funcionalidades implementadas.
- **FR-034:** El sistema DEBE utilizar datos ficticios para las demostraciones.
- **FR-035:** El sistema DEBE mostrar de forma segura el contenido ingresado por el usuario, evitando la ejecución de scripts introducidos en campos de texto.

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

14. **Unidad vacía:** se rechaza el registro y se solicita una unidad.

15. **Asignaciones superpuestas:** se rechaza una nueva asignación que se superponga con otra del mismo trabajador.

16. **Fecha de término anterior a la fecha de inicio:** se rechaza la asignación.

17. **Almacenamiento local lleno o no disponible:** el sistema debe informar que no pudo guardar los datos y evitar mostrar una confirmación de guardado exitoso.

18. **Datos eliminados del navegador:** el sistema no garantiza su recuperación, ya que no cuenta con respaldo ni sincronización.

19. **Uso compartido del navegador:** no existe autenticación ni separación de usuarios. Solo deben utilizarse datos ficticios.

20. **Intento de registrar liquidaciones:** las funcionalidades de planilla no forman parte del incremento 002.

21. **Ingreso accidental de datos reales:** el sistema debe mostrar una advertencia de uso exclusivo de datos ficticios. No se garantiza la detección automática de información real.

Los comportamientos adicionales sobre errores de almacenamiento y advertencias de datos ficticios deberán validarse con el grupo antes de cerrar la especificación.

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
- **SC-010:** El MVP no presenta autenticación ni control de acceso como funcionalidades disponibles.
- **SC-011:** Los datos utilizados en la demostración son ficticios.
- **SC-012:** Los registros se conservan al recargar la aplicación mientras el almacenamiento local siga disponible.

Estos criterios deberán verificarse durante las pruebas de implementación.

---

## 11. Suposiciones

- El módulo funciona localmente, sin backend ni sincronización multiusuario.
- Los datos se almacenan en el navegador mediante `localStorage`.
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

---

## 12. Riesgos y consideraciones éticas

### 12.1. Sesgo por cambios de departamento

Comparar resultados de distintos departamentos o responsabilidades puede producir evaluaciones injustas. Por ello, cada medición debe conservar su departamento y unidad correspondiente.

### 12.2. Reducción del desempeño a números

La productividad no debe entenderse como una representación completa del aporte laboral de una persona. Las mediciones son herramientas de apoyo y no juicios automáticos.

### 12.3. Privacidad y confidencialidad

El almacenamiento local no ofrece autenticación, control de acceso ni respaldo centralizado.

Cualquier persona con acceso al navegador podría consultar los registros. Por esta razón, el MVP debe utilizar únicamente datos ficticios.

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

---

## 14. Pendientes de aprobación y cierre

### 14.1. Asignación de responsables

Las cuatro historias de usuario están definidas e implementadas. El grupo aún debe confirmar qué integrante será responsable de cada una; esto no cambia su alcance ni su estado técnico.

| Historia | Responsable | Estado |
|---|---|---|
| HU1 — Registro de medición de productividad | Pendiente de asignación por el grupo | Implementada; pruebas automatizadas aprobadas |
| HU2 — Consulta del historial de desempeño | Pendiente de asignación por el grupo | Implementada; pruebas automatizadas aprobadas |
| HU3 — Gestión de trabajadores y asignaciones de departamento | Pendiente de asignación por el grupo | Implementada; pruebas automatizadas aprobadas |
| HU4 — Visualización de la evolución de productividad | Pendiente de asignación por el grupo | Implementada; pruebas automatizadas aprobadas |

La asignación de responsables deberá ser acordada por el grupo antes de cerrar la planificación.

Si el grupo tiene más integrantes que historias de usuario, podrán distribuirse tareas de implementación, pruebas, integración y documentación sin inventar historias adicionales.

### 14.2. Verificaciones de cierre

- Confirmar los responsables de cada historia de usuario (pendiente de asignación por el grupo; T084).
- Aprobar el texto de la advertencia sobre datos ficticios (pendiente; T072).
- Completar la prueba manual de extremo a extremo y documentar las mediciones de SC-001 a SC-004 (pendiente; T083).
- Prueba técnica con 500 registros en Edge aislado: verificada (T076); evaluación de usuarios reales para SC-004 pendiente (T083).
- Coherencia entre `plan.md`, `data-model.md`, `tasks.md` y esta especificación revisada: completada (T085).
- Nombres de campos verificados contra las estructuras reales del módulo base; tareas de implementación registradas en `tasks.md`: completado.
- Mantener los cambios en la rama `correccion-specs-002` hasta su revisión.

---

## 15. Registro de reorganización documental

Durante la revisión de las observaciones docentes se identificaron dos carpetas correspondientes al incremento 002:

- `specs/002-modulo-rrhh-planilla`
- `specs/002-rrhh-productividad`

Para evitar duplicidad y mantener una estructura coherente, se consolidó la documentación correspondiente en `specs/002-rrhh-productividad`.

La reorganización se realizó en la rama `correccion-specs-002`, conservando los cambios en el historial de Git.

Esta reorganización corresponde a documentación y no constituye por sí misma una implementación funcional.

La implementación puede realizarse con ayuda directa de OpenCode, incluyendo la creación y modificación de archivos y la ejecución de pruebas, bajo supervisión del grupo. Los integrantes deben revisar y comprender los cambios generados. No se autorizan commits, push, merge ni cambios de rama automáticos.
