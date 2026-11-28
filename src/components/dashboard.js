import { getConfig, labelFor, isRRHHMode } from '../module-config.js';
import {
  loadEntities,
  entityDisplayName,
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
const PERIOD_OPTIONS = [3, 6, 12];

function formatDate(value){
  if(!value) return '—';
  const parts = String(value).split('-').map(Number);
  if(parts.length !== 3 || parts.some(number => !Number.isFinite(number))) return String(value);
  const [year, month, day] = parts;
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

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
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  chevronDown: ['m6 9 6 6 6-6']
};

let selectedDepartmentId = null;
let selectedPeriodCount = 6;

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

function renderPartialDataNotice(entities, departments, assignments, documents){
  const node = document.getElementById('partial-data-notice');
  if(!node) return;
  const hasAny = entities.length || departments.length || assignments.length || documents.length;
  const complete = entities.length === 6 && departments.length === 3 && assignments.length === 6 && documents.length === 12;
  const partial = isRRHHMode() && Boolean(hasAny) && !complete;
  node.hidden = !partial;
  if(partial){
    node.textContent = 'Hay datos guardados, por lo que no se completó el conjunto simulado. Puedes usar «Cargar datos de demostración» para reemplazarlos con datos ficticios.';
  }
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

function isEntityActive(entity){ return /^activo$/i.test(String(entity?.estadoLaboral ?? entity?.status ?? '').trim()); }
function activeWorkerCount(entities){ return entities.filter(isEntityActive).length; }


function currentAssignmentCount(assignments = loadDepartmentHistory()){
  const today = todayString();
  return assignments.filter(assignment =>
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
        worker: entity ? entityDisplayName(entity) : 'Personal no identificado',
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
  kpiSection.appendChild(element('h2', 'section-title', 'Indicadores principales'));
  const existingIcons = ['users', 'file'];
  statGrid.querySelectorAll('.stat-card').forEach((card, index) => {
    if(!card.querySelector('.stat-icon')) card.prepend(icon(existingIcons[index] || 'layers', 'stat-icon'));
  });
  statGrid.append(
    statCard('stat-active', 'stat-active-label', 'Personal activo', 'activity'),
    statCard('stat-departments', 'stat-departments-label', 'Áreas de trabajo', 'layers'),
    statCard('stat-assignments', 'stat-assignments-label', 'Asignaciones vigentes', 'calendar')
  );
  kpiSection.appendChild(statGrid);

  const topPanels = element('div', 'dashboard-panels dashboard-panels-main');
  topPanels.append(
    createChartPanel(),
    panel('dashboard-activity', 'Actividad reciente', 'Últimas 5 evaluaciones', 'file')
  );

  const bottomPanels = element('div', 'dashboard-panels dashboard-panels-secondary');
  bottomPanels.append(
    panel('dashboard-distribution', 'Distribución del personal', 'Por área y estado', 'layers'),
    panel('dashboard-actions-panel', 'Acciones rápidas', 'Accesos frecuentes', 'activity')
  );
  const actionPanel = bottomPanels.querySelectorAll('.panel')[1];
  if(actionPanel){
    actionPanel.querySelector('.panel-body').appendChild(actionGrid);
    actionsHeading.remove();
  }

  shell.append(kpiSection, topPanels, bottomPanels);
  view.appendChild(shell);
  view.dataset.dashboardLayout = 'ready';
  decorateActionButtons(actionGrid);
}

function ensureChartFilters(container){
  let filters = container.querySelector('.chart-filters');
  if(filters) return filters;
  filters = element('div', 'chart-filters');
  const deptWrap = element('label', 'chart-filter');
  deptWrap.appendChild(element('span','chart-filter-label','Área de trabajo'));
  const deptSelect = element('select','chart-select');
  deptSelect.id = 'dashboard-chart-department';
  deptWrap.appendChild(deptSelect);

  const periodWrap = element('label', 'chart-filter');
  periodWrap.appendChild(element('span','chart-filter-label','Período'));
  const periodSelect = element('select','chart-select');
  periodSelect.id = 'dashboard-chart-period';
  PERIOD_OPTIONS.forEach(n => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = `Últimos ${n} meses`; 
    if(n === selectedPeriodCount) opt.selected = true;
    periodSelect.appendChild(opt);
  });
  periodWrap.appendChild(periodSelect);

  deptSelect.addEventListener('change', (e) => {
    selectedDepartmentId = e.target.value || null;
    if(selectedDepartmentId) localStorage.setItem('erp_dashboard_department', selectedDepartmentId);
    else localStorage.removeItem('erp_dashboard_department');
    renderDashboard();
  });
  periodSelect.addEventListener('change', (e) => {
    const n = Number(e.target.value);
    selectedPeriodCount = PERIOD_OPTIONS.includes(n) ? n : 6;
    renderDashboard();
  });

  filters.append(deptWrap, periodWrap);
  container.prepend(filters);
  return filters;
}

function populateChartFilters(){
  const deptSelect = document.getElementById('dashboard-chart-department');
  if(deptSelect){
    const prev = selectedDepartmentId || '';
    deptSelect.innerHTML = '<option value="">Todas las áreas</option>'; 
    loadDepartments().slice().sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||'','es')).forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.id_departamento;
      opt.textContent = d.nombre;
      deptSelect.appendChild(opt);
    });
    if(prev && [...deptSelect.options].some(o => o.value === prev)) deptSelect.value = prev;
    else { selectedDepartmentId = null; deptSelect.value = ''; }
  }
  const periodSelect = document.getElementById('dashboard-chart-period');
  if(periodSelect) periodSelect.value = String(selectedPeriodCount);
}

function renderLineChart(months, resultSeries, metaSeries){
  const container = document.getElementById('dashboard-chart');
  if(!container) return;
  ensureChartFilters(container);
  populateChartFilters();
  container.querySelectorAll('svg.line-chart, .chart-legend, .empty, .chart-summary, .chart-tooltip').forEach(el => el.remove());

  const points = months.map((m, i) => ({ month: m, result: resultSeries[i], meta: metaSeries[i] }));
  const hasAny = points.some(p => Number.isFinite(p.result) || Number.isFinite(p.meta));
  const comparable = points.filter(p => Number.isFinite(p.result));
  const hasComparison = comparable.length >= 2;

  const allValues = points.flatMap(p => [p.result, p.meta]).filter(v => Number.isFinite(v));
  const maxValue = Math.max(1, ...allValues);
  const yMax = Math.ceil(maxValue * 1.15 * 10) / 10;
  const chartWidth = Math.max(320, container.clientWidth || 400);
  const chartHeight = 220;
  const margin = { top: 24, right: 20, bottom: 38, left: 44 };
  const width = chartWidth - margin.left - margin.right;
  const height = chartHeight - margin.top - margin.bottom;
  const xFor = i => margin.left + (points.length === 1 ? width / 2 : (i * width / (points.length - 1)));
  const yFor = v => margin.top + height - (v / yMax) * height;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${chartWidth} ${chartHeight}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', String(chartHeight));
  svg.setAttribute('class', 'line-chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Evolución del desempeño por período');

  for(let i = 0; i <= 4; i++){
    const y = margin.top + (i/4)*height;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', margin.left); line.setAttribute('x2', margin.left + width);
    line.setAttribute('y1', y); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(line);
    const lbl = document.createElementNS(SVG_NS, 'text');
    lbl.setAttribute('x', margin.left - 8); lbl.setAttribute('y', y + 4);
    lbl.setAttribute('text-anchor','end'); lbl.setAttribute('font-size','10'); lbl.setAttribute('fill','var(--muted)');
    lbl.textContent = formatResult((yMax * (4-i)) / 4);
    svg.appendChild(lbl);
  }

  const drawSeries = (key, color, dash) => {
    const valid = points.map((p,i)=>({ ...p, i })).filter(p => Number.isFinite(p[key]));
    if(valid.length === 0) return;
    if(valid.length >= 2){
      const pl = document.createElementNS(SVG_NS, 'polyline');
      pl.setAttribute('fill','none'); pl.setAttribute('stroke', color); pl.setAttribute('stroke-width','2.5');
      if(dash) pl.setAttribute('stroke-dasharray', dash);
      pl.setAttribute('points', valid.map(p => `${xFor(p.i)},${yFor(p[key])}`).join(' '));
      svg.appendChild(pl);
    }
    valid.forEach(p => {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', xFor(p.i)); c.setAttribute('cy', yFor(p[key]));
      c.setAttribute('r', '3.5'); c.setAttribute('fill', color);
      svg.appendChild(c);
    });
  };

  const hasMeta = points.some(p => Number.isFinite(p.meta));
  if(hasMeta) drawSeries('meta', '#9D9167', '6 4');
  drawSeries('result', '#84592B', '');

  points.forEach((p,i) => {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', xFor(i)); label.setAttribute('y', chartHeight - 10);
    label.setAttribute('text-anchor','middle'); label.setAttribute('font-size','11'); label.setAttribute('fill','var(--muted)');
    label.textContent = `${MONTHS[Number(p.month.slice(5))-1]} ${p.month.slice(2,4)}`;
    svg.appendChild(label);
  });

  if(!hasAny){
    const msg = document.createElementNS(SVG_NS,'text');
    msg.setAttribute('x', margin.left + width/2); msg.setAttribute('y', margin.top + height/2);
    msg.setAttribute('text-anchor','middle'); msg.setAttribute('font-size','12'); msg.setAttribute('fill','var(--muted)');
    msg.textContent = 'Sin evaluaciones registradas en el período seleccionado';
    svg.appendChild(msg);
  }

  container.appendChild(svg);
  if(!hasAny){ container.appendChild(element('p','empty chart-empty-state','Aún no hay evaluaciones para mostrar la evolución del desempeño.')); }
  const legend = element('div','chart-legend');
  legend.innerHTML = '<div class="legend-item"><span class="legend-color" style="background:#84592B"></span><span class="legend-label">Resultado</span></div><div class="legend-item"><span class="legend-color legend-color-meta"></span><span class="legend-label">Meta de desempeño</span></div>';
  container.appendChild(legend);

  const summary = element('div','chart-summary');
  if(!hasAny) summary.textContent = 'El gráfico se mostrará con datos reales cuando se registren evaluaciones en los períodos seleccionados.';
  else if(hasComparison){
    const first = comparable[0], last = comparable[comparable.length-1];
    const diff = Number(last.result) - Number(first.result);
    const trend = diff > 0 ? 'alza' : diff < 0 ? 'baja' : 'estable';
    summary.textContent = `Comparación: ${formatResult(first.result)} (${first.month}) → ${formatResult(last.result)} (${last.month}) → Tendencia ${trend}${diff !== 0 ? ` (${diff>0?'+':''}${formatResult(diff)})` : ''}.`;
  } else {
    summary.textContent = 'Hay datos disponibles, pero se necesitan evaluaciones en al menos dos períodos para comparar la evolución.';
  }
  container.appendChild(summary);
}

function renderDistribution(sourceEntities, sourceDepartments, sourceAssignments){
  const container = document.getElementById('dashboard-distribution');
  if(!container) return;
  container.replaceChildren();

  const entities = sourceEntities;
  const departments = sourceDepartments.slice().sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||'','es'));
  const assignments = sourceAssignments;
  const today = todayString();
  const activeAssignments = assignments.filter(a => a.fecha_inicio && a.fecha_inicio <= today && (!a.fecha_fin || a.fecha_fin >= today));

  const activeCount = entities.filter(isEntityActive).length;
  const inactiveCount = Math.max(0, entities.length - activeCount);

  if(entities.length === 0 && departments.length === 0){
    container.appendChild(element('p', 'empty activity-empty', 'No hay información de personal disponible para mostrar la distribución.')); 
    return;
  }

  const summary = element('div', 'distribution-summary');
  [
    ['Personal activo', String(activeCount)],
    ['Personal inactivo', String(inactiveCount)],
    ['Asignaciones vigentes', String(activeAssignments.length)]
  ].forEach(([label, value]) => {
    const card = element('div', 'distribution-mini');
    card.append(element('span','distribution-mini-value', value), element('span','distribution-mini-label', label));
    summary.appendChild(card);
  });
  container.appendChild(summary);

  const rows = departments.map(dep => {
    const depWorkers = entities.filter(e => (e.departamentoId || e.departmentId) === dep.id_departamento);
    const active = depWorkers.filter(isEntityActive).length;
    const inactive = Math.max(0, depWorkers.length - active);
    const current = activeAssignments.filter(a => a.id_departamento === dep.id_departamento).length;
    return { name: dep.nombre || 'área', workers: depWorkers.length, active, inactive, current };
  });
  const unassigned = entities.filter(e => !(e.departamentoId || e.departmentId));
  if(unassigned.length){ const active=unassigned.filter(isEntityActive).length; rows.push({ name:'Sin área asignada', workers:unassigned.length, active, inactive:unassigned.length-active, current:0 }); }
  if(rows.length === 0){ container.appendChild(element('p','empty activity-empty','No hay áreas de trabajo registradas.')); return; }
  const max = Math.max(1, ...rows.map(r => r.workers));
  const legendD = element('div','distribution-legend');
  legendD.innerHTML = '<span class="legend-item"><span class="legend-color" style="background:#84592B"></span><span class="legend-label">Activos</span></span><span class="legend-item"><span class="legend-color" style="background:#C7A97A"></span><span class="legend-label">Inactivos</span></span>';
  container.appendChild(legendD);
  const list = element('div', 'distribution-list');
  rows.forEach(row => {
    const item = element('div', 'distribution-row');
    const head = element('div', 'distribution-row-head');
    head.append(element('span','distribution-name', row.name), element('span','distribution-count', `${row.workers} trabajador${row.workers===1?'':'es'}`));
    const bar = element('div', 'distribution-bar distribution-bar-stacked');
    const a = element('span','distribution-fill distribution-fill-active'); a.style.width = `${(row.active/max)*100}%`;
    const i = element('span','distribution-fill distribution-fill-inactive'); i.style.width = `${(row.inactive/max)*100}%`;
    bar.append(a,i);
    const meta = element('div', 'distribution-meta');
    meta.textContent = `Activos: ${row.active} · Inactivos: ${row.inactive} · Asignaciones vigentes: ${row.current}`;
    item.append(head, bar, meta); list.appendChild(item);
  });
  container.appendChild(list);
}

function renderRecentActivity(records){
  const container = document.getElementById('dashboard-activity');
  if(!container) return;
  container.replaceChildren();

  if(records.length === 0){
    container.appendChild(element('p', 'empty activity-empty', 'No hay evaluaciones recientes registradas.'));
    return;
  }

  const wrap = element('div', 'table-wrap activity-table-wrap');
  const table = element('table', 'data-table activity-table');
  table.setAttribute('aria-label', 'Actividad reciente de evaluaciones');
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Trabajador</th><th>Fecha</th><th>Período</th><th>Resultado / indicador</th></tr>'; 
  const tbody = document.createElement('tbody');
  records.forEach(record => {
    const tr = document.createElement('tr');
    tr.className = 'activity-row';
    if(record.id){
      tr.dataset.documentId = record.id;
      tr.tabIndex = 0;
      tr.setAttribute('role', 'link');
      tr.setAttribute('aria-label', `Abrir evaluación de ${record.worker}`); 
    }
    const worker = document.createElement('td');
    const avatar = document.createElement('span'); avatar.className='activity-avatar'; avatar.textContent=initials(record.worker);
    const name = document.createElement('span'); name.className='activity-worker-name'; name.textContent=record.worker;
    const wcell = document.createElement('div'); wcell.className='activity-worker-cell'; wcell.append(avatar,name); worker.appendChild(wcell);
    const date = document.createElement('td'); date.textContent = formatDate(record.startDate);
    const period = document.createElement('td'); period.textContent = record.period || '—';
    const result = document.createElement('td');
    const rcell = document.createElement('div'); rcell.className='activity-result-cell';
    const strong = document.createElement('strong');
    strong.textContent = record.result !== undefined && record.result !== null && record.result !== ''
      ? (record.unit ? `${formatResult(record.result)} ${record.unit}` : formatResult(record.result))
      : '—';
    rcell.appendChild(strong);
    if(record.indicator){ const ind=document.createElement('span'); ind.className='activity-indicator'; ind.textContent=record.indicator; rcell.appendChild(ind); }
    result.appendChild(rcell);
    tr.append(worker, date, period, result);
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);
}

export function recordCounts(){
  return {
    entities: loadEntities().length,
    documents: loadDocuments().length
  };
}

export function renderDashboard(options = {}){
  const entities = Array.isArray(options.entities) ? options.entities : loadEntities();
  const documents = Array.isArray(options.documents) ? options.documents : loadDocuments();
  const departments = Array.isArray(options.departments) ? options.departments : loadDepartments();
  const assignments = Array.isArray(options.assignments) ? options.assignments : loadDepartmentHistory();
  const counts = { entities: entities.length, documents: documents.length };
  renderPartialDataNotice(entities, departments, assignments, documents);
  const view = document.getElementById('view-dashboard');
  ensureLayout(view);

  setText('stat-entities', String(counts.entities));
  setText('stat-documents', String(counts.documents));
  setText('stat-entities-label', labelFor('entities'));
  setText('stat-documents-label', labelFor('documents'));
  setText('stat-active', String(activeWorkerCount(entities)));
  setText('stat-active-label', isRRHHMode() ? 'Personal activo' : 'Evaluaciones registradas');
  setText('stat-departments', String(departments.length));
  setText('stat-departments-label', 'Áreas de trabajo');
  setText('stat-assignments', String(currentAssignmentCount(assignments)));
  setText('stat-assignments-label', 'Asignaciones de área vigentes');

  if(!selectedDepartmentId){
    const saved = localStorage.getItem('erp_dashboard_department');
    if(saved) selectedDepartmentId = saved;
  }
  calcularMetasConsolidadas();

  const months = monthKeys(selectedPeriodCount);
  const consolidations = loadMetasConsolidadas();
  const docs = documents.filter(d => isRRHHMode() ? d && (d.indicador || d.resultado !== undefined) : true);
  const monthMap = new Map(months.map(m => [m, { resultSum:0, resultCount:0, metaSum:0, metaCount:0 }]));
  docs.forEach(doc => {
    const period = recordPeriod(doc);
    if(!period || !monthMap.has(period)) return;
    if(selectedDepartmentId){
      const dept = getDepartmentForDocument(doc);
      if(!dept || dept.id_departamento !== selectedDepartmentId) return;
    }
    const r = Number(doc.resultado);
    const m = Number(doc.meta);
    const bucket = monthMap.get(period);
    if(Number.isFinite(r)) { bucket.resultSum += r; bucket.resultCount += 1; }
    if(Number.isFinite(m)) { bucket.metaSum += m; bucket.metaCount += 1; }
  });
  if(selectedDepartmentId){
    consolidations.forEach(c => {
      if(c.departamentoId !== selectedDepartmentId) return;
      const bucket = monthMap.get(c.periodo);
      if(!bucket) return;
      if(bucket.metaCount === 0 && Number.isFinite(Number(c.metaConsolidada))) { bucket.metaSum = Number(c.metaConsolidada); bucket.metaCount = 1; }
      if(bucket.resultCount === 0 && Number.isFinite(Number(c.resultadoConsolidado))) { bucket.resultSum = Number(c.resultadoConsolidado); bucket.resultCount = 1; }
    });
  }
  const resultSeries = months.map(m => { const b = monthMap.get(m); return b.resultCount ? b.resultSum / b.resultCount : null; });
  const metaSeries = months.map(m => { const b = monthMap.get(m); return b.metaCount ? b.metaSum / b.metaCount : null; });
  renderLineChart(months, resultSeries, metaSeries);
  renderRecentActivity(recentRecords(documents, entities));
  renderDistribution(entities, departments, assignments);
}
