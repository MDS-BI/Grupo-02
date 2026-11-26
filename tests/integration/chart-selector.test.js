import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { RRHH_CONFIG } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;
let departments;
let cafe;
let jefatura;
let operaciones;

function chartSelect(){
  return document.getElementById('dashboard-chart-department');
}
function periodSelect(){
  return document.getElementById('dashboard-chart-period');
}
function selectedLabel(){
  const select = chartSelect();
  return select.options[select.selectedIndex].textContent;
}
function selectDepartment(id){
  const select = chartSelect();
  select.value = id;
  select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();

  vi.resetModules();
  const configModule = await import('../../src/module-config.js');
  configModule.setActiveConfig(configModule.normalizeConfig(RRHH_CONFIG).config);
  const { addDepartment } = await import('../../src/storage.js');
  cafe = addDepartment({ nombre: 'Team cafe' });
  jefatura = addDepartment({ nombre: 'Jefatura' });
  operaciones = addDepartment({ nombre: 'Dirección de Operaciones y Calidad Total' });
  departments = { cafe, jefatura, operaciones };

  const { boot } = await import('../../src/app.js');
  await boot(RRHH_CONFIG);
});

afterEach(() => {
  dom.window.close();
});

describe('Panel line chart - selector y leyenda', () => {
  it('A: sin selecci?n muestra todas las ?reas, filtro de per?odo y estado vac?o', () => {
    const select = chartSelect();
    expect(select).not.toBeNull();
    expect(select.value).toBe('');
    expect(select.options[0].textContent).toBe('Todas las ?reas');
    expect(periodSelect()).not.toBeNull();
    expect([...periodSelect().options].map(o => o.textContent)).toEqual(['?ltimos 3 meses', '?ltimos 6 meses', '?ltimos 12 meses']);
    expect([...select.options].map(option => option.value)).toContain(departments.cafe.id_departamento);
    expect(document.querySelector('#dashboard-chart .chart-empty-state')?.textContent).toContain('A?n no hay evaluaciones');
  });

  it('B: con selecci?n conserva el nombre y persiste el ?rea', () => {
    selectDepartment(departments.cafe.id_departamento);
    expect(selectedLabel()).toBe('Team cafe');
    expect(localStorage.getItem('erp_dashboard_department')).toBe(departments.cafe.id_departamento);
  });

  it('C: permite cambiar entre departamentos sin romper el gr?fico', () => {
    for(const department of [departments.cafe, departments.jefatura, departments.operaciones, departments.cafe]){
      selectDepartment(department.id_departamento);
      expect(selectedLabel()).toBe(department.nombre);
      expect(chartSelect()).not.toBeNull();
      expect(periodSelect()).not.toBeNull();
    }
  });
});