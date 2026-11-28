export const HELP_TEXT = Object.freeze({
  'role-select': 'Administrador / Gerente de Cafetería: gestiona todo, incluidas las metas globales. Jefe de Turno: mide y consulta solo su área y turno. Barista / Trabajador: consulta solo sus evaluaciones. El cambio es demostrativo, no altera los datos ni solicita contraseña.',
  'role-area': 'Para el Jefe de Turno, elige un área de trabajo: Barra, Cocina o Salón. Solo verá las mediciones de esa área.',
  'role-turn': 'Para el Jefe de Turno, elige Mañana o Tarde. Solo podrá registrar y ver mediciones de ese turno.',
  'role-worker': 'Para el Barista, elige tu trabajador. Verás únicamente tus propias evaluaciones en modo lectura.',
  'dashboard': 'El panel resume personal, evaluaciones, áreas de trabajo y asignaciones vigentes. Las tarjetas y gráficos respetan el rol activo.',
  'quick-actions': 'Accesos directos a las tareas más frecuentes. Las acciones disponibles dependen del rol activo.',
  'action-load-demo': 'Carga personal y evaluaciones ficticios de la cafetería. Solo reemplaza los datos si están vacíos o si confirmas la recarga.',
  'view-entities': 'Trabajadores: alta, edición y consulta del personal. Los departamentos se muestran como áreas de trabajo; los cargos son Barista, Cajero, Mesero, Cocinero y Encargado.',
  'view-documents': 'Medición: registro y corrección de evaluaciones de desempeño con indicador, unidad, meta individual, resultado, turno y cuatro evaluaciones cualitativas.',
  'view-departments': 'Áreas de trabajo: Barra para bebidas y atención en barra, Cocina para preparación de alimentos y Salón para atención en mesas. Se obtienen de la asignación histórica, no de los cargos.',
  'view-assignments': 'Asignaciones de área: vinculan al personal con Barra, Cocina o Salón en un período. La asignación anterior se cierra automáticamente.',
  'view-history': 'Historial: consulta evaluaciones por trabajador, área histórica y turno. El Jefe de Turno ve solo su alcance; el Barista ve solo las suyas.',
  'view-evolution': 'Evolución: compara el mismo indicador y unidad en el tiempo. Solo se comparan mediciones equivalentes; no hay calificación automática.',
  'view-search': 'Búsqueda de personal por nombre, código o cargo. Los resultados se limitan según el rol activo.',
  'entity-form': 'Registra o edita personal usando siempre terminología de cafetería: Barra, Cocina y Salón como áreas de trabajo y los cinco cargos oficiales.',
  'document-form': 'Registra una evaluación de desempeño. Selecciona personal, período, indicador, resultado, meta y turno. La meta individual no es lo mismo que el total consolidado interno ni la meta global por área.',
  'department-form': 'Administra las áreas de trabajo de la cafetería: Barra, Cocina y Salón. No confundas áreas con los cinco cargos oficiales.',
  'assignment-form': 'Asocia personal a un área de trabajo. Al guardar, se cierra automáticamente la asignación vigente anterior.',
  'history-filters': 'Filtra el historial por trabajador. El Jefe de Turno ve solo su área y turno; el Barista ve solo sus evaluaciones.',
  'evolution-filters': 'Filtra la evolución por trabajador, indicador y unidad. Los datos mostrados respetan el rol activo.',
  'global-goal': 'Meta global de desempeño por área y período. Solo el Administrador / Gerente de Cafetería puede crearla o corregirla; es distinta de la meta individual y del total consolidado interno.',
  'search': 'Busca personal por nombre, código o cargo. Los resultados se limitan según el rol activo.',
  'fictitious-data': 'Uso académico: todos los datos son ficticios. No ingreses datos personales o laborales reales.',
  'metrics-help': 'Indicador y unidad describen qué se mide; la meta individual es el objetivo de la persona; el resultado es lo obtenido. Calidad, Responsabilidad, Cumplimiento y Colaboración usan escala 1-5. Observaciones y oportunidades de mejora son texto libre. Se comparan solo indicadores con la misma unidad y no existe una calificación automática.',
  'state-empty': 'Todavía no hay datos. Puedes registrar el primer trabajador o cargar datos de demostración ficticios.',
  'state-partial': 'Hay datos guardados, por lo que no se completó el conjunto simulado. Revisa lo existente o usa «Cargar datos de demostración» para reemplazarlo.',
  'state-unauthorized': 'Tu rol no permite esta acción. Cambia a un rol con permisos o consulta la vista de solo lectura.',
  'state-incomplete-context': 'Selecciona área de trabajo y turno para ver y registrar mediciones dentro de tu alcance.'
});

export function helpTextFor(key){
  return HELP_TEXT[key] || '';
}

export function applyHelpText(scope = document){
  const root = scope && typeof scope.querySelectorAll === 'function' ? scope : document;
  const nodes = root.querySelectorAll('[data-help]');
  nodes.forEach(node => {
    const key = node.getAttribute('data-help');
    const text = helpTextFor(key);
    if(!text) return;
    node.setAttribute('title', text);
    if(!node.getAttribute('aria-description')) node.setAttribute('aria-description', text);
    let hint = node.nextElementSibling;
    if(!hint || !hint.classList?.contains('help-text') || hint.getAttribute('data-help-for') !== key){
      hint = document.createElement('span');
      hint.className = 'help-text';
      hint.setAttribute('data-help-for', key);
      node.insertAdjacentElement('afterend', hint);
    }
    hint.textContent = text;
    hint.hidden = Boolean(node.hidden || node.closest?.('[hidden]'));
  });
}
