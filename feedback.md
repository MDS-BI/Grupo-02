Feedback Avance 01 (26/10/26)

- reorganizar el template entre distintas areas de Desarrollo puede generar conflictos (es un solo modulo), tener cuidado.
- Agregar el MER al data-model.md es redudante y consume mas tokens de lo necesario.
- ajustar nombres dentro de specs para poder desarrollar de forma acumulativa (001, 002, 003...)

Proximos pasos:

- rectificar puntos anteriores
- trabajar en los specs (historias de usuario, US) para definir tareas
- dividirse las US y tareas para una siguiente iteracion (avances cada semana)
- ejecutar una version integrada de prueba

 Feedback Avance 02 (2/11/26)

- Se insiste en el manejo de los specs (revisar video). Cada carpeta debe tener toda la estructura base (y editar sobre ella).
- no se observan historias de usuario por miembro del grupo (solo actividad de 1 persona)
- Evitar trabajar con modelos de IA fuera de speckit en local, porque crean ramas nuevas y se pierde la integridad del proyecto

Proximos pasos:

- rectificar puntos anteriores
- hacer primera implmentacion, registar modificaciones/incremental y volver al spec
- dividir el grupo entre modificaciones (ajustes previos) e incremental (nueva funcionalidad)
- integrar nueva version en 2 semanas

Feedback Avance 03 (16/11/26)

- Cambios en spec.md y tasks.md: ambos son nuevos esta semana (consolidación de `002-rrhh-productividad`). Son claros y coherentes entre sí: 4 HU, FR-001 a FR-035 trazados a las fases de tasks.md y estados alineados (T072, T083 y T084 pendientes). Las HU siguen con responsable "Por confirmar", lo que ya se señaló en avances anteriores.
- Consistencia: T052 y T079 piden bloquear o tratar documentos no productivos. `app.js` solo muestra un aviso (`inspectDocumentsForRRHH`); no se pudo ver `storage.js`, por lo que el bloqueo real es no verificable.
- Consistencia: `index.html` y `app.js` incluyen la sección "Asignaciones" con filtro, y un botón "Marcar como Inactivo". Ambos están cubiertos por T031 y T036, pero no figuran como requisito en spec.md (FR-004 y FR-010 no los describen).
- Consistencia: el formulario de documentos conserva los campos monetarios del módulo base, solo ocultos en modo RR. HH. (T079 declara que no se usan campos monetarios).
- hacer mejoras de funcionalidad e interfaz de usuario, incluir data simulada para probar campos, incluir mejoras de estilo, transicion, navegacion, etcetera.

Presentaicon de MVP final en 2 semanas.
