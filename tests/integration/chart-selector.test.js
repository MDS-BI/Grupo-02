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
  return document.querySelector('.chart-title-select');
}

function chevron(){
  return document.querySelector('.chart-title-chevron');
}

function instructionMessage(){
  return [...document.querySelectorAll('#dashboard-chart p')]
    .find(p => p.textContent.includes('Seleccione un departamento para visualizar'));
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
  it('A: sin selección muestra el placeholder, la flecha completa y sin mensaje inferior', () => {
    const select = chartSelect();
    expect(select.value).toBe('');
    expect(select.options[0].textContent).toBe('Seleccione departamento');
    expect(chartSelect().closest('.chart-title-container')).not.toBeNull();

    const icon = chevron();
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('path').getAttribute('d')).toBe('m6 9 6 6 6-6');

    expect([...select.options].map(option => option.value)).toContain(departments.cafe.id_departamento);
    expect([...select.options].map(option => option.value)).toContain(departments.jefatura.id_departamento);
    expect([...select.options].map(option => option.value)).toContain(departments.operaciones.id_departamento);
    expect(instructionMessage()).toBeUndefined();
    expect([...document.querySelectorAll('.legend-label')].map(node => node.textContent))
      .toEqual(['Meta esperada', 'Resultado']);
  });

  it('B: con selección conserva el nombre, la flecha y el desplegable', () => {
    selectDepartment(departments.cafe.id_departamento);

    expect(selectedLabel()).toBe('Team cafe');
    expect(chevron()).not.toBeNull();
    expect(chevron().querySelector('path').getAttribute('d')).toBe('m6 9 6 6 6-6');
    expect([...chartSelect().options].some(option => option.textContent === 'Jefatura')).toBe(true);
    expect(instructionMessage()).toBeUndefined();
    expect(localStorage.getItem('erp_dashboard_department')).toBe(departments.cafe.id_departamento);
  });

  it('C: la flecha permanece igual al cambiar entre departamentos', () => {
    for(const department of [departments.cafe, departments.jefatura, departments.operaciones, departments.cafe]){
      selectDepartment(department.id_departamento);
      expect(selectedLabel()).toBe(department.nombre);
      expect(chevron()).not.toBeNull();
      expect(chevron().querySelector('path').getAttribute('d')).toBe('m6 9 6 6 6-6');
      expect(instructionMessage()).toBeUndefined();
    }
  });
});
