# Feature Specification: Datos cafetería, rol Jefe de Turno e interfaz auto-explicativa

**Feature Branch**: `004-cafe-shift-role-ui`

**Created**: 2026-11-27

**Status**: Draft

**Input**: User description: "Crea una nueva historia de usuario para: 1. Precargar data simulada realista de trabajadores de la cafetería (con nombres, cargos, áreas de trabajo, turnos mañana/tarde e historial de evaluaciones/productividad) al iniciar la aplicación si no hay datos previos. 2. Corregir completamente el flujo y permisos del rol Jefe de Turno (FR-052 a FR-065) para que todas sus acciones operativas funcionen sin bloqueos ni errores visuales. 3. Hacer toda la interfaz auto-explicativa mediante subtítulos descriptivos y textos de ayuda claros en cada vista y formulario (explicando qué son las Áreas de Trabajo de la cafetería, qué permite cada rol y cómo interpretar cada métrica)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Datos simulados listos desde el primer ingreso (Priority: P1)

Una persona abre la aplicación por primera vez y encuentra una cafetería de demostración ya poblada: trabajadores con nombres y cargos creíbles, áreas de trabajo, turnos de mañana y tarde, y un historial de evaluaciones y productividad que se puede consultar de inmediato, sin tener que cargar datos manualmente.

**Why this priority**: Sin datos iniciales no se puede demostrar ni validar ninguno de los flujos operativos; es la base sobre la que se apoyan las historias siguientes.

**Independent Test**: Se puede validar abriendo la aplicación con datos vacíos y comprobando que aparece el conjunto simulado completo, sin pulsar ninguna acción de carga.

**Acceptance Scenarios**:

1. **Given** una instalación sin datos de trabajadores, departamentos, asignaciones ni mediciones, **When** se abre la aplicación, **Then** se muestran automáticamente al menos 6 trabajadores, los 3 departamentos oficiales Barra, Cocina y Salón, asignaciones históricas válidas y al menos 12 mediciones repartidas en 2 meses y en los turnos Mañana y Tarde (FR-001, FR-002, FR-003).
2. **Given** el conjunto simulado ya precargado, **When** se vuelve a abrir la aplicación, **Then** no se duplica ningún trabajador, asignación ni medición y los valores existentes permanecen iguales (FR-004).
3. **Given** datos parciales creados por una persona, **When** se abre la aplicación, **Then** se conservan íntegramente y no se mezclan con el conjunto simulado; la vista correspondiente explica por qué no se precargaron datos (FR-005, FR-023).
4. **Given** el conjunto simulado, **When** se consulta el historial de un trabajador, **Then** se pueden ver su cargo, su departamento asignado, el turno, la meta esperada, el resultado con su unidad, las cuatro evaluaciones cualitativas, las observaciones y las oportunidades de mejora (FR-002, FR-003, FR-020).
5. **Given** el conjunto simulado, **When** una persona solicita expresamente recargar los datos de demostración, **Then** se le advierte de que la acción reemplaza los datos actuales y, solo si confirma, se restaura el conjunto inicial; si cancela, no cambia nada (FR-004, FR-022).
6. **Given** un trabajador simulado con historial que ya no está activo, **When** se consulta su evolución, **Then** sus mediciones históricas siguen siendo consultables pero no se ofrece para registrar nuevas mediciones (FR-003, FR-016).

---

### User Story 2 - Jefe de Turno opera sin bloqueos dentro de su alcance (Priority: P1)

Una persona con el rol Jefe de Turno selecciona su departamento y su turno, consulta solo la operación correspondiente, registra una medición y corrige otra. Todas las acciones permitidas responden normalmente y las acciones fuera de su alcance no se pueden ejecutar ni generan errores visuales.

**Why this priority**: Es el flujo operativo crítico indicado en FR-052 a FR-065 y actualmente presenta bloqueos y textos dañados que impiden trabajar.

**Independent Test**: Se puede validar seleccionando el rol Jefe de Turno en el control demostrativo, eligiendo Barra y Mañana, registrando y corrigiendo una medición, y verificando que no aparecen datos de otros departamentos o turnos.

**Acceptance Scenarios**:

1. **Given** el rol Jefe de Turno activo y sin departamento o turno elegidos, **When** se abren las vistas operativas, **Then** se muestra una guía que pide seleccionar un departamento y un turno, y no se muestran datos ni se habilitan las acciones "Nueva medición" o "Corregir medición" (FR-008, FR-023).
2. **Given** la selección de Barra y Mañana, **When** se consultan Medición, Historial y Evolución, **Then** solo se muestran mediciones cuyo trabajador tenía asignación histórica en Barra y cuyo turno es Mañana; las vistas de gestión de trabajadores, departamentos, asignaciones, turnos y metas globales están ocultas o deshabilitadas (FR-009, FR-010, FR-013).
3. **Given** un trabajador dentro del departamento y turno seleccionados, **When** se registra una nueva medición, **Then** el formulario permite meta esperada individual, resultado, indicador con unidad, las cuatro evaluaciones cualitativas, observaciones y oportunidades de mejora; al guardar, el registro aparece en el historial y en la evolución del departamento/turno (FR-011, FR-020).
4. **Given** una medición dentro del alcance, **When** se corrige, **Then** solo cambia esa medición, se conserva su folio y periodo, y los valores actualizados se reflejan de inmediato en el historial y la evolución (FR-011).
5. **Given** un trabajador o medición de otro departamento o turno, **When** se intenta registrar, corregir o consultar directamente esa acción, **Then** la acción se bloquea, se muestra un mensaje claro y no se guarda ningún cambio parcial (FR-010, FR-012, FR-017).
6. **Given** el rol Jefe de Turno activo, **When** se intenta crear o editar trabajadores, departamentos, asignaciones o turnos, marcar trabajadores como inactivos o modificar metas globales de ventas, **Then** esas acciones no están disponibles y, si se invocan de algún otro modo, se bloquean con un mensaje comprensible (FR-012, FR-017).
7. **Given** cualquier vista o formulario del flujo del Jefe de Turno, **When** se lee en pantalla, **Then** todos los textos están en español legible, sin caracteres sustituidos ni rótulos incompletos, y el rol activo y el alcance elegido son visibles (FR-006, FR-008, FR-018).
8. **Given** cambios repetidos entre Administrador, Barista y Jefe de Turno, **When** se selecciona cada rol, **Then** vistas, botones, acciones y datos se actualizan de inmediato sin modificar trabajadores, asignaciones, mediciones ni metas (FR-007).

---

### User Story 3 - Matriz de roles y metas globales coherente (Priority: P2)

Una persona con rol Administrador/Gerente puede gestionar toda la cafetería y configurar metas globales de ventas, mientras que una persona con rol Barista solo puede consultar su propio desempeño. El selector de rol se entiende claramente como una demostración, no como un acceso seguro.

**Why this priority**: FR-052 a FR-065 definen también los límites de los otros dos roles; dejar huecos en la matriz genera confusión y acciones bloqueadas fuera del alcance del Jefe de Turno.

**Independent Test**: Se puede validar recorriendo la matriz de los tres roles y comprobando, para cada uno, qué vistas y acciones aparecen y qué datos se muestran.

**Acceptance Scenarios**:

1. **Given** el rol Administrador/Gerente activo, **When** se abre la aplicación, **Then** todas las vistas y acciones están disponibles, incluidas la creación y edición de trabajadores, departamentos, asignaciones, turnos, la marca de inactivos, el registro y corrección de mediciones, la consulta de cualquier trabajador y la configuración de metas globales de ventas (FR-014).
2. **Given** el rol Barista activo, **When** se abre la aplicación, **Then** solo están disponibles "Mi desempeño" y "Mi evolución", se pide elegir el trabajador propio y no aparecen acciones de registro, corrección, gestión ni datos de otros trabajadores (FR-016).
3. **Given** cualquier vista de metas globales, **When** está activo el rol Jefe de Turno o Barista, **Then** la configuración está oculta o deshabilitada y se bloquea con un mensaje claro si se intenta usar; la meta esperada individual sigue disponible para Administrador y Jefe de Turno, y los totales consolidados internos no se muestran (FR-015, FR-017).
4. **Given** el selector de rol, **When** se abre, **Then** ofrece exactamente tres opciones —"Administrador / Gerente de Cafetería", "Jefe de Turno / Supervisor" y "Barista / Trabajador (Solo lectura)"—, usa Administrador como valor inicial, muestra el rol activo de forma visible y aclara que es un control demostrativo, no un inicio de sesión ni una verificación de identidad (FR-006).
5. **Given** una acción no permitida para el rol activo, **When** se intenta ejecutar, **Then** se impide, se explica el motivo y no se guarda ningún cambio parcial (FR-017).

---

### User Story 4 - Interfaz auto-explicativa en cada vista y formulario (Priority: P2)

Una persona que entra por primera vez entiende qué hace cada pantalla, qué significa cada campo y cómo interpretar las métricas sin salir a buscar documentación externa.

**Why this priority**: Las ayudas claras reducen errores de interpretación y hacen que los permisos y el alcance de datos sean evidentes para todos los roles.

**Independent Test**: Se puede validar recorriendo cada vista y formulario y comprobando que existe un subtítulo y una ayuda contextual visible que explica su propósito y los términos que aparecen en ella.

**Acceptance Scenarios**:

1. **Given** cualquiera de las vistas —panel, trabajadores, medición, áreas de trabajo, asignaciones, historial, evolución, búsqueda, mi desempeño, mi evolución y metas globales—, **When** se abre, **Then** muestra un subtítulo descriptivo y texto de ayuda específico sobre su propósito (FR-019).
2. **Given** la ayuda de departamentos presentados como «Área de trabajo», **When** se lee, **Then** explica que Barra corresponde a bebidas y atención en barra, Cocina a preparación de alimentos y Salón a atención en mesas, y que el departamento se obtiene de la asignación histórica y no se confunde con los cinco cargos oficiales (FR-020).
3. **Given** la ayuda del selector de rol, **When** se lee, **Then** describe qué puede hacer cada uno de los tres roles y recuerda que el cambio de rol es solo demostrativo y no altera los datos (FR-006, FR-020).
4. **Given** el formulario de medición o una vista de históricos, **When** se lee la ayuda de métricas, **Then** se explican el indicador y su unidad, la meta esperada individual, el resultado, la escala de las cuatro evaluaciones cualitativas, las observaciones, las oportunidades de mejora, la regla de comparar solo indicadores con la misma unidad, la ausencia de una calificación automática y la diferencia entre meta individual, total consolidado interno y meta global de ventas (FR-020).
5. **Given** cualquier campo con ayuda, **When** se usa, **Then** la explicación está disponible en la misma vista, sin tener que abandonar el formulario, y usa la misma terminología en todas las pantallas (FR-021).
6. **Given** el aviso de datos ficticios, **When** se abre la aplicación, **Then** permanece visible y legible, indicando que el uso es académico y que no se deben ingresar datos personales o laborales reales (FR-022).
7. **Given** una vista vacía, parcial o no autorizada, **When** se abre, **Then** el texto explica qué ocurre y cuál es el siguiente paso permitido, sin mostrar mensajes confusos ni rótulos dañados (FR-018, FR-023).

---

### Edge Cases

- No existen datos de negocio, pero sí preferencias de rol o tema guardadas: la precarga debe realizarse igualmente porque esas preferencias no cuentan como datos de trabajadores.
- Existen solo algunos trabajadores o solo departamentos, pero no mediciones: no se completa el resto del conjunto simulado; se conserva lo existente y se explica la situación.
- El departamento o turno guardado para el Jefe de Turno deja de estar disponible: se le pide seleccionar de nuevo y no se muestran datos anteriores hasta que lo haga.
- Una asignación histórica termina antes del periodo de una medición: esa medición no se muestra como válida para el Jefe de Turno y se ofrece un mensaje claro al intentar usarla.
- Se intenta registrar una medición en un periodo futuro, anterior a la fecha de ingreso o fuera de la asignación: se bloquea según las reglas vigentes y se indica el motivo.
- Existen dos mediciones iguales para el mismo trabajador, indicador y periodo: se permite con una advertencia, de acuerdo con las reglas actuales.
- Un trabajador inactivo tiene historial: sus mediciones antiguas son consultables, pero no aparece como opción para nuevas mediciones.
- Se cambia el rol mientras hay un formulario sin guardar: los cambios no se aplican de forma parcial y el usuario recibe una explicación clara.
- Se intenta guardar una meta global repetida para el mismo departamento y periodo: se bloquea con un mensaje específico.
- Aparece un valor inesperado en el rol, departamento o turno guardado: se normaliza a una opción válida y se muestra el estado resultante sin fallar.
- El conjunto simulado se recarga mientras el Jefe de Turno tiene un departamento y turno seleccionados: el alcance se mantiene si sigue siendo válido y los datos visibles se actualizan.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE precargar automáticamente un conjunto de datos simulados al iniciar, únicamente cuando no existan datos previos de trabajadores, departamentos, asignaciones y mediciones.
- **FR-002**: El conjunto precargado DEBE incluir al menos 6 trabajadores con nombres ficticios completos y cargos oficiales de Barista, Cajero, Mesero, Cocinero y Encargado, los 3 departamentos oficiales Barra, Cocina y Salón, los turnos Mañana y Tarde, y al menos 12 mediciones distribuidas en un mínimo de 2 meses.
- **FR-003**: Cada medición precargada DEBE tener asignación histórica válida, periodo coherente con la fecha de ingreso, un indicador del catálogo definido para el cargo oficial, meta esperada, resultado con unidad, las cuatro evaluaciones cualitativas, observaciones y oportunidades de mejora; los datos DEBEN cubrir los tres departamentos y ambos turnos.
- **FR-004**: La precarga DEBE ser idempotente: al iniciar de nuevo no DEBE duplicar registros ni sobrescribir datos existentes; la recarga manual de demostración solo DEBE realizarse tras confirmación explícita que advierte del reemplazo.
- **FR-005**: Si existen datos parciales, el sistema DEBE conservarlos sin completarlos con datos simulados y DEBE explicar en la vista correspondiente por qué no se precargó el conjunto completo.
- **FR-006**: El selector de rol DEBE ofrecer exactamente tres opciones —"Administrador / Gerente de Cafetería", "Jefe de Turno / Supervisor" y "Barista / Trabajador (Solo lectura)"—, usar Administrador como predeterminado, mostrar el rol activo de forma visible y aclarar que es un control demostrativo, no autenticación ni verificación de identidad.
- **FR-007**: Al cambiar el rol activo, el sistema DEBE actualizar de inmediato vistas, botones, acciones y datos visibles, sin modificar trabajadores, asignaciones, mediciones ni metas como consecuencia del cambio.
- **FR-008**: Con el rol Jefe de Turno activo, el sistema DEBE pedir la selección explícita de un departamento (Barra, Cocina o Salón) y de un turno (Mañana o Tarde) antes de mostrar datos o habilitar acciones operativas; mientras falte alguna selección DEBE mostrar una guía clara.
- **FR-009**: Con el rol Jefe de Turno activo, el sistema DEBE habilitar únicamente las vistas "Medición", "Historial por área/turno" y "Evolución por área/turno"; las vistas de gestión DEBEN estar ocultas o deshabilitadas.
- **FR-010**: El Jefe de Turno DEBE poder registrar y corregir mediciones solo para trabajadores cuya asignación histórica corresponda al departamento seleccionado y cuya medición corresponda al turno seleccionado; el formulario DEBE mostrar y fijar ese contexto y NO DEBE ofrecer trabajadores fuera de alcance.
- **FR-011**: El formulario de medición del Jefe de Turno DEBE permitir indicador con unidad, meta esperada individual, resultado, las cuatro evaluaciones cualitativas, observaciones y oportunidades de mejora; una corrección DEBE modificar solo la medición elegida, conservar su folio y periodo, y no guardar cambios parciales si la validación falla.
- **FR-012**: El Jefe de Turno NO DEBE poder crear ni editar trabajadores, departamentos, asignaciones o turnos, marcar trabajadores como inactivos, ni modificar metas globales de ventas; esas acciones DEBEN estar ocultas o deshabilitadas y bloquearse si se invocan por otro medio.
- **FR-013**: El sistema DEBE filtrar todos los datos visibles para el Jefe de Turno por departamento de la asignación histórica y por turno registrado, sin mostrar registros de otros departamentos o turnos.
- **FR-014**: Con el rol Administrador/Gerente activo, el sistema DEBE habilitar todas las vistas y acciones, incluidas gestión de trabajadores, departamentos, asignaciones y turnos, marca de inactivos, configuración de metas globales de ventas, registro y corrección de cualquier medición y consulta de cualquier trabajador.
- **FR-015**: La configuración de metas globales de ventas DEBE estar disponible solo para el rol Administrador/Gerente; la meta esperada individual DEBE permanecer disponible para Administrador/Gerente y Jefe de Turno; los totales consolidados internos NO DEBEN mostrarse en la interfaz.
- **FR-016**: Con el rol Barista activo, el sistema DEBE habilitar solo "Mi desempeño" y "Mi evolución", pedir la selección del trabajador propio, mostrar solo sus datos y ocultar o deshabilitar registro, corrección, gestión y acceso a otros trabajadores.
- **FR-017**: Si se intenta una acción no permitida para el rol activo, el sistema DEBE impedirla, mostrar un mensaje claro que explique el motivo y NO DEBE guardar cambios parciales.
- **FR-018**: Toda la interfaz DEBE mostrar textos en español legibles y completos, sin caracteres sustituidos, rótulos incompletos ni errores visuales en etiquetas, títulos, mensajes o ayudas.
- **FR-019**: Cada vista y formulario DEBE incluir un subtítulo descriptivo y texto de ayuda contextual que explique su propósito y el significado de la información que muestra o solicita.
- **FR-020**: La ayuda DEBE definir los departamentos de trabajo ofrecidos como «Área de trabajo» (Barra, Cocina y Salón) y su relación con la asignación histórica, distinguirlos de los cinco cargos oficiales, describir qué permite cada rol, explicar los turnos Mañana y Tarde, e indicar cómo interpretar indicador, unidad, meta esperada, resultado, evaluaciones cualitativas, observaciones, oportunidades de mejora, comparación por indicador y unidad, ausencia de calificación automática, meta individual, total consolidado interno y meta global de ventas.
- **FR-021**: La ayuda DEBE ser visible en la misma vista, estar asociada a los campos que explica, mantener terminología coherente en todo el producto y no exigir abandonar el formulario para consultarla.
- **FR-022**: El aviso sobre uso académico y datos ficticios DEBE estar visible y legible en la aplicación; el conjunto precargado DEBE contener solo datos ficticios.
- **FR-023**: Los estados vacíos, parciales y no autorizados DEBEN explicar qué ocurre y cuál es el siguiente paso permitido, en lugar de mostrar pantallas silenciosas o mensajes genéricos.

### Key Entities *(include if feature involves data)*

- **Trabajador**: Persona ficticia de la cafetería; se identifica por nombre y código, y tiene cargo, fecha de ingreso, estado laboral y descripción.
- **Departamento de trabajo (Área de trabajo)**: Unidad operativa oficial de la cafetería —Barra, Cocina o Salón—; se muestra en la interfaz como «Área de trabajo», se distingue de los cinco cargos oficiales y se asocia al trabajador mediante una asignación histórica.
- **Asignación histórica**: Relación entre un trabajador y un departamento en un periodo determinado; sirve para delimitar el alcance del Jefe de Turno.
- **Turno**: Franja operativa Mañana o Tarde asociada a cada medición.
- **Medición de productividad**: Registro de un periodo, turno, indicador con unidad, meta esperada individual, resultado y evaluación cualitativa de un trabajador.
- **Evaluación cualitativa**: Calificación de calidad, responsabilidad, cumplimiento y colaboración, acompañada de observaciones y oportunidades de mejora.
- **Meta esperada individual**: Valor esperado para el indicador de una medición; distinto del total consolidado interno y de la meta global de ventas.
- **Meta global de ventas**: Objetivo por departamento y periodo que solo puede configurar el rol Administrador/Gerente.
- **Rol activo**: Selección demostrativa entre Administrador/Gerente, Jefe de Turno y Barista; determina vistas, acciones y alcance de datos sin verificar identidad.
- **Contexto del Jefe de Turno**: Combinación de departamento y turno elegida que filtra las mediciones, el historial y la evolución visibles.
- **Texto de ayuda**: Subtítulo o explicación contextual asociado a una vista o campo, con terminología coherente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En la primera apertura con datos vacíos, una persona ve el conjunto simulado completo en menos de 5 segundos y sin realizar ninguna carga manual.
- **SC-002**: El 100% de las combinaciones de rol y acción descritas en FR-052 a FR-065 se comporta según la matriz definida, sin acciones bloqueadas indebidamente.
- **SC-003**: Un Jefe de Turno completa el registro y la corrección de una medición dentro de su alcance en menos de 2 minutos y sin errores visuales.
- **SC-004**: Un Jefe de Turno ve 0 registros de departamentos o turnos distintos a los seleccionados en el historial y la evolución.
- **SC-005**: El 100% de los rótulos, mensajes y ayudas se muestra sin caracteres dañados ni textos incompletos.
- **SC-006**: Al cambiar de rol, la interfaz se actualiza en menos de 3 segundos y el 100% de los datos de negocio permanece sin cambios.
- **SC-007**: Al abrir la aplicación 10 veces seguidas sin borrar datos, el número de trabajadores, asignaciones y mediciones se mantiene exactamente igual.
- **SC-008**: Al menos el 90% de las personas que usan la aplicación por primera vez puede explicar qué es un área de trabajo, qué permite su rol y cómo interpretar meta, resultado y evaluaciones después de leer las ayudas, sin asistencia externa.
- **SC-009**: El 100% de las vistas y formularios incluye subtítulo y ayuda contextual; el 100% de los campos de medición incluye explicación de su significado.
- **SC-010**: Las acciones no permitidas muestran un mensaje comprensible en el 100% de los casos y no producen cambios parciales.

## Assumptions

- La aplicación sigue siendo una herramienta académica en español, con datos ficticios y sin autenticación real; el selector de rol continúa siendo demostrativo.
- La terminología oficial integrada desde `main` (cambio US7) es la siguiente: los departamentos son únicamente Barra, Cocina y Salón —presentados en la interfaz como «Área de trabajo»— y los cargos oficiales son Barista, Cajero, Mesero, Cocinero y Encargado; el conjunto simulado usa esos tres departamentos y esos cinco cargos, sin departamentos «Caja» ni «Supervisión».
- La HU7 (confidencialidad de licencias médicas y ausencias justificadas) continúa fuera de alcance y con tareas diferidas; de su integración se adopta solo la aclaración terminológica indicada arriba.
- La precarga se activa solo cuando no hay ningún dato de negocio relevante; cualquier dato existente se considera propio del usuario y se preserva.
- La acción manual de recarga de demostración se mantiene, pero se presenta como reemplazo explícito y confirmado de los datos actuales.
- Las reglas vigentes de validación de periodos, indicadores, resultados, asignaciones y duplicados continúan aplicándose a los datos precargados y a los nuevos registros.
- Las ayudas se muestran dentro de cada vista o formulario, reutilizando la presentación y terminología existentes del producto.
- El rol Administrador/Gerente conserva acceso a la configuración de metas globales de ventas, que se incorpora a la interfaz como parte de la corrección de la matriz de roles.
- El cumplimiento de esta historia se verifica con pruebas automáticas de precarga, matriz de roles, flujo del Jefe de Turno y presencia de ayudas, además de una revisión visual de los textos.
