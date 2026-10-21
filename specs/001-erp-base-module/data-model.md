# Modelo de Datos: Módulo Base de Software de Planificación de Recursos Empresariales (ERP)

## Entidad: Entity (registro de datos maestros)

Representa el dato maestro central del módulo (p. ej., cliente, proveedor, artículo) con su identidad fiscal, contacto y condiciones comerciales.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador interno único del registro de entidad | Obligatorio, generado automáticamente |
| entity_id | string | Identificador público usado para vincular documentos a esta entidad | Obligatorio, generado automáticamente, único |
| name | string | Nombre o razón social de la entidad | Obligatorio, no vacío |
| code | string | Código o clave de negocio que identifica la entidad | Obligatorio, no vacío |
| taxId | string | Identificación fiscal de la entidad (p. ej., RFC, NIT, CUIT) | Opcional; se almacena recortada cuando se proporciona |
| email | string | Correo electrónico principal de contacto | Opcional; debe tener formato de correo válido si se proporciona |
| phone | string | Teléfono de contacto | Opcional |
| address | string | Dirección fiscal o comercial | Opcional |
| category | string | Clasificación opcional como tipo, grupo o clase | Opcional |
| description | string | Descripción corta o notas | Opcional |
| targetDate | string | Fecha objetivo opcional en formato YYYY-MM-DD; los módulos personalizados definen su significado (p. ej., fecha de vencimiento, fecha de revisión) | Opcional, debe ser una fecha de calendario válida si se proporciona |
| creditLimit | number | Límite de crédito extendido a la entidad en la moneda configurada | Opcional, debe ser un número no negativo |
| paymentTerms | string | Condiciones de pago acordadas (p. ej., contado, neto 30) | Opcional |
| createdAt | string | Marca de tiempo de cuándo se creó la entidad | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización de la entidad | Obligatorio |

## Entidad: Document (registro transaccional)

Representa un documento transaccional vinculado a una entidad (p. ej., pedido, factura, contrato), identificado por serie y folio y con desglose económico.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| id | string | Identificador único del documento | Obligatorio, generado automáticamente |
| entity_id | string | Identificador de la entidad a la que pertenece este documento | Obligatorio, debe referenciar el entity_id de una entidad existente |
| series | string | Serie del documento (p. ej., FAC, A, NV) que agrupa folios consecutivos | Opcional |
| folio | number | Folio consecutivo que, junto con la serie, forma el número oficial del documento | Obligatorio, debe ser un entero positivo |
| startDate | string | Fecha de inicio en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida |
| endDate | string | Fecha de fin en formato YYYY-MM-DD | Obligatorio, debe ser una fecha de calendario válida, debe ser igual o posterior a startDate |
| quantity | number | Cantidad asociada al documento | Opcional, debe ser un entero positivo |
| subtotal | number | Importe antes de descuentos e impuestos | Opcional, debe ser un número no negativo |
| discount | number | Descuento aplicado sobre el subtotal | Opcional, debe ser un número no negativo y no puede superar el subtotal |
| taxAmount | number | Impuesto calculado para el documento | Opcional, debe ser un número no negativo |
| totalAmount | number | Importe total del documento en la moneda configurada | Opcional, debe ser un número no negativo |
| currency | string | Código de moneda para los importes del documento (p. ej., MXN, USD, EUR) | Opcional |
| paymentTerms | string | Condiciones de pago del documento (p. ej., contado, neto 30) | Opcional |
| notes | string | Notas u observaciones libres del documento | Opcional |
| status | string | Estado del documento como borrador, pendiente, aprobado o cancelado | Opcional |
| createdAt | string | Marca de tiempo de cuándo se creó el documento | Obligatorio |
| updatedAt | string | Marca de tiempo de la última actualización del documento | Obligatorio |

## Entidad: ModuleConfig

Objeto de configuración cargado al arrancar que adapta el módulo base en un módulo específico.

| Campo | Tipo | Descripción | Restricciones |
|---|---|---|---|
| moduleName | string | Nombre visible del módulo adaptado | Obligatorio, no vacío |
| labels | object | Mapeos de términos como `{ entity: "Cliente", entities: "Clientes", document: "Pedido de Venta", documents: "Pedidos de Venta" }` | Opcional; retrocede a Entidad/Documento |
| customFields | array | Definiciones de campos por tipo de registro: `{ target: "entity"\|"document", key, label, type: "text"\|"number"\|"date"\|"select", required: boolean, options?: string[] }` | Opcional; las claves NO DEBEN chocar con nombres de campos base |
| statusLifecycle | object | Estados ordenados y transiciones permitidas para documentos, p. ej., `{ statuses: ["cotización", "pedido", "facturado"], transitions: { cotización: ["pedido"], pedido: ["facturado"], facturado: [] } }` | Opcional |
| theme | object | Opciones de marca, p. ej., `{ accentColor: "#0f62fe" }`; aplicado como propiedad personalizada de CSS en todo el marco del espacio de trabajo | Opcional; accentColor debe ser un color CSS válido o retrocede al predeterminado |

## Reglas de ModuleConfig

- La configuración se carga una vez al arrancar y se aplica en todas las pantallas.
- Cuando la configuración está ausente, se aplican los valores predeterminados integrados: etiquetas Entidad/Documento, sin campos personalizados, estado de texto libre, color de acento predeterminado.
- Los valores inválidos o conflictivos deben informarse con claridad en lugar de fallar silenciosamente.
- Las claves de campos personalizados no deben chocar con los nombres de campos base (`id`, `entity_id`, `name`, `code`, `taxId`, `email`, `phone`, `address`, `category`, `description`, `targetDate`, `creditLimit`, `paymentTerms`, `series`, `folio`, `startDate`, `endDate`, `quantity`, `subtotal`, `discount`, `taxAmount`, `totalAmount`, `currency`, `notes`, `status`).
- Los valores de campos personalizados se persisten junto a los campos base sin cambios de esquema en el almacenamiento.
- Un ciclo de vida configurado reemplaza la entrada de estado de texto libre; sin uno, el estado permanece como texto libre.

## Reglas de Validación

### Entidad

- Una entidad debe incluir un nombre no vacío.
- Una entidad debe incluir un código no vacío.
- La identificación fiscal, teléfono, dirección, categoría, descripción y condiciones de pago son opcionales pero deben almacenarse como cadenas recortadas.
- El correo electrónico es opcional pero, cuando está presente, debe tener formato de correo válido.
- El límite de crédito es opcional pero, cuando está presente, debe ser un número no negativo.
- La fecha objetivo es opcional pero, cuando está presente, debe ser una fecha de calendario válida en formato YYYY-MM-DD.
- Un entity_id debe generarse automáticamente y debe ser único entre todas las entidades.

### Documento

- Un documento debe referenciar una entidad existente mediante entity_id.
- Un documento debe incluir un folio entero positivo; la serie es opcional y, cuando existe, se combina con el folio para formar el número oficial del documento (p. ej., `FAC-1001`).
- Un documento debe incluir fechas de inicio y fin válidas; la fecha de fin debe ser igual o posterior a la fecha de inicio.
- La cantidad es opcional y debe ser un entero positivo.
- Subtotal, descuento, impuesto e importe total son opcionales y deben ser números no negativos; el descuento no puede superar el subtotal.
- La aplicación debe normalizar el texto para un comportamiento de búsqueda consistente.

> Nota: el cálculo automático de totales (p. ej., `total = subtotal - descuento + impuesto`) queda como punto de extensión; el módulo base valida cada importe de forma independiente para evitar sorpresas por redondeo.

## Relaciones

- Cada entidad se almacena independientemente y aparece como una única fila en la lista de entidades.
- Cada entidad tiene un entity_id usado para conectarse a sus documentos.
- Cada documento pertenece exactamente a una entidad, vinculada por el entity_id de la entidad.
- Cuando se elimina una entidad, todos los documentos que referencian su entity_id también se eliminan.
- Las operaciones de búsqueda se realizan sobre los registros de entidad almacenados, incluyendo identidad fiscal, contacto y condiciones comerciales.

## Notas de Extensibilidad

- Los módulos personalizados pueden añadir campos específicos del dominio a cualquiera de los dos tipos de registro; los campos base anteriores deben mantener sus nombres y semántica para que el almacenamiento, la validación y la integridad referencial permanezcan intactos.
- El campo `status` es intencionadamente de texto libre a nivel base para que cada módulo personalizado pueda imponer su propio ciclo de vida (p. ej., estados de pedidos, estados de aprobación).
- La unicidad de folio por serie, las partidas de documento (líneas con producto, cantidad y precio) y la numeración automática son puntos de extensión naturales para módulos que los requieran.

# Modelo de Datos — Módulo ERP de Recursos Humanos, Planilla y Productividad

**Asignatura:** Modelación de Sistemas 2026-2  
**Grupo:** Grupo-02  
**Tipo de empresa:** Pequeña y mediana empresa (PYME) chilena  
**Tecnologías base:** Vite, JavaScript, HTML, CSS y localStorage  
**Documento:** data-model.md  
**Versión:** 1.0

---

# 1. Descripción general del módulo

## 1.1. Contexto y problemática

Las pequeñas y medianas empresas requieren administrar información relacionada con sus trabajadores, contratos laborales, remuneraciones y actividades desarrolladas.

Cuando estos antecedentes se encuentran distribuidos en diferentes registros, se dificulta su actualización, seguimiento y análisis.

Adicionalmente, la ausencia de información centralizada sobre tareas asignadas, horas utilizadas y metas laborales limita la capacidad de evaluar la productividad de los trabajadores y detectar desviaciones en el cumplimiento de objetivos.

**Problemática identificada:**

La empresa presenta dificultades para gestionar de manera integrada la información laboral y las remuneraciones de sus colaboradores, así como para medir y analizar su productividad mediante indicadores de cumplimiento de tareas, eficiencia temporal y cumplimiento de metas.

## 1.2. Solución propuesta

Se propone desarrollar un módulo ERP de Recursos Humanos y Planilla para una PYME chilena, incorporando herramientas de seguimiento de productividad laboral.

El sistema permitirá registrar colaboradores, administrar información contractual, generar liquidaciones de remuneraciones simuladas y gestionar tareas, registros de horas y metas.

La información permitirá analizar indicadores individuales y por departamento, facilitando el seguimiento operacional y la toma de decisiones.

## 1.3. Alcance funcional del MVP

El Producto Mínimo Viable considera las siguientes funcionalidades:

### Gestión de Recursos Humanos

- Registrar, consultar y actualizar trabajadores.
- Registrar departamentos de la empresa.
- Asociar trabajadores a departamentos.
- Registrar contratos y condiciones laborales.
- Mantener antecedentes históricos cuando un trabajador cambie de departamento.
- Consultar el estado laboral de cada trabajador.

### Gestión de Planilla

- Generar liquidaciones de remuneraciones simuladas.
- Asociar liquidaciones a trabajadores.
- Registrar haberes y descuentos.
- Calcular totales de remuneraciones.
- Consultar liquidaciones por trabajador y periodo.
- Administrar los estados Borrador, Emitida y Pagada.

### Control de Productividad

- Registrar tareas asignadas a trabajadores.
- Definir plazos y horas estimadas.
- Registrar horas efectivamente utilizadas.
- Establecer metas individuales.
- Consultar indicadores de cumplimiento de tareas, eficiencia temporal y cumplimiento de metas.
- Visualizar información resumida por trabajador y departamento.

Los cálculos de remuneraciones tendrán carácter demostrativo. El MVP no contempla integración bancaria, declaración previsional real ni emisión de documentos con validez legal.

## 1.4. Usuarios del sistema

**Administrador de Recursos Humanos:** responsable de mantener los registros laborales, departamentos y contratos.

**Encargado de remuneraciones:** responsable de revisar, generar y consultar liquidaciones de sueldo.

**Supervisor:** responsable de asignar tareas, registrar o revisar avances y consultar indicadores de productividad.

Los permisos específicos de cada perfil corresponden a una funcionalidad de implementación. Este modelo identifica a los usuarios funcionales, pero no incluye todavía un sistema de autenticación o control de acceso.

---

# 2. Compatibilidad con el ERP base

El desarrollo se realizará a partir del módulo base entregado, conservando sus estructuras principales:

- `Entity`: registro de datos maestros.
- `Document`: registro transaccional.
- `ModuleConfig`: configuración del módulo.

## 2.1. Adaptación de Entity

La estructura `Entity` se utilizará para representar a los trabajadores.

Se conservarán los atributos existentes del modelo base y se incorporarán campos específicos de Recursos Humanos mediante los mecanismos de extensión del ERP.

La correspondencia principal será:

| ERP base | Recursos Humanos |
|---|---|
| Entity | Trabajador |
| id | Identificador interno |
| entity_id | Identificador público único |
| name | Nombre completo del trabajador |
| code | Código interno del trabajador |
| taxId | RUT del trabajador |
| email | Correo electrónico |
| phone | Teléfono |
| address | Dirección |
| category | Clasificación del registro |

El campo `entity_id` será la referencia principal para relacionar trabajadores con documentos y registros adicionales.

## 2.2. Adaptación de Document

La estructura `Document` se utilizará para representar las liquidaciones de remuneraciones.

Se conservarán los campos originales:

- `id`
- `entity_id`
- `series`
- `folio`
- `startDate`
- `endDate`
- `quantity`
- `subtotal`
- `discount`
- `taxAmount`
- `totalAmount`
- `currency`
- `paymentTerms`
- `notes`
- `status`
- `createdAt`
- `updatedAt`

La relación entre trabajador y liquidación utilizará `entity_id`, tal como establece el ERP base.

Para el módulo se propone utilizar:

- `series`: serie identificadora de liquidaciones.
- `folio`: número correlativo del documento.
- `startDate` y `endDate`: fechas del periodo de remuneración.
- `subtotal`: total de haberes.
- `discount`: total de descuentos.
- `taxAmount`: valor cero dentro de la convención de remuneraciones simuladas del MVP.
- `totalAmount`: sueldo líquido.
- `status`: estado de la liquidación.

La interpretación de estos campos es una adaptación específica del módulo y deberá documentarse en la implementación.

## 2.3. Configuración ModuleConfig

La configuración del ERP permitirá definir:

**moduleName:** Recursos Humanos y Planilla.

**labels:** reemplazar las denominaciones visibles Entidad y Documento por Trabajador y Liquidación, respectivamente.

**customFields:** incorporar atributos laborales que no existan en el modelo base.

**statusLifecycle:** configurar las transiciones permitidas entre Borrador, Emitida y Pagada.

**theme:** conservar o personalizar el estilo visual del módulo.

Los campos personalizados deberán utilizar claves diferentes de los nombres reservados del ERP base.

`ModuleConfig` no se considera una entidad operacional del MER, ya que corresponde a la configuración del software.

## 2.4. Entidades adicionales

Las entidades Departamento, Contrato, Detalle_Liquidacion, Tarea, Registro_Horas, Meta e Historial_Departamento representan extensiones del modelo original.

Su implementación requerirá ampliar la lógica de almacenamiento, validación y consulta del ERP.

La incorporación de atributos mediante `customFields` no significa que el template permita crear automáticamente nuevas entidades independientes.

---

# 3. Diccionario de datos

El modelo propuesto contiene nueve entidades operacionales.

Los tipos `string`, `number` e `integer` representan tipos lógicos. Las fechas se almacenarán en formato `YYYY-MM-DD`, siguiendo la representación utilizada por el ERP base.

Los identificadores se representarán como cadenas de texto y podrán generarse automáticamente.

**Convenciones:**

- **PK:** clave primaria.
- **FK:** clave foránea.
- **UK:** campo con restricción de unicidad.
- **Obligatorio:** debe contener un valor válido.
- **Opcional:** puede no contener información, según las reglas de negocio.

## 3.1. Entidad DEPARTAMENTO

**Descripción:** representa las áreas organizacionales de la PYME y permite agrupar trabajadores para su administración y análisis de productividad.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id_departamento | string | PK | Obligatorio, único, generado automáticamente |
| nombre | string | — | Obligatorio, no vacío |
| descripcion | string | — | Opcional |

**Reglas:**

- Cada departamento debe poseer un identificador único.
- No se permitirá registrar nombres duplicados después de normalizar espacios y mayúsculas.
- Un departamento con trabajadores o antecedentes históricos no podrá eliminarse físicamente sin una política de conservación de sus referencias.
- Los departamentos podrán utilizarse para elaborar reportes de productividad por área.

## 3.2. Entidad TRABAJADOR

**Descripción:** representa a los colaboradores de la empresa y especializa la estructura `Entity` del ERP base.

### Atributos heredados de Entity

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id | string | PK | Obligatorio, generado automáticamente |
| entity_id | string | UK | Obligatorio, identificador único utilizado en relaciones |
| name | string | — | Obligatorio, nombre completo no vacío |
| code | string | — | Obligatorio, código interno no vacío |
| taxId | string | — | RUT del trabajador, opcional en el ERP base |
| email | string | — | Opcional, formato de correo válido |
| phone | string | — | Opcional |
| address | string | — | Opcional |
| category | string | — | Clasificación del trabajador |
| description | string | — | Observaciones opcionales |
| targetDate | string | — | Fecha objetivo del ERP base, opcional |
| creditLimit | number | — | Campo comercial heredado, opcional y no negativo |
| paymentTerms | string | — | Campo comercial heredado, opcional |
| createdAt | string | — | Fecha y hora de creación, obligatoria |
| updatedAt | string | — | Fecha y hora de última modificación, obligatoria |

Los campos comerciales heredados se mantendrán técnicamente, aunque no se utilizarán para representar información salarial.

### Atributos específicos de Recursos Humanos

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| departamentoId | string | FK | Referencia al departamento actual |
| cargo | string | — | Obligatorio para el módulo |
| tipoContrato | string | — | Clasificación laboral, coherente con el contrato vigente |
| fechaIngreso | string | — | Fecha válida en formato YYYY-MM-DD |
| estadoLaboral | string | — | Activo o Inactivo |

**Reglas:**

- Se conservarán los identificadores originales `id` y `entity_id`.
- `entity_id` no podrá modificarse una vez generado.
- El módulo validará el formato y dígito verificador del RUT, cuando se registre.
- El RUT deberá ser único entre los trabajadores registrados.
- Los trabajadores deberán estar asociados a un departamento válido para participar en los reportes por área.
- La modificación del departamento actual deberá generar un registro en Historial_Departamento.
- Los trabajadores con antecedentes históricos no deberán eliminarse físicamente mediante las operaciones ordinarias del módulo.

La validación adicional del RUT y las reglas de conservación son extensiones propuestas; no forman parte de las validaciones originales de `Entity`.

## 3.3. Entidad CONTRATO

**Descripción:** almacena las condiciones contractuales de los trabajadores y permite conservar su historial laboral.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id_contrato | string | PK | Obligatorio, único |
| entity_id | string | FK | Referencia a TRABAJADOR.entity_id |
| tipo_contrato | string | — | Obligatorio |
| fecha_inicio | string | — | Fecha de inicio, obligatoria |
| fecha_termino | string | — | Opcional para contratos indefinidos |
| sueldo_base | number | — | Obligatorio, mayor o igual a cero |
| estado | string | — | Vigente, Finalizado o Anulado |

**Reglas:**

- Cada contrato debe pertenecer a un trabajador existente.
- La fecha de término no podrá ser anterior a la fecha de inicio.
- Los cambios contractuales relevantes deberán conservarse como antecedentes históricos.
- No podrán existir contratos principales vigentes con periodos superpuestos para un mismo trabajador dentro del alcance del MVP.
- La liquidación utilizará el contrato aplicable al periodo que se está procesando.

## 3.4. Entidad LIQUIDACION

**Descripción:** representa los documentos de remuneraciones mensuales y especializa la estructura `Document` del ERP base.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id | string | PK | Obligatorio, generado automáticamente |
| entity_id | string | FK | Referencia a TRABAJADOR.entity_id |
| contratoId | string | FK | Referencia a CONTRATO.id_contrato |
| series | string | — | Serie opcional del documento |
| folio | integer | — | Obligatorio, entero positivo |
| startDate | string | — | Inicio del periodo, obligatorio |
| endDate | string | — | Fin del periodo, obligatorio |
| quantity | number | — | Cantidad opcional, entero positivo |
| subtotal | number | — | Total de haberes, no negativo |
| discount | number | — | Total de descuentos, no negativo |
| taxAmount | number | — | Campo heredado; cero en el MVP propuesto |
| totalAmount | number | — | Sueldo líquido, no negativo |
| currency | string | — | CLP para el módulo propuesto |
| paymentTerms | string | — | Condiciones de pago, opcional |
| notes | string | — | Observaciones opcionales |
| status | string | — | Borrador, Emitida o Pagada |
| createdAt | string | — | Marca de tiempo obligatoria |
| updatedAt | string | — | Marca de tiempo obligatoria |

**Reglas:**

- Cada liquidación debe asociarse a un trabajador existente.
- El contrato relacionado deberá pertenecer al mismo trabajador.
- Antes de emitir una liquidación deberá identificarse el respaldo contractual aplicable.
- `endDate` deberá ser igual o posterior a `startDate`.
- Los montos no podrán ser negativos.
- El total de descuentos no podrá superar el total de haberes dentro de las reglas simplificadas del MVP.
- La combinación de serie y folio deberá ser única dentro del módulo.
- No se permitirá generar dos liquidaciones ordinarias para un mismo trabajador y periodo.
- Las liquidaciones emitidas o pagadas no podrán modificar sus montos sin un procedimiento de corrección documentado.

**Ciclo de estados:**

Borrador → Emitida → Pagada.

El módulo no permitirá retroceder de Pagada a Borrador mediante el flujo ordinario.

**Cálculo de remuneraciones del MVP:**

Total de haberes = suma de conceptos de tipo Haber.

Total de descuentos = suma de conceptos de tipo Descuento.

Sueldo líquido = Total de haberes − Total de descuentos.

Los cálculos de cotizaciones legales requerirán reglas específicas si se incorporan. En esta versión se utilizarán valores simulados explícitamente identificados.

## 3.5. Entidad DETALLE_LIQUIDACION

**Descripción:** representa los conceptos individuales que componen los haberes y descuentos de cada liquidación.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id_detalle | string | PK | Obligatorio, único |
| liquidacionId | string | FK | Referencia a LIQUIDACION.id |
| concepto | string | — | Obligatorio, no vacío |
| tipo | string | — | Haber o Descuento |
| monto | number | — | Obligatorio, mayor o igual a cero |

**Reglas:**

- Cada detalle pertenece a una liquidación existente.
- Una liquidación deberá contener al menos un detalle válido antes de emitirse.
- Los conceptos deberán clasificarse como Haber o Descuento.
- Los importes acumulados deberán ser coherentes con los totales de la liquidación.
- Se conservará el desglose de las liquidaciones emitidas y pagadas.

## 3.6. Entidad TAREA

**Descripción:** registra las actividades asignadas a los trabajadores para realizar seguimiento de productividad.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id_tarea | string | PK | Obligatorio, único |
| entity_id | string | FK | Referencia a TRABAJADOR.entity_id |
| descripcion | string | — | Obligatorio, no vacío |
| fecha_asignacion | string | — | Fecha válida, obligatoria |
| fecha_limite | string | — | Fecha comprometida, obligatoria |
| fecha_finalizacion | string | — | Opcional hasta completar la tarea |
| horas_estimadas | number | — | Obligatorio, mayor que cero |
| estado | string | — | Pendiente, En proceso, Completada o Cancelada |

**Reglas:**

- Cada tarea tendrá un trabajador responsable en el MVP.
- La fecha límite no podrá ser anterior a la fecha de asignación.
- La fecha de finalización no podrá ser anterior a la fecha de asignación.
- Las tareas completadas deberán tener una fecha de finalización.
- Las tareas canceladas no se considerarán completadas.
- Los cambios de departamento del trabajador no deberán eliminar ni reasignar automáticamente sus tareas históricas.

## 3.7. Entidad REGISTRO_HORAS

**Descripción:** almacena las horas reales dedicadas a una tarea y permite comparar tiempos estimados y ejecutados.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id_registro | string | PK | Obligatorio, único |
| id_tarea | string | FK | Referencia a TAREA.id_tarea |
| fecha | string | — | Fecha válida, obligatoria |
| horas_trabajadas | number | — | Obligatorio, mayor que cero |
| observaciones | string | — | Opcional |

**Reglas:**

- Cada registro deberá pertenecer a una tarea existente.
- Las horas trabajadas deberán ser positivas.
- La suma de registros constituirá el tiempo real utilizado en la tarea.
- Se deberán validar registros duplicados o inconsistentes.
- Los registros no deberán perderse cuando un trabajador cambie de departamento.
- Las correcciones deberán preservar la trazabilidad cuando se incorporen mecanismos de auditoría.

## 3.8. Entidad META

**Descripción:** almacena los objetivos de productividad asignados a cada trabajador durante un periodo.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id_meta | string | PK | Obligatorio, único |
| entity_id | string | FK | Referencia a TRABAJADOR.entity_id |
| descripcion | string | — | Obligatorio, no vacío |
| fecha_inicio | string | — | Inicio del periodo, obligatorio |
| fecha_fin | string | — | Fin del periodo, obligatorio |
| valor_objetivo | number | — | Obligatorio, mayor que cero |
| valor_alcanzado | number | — | Obligatorio, mayor o igual a cero |
| unidad_medida | string | — | Obligatorio |
| estado | string | — | Pendiente, En proceso, Cumplida o No cumplida |

**Reglas:**

- Cada meta estará asociada a un trabajador.
- La fecha de término no podrá ser anterior a la fecha de inicio.
- El resultado alcanzado deberá utilizar la misma unidad de medida que el objetivo.
- El cumplimiento podrá superar el 100 % cuando los resultados excedan la meta establecida.
- Los registros históricos de metas no deberán modificarse automáticamente cuando un trabajador cambie de departamento.

## 3.9. Entidad HISTORIAL_DEPARTAMENTO

**Descripción:** conserva los periodos durante los cuales un trabajador ha pertenecido a diferentes departamentos.

Esta entidad permitirá analizar información histórica sin perder las asignaciones anteriores.

| Atributo | Tipo | Clave | Restricción o descripción |
|---|---|---|---|
| id_historial | string | PK | Obligatorio, único |
| entity_id | string | FK | Referencia a TRABAJADOR.entity_id |
| id_departamento | string | FK | Referencia a DEPARTAMENTO.id_departamento |
| fecha_inicio | string | — | Inicio de asignación, obligatorio |
| fecha_fin | string | — | Término de asignación, opcional |

**Reglas:**

- Cada registro representa un periodo de asignación departamental.
- La fecha de término deberá ser igual o posterior a la fecha de inicio.
- Un trabajador solamente podrá tener una asignación departamental vigente a la vez dentro del MVP.
- Los periodos de asignación no podrán superponerse para un mismo trabajador.
- Un cambio de departamento cerrará la asignación anterior y creará un registro nuevo.
- El historial no se sobrescribirá al modificar el departamento actual.
- Los registros históricos deberán mantenerse disponibles para consultas y análisis.

---

# 4. Relaciones y cardinalidades

El modelo utiliza relaciones uno a muchos (1:N).

## 4.1. Departamento — Trabajador

**Cardinalidad:** 1:N.

Un departamento puede tener varios trabajadores. Cada trabajador tendrá un departamento actual asociado.

Relación mediante:

`TRABAJADOR.departamentoId → DEPARTAMENTO.id_departamento`

La relación representa la asignación actual y no reemplaza el historial.

## 4.2. Trabajador — Contrato

**Cardinalidad:** 1:N.

Un trabajador puede tener distintos contratos a lo largo del tiempo. Cada contrato corresponde a un trabajador.

Relación mediante:

`CONTRATO.entity_id → TRABAJADOR.entity_id`

## 4.3. Trabajador — Liquidación

**Cardinalidad:** 1:N.

Un trabajador puede recibir múltiples liquidaciones durante distintos periodos. Cada liquidación pertenece a un trabajador.

Relación mediante:

`LIQUIDACION.entity_id → TRABAJADOR.entity_id`

Esta relación utiliza el identificador original del ERP base.

## 4.4. Contrato — Liquidación

**Cardinalidad:** 1:N, considerando que la asociación del contrato es opcional durante la preparación del documento.

Un contrato puede respaldar varias liquidaciones y una liquidación puede asociarse a un contrato.

Relación mediante:

`LIQUIDACION.contratoId → CONTRATO.id_contrato`

La emisión requerirá validar el respaldo contractual correspondiente.

## 4.5. Liquidación — Detalle Liquidación

**Cardinalidad:** 1:N.

Una liquidación contiene varios conceptos de remuneración y cada detalle corresponde a una única liquidación.

Relación mediante:

`DETALLE_LIQUIDACION.liquidacionId → LIQUIDACION.id`

Antes de emitir una liquidación se exigirá al menos un concepto válido.

## 4.6. Trabajador — Tarea

**Cardinalidad:** 1:N.

Un trabajador puede tener múltiples tareas y cada tarea tendrá un responsable.

Relación mediante:

`TAREA.entity_id → TRABAJADOR.entity_id`

## 4.7. Tarea — Registro Horas

**Cardinalidad:** 1:N.

Una tarea puede tener múltiples registros de horas y cada registro corresponde a una tarea.

Relación mediante:

`REGISTRO_HORAS.id_tarea → TAREA.id_tarea`

## 4.8. Trabajador — Meta

**Cardinalidad:** 1:N.

Un trabajador puede registrar múltiples metas y cada meta pertenece a un trabajador.

Relación mediante:

`META.entity_id → TRABAJADOR.entity_id`

## 4.9. Trabajador — Historial Departamento

**Cardinalidad:** 1:N.

Un trabajador puede tener diferentes asignaciones departamentales durante su permanencia en la empresa.

Relación mediante:

`HISTORIAL_DEPARTAMENTO.entity_id → TRABAJADOR.entity_id`

## 4.10. Departamento — Historial Departamento

**Cardinalidad:** 1:N.

Un departamento puede aparecer en múltiples registros históricos de asignación.

Relación mediante:

`HISTORIAL_DEPARTAMENTO.id_departamento → DEPARTAMENTO.id_departamento`

Esta relación permite reconstruir la pertenencia departamental de los trabajadores en periodos anteriores.

---

# 5. Conservación del historial laboral

## 5.1. Necesidad de mantener registros históricos

Uno de los requisitos del modelo es impedir la pérdida de antecedentes cuando un trabajador cambia de equipo o departamento.

Si únicamente se modifica el departamento del registro maestro, se pierde la información sobre las asignaciones anteriores.

Para evitarlo se propone la entidad `HISTORIAL_DEPARTAMENTO`.

## 5.2. Procedimiento de cambio de departamento

Cuando un trabajador sea trasladado a otra área, el sistema deberá:

1. Identificar el trabajador mediante `entity_id`.
2. Consultar su asignación departamental vigente.
3. Validar la fecha del traslado.
4. Cerrar el registro histórico anterior mediante `fecha_fin`.
5. Crear una nueva asignación con el departamento de destino y `fecha_inicio`.
6. Actualizar el campo `departamentoId` del trabajador.
7. Conservar los contratos, liquidaciones, tareas, registros de horas y metas existentes.

Las operaciones deberán aplicarse de forma consistente. Una modificación parcial no deberá dejar al trabajador con departamentos actuales e históricos contradictorios.

## 5.3. Ejemplo de conservación del historial

| Trabajador | Departamento | Fecha inicio | Fecha fin |
|---|---|---|---|
| Juan Pérez | Producción | 01-01-2026 | 28-02-2026 |
| Juan Pérez | Administración | 01-03-2026 | Vigente |

En este ejemplo, Juan Pérez cambia de Producción a Administración el 1 de marzo de 2026.

El sistema conserva ambos periodos.

Las tareas ejecutadas durante enero y febrero continúan asociadas al mismo trabajador y pueden analizarse considerando su departamento histórico.

## 5.4. Consulta de productividad histórica

Para elaborar indicadores por departamento se utilizará la fecha del registro que se está analizando.

Por ejemplo:

- Para tareas asignadas, podrá utilizarse la fecha de asignación.
- Para horas trabajadas, se utilizará la fecha del registro.
- Para metas, se utilizará el periodo de evaluación y una regla explícita de atribución cuando abarque más de un departamento.

La pertenencia departamental se determinará mediante la asignación histórica vigente en la fecha correspondiente.

De esta manera, un traslado posterior no modificará los resultados históricos del departamento anterior.

## 5.5. Conservación de documentos y registros

El ERP base considera eliminación en cascada de documentos cuando se elimina su entidad asociada.

Para este módulo se propone extender dicho comportamiento y evitar la eliminación física ordinaria de trabajadores que posean registros históricos.

En esos casos se utilizará `estadoLaboral = Inactivo`.

Esta modificación deberá implementarse expresamente, ya que no corresponde al comportamiento de eliminación original del template.

---

# 6. Reglas de negocio, validaciones e indicadores

## 6.1. Integridad de datos

El sistema deberá asegurar:

- Identificadores únicos para los registros.
- Referencias a entidades existentes.
- Validación de los campos obligatorios.
- Conservación de los nombres y significados de los campos del ERP base.
- Fechas válidas y cronológicamente consistentes.
- Valores monetarios y cantidades dentro de rangos permitidos.
- Consistencia entre departamento actual e historial.
- Prevención de referencias huérfanas cuando se eliminen o desactiven registros.

Las nuevas entidades requerirán validaciones adicionales a las existentes en el template.

## 6.2. Reglas de liquidaciones

El flujo documental será:

**Borrador → Emitida → Pagada**

### Borrador

Permite ingresar y corregir los antecedentes de la liquidación.

### Emitida

Representa una liquidación cuyos datos y cálculos han sido validados.

### Pagada

Representa una liquidación cuyo pago ha sido registrado administrativamente en el MVP.

Las transiciones deberán respetar el ciclo de estados configurado y no permitir modificaciones arbitrarias de documentos finalizados.

## 6.3. Indicador de cumplimiento de tareas

**Objetivo:** medir la proporción de tareas completadas respecto de las asignadas durante un periodo.

**Fórmula:**

Cumplimiento de tareas (%) = (Tareas completadas / Tareas asignadas) × 100.

**Datos requeridos:**

- Identificador del trabajador.
- Estado de la tarea.
- Fecha de asignación.
- Fecha de finalización.
- Periodo de evaluación.

Las tareas canceladas se excluirán del denominador según la regla de evaluación definida para el MVP.

Cuando no existan tareas aplicables, el indicador se mostrará como no disponible.

## 6.4. Indicador de eficiencia temporal

**Objetivo:** comparar las horas estimadas con las horas reales utilizadas para ejecutar tareas completadas.

**Fórmula:**

Eficiencia temporal (%) = (Horas estimadas / Horas reales) × 100.

**Datos requeridos:**

- Horas estimadas de las tareas.
- Horas reales acumuladas.
- Estado de finalización.
- Periodo de evaluación.

Para obtener resultados comparables se utilizarán las horas correspondientes a tareas completadas y se aplicará la misma población de tareas al numerador y denominador.

Cuando las horas reales sean cero, el indicador se mostrará como no disponible.

## 6.5. Indicador de cumplimiento de metas

**Objetivo:** determinar el nivel de cumplimiento de los objetivos definidos.

**Fórmula:**

Cumplimiento de metas (%) = (Valor alcanzado / Valor objetivo) × 100.

**Datos requeridos:**

- Identificador de la meta.
- Trabajador asignado.
- Periodo.
- Valor objetivo.
- Valor alcanzado.
- Unidad de medida.

El indicador podrá superar el 100 % cuando el resultado alcanzado exceda el objetivo.

Para consolidar distintas metas se deberán utilizar reglas de agregación que consideren las unidades y características de cada objetivo.

## 6.6. Interpretación de productividad

Los tres indicadores se utilizarán como herramientas de seguimiento.

No se propone calcular automáticamente una puntuación única de productividad, ya que las tareas pueden diferir en complejidad, duración, calidad exigida y recursos disponibles.

Tampoco se utilizarán estos indicadores para aplicar automáticamente descuentos salariales.

Los análisis deberán realizarse dentro de periodos comparables y considerando las características de las actividades ejecutadas.

## 6.7. Persistencia de información

El ERP original almacena registros mediante `localStorage`, utilizando las claves:

- `erp_base_module:entities`
- `erp_base_module:documents`

Estas estructuras deberán conservarse o evolucionar mediante una estrategia de migración documentada.

Las entidades nuevas requerirán almacenamiento adicional, con mecanismos de validación y relaciones consistentes.

El uso de `localStorage` corresponde exclusivamente a una demostración frontend y no constituye una base de datos empresarial multiusuario.

## 6.8. Datos personales y seguridad

El módulo manejará información de carácter personal y laboral.

Para el MVP se utilizarán datos ficticios y remuneraciones simuladas.

Se deberá evitar incorporar información real sensible de trabajadores, como RUT, domicilios y remuneraciones reales, en datos de demostración o repositorios públicos.

Asimismo, deberá documentarse que `localStorage` no proporciona por sí mismo autenticación, control de acceso ni protección suficiente para el uso productivo de información salarial.

Una implementación futura deberá incorporar almacenamiento seguro, autorización por roles y mecanismos de auditoría.

## 6.9. Extensibilidad

El modelo permite incorporar posteriormente:

- Control de asistencia.
- Gestión de vacaciones.
- Permisos y ausencias.
- Contratos y anexos digitales.
- Sistemas de aprobación.
- Integración con nóminas y pagos.
- Integración previsional.
- Reportes históricos de productividad.
- Indicadores de calidad de tareas.
- Control de acceso por perfiles.
- Auditoría de modificaciones.

Estas funcionalidades se consideran ampliaciones futuras y no compromisos del MVP actual.

---

# 7. Diagrama Modelo Entidad-Relación (MER)

En esta sección se incorporará la imagen del Modelo Entidad-Relación desarrollada por el grupo.

**Archivo previsto:** `mer.png`.

La imagen deberá coincidir con las nueve entidades documentadas:

1. Departamento.
2. Trabajador.
3. Contrato.
4. Liquidación.
5. Detalle_Liquidacion.
6. Tarea.
7. Registro_Horas.
8. Meta.
9. Historial_Departamento.

También deberá reflejar las claves primarias, foráneas y cardinalidades establecidas en este documento.

---

# 8. Justificación general del modelo

El modelo propuesto busca mantener un equilibrio entre la compatibilidad técnica con el ERP original y las necesidades del módulo de Recursos Humanos, Planilla y Productividad.

Las estructuras Trabajador y Liquidación especializan los registros `Entity` y `Document`, preservando sus identificadores y atributos principales.

Las entidades Contrato y Detalle_Liquidacion permiten representar información laboral y el desglose económico de las liquidaciones.

Las entidades Tarea, Registro_Horas y Meta proporcionan la información requerida para analizar el cumplimiento de actividades, los tiempos de ejecución y los resultados alcanzados.

Departamento e Historial_Departamento permiten organizar a los trabajadores y mantener trazabilidad sobre sus cambios de asignación.

Las nueve entidades se relacionan mediante identificadores y claves foráneas, evitando almacenar innecesariamente la misma información en múltiples registros.

La propuesta responde tanto a las funcionalidades administrativas del módulo como a la problemática de productividad seleccionada por el grupo.

## Conclusión

Este modelo constituye la estructura lógica propuesta para el MVP de Recursos Humanos y Planilla de una PYME chilena.

Su implementación permitirá desarrollar funcionalidades de administración de trabajadores, remuneraciones simuladas y seguimiento de productividad.

La compatibilidad con el ERP base se mantendrá utilizando sus estructuras principales, mientras que las nuevas entidades se implementarán como extensiones documentadas.

El modelo también contempla la conservación de registros históricos, necesaria para que los cambios de departamento no alteren la información de periodos anteriores.

Las decisiones de implementación, el orden de desarrollo y las modificaciones técnicas necesarias deberán describirse posteriormente en `plan.md`.
message.txt
35 KB

<img width="2438" height="5506" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/c817bf1b-4579-4de8-b421-bb4ad174d21a" />


