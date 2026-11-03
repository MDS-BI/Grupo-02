# Contrato del Historial de Actividad

## Propósito

Definir la persistencia y consulta de la actividad realizada en el ERP. Este contrato complementa `entity-storage.md`; no introduce autenticación ni reemplaza la persistencia de entidades y documentos.

## Persistencia

- Almacenar la lista de actividades en `localStorage` bajo la clave `erp_base_module:activities`.
- Cada escritura añade una nueva actividad y conserva las anteriores.
- La persistencia es local al origen y al perfil del navegador donde se ejecuta la aplicación. Las personas que utilizan el ERP en ese mismo entorno local comparten el historial; no hay sincronización entre perfiles o dispositivos ni respaldo automático.
- Los datos pueden ser eliminados o modificados por el usuario o por herramientas del navegador; además, la cuota disponible es limitada y una escritura puede fallar al agotarse. Por tanto, `localStorage` no ofrece una bitácora central, inviolable ni una garantía de conservación.
- No se aplica vencimiento automático y la interfaz ordinaria no permite editar o eliminar actividades. La conservación no es indefinida ni garantizada: depende de que el almacenamiento del navegador permanezca disponible y sin modificaciones externas.
- Cualquier persona que pueda utilizar el ERP local puede consultar el historial. No se introducen autenticación, roles ni una restricción de acceso administrativa.

## Forma del Registro

Cada actividad debe ajustarse a la entidad `ActivityLog` definida en `data-model.md`:

```text
{
  id: string,
  actorId: string | null,
  actorName: string | null,
  action: "login" | "logout" | "read" | "search" | "create" | "update" | "delete",
  module: string,
  occurredAt: string,
  description: string,
  result: "success" | "failure",
  targetType: "entity" | "document" | null,
  targetId: string | null
}
```

`occurredAt` debe ser una fecha y hora ISO 8601 en UTC. El identificador se genera al registrar la actividad. Si no se entrega una identidad válida desde un contexto de usuario ya existente, `actorId` y `actorName` se almacenan como `null`; la interfaz muestra «No identificado». `targetType` y `targetId` pueden ser `null` cuando el evento no se refiere a un registro concreto, como un inicio o cierre de sesión.

## Operaciones

- `loadActivities()`: carga las actividades persistidas y las devuelve de más reciente a más antigua. No modifica ni migra silenciosamente registros previos.
- `recordActivity(activity)`: recibe `action`, `module`, `description` y `result`; recibe opcionalmente `actorId`, `actorName`, `targetType` y `targetId`, que se almacenan como `null` cuando no están disponibles o no aplican. Genera `id` y `occurredAt`, añade el registro y devuelve la actividad persistida.

No se exponen `updateActivity()` ni `deleteActivity()` para el flujo ordinario de la aplicación. Si la carga o escritura falla, la operación debe comunicar el error al llamador; no debe devolver una lista vacía ni un registro que no se guardó como si la operación hubiera tenido éxito.

## Reglas de Registro

- `login`: registrar los eventos de inicio de sesión que proporcione un mecanismo de identidad/autenticación ya existente. Un intento fallido se registra con `result: "failure"`; no se añade ni se presume un sistema de autenticación.
- `logout`: registrar el cierre de sesión cuando lo proporcione un mecanismo de identidad/sesión ya existente.
- `read`: registrar las consultas explícitas de registros o información iniciadas por el usuario; no registrar lecturas internas necesarias para renderizar la interfaz.
- `search`: registrar cada búsqueda ejecutada desde el ERP, no cada pulsación de tecla. Una búsqueda sin coincidencias sigue siendo `success` si se completó correctamente; `failure` indica que no pudo ejecutarse.
- `create`, `update` y `delete`: registrar los intentos de creación, modificación y eliminación de entidades y documentos, tanto si terminan correctamente como si fallan.
- Las consultas y búsquedas fallidas también se registran con `result: "failure"` si el almacenamiento del historial sigue disponible. Una búsqueda completada sin coincidencias tiene `result: "success"`.
- `description` contiene solo el contexto mínimo necesario para comprender la actividad. No incluye contraseñas, tokens, secretos, términos de búsqueda ni valores sensibles completos de entidades o documentos.
- El módulo se captura usando el nombre de módulo activo al momento de la operación. Para eventos de inicio/cierre de sesión sin módulo activo, se usa el nombre general del ERP. La etiqueta visible histórica no cambia si después cambia la configuración.
- Los eventos de inicio/cierre de sesión y la identidad del actor dependen de mecanismos ya existentes; la ausencia de dichos mecanismos no autoriza a inventar identidades ni a introducir autenticación en este alcance.
- No generar una identidad ficticia para completar los campos del actor.
- Una falla al escribir el historial no debe intentar generar otra actividad recursiva. Si el registro de negocio ya fue persistido, no debe deshacerse silenciosamente; se debe informar que el cambio se guardó, pero su actividad no pudo conservarse.
- Una falla de escritura puede impedir el registro del intento fallido; el sistema debe comunicarlo explícitamente y no afirmar que quedó auditado.

## Consulta en la Interfaz

- La opción Historial debe poder abrirse desde la navegación del ERP.
- La vista no restringe el acceso por rol: toda persona que pueda utilizar el ERP local puede consultar los registros.
- Al abrir o volver a mostrar la vista, debe cargar las actividades persistidas y presentarlas de más reciente a más antigua.
- La vista debe mostrar fecha y hora, actor (o «No identificado»), módulo, acción, resultado y descripción, y un estado vacío cuando no haya registros. Los eventos sin registro de destino muestran que no aplica.
- El historial local no constituye un registro inviolable ni permite determinar qué persona utilizó un navegador compartido. No se debe presentar como evidencia de autoría autenticada.
- No debe prometerse retención indefinida. El borrado, modificación o agotamiento del almacenamiento local puede eliminar o impedir conservar actividades; exportación, respaldo y retención garantizada quedan fuera del MVP.

## Errores que Deben Comunicarse

- JSON almacenado ilegible o con estructura incompatible.
- Fallo de lectura o escritura de `localStorage`, incluido el límite de almacenamiento disponible.
- Identidad de actor ausente (se representa como «No identificado»; no es un error que impida la operación).
- Imposibilidad de persistir la actividad después de completar la operación de negocio.
- Evento de inicio/cierre de sesión no disponible por ausencia de un mecanismo preexistente: no se genera un evento ficticio ni se bloquea el ERP.
