# Inicio Rápido: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Configuración

1. Instale las dependencias con `npm install`.
2. Inicie el servidor de desarrollo con `npm run dev`.
3. Abra la URL local de Vite en un navegador.

## Flujo de Usuario Principal

1. Aterrice en el panel ERP y use un botón de acción rápida (nueva entidad, nuevo documento, gestión de entidades o buscar registros).
2. Cree una entidad usando el formulario.
3. Busque una entidad usando la pantalla de búsqueda.
4. Edite o elimine una entidad desde el área de gestión.
5. Cambie entre módulos usando la barra lateral; actualice la página para confirmar que las entidades persisten en el almacenamiento local y que el marco con marca (logotipo, nombre del módulo) permanece consistente.
6. Abra Historial desde la navegación y compruebe que las operaciones de creación, edición, eliminación, consultas explícitas y búsquedas ejecutadas aparecen de más reciente a más antigua con acción, módulo, fecha y hora, resultado y actor disponible. La navegación y las lecturas internas no deben producir entradas.
7. Repita una operación cuando no haya identidad de usuario disponible y confirme que se muestra «No identificado»; esto no debe bloquear el flujo ni atribuir la acción a otra persona.
8. Compruebe que cualquier persona que pueda utilizar el ERP local puede abrir Historial, sin login, roles ni control de acceso administrativo.
9. Compruebe que las actividades anteriores siguen presentes después de nuevas operaciones y de recargar la aplicación en el mismo perfil del navegador, mientras no se borren o modifiquen externamente los datos.
10. Si existe un mecanismo preexistente de sesión, verifique que sus eventos de inicio y cierre se registran; no instale ni suponga autenticación para esta comprobación.

## Validación

- Verifique que los campos obligatorios muestran errores de validación.
- Verifique que un documento exige folio entero positivo y que el descuento no puede superar el subtotal.
- Verifique que un correo electrónico con formato inválido se rechaza con una explicación.
- Verifique que los resultados de búsqueda se actualizan a medida que el usuario escribe.
- Verifique que la lista permanece consistente tras las acciones de edición y eliminación.
- Verifique que las estadísticas del panel coinciden con el número de registros almacenados.
- Verifique que una operación exitosa y un intento fallido que alcance el flujo de operación registran el resultado correcto.
- Verifique que una consulta y una búsqueda se registran con `read` y `search`; una búsqueda completada sin resultados debe ser exitosa.
- Verifique que el historial vacío tiene un estado explicativo y que una actividad nueva se muestra al volver a abrir la vista.
- Simule una falla de escritura del historial y confirme que se informa explícitamente y no se presenta la actividad como guardada.
- Revise las descripciones para confirmar que excluyen contraseñas, tokens, secretos, términos de búsqueda y valores sensibles completos de entidades o documentos.
- Confirme que la interfaz no ofrece edición, eliminación ni vencimiento automático de actividades y que advierte de los límites de conservación local.

## Extender el Módulo Base

Los módulos ERP personalizados adaptan la base mediante un único archivo de configuración (`src/module-config.js`) en lugar de editar el código central:

1. Establezca el nombre del módulo y los mapeos de términos (p. ej., Entidad → Cliente, Documento → Pedido de Venta); cada pantalla se reetiqueta, incluida la barra lateral y el logotipo.
2. Declare campos personalizados por tipo de registro (texto, número, fecha, selección) — aparecen automáticamente en formularios, listas, validación y búsqueda.
3. Defina el ciclo de vida de estados de documentos y las transiciones permitidas (p. ej., cotización → pedido → facturado).
4. Opcionalmente establezca `theme.accentColor` para remarcar los resaltados y controles principales de todo el espacio de trabajo.
5. Añada reglas de validación específicas del módulo junto a las reglas base donde sea necesario.

La generación de identidad, marcas de tiempo, integridad referencial entre entidades y documentos, eliminación en cascada, navegación y búsqueda siguen siendo gestionadas por el módulo base. Sin archivo de configuración, la aplicación se ejecuta con el comportamiento predeterminado Entidad/Documento. Consulte `specs/001-erp-base-module/` para la especificación completa.

El historial utiliza `localStorage` en el mismo origen y perfil del navegador y está disponible para cualquier persona que pueda utilizar el ERP en ese entorno; quienes comparten el entorno comparten los registros. No se sincroniza entre perfiles o dispositivos ni tiene respaldo automático; los datos pueden borrarse o modificarse y la cuota puede agotarse. No hay vencimiento automático ni borrado desde la interfaz, pero esto no garantiza conservación indefinida. El historial no reemplaza autenticación ni una bitácora central. Si no hay identidad disponible, el actor aparece como «No identificado»; no debe afirmarse quién realizó una acción en un navegador compartido.
