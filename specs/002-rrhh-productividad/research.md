# Investigación técnica — Incremento 002

**Fecha:** 2026-11-26\
**Entrada:** `spec.md` con FR-052 a FR-065 y `plan.md` con Technical Context.\
**Resultado:** no quedan marcadores `NEEDS CLARIFICATION`.

## Decisiones de diseño

### Control de acceso por rol activo

- **Decision:** usar un estado de interfaz con tres roles activos —Administrador / Gerente de Cafetería, Jefe de Turno / Supervisor y Barista / Trabajador (Solo lectura)— que regula vistas, botones, acciones y datos visibles. El Supervisor declara explícitamente área (Barra, Cocina o Salón) y turno (Mañana o Tarde); el Barista declara explícitamente el trabajador propio. El valor predeterminado es Administrador.
- **Rationale:** el feedback docente exige permisos sustancialmente distintos y un MVP reproducible desde la especificación. Las estructuras ya existentes permiten derivar el alcance sin crear nuevas entidades: el departamento histórico se resuelve desde `asignacionId`, el turno desde el campo `turno` de la medición y el trabajador propio desde `Entity.entity_id`.
- **Alternatives considered:** (1) autenticación con credenciales, descartada porque sigue fuera del alcance y no es necesaria para la demostración académica; (2) un cuarto rol de dirección, descartado porque la dirección ya queda cubierta por el rol Administrador; (3) crear entidades de usuario/rol en el MER, descartado porque el MER de nueve entidades se conserva sin cambios; (4) inferir el área del Supervisor desde el departamento actual del trabajador, descartado porque perdería el contexto histórico de cada medición.

### Persistencia y compatibilidad

- **Decision:** conservar Vite, JavaScript y el almacenamiento local del navegador, sin backend ni dependencias nuevas. El estado de rol se guarda por separado en `erp_base_module:rol_activo` como dato demostrativo, no como entidad laboral.
- **Rationale:** es la arquitectura ya implementada y verificada; mantiene los contratos del módulo base y permite que el cambio de rol no mute trabajadores, asignaciones, mediciones ni metas.
- **Alternatives considered:**后端 o base de datos remota, descartado por estar fuera de alcance; mezclar el rol dentro de `Entity`, descartado porque ensuciaría datos laborales ficticios y exigiría modificar el MER; persistir el rol dentro de cada medición, descartado porque el rol es una propiedad de la sesión de demostración, no del registro.

### Contratos y pruebas

- **Decision:** documentar las claves de persistencia y la matriz rol-acción en `contracts/storage.md`, y validar los tres roles en `quickstart.md` con escenarios independientes.
- **Rationale:** permite verificar SC-010, SC-016, SC-017 y SC-018 sin depender de detalles de implementación.
- **Alternatives considered:** pruebas solo manuales, descartado porque la constitución exige verificación automatizada; contrato HTTP, descartado porque el MVP no expone API externa.

## Decisiones verificadas

- Las claves de persistencia y los campos existentes se documentan en `data-model.md` y `contracts/storage.md`.
- Cada medición referencia su asignación histórica mediante `asignacionId`; el departamento histórico se resuelve desde esa asignación.
- Las seis historias de usuario están implementadas con componentes y almacenamiento del proyecto base; HU5 y HU6 se relacionan con tareas y pruebas existentes. Los roles se aplican como una capa de alcance sobre las vistas ya existentes.
- El MER original de nueve entidades se conserva; no se agregan entidades al modelo.
- No se requiere API externa ni contrato HTTP para este MVP local.

## Referencias consultadas

- Código base en `src/storage.js`, `src/module-config.js` y `src/app.js`.
- Modelo de referencia en `specs/001-erp-base-module/data-model.md`.
- Pruebas unitarias y de integración en `tests/`.
- Especificación funcional en `specs/002-rrhh-productividad/spec.md`.
