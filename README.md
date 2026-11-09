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
- **Datos ficticios:** la aplicación no implementa autenticación, roles ni control de acceso. No debe utilizarse con datos reales de trabajadores.

El MER original de nueve entidades se conserva sin modificaciones. El incremento 002 reutiliza `Entity` para trabajadores y `Document` para productividad, e implementa `Departamento` e `Historial_Departamento`.

---

## 2. Persistencia local

La aplicación guarda los registros en el `localStorage` del navegador:

- `erp_base_module:entities`: trabajadores.
- `erp_base_module:documents`: registros de productividad.
- `erp_base_module:departamentos`: departamentos.
- `erp_base_module:historial_departamentos`: asignaciones históricas.

Los datos permanecen disponibles al navegar o volver a abrir la aplicación en el mismo navegador. El almacenamiento es local a ese navegador y dispositivo: no hay sincronización, servidor, autenticación ni copias de seguridad automáticas. Si se borran los datos del sitio, se pueden perder los registros.

Antes de guardar productividad, la aplicación inspecciona la colección de documentos. Si encuentra registros incompatibles con el esquema de productividad, bloquea el guardado y solicita respaldar o migrar esos datos, sin eliminarlos silenciosamente.

---

## 3. Información del equipo

- Curso: Modelación de Sistemas (580211-1)
- Grupo: Grupo-02
- Integrantes:
  - Daphnne Hidalgo
  - Consuelo Estefania Hidalgo Salgado
  - Bastián Ignacio Reinado Bravo
  - Bruno Phillipe Cabalin Ferreira
  - Soarzo Mancilla
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

## 5. Documentación de la funcionalidad

- `specs/002-rrhh-productividad/spec.md`: especificación funcional.
- `specs/002-rrhh-productividad/plan.md`: plan técnico.
- `specs/002-rrhh-productividad/research.md`: decisiones técnicas revisadas.
- `specs/002-rrhh-productividad/data-model.md`: modelo de datos y validaciones.
- `specs/002-rrhh-productividad/quickstart.md`: inicio rápido.
- `specs/002-rrhh-productividad/contracts/storage.md`: contrato de persistencia local.
- `specs/002-rrhh-productividad/tasks.md`: tareas y estado de implementación.
