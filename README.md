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
- **Áreas de trabajo:** solo `Barra`, `Cocina` y `Salón` (la etiqueta del campo es «Área de trabajo»). Los cargos son `Barista`, `Cajero`, `Mesero`, `Cocinero` y `Encargado`; no se usan `Caja` ni `Supervisión` como áreas.
- **Metas:** la meta individual se registra en cada medición; el Administrador / Gerente de Cafetería puede configurar metas globales por área y período. No se muestran totales consolidados como meta para el personal.
- **Ayuda contextual:** cada vista y formulario principal incluye un subtítulo y una explicación visible sobre su propósito, terminología, unidades, escalas y estados vacíos, parciales o no autorizados.
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

Abre `http://localhost:5173`. La primera vez que se abre con el almacenamiento vacío, la aplicación precarga automáticamente el conjunto ficticio oficial: **6 trabajadores**, **3 áreas de trabajo** (`Barra`, `Cocina`, `Salón`), **6 asignaciones** y **12 mediciones** en dos períodos. Si ya existen datos, no se sobrescriben; el panel explica la situación parcial y ofrece **Cargar datos de demostración** para reemplazarlos tras confirmación.

Para el flujo principal, crea un trabajador, registra su asignación de área, ingresa una medición mensual y consulta **Historial** y **Evolución**. El panel y los formularios muestran ayudas contextuales con la misma terminología en todos los roles.

La navegación anuncia el cambio de vista a lectores de pantalla, muestra transiciones suaves entre secciones y respeta `prefers-reduced-motion`.

No hay credenciales de acceso: el MVP no implementa inicio de sesión, usuarios, contraseñas ni control de acceso. Basta con abrir la URL local; no hay que buscar ni pedir un login.

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
| **Administrador / Gerente de Cafetería** | Seleccionarlo en **Rol activo**. | Accede al Panel, trabajadores, áreas de trabajo, asignaciones, medición, historial, evolución, búsqueda y metas globales. Puede crear y editar trabajadores, áreas, asignaciones y turnos, marcar trabajadores como Inactivos, configurar metas globales por área y período, y registrar, corregir o eliminar mediciones de cualquier área o turno. |
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
- `specs/002-rrhh-productividad/mer.png`: MER de referencia con las 9 entidades originales.
- `specs/003-cafe-shift-role-ui/spec.md`: especificación de datos ficticios de cafetería, rol de turno e interfaz auto-explicativa.
- `specs/003-cafe-shift-role-ui/plan.md`, `research.md`, `data-model.md`, `quickstart.md`: decisiones técnicas y contratos del incremento 003.
- `specs/003-cafe-shift-role-ui/contracts/ui-storage.md`: contrato de ayudas, roles y metas globales.
- `specs/003-cafe-shift-role-ui/tasks.md`: tareas y estado de implementación del incremento 003.

---

## 7. Escalabilidad

El MVP usa `localStorage`: los datos viven en un solo navegador, no hay servidor, autenticación ni sincronización. Esta decisión es deliberada para la demostración académica, pero limita el crecimiento del módulo. Una evolución futura, fuera del alcance de 002, podría realizarse en cuatro etapas:

1. **Base de datos centralizada:** mover las colecciones de `localStorage` a una base de datos relacional administrada por una API. El contrato actual de almacenamiento (`src/storage.js`) serviría como capa de repositorio; se conservarían las claves lógicas (`entity_id`, `asignacionId`, `id_departamento`) y las validaciones de integridad referencial.
2. **Autenticación y roles:** incorporar inicio de sesión, sesiones y perfiles para encargado de RR. HH., jefatura de área y dirección. Los tipos de usuario ya descritos en la especificación son hoy solo necesidades de diseño, no controles de acceso implementados.
3. **Trabajo simultáneo:** agregar control de concurrencia (por ejemplo, versión de registro o `updatedAt`), detección de conflictos y transacciones para el recálculo de metas consolidadas, de modo que dos personas puedan registrar mediciones sin sobrescribirse.
4. **Respaldos históricos:** definir política de retención, copias programadas, procedimientos de restauración y exportación. Actualmente, si se borran los datos del sitio o falla el navegador, la información no se recupera.

Estas mejoras no están implementadas en el MVP y no deben presentarse como funcionalidades disponibles.

---

## 8. Referencias bibliográficas

- Vite — guía oficial: https://vite.dev/guide/
- JavaScript — MDN Web Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- Vitest — documentación oficial: https://vitest.dev/guide/
- jsdom — documentación del proyecto: https://github.com/jsdom/jsdom
- Documentación interna del proyecto: `specs/001-erp-base-module/` y `specs/002-rrhh-productividad/`.

---

## 9. Evidencia colaborativa

**Nómina oficial:** la nómina del grupo para el MVP es de **6 integrantes**, la indicada en la sección 3. En versiones anteriores del README se registraban 5; ese desajuste quedó corregido y todas las historias de usuario tienen responsable asignado en `specs/002-rrhh-productividad/tasks.md`.

**Trazabilidad de Pull Requests:** los incrementos quedaron integrados mediante los siguientes PRs del repositorio `MDS-BI/Grupo-02`:

| PR | Rama de origen | Uso principal |
|---|---|---|
| [#2](https://github.com/MDS-BI/Grupo-02/pull/2) | `historial-productividad` | Implementación inicial del historial de productividad. |
| [#4](https://github.com/MDS-BI/Grupo-02/pull/4) | `phillipecabalin-patch-1` | Ajustes de la historia de productividad. |
| [#5](https://github.com/MDS-BI/Grupo-02/pull/5) | `historial-ajustes` | Ajustes al historial y a la documentación del incremento 002. |
| [#6](https://github.com/MDS-BI/Grupo-02/pull/6) | `correccion-specs-002` | Consolidación de specs, tareas y responsables de 002. |

Los commits posteriores a esos PRs continúan registrados en el historial de Git y son revisables desde el repositorio remoto.
