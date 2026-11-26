# ERP Software Base Module (Vite + Vanilla JS)

## Módulo ERP: RR. HH. e Historial de Productividad Laboral

Módulo web desarrollado sobre la arquitectura base del ERP (Vite + JavaScript puro). El incremento 002 implementa la gestión de trabajadores, departamentos y asignaciones históricas, junto con el registro y la consulta de mediciones de productividad por período.

La documentación de planilla, remuneraciones y liquidaciones se conserva como referencia de alcance futuro, pero **no forma parte de la implementación actual**.

---

## 1. Alcance implementado

- **Trabajadores:** registro y edición de nombre, código, cargo, fecha de ingreso, estado laboral y departamento actual.
- **Departamentos:** alta, edición, listado y eliminación protegida cuando existen relaciones históricas.
- **Asignaciones históricas:** períodos de pertenencia por trabajador, cierre de la asignación anterior al cambiar de departamento y conservación del historial.
- **Registro de productividad:** período mensual (`AAAA-MM`), indicador, resultado numérico, unidad y asignación de departamento válida.
- **Historial:** consulta cronológica por trabajador con el departamento histórico de cada medición.
- **Evolución:** comparación exclusiva de mediciones con el mismo indicador y la misma unidad.
- **Protecciones:** no se eliminan trabajadores con historial ni asignaciones con mediciones vinculadas; los trabajadores pueden marcarse como `Inactivo`.
- **Roles activos:** selector demostrativo con tres perfiles —Administrador / Gerente de Cafetería, Jefe de Turno / Supervisor y Barista / Trabajador (Solo lectura)— que ajusta vistas, botones, acciones y datos visibles. No hay autenticación con credenciales ni verificación de identidad real.
- **Datos ficticios:** no debe utilizarse con datos reales de trabajadores.

El MER original de nueve entidades se conserva sin modificaciones. El incremento 002 reutiliza `Entity` para trabajadores y `Document` para productividad, e implementa `Departamento` e `Historial_Departamento`.

---

## 2. Persistencia local

La aplicación guarda los registros en el `localStorage` del navegador:

- `erp_base_module:entities`: trabajadores.
- `erp_base_module:documents`: registros de productividad.
- `erp_base_module:departamentos`: departamentos.
- `erp_base_module:historial_departamentos`: asignaciones históricas.
- `erp_base_module:rol_activo`: estado demostrativo del rol activo y su contexto; no es una entidad laboral.

Los datos permanecen disponibles al navegar o volver a abrir la aplicación en el mismo navegador. El almacenamiento es local a ese navegador y dispositivo: no hay sincronización, servidor, autenticación ni copias de seguridad automáticas. Si se borran los datos del sitio, se pueden perder los registros.

Antes de guardar productividad, la aplicación inspecciona la colección de documentos. Si encuentra registros incompatibles con el esquema de productividad, bloquea el guardado y solicita respaldar o migrar esos datos, sin eliminarlos silenciosamente.

---

## 3. Información del equipo

- Curso: Modelación de Sistemas (580211-1)
- Grupo: Grupo-02
- Integrantes:
  - Daphnne Hidalgo Mundaca
  - Consuelo Estefania Hidalgo Salgado
  - Bastián Ignacio Reinado Bravo
  - Bruno Phillipe Cabalin Ferreira
  - Lucas Soarzo Mancilla
  - Emilio Vejar Bravo

---

## 4. Configuración y ejecución

Instalar dependencias y ejecutar el servidor local:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Para el flujo principal, crea un departamento y un trabajador, registra su asignación, ingresa una medición mensual y consulta las vistas **Historial** y **Evolución**.

Compilar para producción:

```bash
npm run build
```

Ejecutar las pruebas:

```bash
npm test -- --run
```

La aplicación arranca con la configuración de RR. HH. definida en `src/module-config.js` (`RRHH_CONFIG`). El módulo base puede ejecutarse con la configuración predeterminada mediante `boot()` en pruebas o integraciones que no requieran las extensiones de 002.

---

## 5. Roles activos y control de acceso

El encabezado de la aplicación muestra el selector **Rol activo**. El rol predeterminado es **Administrador / Gerente de Cafetería**. Al cambiar de rol, las vistas, botones, acciones y datos visibles se actualizan de inmediato; el estado se guarda en `erp_base_module:rol_activo` y se recupera al volver a abrir la aplicación. Este control es demostrativo: **no autentica, no solicita credenciales y no verifica la identidad real**.

| Rol activo | Cómo probarlo | Permisos |
|---|---|---|
| **Administrador / Gerente de Cafetería** | Seleccionarlo en **Rol activo**. | Accede al Panel, trabajadores, departamentos, asignaciones, medición, historial, evolución y búsqueda. Puede crear y editar trabajadores, departamentos, asignaciones y turnos, marcar trabajadores como Inactivos, configurar metas globales de ventas y registrar, corregir o eliminar mediciones de cualquier área o turno. |
| **Jefe de Turno / Supervisor** | Seleccionarlo y elegir explícitamente un **Área** (`Barra`, `Cocina` o `Salón`) y un **Turno** (`Mañana` o `Tarde`). | Solo ve Medición, Historial por área/turno y Evolución por área/turno. Puede registrar y corregir mediciones del área y turno seleccionados, incluida la meta esperada individual. No puede crear ni editar trabajadores, departamentos, asignaciones, turnos ni metas globales; esas acciones se ocultan y se bloquean. |
| **Barista / Trabajador (Solo lectura)** | Seleccionarlo y elegir explícitamente el **Trabajador propio** en el encabezado. | Solo ve Mi desempeño y Mi evolución del trabajador seleccionado. No puede registrar, corregir ni eliminar mediciones, ni acceder a gestión, metas globales o datos de otros trabajadores. |

Si se intenta ejecutar una acción no permitida, la aplicación la bloquea, muestra un mensaje en el aviso superior y no guarda cambios parciales. El cambio de rol no modifica trabajadores, asignaciones, mediciones ni metas.

---

## 6. Documentación de la funcionalidad

- `specs/002-rrhh-productividad/spec.md`: especificación funcional.
- `specs/002-rrhh-productividad/plan.md`: plan técnico.
- `specs/002-rrhh-productividad/research.md`: decisiones técnicas revisadas.
- `specs/002-rrhh-productividad/data-model.md`: modelo de datos y validaciones.
- `specs/002-rrhh-productividad/quickstart.md`: inicio rápido.
- `specs/002-rrhh-productividad/contracts/storage.md`: contrato de persistencia local.
- `specs/002-rrhh-productividad/tasks.md`: tareas y estado de implementación.
