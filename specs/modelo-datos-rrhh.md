# Modelo de Datos: Módulo de Recursos Humanos — Historial de Productividad

## Entidad: Trabajador

Representa a una persona trabajadora registrada en el módulo de Recursos Humanos.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador interno único del trabajador | Clave primaria; obligatorio, generado automáticamente |
| name | string | Nombre de la persona trabajadora | Obligatorio, no vacío |
| hireDate | string | Fecha de ingreso en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida |
| createdAt | string | Marca de tiempo de creación del registro | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del registro | Obligatorio |

## Entidad: Equipo

Representa un equipo al que pueden asignarse trabajadores.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador interno único del equipo | Clave primaria; obligatorio, generado automáticamente |
| name | string | Nombre del equipo | Obligatorio, no vacío |
| description | string | Descripción breve del equipo | Opcional |
| createdAt | string | Marca de tiempo de creación del registro | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del registro | Obligatorio |

## Entidad: Asignación de equipo

Representa la pertenencia de un trabajador a un equipo durante un intervalo de tiempo. Cada cambio de equipo se registra como una nueva asignación, conservando las anteriores.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único de la asignación | Clave primaria; obligatorio, generado automáticamente |
| workerId | string | Trabajador al que corresponde la asignación | Clave foránea a Trabajador.id; obligatorio |
| teamId | string | Equipo al que se asigna el trabajador | Clave foránea a Equipo.id; obligatorio |
| startDate | string | Primer día de vigencia en formato YYYY-MM-DD | Obligatorio, fecha válida; inclusiva |
| endDate | string | Último día de vigencia en formato YYYY-MM-DD | Opcional; fecha válida e inclusiva, igual o posterior a startDate; vacío indica asignación vigente |
| createdAt | string | Marca de tiempo de creación del registro | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del registro | Obligatorio |

## Entidad: Registro de productividad

Representa el resultado registrado para un trabajador en un período. La asignación referenciada identifica el equipo correspondiente y permite consultar el historial sin sustituirlo por el equipo actual.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del registro de productividad | Clave primaria; obligatorio, generado automáticamente |
| assignmentId | string | Asignación de equipo vigente a la que pertenece el registro | Clave foránea a Asignación de equipo.id; obligatorio |
| period | string | Período del registro en formato YYYY-MM | Obligatorio, mes de calendario válido; no puede ser futuro ni anterior a hireDate del trabajador asociado |
| indicator | string | Nombre del indicador informado para este registro | Obligatorio, entre 3 y 60 caracteres; no define un catálogo ni una fórmula |
| result | number | Resultado registrado para el indicador | Obligatorio, número no negativo; no se calcula a partir de otros campos |
| unit | string | Unidad en la que se expresa el resultado | Obligatorio, no vacío |
| createdAt | string | Marca de tiempo de creación del registro | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del registro | Obligatorio |

## Reglas de Validación

### Trabajador

- El nombre es obligatorio y no puede estar vacío.
- La fecha de ingreso debe ser una fecha de calendario válida en formato YYYY-MM-DD.
- El id se genera automáticamente y es único.

### Equipo

- El nombre es obligatorio y no puede estar vacío.
- El id se genera automáticamente y es único.

### Asignación de equipo

- Cada asignación debe referenciar un trabajador y un equipo existentes.
- startDate es obligatoria y endDate, cuando existe, debe ser igual o posterior a startDate.
- Un trabajador no puede tener dos asignaciones vigentes que se solapen en el tiempo.
- Para un cambio de equipo se conserva la asignación anterior y se registra otra con el nuevo equipo; no se reemplaza la asignación anterior.
- La asignación vigente en una fecha se determina por su intervalo inclusivo; una endDate vacía indica que no tiene fecha de término.
- No se debe eliminar una asignación referenciada por registros de productividad ni cambiar su trabajador o equipo; para un cambio se crea una asignación nueva.

### Registro de productividad

- Cada registro debe referenciar una asignación existente. El trabajador y el equipo del registro se obtienen de esa asignación.
- La asignación debe corresponder al período registrado. El período no puede ser futuro ni anterior a la fecha de ingreso del trabajador.
- Si hay más de una asignación de equipo dentro de un mismo mes, debe definirse antes de implementar si se permite más de un registro mensual asociado a distintas asignaciones o qué asignación representa el período. No se presupone aquí una regla que no aparece en los requisitos.
- El indicador debe tener entre 3 y 60 caracteres; el resultado debe ser un número no negativo; la unidad es obligatoria.
- La política de duplicados para trabajador + período + indicador está pendiente de confirmación; no se impone una restricción de unicidad en esta propuesta.
- Corregir un registro solo modifica ese registro; no altera los de otros períodos.
- No se definen indicadores, evaluaciones, puntajes ni fórmulas de productividad.

## Relaciones

- Un trabajador puede tener varias asignaciones de equipo a lo largo del tiempo; cada asignación pertenece a exactamente un trabajador.
- Un equipo puede aparecer en varias asignaciones; cada asignación corresponde a exactamente un equipo.
- Una asignación puede estar relacionada con varios registros de productividad; cada registro referencia exactamente una asignación.
- El trabajador y el equipo de un registro se obtienen recorriendo Registro de productividad.assignmentId → Asignación de equipo.workerId/teamId. El equipo histórico no se obtiene de la asignación actual del trabajador.
- Las asignaciones previas deben conservarse al cambiar de equipo. Así, los registros existentes continúan vinculados a la asignación y al equipo que les correspondían, aunque el trabajador tenga posteriormente otra asignación.
- La eliminación de un trabajador, equipo o asignación que tenga asignaciones o registros dependientes debe impedirse mientras existan esas referencias.

## Notas de Extensibilidad

- La propuesta registra el indicador, el resultado y su unidad como datos ingresados; no establece catálogos, métricas ni cálculos.
- La granularidad mensual del período proviene de los requisitos de Historial de Productividad. La interpretación de un mes en el que se produce un cambio de equipo queda pendiente de decisión.
