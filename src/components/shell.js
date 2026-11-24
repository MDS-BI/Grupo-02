import { labelFor } from '../module-config.js';

export function monogramFor(name){
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 0 ? words.map(w => w[0]).slice(0, 2).join('') : 'E';
  return letters.toUpperCase();
}

export function renderLogo(container){
  if(!container) return;
  container.innerHTML = '<img class="cafe-logo" src="cafeteria-logo.svg" width="36" height="36" alt="" />';
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

export function setActiveModule(name){
  document.querySelectorAll('.nav-module').forEach(btn => {
    const active = btn.dataset.module === name;
    btn.classList.toggle('active', active);
    if(active) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
}
