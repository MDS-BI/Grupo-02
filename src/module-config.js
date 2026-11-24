// ============================================================================
// Configuración del Módulo — edita `userConfig` abajo para adaptar este módulo
// base a un módulo ERP específico (p. ej., Ventas). Ningún otro archivo necesita cambios.
// ============================================================================

// Establece en null para ejecutar con los valores predeterminados integrados,
// o proporciona un objeto como:
// {
//   moduleName: 'Ventas',
//   labels: { entity: 'Cliente', entities: 'Clientes', document: 'Pedido de Venta', documents: 'Pedidos de Venta' },
//   customFields: [
//     { target: 'entity', key: 'zona', label: 'Zona', type: 'select', options: ['Norte', 'Sur'] },
//     { target: 'document', key: 'metodoEnvio', label: 'Método de envío', type: 'select', options: ['estándar', 'exprés'] }
//   ],
//   statusLifecycle: {
//     statuses: ['cotización', 'pedido', 'facturado'],
//     transitions: { cotización: ['pedido'], pedido: ['facturado'], facturado: [] }
//   },
//   theme: { accentColor: '#84592B' }
// }
export const userConfig = null;

// Configuración del incremento 002. Se mantiene separada de `userConfig` para
// conservar el comportamiento del módulo base cuando se ejecutan sus pruebas o
// se arranca la aplicación sin una configuración explícita.
export const RRHH_CONFIG = Object.freeze({
  moduleName: 'Cafetería Gestión de personal y evaluaciones',
  labels: Object.freeze({
    entity: 'Trabajador',
    entities: 'Trabajadores',
    document: 'Registro de Productividad',
    documents: 'Registros de Productividad'
  }),
  customFields: Object.freeze([
    { target: 'entity', key: 'cargo', label: 'Cargo', type: 'text', required: true },
    { target: 'entity', key: 'fechaIngreso', label: 'Fecha de ingreso', type: 'date', required: true },
    { target: 'entity', key: 'estadoLaboral', label: 'Estado laboral', type: 'select', required: true, options: Object.freeze(['Activo', 'Inactivo']) },
    { target: 'entity', key: 'departamentoId', label: 'Área de trabajo', type: 'text', required: false, optionsSource: 'departments' },
    { target: 'document', key: 'indicador', label: 'Indicador de desempeño', type: 'text', required: true },
    { target: 'document', key: 'resultado', label: 'Resultado obtenido', type: 'number', required: true },
    { target: 'document', key: 'unidad', label: 'Unidad', type: 'text', required: true },
    { target: 'document', key: 'asignacionId', label: 'Asignación de área', type: 'text', required: true, optionsSource: 'assignments' },
    { target: 'document', key: 'turno', label: 'Turno', type: 'select', required: true, options: Object.freeze(['Mañana', 'Tarde']) },
    { target: 'document', key: 'meta', label: 'Meta esperada', type: 'number', required: true },
    { target: 'document', key: 'evaluacionCalidad', label: 'Calidad (1-5)', type: 'number', required: true },
    { target: 'document', key: 'evaluacionResponsabilidad', label: 'Responsabilidad (1-5)', type: 'number', required: true },
    { target: 'document', key: 'evaluacionCumplimiento', label: 'Cumplimiento de procedimientos (1-5)', type: 'number', required: true },
    { target: 'document', key: 'evaluacionColaboracion', label: 'Colaboración (1-5)', type: 'number', required: true },
    { target: 'document', key: 'observaciones', label: 'Observaciones', type: 'text', required: false },
    { target: 'document', key: 'oportunidadesMejora', label: 'Oportunidades de mejora', type: 'text', required: false }
  ]),
  statusLifecycle: null,
  theme: Object.freeze({ accentColor: '#84592B' })
});

// Indicadores de productividad sugeridos por cargo, para el contexto de cafetería.
// Cuando se selecciona un trabajador, el sistema propone automáticamente los
// indicadores que corresponden a su cargo, evitando que el usuario elija
// indicadores no relevantes. Cada indicador incluye su unidad de medida.
export const INDICADORES_POR_CARGO = Object.freeze({
  Barista: Object.freeze([
    { value: 'Calidad de café', label: 'Calidad de café', unidad: 'puntos' },
    { value: 'Velocidad de preparación', label: 'Velocidad de preparación', unidad: 'segundos' },
    { value: 'Limpieza de estación', label: 'Limpieza de estación', unidad: 'puntos' },
    { value: 'Conocimiento de menú', label: 'Conocimiento de menú', unidad: 'puntos' }
  ]),
  Cajero: Object.freeze([
    { value: 'Precisión de cobro', label: 'Precisión de cobro', unidad: 'puntos' },
    { value: 'Atención al cliente', label: 'Atención al cliente', unidad: 'puntos' },
    { value: 'Manejo de efectivo', label: 'Manejo de efectivo', unidad: 'puntos' },
    { value: 'Cierre de caja', label: 'Cierre de caja', unidad: 'puntos' }
  ]),
  Mesero: Object.freeze([
    { value: 'Atención a mesas', label: 'Atención a mesas', unidad: 'puntos' },
    { value: 'Conocimiento de menú', label: 'Conocimiento de menú', unidad: 'puntos' },
    { value: 'Tiempo de respuesta', label: 'Tiempo de respuesta', unidad: 'minutos' },
    { value: 'Propinas promedio', label: 'Propinas promedio', unidad: 'moneda' }
  ]),
  Cocinero: Object.freeze([
    { value: 'Preparación de platos', label: 'Preparación de platos', unidad: 'puntos' },
    { value: 'Higiene en cocina', label: 'Higiene en cocina', unidad: 'puntos' },
    { value: 'Tiempos de entrega', label: 'Tiempos de entrega', unidad: 'minutos' },
    { value: 'Control de inventario', label: 'Control de inventario', unidad: 'puntos' }
  ]),
  Encargado: Object.freeze([
    { value: 'Supervisión de turno', label: 'Supervisión de turno', unidad: 'puntos' },
    { value: 'Gestión de inventario', label: 'Gestión de inventario', unidad: 'puntos' },
    { value: 'Atención a clientes', label: 'Atención a clientes', unidad: 'puntos' },
    { value: 'Cierre de operaciones', label: 'Cierre de operaciones', unidad: 'puntos' }
  ])
});

// Devuelve los indicadores sugeridos para un cargo dado, o un arreglo vacío
// si no hay configuración para ese cargo.
export function indicadoresParaCargo(cargo){
  return INDICADORES_POR_CARGO[cargo] || [];
}

// ---------------------------------------------------------------------------
// Cargador central — no deberías necesitar modificar nada debajo de esta línea.
// ---------------------------------------------------------------------------

export const DEFAULT_CONFIG = Object.freeze({
  moduleName: 'Cafetería Gestión de personal y evaluaciones',
  labels: Object.freeze({
    entity: 'Entidad',
    entities: 'Entidades',
    document: 'Documento',
    documents: 'Documentos'
  }),
  customFields: Object.freeze([]),
  statusLifecycle: null,
  theme: Object.freeze({ accentColor: '#84592B' })
});

export const FIELD_TYPES = ['text', 'number', 'date', 'select'];

export const BASE_FIELDS = Object.freeze({
  entity: Object.freeze(['id', 'entity_id', 'name', 'surname', 'code', 'taxId', 'email', 'phone', 'address', 'category', 'description', 'targetDate', 'creditLimit', 'paymentTerms', 'createdAt', 'updatedAt']),
  document: Object.freeze(['id', 'entity_id', 'series', 'folio', 'startDate', 'endDate', 'quantity', 'subtotal', 'discount', 'taxAmount', 'totalAmount', 'currency', 'paymentTerms', 'notes', 'status', 'createdAt', 'updatedAt'])
});

function isNonEmptyString(v){ return typeof v === 'string' && v.trim().length > 0; }

function validateCustomFields(raw, errors){
  const seen = { entity: new Set(), document: new Set() };
  if(!Array.isArray(raw)) { errors.push('customFields debe ser un arreglo'); return []; }
  const clean = [];
  raw.forEach((f, i) => {
    const where = `customFields[${i}]`;
    if(!f || typeof f !== 'object'){ errors.push(`${where} debe ser un objeto`); return; }
    if(f.target !== 'entity' && f.target !== 'document'){ errors.push(`${where}.target debe ser "entity" o "document"`); return; }
    if(!isNonEmptyString(f.key)){ errors.push(`${where}.key debe ser una cadena no vacía`); return; }
    if(BASE_FIELDS[f.target].includes(f.key)){ errors.push(`${where}.key "${f.key}" choca con un campo base de ${f.target}`); return; }
    if(seen[f.target].has(f.key)){ errors.push(`${where}.key "${f.key}" está declarada más de una vez`); return; }
    if(!FIELD_TYPES.includes(f.type)){ errors.push(`${where}.type debe ser uno de: ${FIELD_TYPES.join(', ')}`); return; }
    if(f.type === 'select' && !(Array.isArray(f.options) && f.options.length > 0)){ errors.push(`${where}.options debe ser un arreglo no vacío para campos de selección`); return; }
    seen[f.target].add(f.key);
    clean.push({
      target: f.target,
      key: f.key,
      label: isNonEmptyString(f.label) ? f.label : f.key,
      type: f.type,
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? [...f.options] : undefined,
      optionsSource: isNonEmptyString(f.optionsSource) ? f.optionsSource : undefined
    });
  });
  return clean;
}

function validateLifecycle(raw, errors){
  if(raw === null || raw === undefined) return null;
  if(typeof raw !== 'object' || !Array.isArray(raw.statuses) || raw.statuses.length === 0 || !raw.statuses.every(isNonEmptyString)){
    errors.push('statusLifecycle.statuses debe ser un arreglo no vacío de nombres de estado');
    return null;
  }
  const statuses = new Set(raw.statuses);
  const transitions = {};
  if(raw.transitions !== undefined && (typeof raw.transitions !== 'object' || raw.transitions === null)){
    errors.push('statusLifecycle.transitions debe ser un objeto que mapee estado -> arreglo de estados siguientes');
    return null;
  }
  const source = raw.transitions || {};
  for(const [from, toList] of Object.entries(source)){
    if(!statuses.has(from)){ errors.push(`statusLifecycle.transitions referencia el estado desconocido "${from}"`); return null; }
    if(!Array.isArray(toList) || !toList.every((s) => statuses.has(s))){ errors.push(`statusLifecycle.transitions["${from}"] debe listar estados conocidos`); return null; }
    transitions[from] = [...toList];
  }
  return { statuses: [...raw.statuses], transitions };
}

function validateTheme(raw, errors){
  if(raw === null || raw === undefined) return structuredClone(DEFAULT_CONFIG.theme);
  if(typeof raw !== 'object'){
    errors.push('theme debe ser un objeto');
    return structuredClone(DEFAULT_CONFIG.theme);
  }
  const out = { accentColor: DEFAULT_CONFIG.theme.accentColor };
  if(raw.accentColor !== undefined && raw.accentColor !== null){
    const value = String(raw.accentColor).trim();
    if(!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)){
      errors.push('theme.accentColor debe ser un color hexadecimal como #rrggbb');
    } else {
      out.accentColor = value;
    }
  }
  return out;
}

export function normalizeConfig(raw){
  if(raw === null || raw === undefined){
    return { config: structuredClone(DEFAULT_CONFIG), errors: [] };
  }
  if(typeof raw !== 'object'){
    return { config: structuredClone(DEFAULT_CONFIG), errors: ['La configuración del módulo debe ser un objeto'] };
  }
  const errors = [];
  const cfg = structuredClone(DEFAULT_CONFIG);
  if(raw.moduleName !== undefined){
    if(!isNonEmptyString(raw.moduleName)) errors.push('moduleName debe ser una cadena no vacía');
    else cfg.moduleName = raw.moduleName.trim();
  }
  if(raw.labels !== undefined){
    if(typeof raw.labels !== 'object' || raw.labels === null) errors.push('labels debe ser un objeto');
    else {
      for(const key of ['entity', 'entities', 'document', 'documents']){
        if(raw.labels[key] === undefined) continue;
        if(!isNonEmptyString(raw.labels[key])){ errors.push(`labels.${key} debe ser una cadena no vacía`); continue; }
        cfg.labels[key] = raw.labels[key].trim();
      }
    }
  }
  if(raw.customFields !== undefined && raw.customFields !== null){
    cfg.customFields = validateCustomFields(raw.customFields, errors);
  }
  if(raw.statusLifecycle !== undefined){
    const lc = validateLifecycle(raw.statusLifecycle, errors);
    if(lc) cfg.statusLifecycle = lc;
  }
  if(raw.theme !== undefined){
    cfg.theme = validateTheme(raw.theme, errors);
  }
  return { config: cfg, errors };
}

let activeConfig = structuredClone(DEFAULT_CONFIG);

export function setActiveConfig(config){
  activeConfig = normalizeConfig(config).config;
}

export function getConfig(){
  return activeConfig;
}

export function isRRHHMode(){
  return activeConfig.labels.entity === 'Trabajador'
    && activeConfig.customFields.some(f => f.target === 'entity' && f.key === 'fechaIngreso');
}

const DISPLAY_LABELS = Object.freeze({
  'Trabajador': 'Personal',
  'Trabajadores': 'Personal',
  'Entidad': 'Personal',
  'Entidades': 'Personal',
  'Registro de Productividad': 'Evaluación de desempeño',
  'Registros de Productividad': 'Evaluaciones de desempeño',
  'Documento': 'Evaluación',
  'Documentos': 'Evaluaciones'
});

export function labelFor(kind){
  const label = activeConfig.labels[kind] || DEFAULT_CONFIG.labels[kind];
  return DISPLAY_LABELS[label] || label;
}

export async function loadModuleConfig(){
  const { config, errors } = normalizeConfig(userConfig);
  return { config, errors };
}
