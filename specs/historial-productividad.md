# Registro e historial de productividad

Parte del módulo de RR. HH.: Historial de Productividad Laboral.
Responsable: Persona 3.

## 1. Alcance

Permitir registrar resultados de productividad de un trabajador por mes y consultar su historial sin perder los registros de períodos anteriores ni el equipo que el trabajador tenía en cada período.

Los resultados se muestran como datos. El sistema no define indicadores, puntajes ni fórmulas, y no los interpreta como una evaluación completa de la persona.

## 2. Entidades que utiliza

Según `modelo-datos-rrhh.md`:

- **Trabajador**: nombre y fecha de ingreso (`hireDate`).
- **Equipo**: nombre y descripción.
- **Asignación de equipo**: trabajador, equipo, `startDate` y `endDate` (vacía si está vigente).
- **Registro de productividad**: asignación (`assignmentId`), período (`period`, formato AAAA-MM), indicador, resultado y unidad.

El trabajador y el equipo de un registro se obtienen a través de su asignación, no de la asignación actual del trabajador.

## 3. Historias de usuario

### HU-01: Registrar productividad
Como encargado de RR. HH., quiero registrar el resultado de un trabajador en un período para mantener su historial actualizado.

Criterios de aceptación:
- El formulario permite elegir trabajador, período, indicador, resultado y unidad.
- El registro queda vinculado a la asignación de equipo que corresponde a ese período.
- Al guardar, el registro aparece en el historial del trabajador.
- Si falta un dato o es inválido, no se guarda y se muestra un mensaje en español junto al campo.
- Guardar un registro nuevo nunca modifica ni borra registros de otros períodos.

### HU-02: Consultar el historial de un trabajador
Como encargado de RR. HH., quiero consultar el historial de productividad de un trabajador para analizar cómo han evolucionado sus resultados durante distintos períodos.

Criterios de aceptación:
- Al elegir un trabajador se muestran todos sus registros ordenados por período.
- Cada fila muestra período, equipo de ese período, indicador, resultado y unidad.
- Si el trabajador cambió de equipo, cada registro conserva el equipo de su asignación y no se le atribuye el equipo actual.
- Si no hay registros, se muestra un mensaje claro de que no hay datos.

### HU-03: Corregir un registro
Como encargado de RR. HH., quiero corregir un registro mal ingresado para que el historial refleje datos correctos.

Criterios de aceptación:
- Se puede editar un registro existente.
- La edición solo modifica ese registro y no altera los de otros períodos.
- Las mismas validaciones del registro se aplican al editar.

### HU-04: Consulta de la jefatura (restricción de diseño)
Como jefatura de equipo, quiero ver el historial de los trabajadores de mi equipo para detectar necesidades de capacitación.

Criterios de aceptación:
- La jefatura consulta solo a los integrantes de su equipo y no registra ni edita resultados.

Nota: según el plan del grupo, en el MVP esta historia es una restricción de diseño documentada. No hay autenticación real, por lo que no se implementa control de acceso técnico. Se desarrollaría en una ampliación.

## 4. Reglas de validación

| Campo | Regla | Mensaje |
|---|---|---|
| Trabajador | Obligatorio, debe existir | "Selecciona un trabajador." |
| Asignación | Debe existir y corresponder al período registrado | "El trabajador no tiene equipo asignado en ese período." |
| Período | Obligatorio, formato AAAA-MM, mes de calendario válido | "Ingresa un período válido (ej. 2026-03)." |
| Período | No puede ser futuro | "El período no puede ser futuro." |
| Período | No puede ser anterior a la fecha de ingreso del trabajador | "El período es anterior al ingreso del trabajador." |
| Indicador | Obligatorio, entre 3 y 60 caracteres | "El indicador debe tener entre 3 y 60 caracteres." |
| Resultado | Obligatorio, número mayor o igual a 0 | "El resultado debe ser un número no negativo." |
| Unidad | Obligatoria, no vacía | "Ingresa la unidad del indicador." |

## 5. Decisiones pendientes

Ambas quedan abiertas en `modelo-datos-rrhh.md` y deben resolverse antes de implementar:

1. **Duplicados:** si ya existe un registro del mismo trabajador, período e indicador, ¿se bloquea, se permite o se pide confirmación? Por ahora no se impone unicidad.
2. **Mes con cambio de equipo:** si hay más de una asignación dentro de un mismo mes, ¿se permite un registro por asignación, o qué asignación representa el período?

## 6. Fuera del alcance del MVP

- Comparación entre equipos.
- Catálogo de indicadores con definiciones.
- Control de acceso real y trazabilidad de modificaciones.

## 7. Riesgos

- Los datos de productividad pueden usarse de forma injusta para evaluar personas. El historial muestra datos, no puntajes ni juicios.
- Un mismo indicador no sirve para todos los cargos. Cada registro guarda su indicador y su unidad.
- Los datos viven en el navegador (localStorage): sin respaldo ni acceso real controlado. Usar solo datos de prueba.

## 8. Pruebas previstas

- Se rechaza un registro con campos vacíos.
- Se rechaza un resultado negativo o no numérico.
- Se rechaza un período futuro o anterior a la fecha de ingreso.
- Se rechaza un indicador de menos de 3 o más de 60 caracteres.
- Un registro nuevo no modifica los anteriores.
- Corregir un registro no modifica los demás.
- El historial muestra el equipo correcto tras un cambio de equipo.