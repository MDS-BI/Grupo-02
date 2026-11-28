import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { DEFAULT_CONFIG, RRHH_CONFIG, normalizeConfig } from '../../src/module-config.js';
import { addEntity, addDocument, loadEntities, loadDocuments } from '../../src/storage.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

const brandedConfig = {
  moduleName: 'Sales Suite',
  theme: { accentColor: '#0f62fe' }
};

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
});

afterEach(() => {
  dom.window.close();
});

async function bootWith(configOverride){
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride), { skipDemoSeed: true });
}

describe('User Story 13 - branded ERP workspace shell', () => {
  it('shows the cafe logo and the module name on every screen', async () => {
    await bootWith(brandedConfig);
    expect(qs('logo-mark').querySelector('.cafe-logo')).not.toBeNull();
    expect(qs('brand-name').textContent).toBe('Sales Suite');

    qs('nav-entities').click();
    expect(qs('logo-mark').querySelector('.cafe-logo')).not.toBeNull();

    qs('nav-documents').click();
    qs('nav-search').click();
    expect(qs('logo-mark').querySelector('.cafe-logo')).not.toBeNull();
    expect(document.querySelector('.topbar .brand')).not.toBeNull();
  });

  it('uses the shared coffee cup logo regardless of the module name', async () => {
    await bootWith(brandedConfig);
    const logo = qs('logo-mark').querySelector('.cafe-logo');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('src')).toBe('cafeteria-logo.svg');
  });

  it('toggles the sidebar from the logo button and keeps navigation working', async () => {
    await bootWith(brandedConfig);
    const workspace = document.querySelector('.workspace');
    const toggle = qs('logo-mark');

    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe('side-nav');
    expect(document.querySelectorAll('[aria-controls="side-nav"]').length).toBe(1);

    toggle.click();
    expect(workspace.classList.contains('is-collapsed')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    document.querySelectorAll('.nav-module:not([hidden])').forEach(btn => {
      btn.click();
      expect(qs(`view-${btn.dataset.module}`).hidden).toBe(false);
    });

    toggle.click();
    expect(workspace.classList.contains('is-collapsed')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps every RRHH section reachable while the sidebar is collapsed', async () => {
    await bootWith(RRHH_CONFIG);
    qs('logo-mark').click();
    document.querySelectorAll('.nav-module:not([hidden])').forEach(btn => {
      btn.click();
      expect(qs(`view-${btn.dataset.module}`).hidden).toBe(false);
    });
  });

  it('offers sidebar module buttons using configured terminology', async () => {
    await bootWith(brandedConfig);
    expect(qs('nav-dashboard-label').textContent).toBe('Panel');
    expect(qs('nav-entities-label').textContent).toBe('Personal');
    expect(qs('nav-documents-label').textContent).toBe('Evaluaciones');
    expect(qs('nav-search-label').textContent).toBe('Búsqueda');
    expect(document.querySelectorAll('.nav-module').length).toBe(4);
  });

  it('uses remapped terms on the sidebar for tailored modules', async () => {
    await bootWith({
      moduleName: 'Ventas',
      labels: { entity: 'Cliente', entities: 'Clientes', document: 'Pedido de Venta', documents: 'Pedidos de Venta' }
    });
    expect(qs('nav-entities-label').textContent).toBe('Clientes');
    expect(qs('nav-documents-label').textContent).toBe('Pedidos de Venta');
  });

  it('keeps every module button labeled for accessible icon-rail collapse', async () => {
    await bootWith(undefined);
    document.querySelectorAll('.nav-module').forEach(btn => {
      expect(btn.querySelector('.nav-label')).not.toBeNull();
      expect(btn.querySelector('.nav-label').textContent.length).toBeGreaterThan(0);
    });
  });

  it('highlights the active module while navigating between all screens', async () => {
    await bootWith(undefined);
    const activeModule = () => document.querySelector('.nav-module[aria-current="page"]').dataset.module;

    expect(activeModule()).toBe('dashboard');

    qs('nav-entities').click();
    expect(activeModule()).toBe('entities');
    expect(qs('view-entities').hidden).toBe(false);

    qs('nav-documents').click();
    expect(activeModule()).toBe('documents');
    expect(qs('view-documents').hidden).toBe(false);

    qs('nav-search').click();
    expect(activeModule()).toBe('search');
    expect(qs('view-search').hidden).toBe(false);

    qs('nav-dashboard').click();
    expect(activeModule()).toBe('dashboard');
    expect(qs('view-dashboard').hidden).toBe(false);
  });

  it('announces the visible section after navigating', async () => {
    await bootWith(undefined);
    expect(qs('route-announcer').textContent).toBe('Vista: Panel');

    qs('nav-entities').click();
    expect(qs('route-announcer').textContent).toBe('Vista: Personal');

    qs('nav-documents').click();
    expect(qs('route-announcer').textContent).toBe('Vista: Evaluaciones');
  });

  it('preserves all stored data while navigating between modules', async () => {
    await bootWith(undefined);
    const entity = addEntity({ name: 'Acme', code: 'AC-001' });
    addDocument({ entityId: entity.entity_id, folio: 1001, startDate: '2026-08-01', endDate: '2026-08-05' });

    qs('nav-entities').click();
    qs('nav-documents').click();
    qs('nav-search').click();
    qs('nav-dashboard').click();

    expect(loadEntities().length).toBe(1);
    expect(loadDocuments().length).toBe(1);
    expect(loadEntities()[0].name).toBe('Acme');
  });

  it('applies the configured accent color to the document root', async () => {
    await bootWith(brandedConfig);
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#0f62fe');
  });

  it('falls back to the default accent when the color is invalid', async () => {
    await bootWith({ moduleName: 'X', theme: { accentColor: 'not-a-color' } });
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(DEFAULT_CONFIG.theme.accentColor);
  });
});
