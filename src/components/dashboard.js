import { getConfig, isRRHHMode } from '../module-config.js';
import {
  loadEntities,
  loadDocuments,
  loadDepartments,
  loadDepartmentHistory,
  getDocumentPeriod,
  currentPeriod
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

  const header = element('header', 'dashboard-header');
  const headerText = element('div', 'dashboard-header-text');
  headerText.append(heading, subtitle);
  header.append(headerText, element('span', 'dashboard-badge', 'ERP · Vista general'));

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
    panel('dashboard-chart', 'Registros por mes', 'Últimos seis meses', 'activity'),
    panel('dashboard-activity', 'Actividad reciente', 'Últimos 5 registros', 'file')
  );

  const actionSection = element('section', 'dashboard-section');
  actionSection.appendChild(actionsHeading);
  actionSection.appendChild(actionGrid);

  shell.append(header, kpiSection, panels, actionSection);
  view.appendChild(shell);
  view.dataset.dashboardLayout = 'ready';
  decorateActionButtons(actionGrid);
}

function renderChart(data){
  const container = document.getElementById('dashboard-chart');
  if(!container) return;
  container.replaceChildren();

  const max = Math.max(1, ...data.map(item => item.count));
  const summary = data.map(item => `${item.label}: ${item.count}`).join('; ');
  const chart = element('div', 'chart');
  chart.setAttribute('role', 'img');
  chart.setAttribute('aria-label', `Cantidad de registros por mes en los últimos seis meses. ${summary}.`);
  const bars = element('div', 'chart-bars');

  data.forEach(item => {
    const column = element('div', 'chart-column');
    column.title = `${item.label}: ${item.count} registro(s)`;
    const value = element('span', 'chart-value', String(item.count));
    const track = element('div', 'chart-track');
    const bar = element('div', 'chart-bar');
    bar.style.height = item.count === 0 ? '0%' : `${Math.max(8, Math.round((item.count / max) * 100))}%`;
    track.appendChild(bar);
    column.append(value, track, element('span', 'chart-label', item.shortLabel));
    bars.appendChild(column);
  });

  chart.appendChild(bars);
  container.append(chart, element('p', 'chart-legend', 'Cantidad de registros almacenados. No representa niveles de productividad.'));
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
    meta.append(
      element('span', 'activity-indicator', record.indicator || 'Sin indicador'),
      element('span', 'activity-result', resultText)
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

  const title = document.querySelector('#dashboard-chart')?.closest('.panel')?.querySelector('.panel-title');
  if(title) title.textContent = isRRHHMode() ? 'Registros de productividad por mes' : 'Registros por mes';

  const documents = loadDocuments();
  renderChart(monthlyCounts(documents));
  renderRecentActivity(recentRecords(documents, loadEntities()));
}
