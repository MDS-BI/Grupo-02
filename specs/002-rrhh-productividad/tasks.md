
# Tareas: Incremento 002 — RR. HH. e Historial de Productividad Laboral

**Entrada:** `spec.md`, `plan.md` y `data-model.md` de `specs/002-rrhh-productividad/`  
**Prerrequisitos:** Documentación de 002 y recuperación/verificación del módulo base (E0)  
**Rama de trabajo:** `correccion-specs-002`  
**Estado:** Implementación técnica completada; suite automatizada aprobada (14 archivos, 132 pruebas) y T076 verificada en Edge aislado. Pendientes las mediciones manuales de T083, la aprobación del texto de advertencia (T072), la asignación de responsables (T084) y la revisión del grupo.

**Separación de trabajo:** T001–T009 (E0) recuperan y verifican el módulo base del incremento 001; no son funcionalidades nuevas de 002. T010–T070 registran la infraestructura y las cuatro historias del incremento 002. T071–T086 registran las verificaciones, documentación y cierre.

**Regla de trabajo con IA:** Se permite utilizar OpenCode para crear, modificar y ejecutar código del proyecto, con supervisión de los integrantes del grupo. Los cambios deben revisarse y probarse antes de considerarse terminados. OpenCode no puede realizar commits, push, merge, eliminar datos existentes ni cambiar de rama sin autorización explícita.

## Formato de tareas

Cada tarea utiliza el formato:

`- [x] T001 [P] [US1] Descripción`

- `[ ]`: tarea pendiente.
- `[x]`: tarea completada.
- `T001`: identificador de la tarea.
- `[P]`: tarea que puede desarrollarse en paralelo si no tiene dependencias pendientes ni conflictos de archivos.
- `[US1]`: historia de usuario 1.
- `[US2]`: historia de usuario 2.
- `[US3]`: historia de usuario 3.
- `[US4]`: historia de usuario 4.

## Responsables

| Historia | Responsable | Estado |
|---|---|---|
| HU1 — Registro de medición de productividad | Por confirmar | Implementado; validación automatizada completada |
| HU2 — Consulta del historial de desempeño | Por confirmar | Implementado; validación automatizada completada |
| HU3 — Gestión de trabajadores y asignaciones | Por confirmar | Implementado; validación automatizada completada |
| HU4 — Visualización de la evolución | Por confirmar | Implementado; validación automatizada completada |

Los responsables deben asignarse cuando el grupo confirme qué integrante desarrollará cada historia. No se inventarán nombres.

## Resumen de fases

| Fase | Contenido | Tareas | Cantidad |
|---|---|---|---|
| 1 | Recuperación y verificación del módulo base | T001–T009 | 9 |
| 2 | Infraestructura fundacional | T010–T022 | 13 |
| 3 | HU3: trabajadores, departamentos y asignaciones | T023–T039 | 17 |
| 4 | HU1: registro de productividad | T040–T054 | 15 |
| 5 | HU2: consulta del historial | T055–T062 | 8 |
| 6 | HU4: visualización de evolución | T063–T070 | 8 |
| 7 | Pruebas, documentación y cierre | T071–T086 | 16 |
| **Total** | | **T001–T086** | **86** |

---

## Fase 1: Recuperación y verificación del módulo base (E0)

**Propósito:** Recuperar el código base eliminado del árbol de trabajo y verificar las estructuras reales antes de implementar el incremento 002.

**Importante:** Esta fase debe completarse antes de comenzar la implementación.

- [x] T001 Verificar que la rama activa sea `correccion-specs-002` y comprobar el estado de `src/`, `index.html` y `tests/`, sin cambiar de rama ni crear ramas nuevas.

- [x] T002 Identificar en el historial de Git el commit recuperable `a0062c0^` y listar los archivos disponibles de `src/`, `index.html` y `tests/`.

- [x] T003 [P] Restaurar manualmente `index.html` desde el historial de Git, sin sobrescribir la documentación del incremento 002. La carga de la aplicación se verificará después de recuperar también `src/`.

- [x] T004 [P] Restaurar manualmente `src/` desde el historial de Git, incluyendo los archivos y componentes existentes en la versión recuperable.

- [x] T005 [P] Restaurar manualmente `tests/` desde el último commit que contenga las pruebas necesarias y verificar su estructura.

- [x] T006 Verificar `package.json` y los scripts de desarrollo, pruebas y compilación. Instalar dependencias si corresponde.

- [x] T007 Ejecutar la aplicación base y las pruebas existentes después de restaurar `index.html`, `src/` y `tests/`. Registrar los resultados y errores encontrados.

- [x] T008 Verificar las estructuras reales de `Entity`, `Document` y `ModuleConfig`, las claves de `localStorage` y el comportamiento de eliminación en cascada. Comparar los resultados con `data-model.md`.

- [x] T009 Documentar los resultados de la recuperación y actualizar `data-model.md` y `plan.md` si se encuentran diferencias con el código recuperado.

**Punto de control:** El módulo base está recuperado, funciona y sus estructuras principales han sido verificadas.

---

## Fase 2: Infraestructura fundacional

**Propósito:** Preparar almacenamiento, configuración, validaciones y componentes comunes necesarios para implementar las cuatro historias de usuario.

**Dependencia:** Fase 1 completada.

### Almacenamiento y validaciones

- [x] T010 Extender `src/storage.js` con operaciones para crear, editar, listar, buscar y validar departamentos.

- [x] T011 Implementar en `src/storage.js` la persistencia de departamentos mediante la clave `erp_base_module:departamentos`.

- [x] T012 Extender `src/storage.js` con operaciones para crear, listar por trabajador, cerrar y validar asignaciones de `Historial_Departamento`.

- [x] T013 Implementar en `src/storage.js` la persistencia de asignaciones mediante la clave `erp_base_module:historial_departamentos`.

- [x] T014 Implementar las validaciones compartidas de fechas, superposición, asignación vigente y protección de asignaciones con mediciones históricas vinculadas.

### Configuración del módulo

- [x] T015 Extender `src/module-config.js` con las etiquetas `Trabajador`, `Trabajadores`, `Registro de Productividad` y `Registros de Productividad`.

- [x] T016 Configurar los campos personalizados de trabajador: `cargo`, `fechaIngreso`, `estadoLaboral` y `departamentoId`.

- [x] T017 Configurar los campos personalizados de productividad: `indicador`, `resultado`, `unidad` y `asignacionId`.

- [x] T018 Verificar o extender `src/components/custom-fields.js` para mostrar correctamente los campos personalizados sin romper el comportamiento base.

### Pruebas e integración

- [x] T019 [P] Agregar pruebas unitarias para operaciones de departamentos, historial y validaciones en la estructura de pruebas confirmada durante E0. Preparar las pruebas antes o junto con cada operación, verificar su fallo inicial y luego comprobar que pasan tras implementarla.

- [x] T020 [P] Agregar pruebas unitarias para las etiquetas y los campos personalizados de ModuleConfig. Preparar las pruebas antes o junto con la configuración correspondiente.

- [x] T021 Integrar la configuración del módulo y las nuevas operaciones de almacenamiento con `src/main.js` y `src/app.js`, ajustando las rutas a la estructura real recuperada.

- [x] T022 Implementar el manejo de errores de localStorage para informar fallos de lectura o escritura y evitar confirmaciones falsas de guardado. Preparar una advertencia provisional de uso exclusivo de datos ficticios; la aprobación del texto definitivo no debe bloquear la infraestructura técnica.

**Punto de control:** El almacenamiento de departamentos y asignaciones funciona, la configuración carga correctamente y las validaciones compartidas están disponibles.

---

## Fase 3: HU3 — Gestión de trabajadores, departamentos y asignaciones

**Prioridad:** P1 — MVP

**Objetivo:** Registrar y editar trabajadores y departamentos, administrar asignaciones históricas y conservar el historial cuando un trabajador cambia de departamento.

**Prueba independiente:** Registrar un trabajador, asignarlo a un departamento, trasladarlo a otro y comprobar que la asignación anterior se conserva.

### Pruebas de HU3

- [x] T023 [P] [US3] Agregar pruebas unitarias para crear, editar y validar trabajadores con campos personalizados.

- [x] T024 [P] [US3] Agregar pruebas unitarias para crear, editar, listar y validar nombres únicos de departamentos.

- [x] T025 [P] [US3] Agregar pruebas unitarias para asignaciones históricas: fechas válidas, ausencia de superposición, una sola asignación vigente y cierre de la asignación anterior.

- [x] T026 [P] [US3] Agregar pruebas de integración para los formularios de trabajador y departamento.

- [x] T027 [P] [US3] Agregar pruebas de integración para el cambio de departamento, la conservación del historial, el bloqueo de eliminaciones con historial y el rechazo de cambios en asignaciones que invaliden mediciones vinculadas.

### Implementación de HU3

- [x] T028 [P] [US3] Extender `src/components/entity-form.js` para registrar `cargo`, `fechaIngreso`, `estadoLaboral` y `departamentoId`.

- [x] T029 [P] [US3] Extender `src/components/entity-list.js` para mostrar información del trabajador, departamento actual y estado laboral.

- [x] T030 [P] [US3] Crear los componentes de formulario y listado de departamentos. Confirmar sus nombres definitivos después de recuperar el módulo base.

- [x] T031 [P] [US3] Crear los componentes de formulario y listado de asignaciones históricas. Confirmar sus nombres definitivos después de recuperar el módulo base.

- [x] T032 [US3] Conectar el registro y edición de trabajadores con el almacenamiento en `src/app.js`.

- [x] T033 [US3] Conectar el registro y edición de departamentos con el almacenamiento en `src/app.js`.

- [x] T034 [US3] Implementar el cambio de departamento: cerrar la asignación anterior, crear una nueva y actualizar `departamentoId`, conservando los registros históricos.

- [x] T035 [US3] Mostrar mensajes claros para errores de validación de trabajadores, departamentos y asignaciones.

- [x] T036 [US3] Impedir la eliminación física de trabajadores que tengan documentos de productividad o asignaciones históricas, y permitir marcarlos como `Inactivo`. Proteger también la operación de almacenamiento para evitar eliminaciones en cascada.

- [x] T037 [US3] Impedir la eliminación física de departamentos con trabajadores o asignaciones históricas vinculadas.

- [x] T038 [US3] Mostrar el departamento actual y las asignaciones anteriores del trabajador. Bloquear la eliminación de asignaciones que tengan mediciones vinculadas y rechazar modificaciones que dejen registros históricos inválidos.

- [x] T039 [US3] Aplicar estilos, ejecutar las pruebas de HU3 y realizar la prueba manual independiente, registrando el resultado.

**Punto de control:** HU3 permite gestionar trabajadores, departamentos y asignaciones sin perder información histórica.

---

## Fase 4: HU1 — Registro de medición de productividad

**Prioridad:** P1 — MVP

**Objetivo:** Registrar mediciones periódicas de productividad asociadas a una asignación histórica válida, permitiendo corregir registros individuales sin afectar otros períodos.

**Dependencia:** HU3 completada.

**Prueba independiente:** Registrar un trabajador, asignarlo a un departamento y guardar una medición válida. Verificar que una corrección no modifique otras mediciones.

### Pruebas de HU1

- [x] T040 [P] [US1] Agregar pruebas unitarias para validar el período mensual, el primer y último día del mes, el rechazo de períodos futuros y los anteriores al ingreso.

- [x] T041 [P] [US1] Agregar pruebas unitarias para indicador de 3 a 60 caracteres, resultado numérico no negativo y unidad obligatoria.

- [x] T042 [P] [US1] Agregar pruebas unitarias para validar asignaciones: existencia, pertenencia al trabajador, superposición con el período y selección automática o explícita.

- [x] T043 [P] [US1] Agregar pruebas unitarias para detectar duplicados con advertencia y generar automáticamente un folio entero positivo.

- [x] T044 [P] [US1] Agregar pruebas de integración para seleccionar explícitamente un trabajador, persistir su entity_id, crear una medición con asignacionId válido, folio automático y sin campos monetarios, y comprobar que el registro corresponde al trabajador seleccionado.

- [x] T045 [P] [US1] Agregar pruebas de integración para corregir únicamente el registro seleccionado, conservar su folio y no modificar otros períodos.

### Implementación de HU1

- [x] T046 [P] [US1] Extender src/components/document-form.js con la selección explícita de trabajador y los campos indicador, resultado, unidad y asignacionId. El formulario debe conservar y enviar entity_id del trabajador seleccionado.

- [x] T047 [US1] Implementar la entrada de período `AAAA-MM` y convertirla a `startDate` y `endDate`, correspondientes al primer y último día del mes.

- [x] T048 [US1] Implementar la selección de asignación histórica: automática si existe una sola válida, explícita si existen varias y rechazo si no existe ninguna.

- [x] T049 [US1] Implementar las validaciones de productividad y mostrar mensajes claros ante datos incorrectos.

- [x] T050 [US1] Implementar la detección de registros duplicados del mismo trabajador, período e indicador. Mostrar advertencia y permitir continuar con confirmación.

- [x] T051 [US1] Implementar la generación automática de folio entero positivo en `src/storage.js`, utilizando el mayor folio válido más uno.

- [x] T052 [US1] Antes de guardar registros de productividad en erp_base_module:documents, inspeccionar los documentos existentes e identificar registros no productivos, folios inválidos y posibles incompatibilidades. Definir y aplicar un tratamiento seguro mediante respaldo, migración o limpieza con confirmación, sin eliminar datos silenciosamente. Si no puede garantizarse una operación segura, bloquear el guardado e informar el problema. Después de esta verificación, persistir Document con entity_id, folio, período, campos personalizados y asignacionId, sin utilizar campos monetarios.

- [x] T053 [US1] Implementar la corrección de una medición existente, actualizando únicamente el registro seleccionado, conservando su folio y aplicando nuevamente las validaciones.

- [x] T054 [US1] Aplicar estilos, ejecutar las pruebas de HU1 y realizar la prueba manual independiente, registrando el resultado.

**Punto de control:** HU1 permite registrar y corregir mediciones de productividad sin alterar otros registros.

---

## Fase 5: HU2 — Consulta del historial de desempeño

**Prioridad:** P1

**Objetivo:** Consultar el historial cronológico de productividad de cada trabajador, mostrando el departamento que correspondía a cada medición.

**Dependencia:** HU1 completada.

**Prueba independiente:** Seleccionar un trabajador con mediciones de distintos períodos y visualizar los registros ordenados y asociados a sus departamentos históricos correctos.

### Pruebas de HU2

- [x] T055 [P] [US2] Agregar pruebas unitarias para filtrar registros por trabajador y ordenarlos cronológicamente mediante `startDate`.

- [x] T056 [P] [US2] Agregar pruebas unitarias para obtener el departamento histórico desde `asignacionId` y `Historial_Departamento`.

- [x] T057 [P] [US2] Agregar pruebas de integración para mostrar período, departamento histórico, indicador, resultado y unidad; comprobar que las mediciones persisten después de recargar la aplicación mientras localStorage esté disponible.

- [x] T058 [P] [US2] Agregar pruebas de integración para trabajadores sin mediciones y para conservar el departamento histórico después de una reasignación.

### Implementación de HU2

- [x] T059 [US2] Crear la vista de historial o extender una vista existente, según la estructura recuperada del módulo base.

- [x] T060 [US2] Conectar la selección de trabajador con la consulta de registros y su orden cronológico.

- [x] T061 [US2] Mostrar cada medición con su período `AAAA-MM`, departamento histórico, indicador, resultado y unidad, sin modificar los registros almacenados.

- [x] T062 [US2] Implementar el mensaje de ausencia de mediciones, aplicar estilos, ejecutar pruebas y registrar la validación manual de HU2.

**Punto de control:** HU2 permite consultar el historial completo sin sobrescribir datos anteriores.

---

## Fase 6: HU4 — Visualización de la evolución de productividad

**Prioridad:** P2

**Objetivo:** Mostrar la evolución de mediciones comparables de un trabajador mediante tablas o paneles resumidos.

**Dependencia:** HU2 completada.

**Prueba independiente:** Seleccionar un trabajador con mediciones de un mismo indicador y unidad en distintos períodos, y verificar que solo se comparen resultados equivalentes.

### Pruebas de HU4

- [x] T063 [P] [US4] Agregar pruebas unitarias para filtrar mediciones comparables por trabajador, indicador y unidad, ordenadas por período.

- [x] T064 [P] [US4] Agregar pruebas de integración para la vista de evolución, la exclusión de indicadores o unidades diferentes y el mensaje de datos insuficientes.

### Implementación de HU4

- [x] T065 [US4] Crear una vista de evolución o extender la vista de historial existente, según la estructura real del módulo base.

- [x] T066 [US4] Conectar la selección de trabajador, indicador y unidad con la consulta de evolución.

- [x] T067 [US4] Mostrar una tabla cronológica con período, indicador, resultado, unidad y departamento histórico.

- [x] T068 [US4] Mostrar la evolución exclusivamente entre mediciones del mismo indicador y la misma unidad, evitando comparaciones entre valores no equivalentes.

- [x] T069 [US4] Implementar el mensaje de datos insuficientes. No calcular puntuaciones únicas de productividad ni emitir juicios automáticos de desempeño.

- [x] T070 [US4] Aplicar estilos, ejecutar las pruebas de HU4 y realizar la prueba manual independiente, registrando los resultados.

**Punto de control:** HU4 permite visualizar la evolución de mediciones comparables sin generar evaluaciones automáticas.

---

## Fase 7: Pruebas, documentación y cierre

**Propósito:** Verificar requisitos transversales, revisar la documentación y comprobar el funcionamiento completo del incremento 002.

- [x] T071 [P] Actualizar `README.md` con el alcance de 002, uso de datos ficticios, almacenamiento local, ausencia de autenticación y conservación de la documentación de planilla.

- [ ] T072 [P] Confirmar con el grupo el texto definitivo de la advertencia de uso exclusivo de datos ficticios, actualizarlo si corresponde y verificar que se muestre correctamente. Esta aprobación no bloquea las tareas técnicas anteriores.

- [x] T073 [P] Verificar el renderizado seguro del contenido ingresado por el usuario, evitando la ejecución de scripts desde campos de texto.

- [x] T074 [P] Verificar el comportamiento ante `localStorage` lleno, bloqueado o no disponible, sin mostrar confirmaciones falsas de guardado.

- [x] T075 [P] Verificar que la aplicación no presente autenticación, roles ni control de acceso como funcionalidades implementadas.

- [x] T076 [P] Verificar el rendimiento y la usabilidad del módulo con al menos 500 registros de productividad. En Edge headless y perfil temporal aislado se cargaron exactamente 500 mediciones ficticias: Historial renderizó 500 filas en 113.7 ms; Evolución, 500 filas en 113.5 ms; navegación por cuatro vistas, 145.4 ms. Sin errores de JavaScript ni mensajes de error de interfaz; perfil temporal eliminado. Esta prueba técnica no sustituye SC-004 con usuarios reales.

- [x] T077 [P] Verificar accesibilidad básica de formularios y vistas: etiquetas, navegación por teclado y estructura semántica.

- [x] T078 [P] Verificar el diseño responsivo de formularios, listados, historial y evolución.

- [x] T079 [P] Verificar que los documentos de productividad no utilicen campos monetarios ni se mezclen con liquidaciones. Comprobar y documentar el tratamiento realizado sobre documentos anteriores y folios inválidos, conservando evidencia de cualquier migración o limpieza autorizada.

- [x] T080 [P] Verificar que el MER original de nueve entidades permanezca sin modificaciones, no se agreguen entidades y exista `specs/001-erp-base-module/mer.png` con PK, FK y cardinalidades.

- [x] T081 Ejecutar la suite completa de pruebas unitarias y de integración. Resultado automatizado: 14 archivos y 132 pruebas aprobadas. Además, ejecutar las comprobaciones de linting, formato y análisis estático exigidas por la constitución del proyecto, utilizando las herramientas configuradas o documentando las que falten. Registrar fallos y correcciones.

- [x] T082 Ejecutar la compilación de producción y comprobar que se completa sin errores. Registrar el resultado junto con el estado de las comprobaciones de calidad de código.

- [ ] T083 Ejecutar y documentar una prueba manual de extremo a extremo HU3 → HU1 → HU2 → HU4 con datos ficticios. **Resultados parciales ejecutados por el grupo:** creación de departamentos y trabajadores; asignaciones y cambios de departamento; registro y consulta de productividad; evolución entre dos períodos; conservación del departamento histórico; persistencia tras recargar la página. Las pruebas de integración también automatizan el registro y consulta, pero no miden el tiempo de una persona. **Medición técnica SC-003:** Historial renderizó 500 filas en 113.7 ms en Edge headless; no equivale a una medición de tiempo de tarea humana. **Pendiente para cerrar T083:** cronometrar SC-001, SC-002 y SC-003 con usuario, evaluar SC-004 con usuarios reales (al menos 90%) y registrar evidencias y resultados.

- [ ] T084 Actualizar spec.md y la tabla de responsables de tasks.md cuando el grupo confirme qué integrante realizará cada historia de usuario. La falta de confirmación no debe bloquear las verificaciones técnicas, pero debe quedar documentada antes de la entrega final.

- [x] T085 Revisar la coherencia de Spec Kit (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/` y `tasks.md`), README e imagen MER, sin alterar funcionalidades.

- [x] T086 Preparar el resumen final de cambios para revisión del grupo, manteniendo el trabajo en `correccion-specs-002`, sin commits ni push automáticos por parte de OpenCode.

**Punto de control:** Las cuatro historias de usuario están integradas, probadas y documentadas.

---

## Dependencias y orden de ejecución

### Dependencias entre fases

1. **Fase 1:** Recuperación y verificación del código base. Es prerrequisito de todo.
2. **Fase 2:** Infraestructura fundacional. Depende de la Fase 1.
3. **Fase 3 — HU3:** Depende de la Fase 2.
4. **Fase 4 — HU1:** Depende de HU3.
5. **Fase 5 — HU2:** Depende de HU1.
6. **Fase 6 — HU4:** Depende de HU2.
7. **Fase 7:** Revisión final después de integrar las cuatro historias.

### Tareas paralelizables

Las tareas marcadas con `[P]` pueden desarrollarse en paralelo únicamente cuando:

- Sus dependencias previas están resueltas.
- No modifican simultáneamente el mismo archivo.
- No generan conflictos de integración.
- Los integrantes coordinan sus cambios antes de integrarlos.

Las operaciones que modifican `src/storage.js` deben coordinarse y no editarse simultáneamente sin una estrategia acordada.

Las tareas de restauración T003, T004 y T005 también pueden prepararse por separado, pero las pruebas de ejecución deben realizarse después de completar la recuperación del código necesario.

### Orden recomendado de implementación

1. Recuperar y verificar el módulo base.
2. Implementar el almacenamiento y la configuración compartidos.
3. Implementar HU3: trabajadores, departamentos y asignaciones.
4. Implementar HU1: registro y corrección de productividad.
5. Validar el flujo mínimo de trabajador → asignación → medición.
6. Implementar HU2: historial cronológico.
7. Implementar HU4: evolución de productividad.
8. Completar pruebas, documentación y revisión final.

### Reglas de avance

- No comenzar a implementar 002 antes de recuperar y verificar el código base.
- Escribir y ejecutar las pruebas correspondientes antes de completar cada funcionalidad, cuando sea viable.
- No marcar tareas como completadas sin verificación.
- No agregar funcionalidades fuera del alcance de `spec.md`.
- Mantener la documentación alineada con el código implementado.

---

## Trazabilidad con requisitos

| Requisitos | Fases y tareas |
|---|---|
| FR-001 a FR-011 | Fase 3: T023–T039 |
| FR-012 a FR-023 | Fase 4: T040–T054 |
| FR-024 a FR-027 | Fase 5: T055–T062 |
| FR-028 a FR-031 | Fase 6: T063–T070 |
| FR-032 a FR-035 | Fases 2 y 7 |
| HU1 | Fase 4 |
| HU2 | Fase 5 |
| HU3 | Fase 3 |
| HU4 | Fase 6 |

---

## Restricciones de alcance

El incremento 002 no debe implementar:

- Planilla, remuneraciones, contratos ni liquidaciones.
- Comparaciones de productividad entre trabajadores o departamentos.
- Catálogo avanzado de indicadores y fórmulas.
- Puntuación única automática de productividad.
- Autenticación, inicio de sesión, roles o control de acceso.
- Auditoría de modificaciones.
- Exportación, respaldo central o sincronización multiusuario.
- Backend o base de datos remota.
- Tratamiento de datos reales de trabajadores.
- Entidades nuevas en el MER.
- Gráficos, contadores, búsquedas o filtros adicionales que no estén exigidos en `spec.md`.

La colección `erp_base_module:documents` se utilizará exclusivamente para productividad durante 002, después de verificar y tratar posibles datos anteriores.

---

## Criterios de finalización

El incremento 002 se considera finalizado cuando:

- [x] Se recuperó y verificó el módulo base.
- [x] Se conservó el MER original de nueve entidades.
- [x] Se reutilizó `Entity` para trabajadores.
- [x] Se reutilizó `Document` para productividad.
- [x] Se implementaron `Departamento` e `Historial_Departamento`.
- [x] Las cuatro historias de usuario funcionan con validación automatizada.
- [x] Las mediciones están asociadas a asignaciones históricas válidas.
- [x] Los cambios de departamento no destruyen el historial anterior.
- [x] Las correcciones de productividad no modifican registros distintos del seleccionado.
- [x] Se aplican las validaciones definidas en `spec.md`.
- [x] Se manejan correctamente los errores de almacenamiento.
- [x] Se utilizan exclusivamente datos ficticios.
- [x] No se implementaron funcionalidades fuera de alcance.
- [x] Se ejecutaron y documentaron las pruebas.
- [x] Se verificó la coherencia final de `spec.md`, `plan.md`, `data-model.md` y `tasks.md`.
- [ ] Se completaron las validaciones manuales T083, la aprobación T072 y la asignación de responsables T084.
- [ ] El grupo revisó los cambios antes de integrarlos.

---

**Nota final:** La implementación técnica, la suite automatizada (14 archivos, 132 pruebas), T076 (500 registros en Edge aislado) y la compilación están completas. Permanecen pendientes T072 (aprobación del texto de advertencia), T083 (mediciones de usuario SC-001 a SC-003 y evaluación de SC-004), T084 (asignación de responsables) y la revisión final del grupo. T085 y T086 están completadas. No se realizaron commits ni push automáticos.


## Aclaraciones posteriores al análisis de Spec Kit

- Se permiten extensiones aditivas de los archivos existentes del ERP base siempre que se mantengan sus contratos y compatibilidad.
- No se modificará el MER original de nueve entidades.
- Antes de reutilizar la colección de documentos se revisarán los datos anteriores y los folios inválidos, sin eliminaciones silenciosas.
- Se verificará la persistencia de las mediciones después de recargar la aplicación.
- Se ejecutarán las comprobaciones de calidad exigidas por la constitución: linting, formato y análisis estático.
- Se impedirá eliminar asignaciones que tengan mediciones vinculadas.
- Un trabajador con documentos de productividad o asignaciones históricas no podrá eliminarse físicamente.
- Las pruebas se prepararán antes o junto con la implementación correspondiente y se verificará su fallo inicial cuando sea aplicable.
- La aprobación del texto de advertencia de datos ficticios y la asignación de responsables no bloquearán la implementación técnica, pero seguirán pendientes de confirmación.
- Los criterios de éxito SC-001 a SC-004 deberán verificarse mediante mediciones o evaluaciones documentadas.
- Las modificaciones realizadas con ayuda de OpenCode deben ser revisadas y comprendidas por integrantes del grupo, conforme a la regla de trabajo con IA indicada al inicio de este documento.
