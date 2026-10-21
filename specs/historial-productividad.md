# Registro e historial de productividad

Parte del módulo de RR. HH.: Historial de Productividad Laboral.
Responsable: Persona 3.

## 1. Alcance

Permitir registrar resultados de productividad de un trabajador por período y consultar su historial sin perder los registros de períodos anteriores. Los datos se guardan en el navegador (localStorage), igual que en el módulo base.

Los resultados se muestran como datos. El sistema no los interpreta como una evaluación completa de la persona.

## 2. Historias de usuario

### HU-01: Registrar productividad
Como encargado de RR. HH., quiero registrar el resultado de un trabajador en un período para mantener su historial actualizado.

Criterios de aceptación:
- El formulario permite elegir trabajador, período, indicador, resultado y unidad.
- Al guardar, el registro aparece en el historial del trabajador.
- Si falta un dato o es inválido, no se guarda y se muestra un mensaje en español junto al campo.
- Guardar un registro nuevo nunca modifica ni borra registros de otros períodos.

### HU-02: Consultar el historial de un trabajador
Como encargado de RR. HH., quiero consultar el historial de productividad de un trabajador para analizar cómo han evolucionado sus resultados durante distintos períodos.

Criterios de aceptación:
- Al elegir un trabajador se muestran todos sus registros ordenados por período.
- Cada fila muestra período, equipo de ese período, indicador, resultado y unidad.
- Si el trabajador cambió de equipo, cada registro conserva el equipo que tenía en ese período.
- Si no hay registros, se muestra un mensaje de lista vacía.

### HU-03: Corregir un registro
Como encargado de RR. HH., quiero corregir un registro mal ingresado para que el historial refleje datos correctos.

Criterios de aceptación:
- Se puede editar el resultado de un registro existente.
- La edición solo afecta a ese registro.
- Se muestra una confirmación antes de guardar el cambio.

### HU-04: Acceso limitado de la jefatura (por confirmar si entra al MVP)
Como jefatura de equipo, quiero ver el historial de los trabajadores de mi equipo para detectar necesidades de capacitación.

Criterios de aceptación:
- La jefatura solo ve a los trabajadores de su equipo.
- La jefatura no puede registrar ni editar resultados.

## 3. Reglas de validación

| Campo | Regla | Mensaje |
|---|---|---|
| Trabajador | Obligatorio, debe existir | "Selecciona un trabajador." |
| Período | Obligatorio, formato AAAA-MM | "Ingresa un período válido (ej. 2026-03)." |
| Período | No puede ser futuro | "El período no puede ser futuro." |
| Período | No puede ser anterior a la fecha de ingreso del trabajador | "El período es anterior al ingreso del trabajador." |
| Período | El trabajador debe tener un equipo asignado ese período | "El trabajador no tiene equipo asignado en ese período." |
| Indicador | Obligatorio, texto entre 3 y 60 caracteres | "Ingresa un indicador." |
| Resultado | Obligatorio, número mayor o igual a 0 | "El resultado debe ser un número no negativo." |
| Unidad | Obligatoria (ej. tareas, horas) | "Ingresa la unidad del indicador." |
| Duplicados | No repetir trabajador + período + indicador (por confirmar) | "Ya existe un registro para ese período e indicador." |

## 4. Datos que utiliza

Entidades del modelo de datos: TRABAJADOR, ASIGNACION_EQUIPO y REGISTRO_DESEMPENO. El equipo de cada registro se obtiene de la asignación vigente en ese período.

## 5. Fuera del alcance del MVP

- Comparación entre equipos.
- Catálogo de indicadores con definiciones.
- Permisos de acceso detallados y trazabilidad de modificaciones.

## 6. Riesgos y decisiones pendientes

- Los datos de productividad pueden usarse de forma injusta para evaluar personas. El historial muestra datos, no puntajes ni juicios.
- Un mismo indicador no sirve para todos los cargos. Cada registro guarda su indicador y su unidad.
- Decisiones pendientes con el grupo: regla de duplicados, si el equipo se completa automáticamente, y si HU-04 entra al MVP.

## 7. Pruebas previstas

- Se rechaza un registro con campos vacíos.
- Se rechaza un resultado negativo o no numérico.
- Se rechaza un período futuro.
- Un registro nuevo no modifica los anteriores.
- El historial muestra el equipo correcto tras un cambio de equipo.