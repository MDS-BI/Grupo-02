import { getConfig, isRRHHMode } from '../module-config.js';
import {
  loadEntities,
  loadDocuments,
  loadDepartments,
  loadDepartmentHistory,
  getDocumentPeriod,
  currentPeriod,
  calcularMetasConsolidadas,
  loadMetasConsolidadas
} from '../storage.js';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75'
  ],
  activity: ['M3 12h4l3-8 4 16 3-8h4'],
  layers: ['M12 2 2 7l10 5 10-5-10-5Z', 'm2 17 10 5 10-5', 'm2 12 10 5 10-5'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'],
  file: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6', 'M8 13h8', 'M8 17h5'],
  userPlus: ['M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M19 8v6', 'M22 11h-6'],
  filePlus: ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z', 'M14 2v6h6', 'M12 12v5', 'M9.5 14.5h5'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.35-4.35'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6']
};

let selectedDepartmentId = null;

function element(tag, className, text){
  const node = document.createElement(tag);
  if(className) node.className = className;
  if(text !== undefined) node.textContent = text;
  return node;
}

function icon(name, className){
  const wrapper = element('span', className);
  wrapper.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('focusable', 'false');
  for(const d of ICONS[name] || []){
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.appendChild(path);
  }
  wrapper.appendChild(svg);
  return wrapper;
}

function setText(id, value){
  const node = document.getElementById(id);
  if(node) node.textContent = value;
}

function monthKeys(count = 6){
  const [year, month] = currentPeriod().split('-').map(Number);
  const keys = [];
  for(let offset = count - 1; offset >= 0; offset--){
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    keys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function recordPeriod(document_){
  const fromDates = getDocumentPeriod(document_);
  if(fromDates) return fromDates;
  const period = document_ && document_.period;
  return typeof period === 'string' && /^\d{4}-\d{2}$/.test(period) ? period : null;
}

function monthlyCounts(documents){
  const keys = monthKeys();
  const totals = new Map(keys.map(key => [key, 0]));
  documents.forEach(document_ => {
    const period = recordPeriod(document_);
    if(period && totals.has(period)) totals.set(period, totals.get(period) + 1);
  });
  return keys.map(key => {
    const monthIndex = Number(key.slice(5)) - 1;
    return {
      key,
      shortLabel: MONTHS[monthIndex],
      label: `${MONTHS[monthIndex]} ${key.slice(0, 4)}`,
      count: totals.get(key)
    };
  });
}

function todayString(){
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function activeWorkerCount(entities){
  const statusField = getConfig().customFields.find(field =>
    field.target === 'entity' && field.key === 'estadoLaboral'
  );
  if(!statusField) return entities.length;
  const activeOption = (statusField.options || []).find(option => /^activo$/i.test(String(option).trim()));
  const activeValue = activeOption || 'Activo';
  return entities.filter(entity => String(entity[statusField.key] ?? '').trim() === activeValue).length;
}

function currentAssignmentCount(){
  const today = todayString();
  return loadDepartmentHistory().filter(assignment =>
    Boolean(assignment.fecha_inicio)
    && assignment.fecha_inicio <= today
    && (!assignment.fecha_fin || assignment.fecha_fin >= today)
  ).length;
}

function initials(name){
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if(words.length === 0) return '—';
  return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

function formatResult(value){
  if(value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if(!Number.isFinite(number)) return String(value);
  return new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(number);
}

function recentRecords(documents, entities, limit = 5){
  return documents
    .map((document_, index) => {
      const timestamp = Date.parse(document_.createdAt || document_.updatedAt || '');
      const entity = entities.find(item =>
        item.entity_id === document_.entity_id || item.id === document_.entity_id
      );
      return {
        worker: entity ? entity.name : 'Trabajador desconocido',
        indicator: document_.indicador || '',
        result: document_.resultado,
        unit: document_.unidad || '',
        turno: document_.turno || '',
        meta: document_.meta !== undefined && document_.meta !== null ? document_.meta : null,
        period: recordPeriod(document_) || '',
        time: Number.isFinite(timestamp) ? timestamp : 0,
        startDate: String(document_.startDate || ''),
        index
      };
    })
    .sort((a, b) =>
      (b.time - a.time)
      || b.startDate.localeCompare(a.startDate)
      || (b.index - a.index)
    )
    .slice(0, limit);
}

function statCard(valueId, labelId, label, iconName){
  const card = element('article', 'stat-card');
  card.appendChild(icon(iconName, 'stat-icon'));
  const value = element('span', 'stat-value', '0');
  value.id = valueId;
  const caption = element('span', 'stat-label', label);
  caption.id = labelId;
  card.append(value, caption);
  return card;
}

function panel(bodyId, title, meta, iconName){
  const section = element('section', 'panel');
  const head = element('div', 'panel-head');
  const titleWrap = element('div', 'panel-title-wrap');
  titleWrap.append(icon(iconName, 'panel-icon'), element('h2', 'panel-title', title));
  head.append(titleWrap, element('span', 'panel-meta', meta));
  const body = element('div', 'panel-body');
  body.id = bodyId;
  section.append(head, body);
  return section;
}

function createChartPanel(){
  const section = element('section', 'panel');
  const head = element('div', 'panel-head');
  const titleWrap = element('div', 'panel-title-wrap');
  titleWrap.append(icon('activity', 'panel-icon'));

  const titleContainer = element('div', 'chart-title-container');
  const title = element('h2', 'panel-title chart-title', 'Seleccione departamento');
  titleContainer.appendChild(title);
  titleContainer.style.cursor = 'pointer';
  titleContainer.title = 'Seleccione un departamento para visualizar sus metas y resultados';
  titleWrap.appendChild(titleContainer);

  const body = element('div', 'panel-body');
  body.id = 'dashboard-chart';
  section.append(head, body);
  return section;
}

function decorateActionButtons(actionGrid){
  if(!actionGrid) return;
  const iconNames = {
    'action-new-entity': 'userPlus',
    'action-new-document': 'filePlus',
    'action-open-entities': 'users',
    'action-find': 'search'
  };
  Object.entries(iconNames).forEach(([id, name]) => {
    const button = document.getElementById(id);
    if(!button || button.querySelector('.action-icon')) return;
    button.prepend(icon(name, 'action-icon'));
    const arrow = icon('arrow', 'action-arrow');
    arrow.setAttribute('aria-hidden', 'true');
    button.appendChild(arrow);
  });
}

function ensureLayout(view){
  if(!view || view.dataset.dashboardLayout === 'ready') return;
  const heading = document.getElementById('dashboard-heading');
  const subtitle = document.getElementById('dashboard-subtitle');
  const statGrid = view.querySelector('.stat-grid');
  const actionsHeading = document.getElementById('quick-actions-heading');
  const actionGrid = view.querySelector('.action-grid');
  if(!heading || !subtitle || !statGrid || !actionsHeading || !actionGrid) return;

  const shell = element('div', 'dashboard-shell');

  const kpiSection = element('section', 'dashboard-section');
  kpiSection.appendChild(element('h2', 'section-title', 'Indicadores clave'));
  const existingIcons = ['users', 'file'];
  statGrid.querySelectorAll('.stat-card').forEach((card, index) => {
    if(!card.querySelector('.stat-icon')) card.prepend(icon(existingIcons[index] || 'layers', 'stat-icon'));
  });
  statGrid.append(
    statCard('stat-active', 'stat-active-label', 'Trabajadores activos', 'activity'),
    statCard('stat-departments', 'stat-departments-label', 'Departamentos', 'layers'),
    statCard('stat-assignments', 'stat-assignments-label', 'Asignaciones vigentes', 'calendar')
  );
  kpiSection.appendChild(statGrid);

  const panels = element('div', 'dashboard-panels');
  panels.append(
    createChartPanel(),
    panel('dashboard-activity', 'Actividad reciente', 'Últimos 5 registros', 'file')
  );

  const actionSection = element('section', 'dashboard-section');
  actionSection.appendChild(actionsHeading);
  actionSection.appendChild(actionGrid);

  shell.append(kpiSection, panels, actionSection);
  view.appendChild(shell);
  view.dataset.dashboardLayout = 'ready';
  decorateActionButtons(actionGrid);
}

function renderLineChart(months, metaSeries, resultSeries, departmentName){
  const container = document.getElementById('dashboard-chart');
  if(!container) return;
  container.replaceChildren();

  const titleContainer = element('div', 'chart-title-container');
  const title = element('h2', 'panel-title chart-title', departmentName || 'Seleccione departamento');
  titleContainer.appendChild(title);
  titleContainer.style.cursor = departmentName ? 'pointer' : 'default';
  titleContainer.title = departmentName
    ? 'Haga clic para cambiar de departamento'
    : 'Seleccione un departamento para visualizar sus metas y resultados';
  container.appendChild(titleContainer);

  const allValues = [...metaSeries, ...resultSeries].filter(v => v !== null && v !== undefined);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
  const yMax = Math.max(maxValue, 1);

  const chartWidth = container.clientWidth || 400;
  const chartHeight = 180;
  const margin = { top: 30, right: 40, bottom: 40, left: 50 };
  const width = chartWidth - margin.left - margin.right;
  const height = chartHeight - margin.top - margin.bottom;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', chartWidth);
  svg.setAttribute('height', chartHeight);
  svg.setAttribute('class', 'line-chart');

  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('transform', `translate(${margin.left},${margin.top})`);

  // Ejes
  const xStep = width / (months.length - 1);
  const monthsShort = months.map(m => m.slice(5, 7));

  // Línea de meta esperada
  const metaLine = document.createElementNS(SVG_NS, 'polyline');
  const metaPoints = months.map((m, i) => {
    const x = i * xStep;
    const y = height - (metaSeries[i] || 0) / yMax * height;
    return `${x},${y}`;
  }).join(' ');
  metaLine.setAttribute('points', metaPoints);
  metaLine.setAttribute('fill', 'none');
  metaLine.setAttribute('stroke', '#0f766e');
  metaLine.setAttribute('stroke-width', '2.5');
  group.appendChild(metaLine);

  // Línea de resultado
  const resultLine = document.createElementNS(SVG_NS, 'polyline');
  const resultPoints = months.map((m, i) => {
    const x = i * xStep;
    const y = height - (resultSeries[i] || 0) / yMax * height;
    return `${x},${y}`;
  }).join(' ');
  resultLine.setAttribute('points', resultPoints);
  resultLine.setAttribute('fill', 'none');
  resultLine.setAttribute('stroke', '#2563eb');
  resultLine.setAttribute('stroke-width', '2.5');
  group.appendChild(resultLine);

  // Marcadores y etiquetas para meta
  months.forEach((m, i) => {
    const x = i * xStep;
    const y = height - (metaSeries[i] || 0) / yMax * height;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#0f766e');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', 'chart-point');
    circle.setAttribute('data-month', m);
    circle.setAttribute('data-series', 'meta');
    circle.setAttribute('data-value', metaSeries[i] || 0);
    group.appendChild(circle);
  });

  // Marcadores y etiquetas para resultado
  months.forEach((m, i) => {
    const x = i * xStep;
    const y = height - (resultSeries[i] || 0) / yMax * height;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#2563eb');
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', 'chart-point');
    circle.setAttribute('data-month', m);
    circle.setAttribute('data-series', 'resultado');
    circle.setAttribute('data-value', resultSeries[i] || 0);
    group.appendChild(circle);
  });

  // Etiquetas del eje X
  months.forEach((m, i) => {
    const x = i * xStep;
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', height + 25);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '11');
    label.setAttribute('fill', '#64748b');
    label.textContent = monthsShort[i] || '';
    group.appendChild(label);
  });

  // Etiquetas del eje Y
  for(let i = 0; i <= 5; i++){
    const value = Math.round((yMax * i) / 5);
    const y = height - (i / 5) * height;
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', -10);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-size', '10');
    label.setAttribute('fill', '#64748b');
    label.textContent = value;
    group.appendChild(label);
  }

  svg.appendChild(group);
  container.appendChild(svg);

  // Leyenda
  const legend = element('div', 'chart-legend');
  const metaItem = element('div', 'legend-item');
  metaItem.innerHTML = `<span class="legend-color" style="background:#0f766e"></span><span class="legend-label">Meta esperada</span>`;
  const resultItem = element('div', 'legend-item');
  resultItem.innerHTML = `<span class="legend-color" style="background:#2563eb"></span><span class="legend-label">Resultado</span>`;
  legend.appendChild(metaItem);
  legend.appendChild(resultItem);
  container.appendChild(legend);

  // Mensaje si no hay departamento seleccionado
  if(!departmentName){
    const emptyMsg = element('p', 'empty', 'Seleccione un departamento para visualizar sus metas y resultados.');
    container.appendChild(emptyMsg);
  }
}

function setupChartTitleInteractivity(){
  const container = document.getElementById('dashboard-chart');
  if(!container) return;
  const titleContainer = container.querySelector('.chart-title-container');
  if(!titleContainer) return;

  titleContainer.addEventListener('click', ()=>{
    const departments = loadDepartments();
    if(departments.length === 0) return;

    // Remover selector existente si lo hay
    const existing = container.querySelector('.department-selector');
    if(existing){
      existing.remove();
      return;
    }

    const selectorWrap = element('div', 'department-selector');
    const label = element('label', '', 'Departamento:');
    const select = element('select', 'department-select');
    select.innerHTML = '<option value="">-- Seleccione un departamento --</option>';
    departments.forEach(d=>{
      const opt = document.createElement('option');
      opt.value = d.id_departamento;
      opt.textContent = d.nombre;
      if(d.id_departamento === selectedDepartmentId) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e)=>{
      selectedDepartmentId = e.target.value || null;
      if(selectedDepartmentId){
        localStorage.setItem('erp_dashboard_department', selectedDepartmentId);
      } else {
        localStorage.removeItem('erp_dashboard_department');
      }
      selectorWrap.remove();
      renderDashboard();
    });

    selectorWrap.appendChild(label);
    selectorWrap.appendChild(select);
    container.appendChild(selectorWrap);
  });
}

function renderRecentActivity(records){
  const container = document.getElementById('dashboard-activity');
  if(!container) return;
  container.replaceChildren();

  if(records.length === 0){
    container.appendChild(element('p', 'empty', 'Aún no hay registros de productividad recientes.'));
    return;
  }

  const list = element('ul', 'activity-list');
  records.forEach(record => {
    const item = element('li', 'activity-item');
    const body = element('div', 'activity-body');
    const top = element('div', 'activity-top');
    top.append(
      element('strong', 'activity-worker', record.worker),
      element('span', 'activity-period', record.period || '—')
    );
    const meta = element('div', 'activity-meta');
    const resultText = record.unit
      ? `${formatResult(record.result)} ${record.unit}`
      : formatResult(record.result);
    const turnoText = record.turno ? ` | Turno: ${record.turno}` : '';
    const metaText = record.meta !== null ? ` | Meta: ${formatResult(record.meta)}` : '';
    meta.append(
      element('span', 'activity-indicator', record.indicator || 'Sin indicador'),
      element('span', 'activity-result', resultText + turnoText + metaText)
    );
    body.append(top, meta);
    item.append(element('span', 'activity-avatar', initials(record.worker)), body);
    list.appendChild(item);
  });
  container.appendChild(list);
}

export function recordCounts(){
  return {
    entities: loadEntities().length,
    documents: loadDocuments().length
  };
}

export function renderDashboard(){
  const counts = recordCounts();
  const config = getConfig();
  const labels = config.labels;
  const view = document.getElementById('view-dashboard');
  ensureLayout(view);

  setText('stat-entities', String(counts.entities));
  setText('stat-documents', String(counts.documents));
  setText('stat-entities-label', labels.entities);
  setText('stat-documents-label', labels.documents);
  setText('stat-active', String(activeWorkerCount(loadEntities())));
  setText('stat-active-label', isRRHHMode() ? 'Trabajadores activos' : 'Registros activos');
  setText('stat-departments', String(loadDepartments().length));
  setText('stat-departments-label', 'Departamentos');
  setText('stat-assignments', String(currentAssignmentCount()));
  setText('stat-assignments-label', 'Asignaciones vigentes');

  // Recargar selección del departamento guardada
  if(!selectedDepartmentId){
    const saved = localStorage.getItem('erp_dashboard_department');
    if(saved){
      selectedDepartmentId = saved;
    }
  }

  // Asegurar que las metas consolidadas estén actualizadas
  calcularMetasConsolidadas();

  const months = monthKeys();
  const consolidations = loadMetasConsolidadas();

  let metaSeries = months.map(() => 0);
  let resultSeries = months.map(() => 0);
  let departmentName = null;

  if(selectedDepartmentId){
    const department = loadDepartments().find(d => d.id_departamento === selectedDepartmentId);
    if(department){
      departmentName = department.nombre;
      consolidations.forEach(c=>{
        if(c.departamentoId === selectedDepartmentId){
          const monthIndex = months.findIndex(m => m === c.periodo);
          if(monthIndex >= 0){
            metaSeries[monthIndex] = c.metaConsolidada || 0;
            resultSeries[monthIndex] = c.resultadoConsolidado || 0;
          }
        }
      });
    } else {
      selectedDepartmentId = null;
      localStorage.removeItem('erp_dashboard_department');
    }
  }

  renderLineChart(months, metaSeries, resultSeries, departmentName);
  setupChartTitleInteractivity();
  renderRecentActivity(recentRecords(loadDocuments(), loadEntities()));
}
