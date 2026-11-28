import { labelFor } from '../module-config.js';
import { allowedModules } from '../roles.js';

export function monogramFor(name){
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 0 ? words.map(w => w[0]).slice(0, 2).join('') : 'E';
  return letters.toUpperCase();
}

export function renderLogo(container){
  if(!container) return;
  container.innerHTML = '<img class="cafe-logo" src="cafeteria-logo.svg" width="36" height="36" alt="" />';
}

export function setupSidebarToggle(button){
  if(!button) return;
  const workspace = button.closest('.workspace');
  if(!workspace) return;
  button.setAttribute('aria-controls', 'side-nav');
  button.setAttribute('aria-expanded', 'true');
  button.setAttribute('aria-label', 'Contraer menú');
  button.onclick = () => {
    const collapsed = workspace.classList.toggle('is-collapsed');
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Contraer menú');
  };
}

export function applyShellLabels(){
  const labels = {
    'nav-dashboard-label': 'Panel',
    'nav-entities-label': labelFor('entities'),
    'nav-documents-label': labelFor('documents'),
    'nav-search-label': 'Búsqueda'
  };
  Object.entries(labels).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
  });
}

export function applyRoleShellPermissions(state){
  const allowed = allowedModules(state);
  document.querySelectorAll('.side-nav [data-module]').forEach(button => {
    button.hidden = !allowed.includes(button.dataset.module);
  });
}

export function setActiveModule(name){
  document.querySelectorAll('.nav-module').forEach(btn => {
    const active = btn.dataset.module === name;
    btn.classList.toggle('active', active);
    if(active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
}
