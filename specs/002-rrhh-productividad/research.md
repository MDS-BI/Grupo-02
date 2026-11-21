# Investigación técnica — Incremento 002

## Resultado

La revisión de la implementación existente confirma que 002 debe seguir usando Vite, JavaScript y `localStorage`, sin backend ni dependencias adicionales. El módulo reutiliza `Entity` para trabajadores y `Document` para productividad; `Departamento` e `Historial_Departamento` conservan sus estructuras definidas en el MER 001.

## Decisiones verificadas

- Las claves de persistencia y los campos existentes se documentan en `data-model.md` y `contracts/storage.md`.
- Cada medición referencia su asignación histórica mediante `asignacionId`; el departamento histórico se resuelve desde esa asignación.
- Las seis historias corresponden a funcionalidades implementadas con componentes y almacenamiento del proyecto base; HU5 y HU6 se relacionan con tareas y pruebas existentes.
- El MER original de nueve entidades se conserva; no se agregan entidades al modelo.
- No se requiere API externa ni contrato HTTP para este MVP local.

## Referencias consultadas

- Código base en `src/storage.js`, `src/module-config.js` y `src/app.js`.
- Modelo de referencia en `specs/001-erp-base-module/data-model.md`.
- Pruebas unitarias y de integración en `tests/`.
