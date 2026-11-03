# Investigación: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Decisión: Usar Vite con HTML, CSS y JavaScript vanilla

**Justificación**: La solicitud enfatiza un enfoque de mínimas librerías y una implementación ligera. Vite proporciona una experiencia de desarrollo rápida y un pipeline de construcción simple sin requerir un framework más pesado. JavaScript vanilla mantiene la aplicación fácil de entender, fácil de probar y fácil de mantener para una pequeña aplicación de página única, y deja a los módulos personalizados libres de adoptar cualquier enfoque de interfaz por encima de ella.

## Alternativas consideradas

- React o Vue: Ecosistema de componentes más sólido, pero añade más abstracción y sobrecarga de dependencias de las necesarias para este alcance.
- HTML estático plano sin Vite: Más simple, pero Vite ofrece un mejor flujo de trabajo de desarrollo local y paso de construcción para crecimiento futuro.
- Persistencia en backend con base de datos: No es necesaria para un módulo base de espacio único y añadiría complejidad innecesaria; el contrato de almacenamiento está aislado, por lo que un backend puede introducirse más tarde sin cambiar la lógica del módulo.

## Decisiones adicionales

- Se usará localStorage del navegador para la persistencia porque el módulo base es de espacio único y no necesita almacenamiento del lado servidor.
- La interfaz inicial será una experiencia de página única con un panel, campo de búsqueda y lista de entidades.
- La aplicación favorecerá la mejora progresiva y los controles de formulario nativos accesibles sobre widgets personalizados complejos.
- El modelo de datos separa los datos maestros (Entidad) de los registros transaccionales (Documento), vinculados por un identificador público autogenerado (`entity_id`), de modo que los módulos personalizados puedan adjuntar cualquier significado de dominio a ambos lados sin cambios estructurales.
- Las preocupaciones base (generación de identidad, marcas de tiempo, integridad referencial, eliminación en cascada) residen en la capa de almacenamiento, manteniendo los módulos personalizados limitados a campos, etiquetas y reglas de validación.

## Investigación complementaria: historial de actividad (Historia de Usuario 14)

### Evidencia del repositorio

- La documentación del proyecto y `plan.md` describen `localStorage` como persistencia del módulo base. El README documenta las claves `erp_base_module:entities` y `erp_base_module:documents`.
- Las pruebas existentes importan `src/storage.js` y `src/module-config.js`, pero el árbol de trabajo revisado no contiene `src/`; por tanto, no fue posible confirmar la implementación real ni añadir una dependencia a una función de identidad existente.
- No se encontró un modelo o flujo de autenticación/usuario en los archivos disponibles. La especificación no debe introducir inicio de sesión ni atribuir operaciones a una persona por inferencia.

### Decisiones de diseño

- Persistir actividades localmente en una nueva clave `erp_base_module:activities`, de acuerdo con el patrón documentado de claves, sin cambiar las claves ni los datos existentes de entidades y documentos.
- Registrar eventos disponibles de inicio/cierre de sesión, consultas explícitas, búsquedas ejecutadas y los intentos de creación, modificación y eliminación de entidades y documentos. Excluir navegación, lecturas internas de interfaz y cada pulsación de tecla. Cada evento guarda acción, módulo, instante UTC, descripción mínima, resultado y destino si se conoce.
- Capturar la identidad únicamente desde un contexto de usuario ya existente; si no está disponible, guardar identidad nula y presentar «No identificado». Esta solución es explícita, pero no identifica de forma fiable a las personas que comparten navegador.
- Registrar inicio/cierre de sesión solo si un mecanismo de identidad o sesión preexistente emite esos eventos; el historial no crea dicho mecanismo. Las consultas y búsquedas no deben guardar términos sensibles en `description`.
- Tratar el historial como append-only en las operaciones ordinarias, sin vencimiento automático ni borrado en la interfaz, y mostrarlo en orden descendente al entrar a la vista o volver a mostrarla.
- Permitir la consulta del historial a cualquier persona que pueda utilizar el ERP local. No implementar autenticación, roles ni control de acceso administrativo.
- No prometer retención indefinida: conservar mientras el almacenamiento local siga disponible; no sincroniza ni ofrece respaldo, resistencia a manipulación o garantía ante borrado externo. Exportación, respaldo y retención garantizada quedan fuera del MVP.
- Minimizar las descripciones: excluir contraseñas, tokens, secretos, términos de búsqueda y valores sensibles completos de entidades o documentos.
- Comunicar los fallos de escritura. Si una operación de negocio ya fue persistida, no revertirla silenciosamente por un fallo posterior de auditoría ni afirmar que quedó registrada.
- No añadir un temporizador: «periódicamente» se interpreta como registrar cada operación dentro del ERP, no como una ejecución programada.

### Alternativas no seleccionadas y límites

- Una base central o un servicio de auditoría sincronizado requeriría backend, despliegue y cambios arquitectónicos que no están justificados por la arquitectura actual.
- Un inicio de sesión o identificador deducido del navegador no está respaldado por la evidencia existente y daría una atribución engañosa.
- El almacenamiento local puede borrarse, ser modificado por quien controla el navegador y agotarse; no es una bitácora inviolable ni una garantía de conservación de registros.

### Decisiones adoptadas y trabajo fuera del MVP

- El historial es visible para cualquier persona que pueda utilizar el ERP en el mismo entorno local; quienes comparten ese entorno comparten los registros. No se restringe a administradores porque no existen roles ni autenticación.
- Si no hay identidad disponible, actor nulo y etiqueta «No identificado»; esto no bloquea la operación y no acredita quién usó un navegador compartido.
- Se auditan sesiones solo si ya hay eventos emitidos por un mecanismo existente, consultas explícitas, búsquedas ejecutadas y operaciones de creación, modificación y eliminación. Navegación, lecturas internas y pulsaciones individuales quedan excluidas.
- No hay vencimiento automático ni eliminación ordinaria. La persistencia solo dura mientras el almacenamiento local esté disponible y no sea borrado o modificado externamente.
- No se añade backend ni autenticación. Acceso con roles, auditoría central, respaldo, exportación y retención garantizada son evoluciones futuras, no decisiones bloqueantes del MVP.
