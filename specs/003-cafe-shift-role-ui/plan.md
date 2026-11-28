# Implementation Plan: Datos cafetería, rol Jefe de Turno e interfaz auto-explicativa

**Branch**: `004-cafe-shift-role-ui` | **Date**: 2026-11-27 | **Spec**: `specs/003-cafe-shift-role-ui/spec.md`

**Input**: Especificación `specs/003-cafe-shift-role-ui/spec.md`, aclaración terminológica oficial integrada desde `main` (US7) en `specs/002-rrhh-productividad/spec.md` y hallazgos de `research.md`.

**Note**: Plan generado por `/speckit.plan`. Las tareas de implementación se documentan en `tasks.md` a petición explícita del usuario.

## Summary

Reparar el flujo operativo del Jefe de Turno (FR-052 a FR-065), precargar datos ficticios coherentes al iniciar solo si no existen datos de negocio y convertir cada vista/formulario en una pantalla auto-explicativa. La solución conserva la arquitectura existente (Vite + JavaScript puro + `localStorage`), reutiliza los validadores y filtros ya definidos, elimina los caracteres dañados que hoy bloquean los controles y añade ayudas contextuales centralizadas con la terminología oficial: tres departamentos (Barra, Cocina, Salón) presentados como «Área de trabajo» y cinco cargos (Barista, Cajero, Mesero, Cocinero, Encargado). La HU7 de `002` permanece fuera de alcance.

## Technical Context

**Language/Version**: JavaScript ES modules para navegadores modernos; Vite `^8.2.1` según `package.json:6-15`.

**Primary Dependencies**: Vite, Vitest `^4.1.10` y jsdom `^30.0.1`; sin framework de interfaz ni backend.

**Storage**: `localStorage` del navegador, con las claves documentadas en `specs/002-rrhh-productividad/contracts/storage.md:5-13` (`entities`, `documents`, `departamentos`, `historial_departamentos`, `metas_consolidadas`, `metas_globales` y `rol_activo`).

**Testing**: Vitest con jsdom; comando `npm test -- --run` (`README.md:78-82`). Compilación con `npm run build` (`package.json:7`). No hay script de lint ni typecheck configurado. Estado base verificado: 19 archivos, 202 pruebas, 8 fallos por caracteres dañados en `index.html` (`research.md`).

**Target Platform**: Aplicación web local de un solo usuario en navegador de escritorio; sin servidor, autenticación ni sincronización.

**Project Type**: Aplicación web (SPA local, solo frontend).

**Performance Goals**: Precarga visible en menos de 5 s en la primera apertura (SC-001); cambio de rol reflectado en menos de 3 s (SC-006); sin rutas de red adicionales.

**Constraints**: Datos exclusivamente ficticios; selector de rol demostrativo sin verificación de identidad; departamentos oficiales solo Barra, Cocina y Salón; cargos oficiales solo Barista, Cajero, Mesero, Cocinero y Encargado; HU7 fuera de alcance; conservar claves, folios y validaciones vigentes de `001`/`002`; corregir los 8 fallos base antes de validar la nueva funcionalidad.

**Scale/Scope**: 6 trabajadores, 3 departamentos, 6 asignaciones históricas, 12 mediciones en 2 períodos, 3 roles activos y aproximadamente 11 vistas con sus formularios; 19 archivos de prueba existentes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio (`.specify/memory/constitution.md`) | Evaluación | Evidencia en el diseño |
|---|---|---|
| I. Code Quality & Maintainability | PASS | Se reutilizan `roles.js`, `storage.js` y los componentes existentes; la única abstracción nueva es un módulo centralizado de textos de ayuda, necesario para evitar 11 copias divergentes de la misma terminología. Sin cambios de framework ni paquetes. |
| II. Test-First & Verification | PASS | Las pruebas se escriben antes o junto con cada cambio; se corrigen primero los 8 fallos base y se exigen `npm test -- --run` y `npm run build` antes de cerrar cada fase. |
| III. User Experience Consistency | PASS | Subtítulos y ayudas en todas las vistas, terminología única, estados vacíos/parciales/no autorizados explícitos, mensajes de bloqueo claros y eliminación de texto dañado. |
| IV. Performance & Reliability | PASS | La precarga se decide antes de renderizar el panel, es idempotente y no añade recorridos de red; los filtros de rol ya existentes se aplican desde el inicio. |
| Quality Standards | PASS | Sin lint/typecheck configurado; la verificación usa pruebas y compilación, y se actualizan `README.md`, contratos y modelos cuando cambia el comportamiento. |
| Development Workflow | PASS | Fases pequeñas con checkpoint independiente por historia, sin tocar HU7 ni datos de negocio del usuario. |
| Governance | PASS | No se introducen desviaciones; la terminología de US7 se adopta y se deja constancia de que HU7 sigue diferida. |

**Resultado post-diseño (Phase 1)**: PASS sin violaciones. No se requiere `Complexity Tracking`.

## Project Structure

### Documentation (this feature)

```text
specs/003-cafe-shift-role-ui/
├── spec.md                    # Especificación funcional (alineada con US7)
├── plan.md                    # Este archivo
├── research.md                # Decisiones de Phase 0
├── data-model.md              # Entidades, campos, reglas y estados
├── quickstart.md              # Guía de validación ejecutable
├── contracts/
│   └── ui-storage.md          # Contrato de UI/roles y persistencia local
├── checklists/
│   └── requirements.md        # Checklist de calidad de la spec
└── tasks.md                   # Tareas de implementación (solicitadas explícitamente)
```

### Source Code (repository root)

```text
index.html                     # Estructura de vistas, formularios, ayudas y tarjeta de metas globales
src/
├── main.js                    # Punto de entrada; boot(RRHH_CONFIG)
├── app.js                     # Orquestación, permisos, contexto de rol, precarga y eventos
├── roles.js                   # Roles, alcance y filtros (reutilizar sin cambiar semántica)
├── storage.js                 # Persistencia, validadores y datos simulados
├── module-config.js           # Configuración RRHH y catálogo de indicadores por cargo
└── components/
    ├── help-text.js           # Nuevo: textos de subtítulos/ayuda centralizados
    ├── dashboard.js           # Panel y textos dañados a reparar
    ├── document-form.js       # Formulario de medición y campos dañados
    ├── shell.js               # Navegación y etiquetas
    └── ...                    # Resto de componentes existentes
tests/
├── unit/                      # roles, storage y datos simulados
└── integration/               # flujos de rol, medición, panel y ayudas
dist/                          # Generado por npm run build; no editar a mano
```

**Structure Decision**: Se mantiene el proyecto único de frontend local (Opción 1 implícita del repositorio). No se crean paquetes, backend ni nuevas dependencias. `dist/` se regenera al final con `npm run build`; el `dist/index.html` actual solo se usa como referencia de marcado para la tarjeta de metas globales porque está desactualizado respecto a `index.html`.

## Complexity Tracking

No se identificaron violaciones de la constitución; no se requieren justificaciones adicionales.
