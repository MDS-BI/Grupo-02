import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig, RRHH_CONFIG } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id){ return document.getElementById(id); }

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

describe('User Story 6 - relabel screens from configuration', () => {
  it('shows default cafe terms everywhere when no mappings are provided', async () => {
    await bootWith(undefined);
    expect(qs('brand-name').textContent).toBe('Cafetería Gestión de personal y evaluaciones');
    expect(qs('nav-entities-label').textContent).toBe('Personal');
    expect(qs('nav-documents-label').textContent).toBe('Evaluaciones');
    expect(qs('action-new-entity-title').textContent).toBe('Nuevo personal');
    qs('nav-entities').click();
    expect(qs('entity-form-heading').textContent).toBe('Agregar / Editar Personal');
    expect(qs('delete-entity').textContent).toBe('Eliminar el personal seleccionado');
    qs('nav-search').click();
    expect(qs('search-view-heading').textContent).toBe('Buscar Personal');
  });

  it('uses configured terms on every screen without altering navigation behavior', async () => {
    await bootWith({
      moduleName: 'Ventas',
      labels: { entity: 'Cliente', entities: 'Clientes', document: 'Pedido de Venta', documents: 'Pedidos de Venta' }
    });
    expect(document.title).toBe('Ventas');
    expect(qs('brand-name').textContent).toBe('Ventas');
    expect(qs('nav-entities-label').textContent).toBe('Clientes');
    expect(qs('nav-documents-label').textContent).toBe('Pedidos de Venta');
    expect(qs('action-new-entity-title').textContent).toBe('Nuevo Cliente');
    expect(qs('action-new-document-title').textContent).toBe('Nuevo Pedido de Venta');

    qs('nav-entities').click();
    expect(qs('entities-view-heading').textContent).toBe('Clientes');
    expect(qs('entity-form-heading').textContent).toBe('Agregar / Editar Cliente');
    expect(qs('edit-entity-heading').textContent).toBe('Editar o eliminar el cliente');
    expect(qs('delete-entity').textContent).toBe('Eliminar el cliente seleccionado');

    qs('nav-documents').click();
    expect(qs('documents-view-heading').textContent).toBe('Pedidos de Venta');
    expect(qs('document-form-heading').textContent).toBe('Agregar / Editar Pedido de Venta');
    expect(qs('edit-document-heading').textContent).toBe('Editar o eliminar el pedido de venta');
    expect(qs('delete-document').textContent).toBe('Eliminar el pedido de venta seleccionado');

    qs('nav-search').click();
    expect(qs('search-view-heading').textContent).toBe('Buscar Clientes');
    expect(qs('search-empty').textContent).toContain('coincidencias');
  });

  it('keeps navigation behavior unchanged after relabeling', async () => {
    await bootWith({ labels: { entity: 'Producto', entities: 'Productos', document: 'Orden', documents: 'Órdenes' } });
    qs('nav-entities').click();
    expect(qs('view-entities').hidden).toBe(false);
    qs('nav-documents').click();
    expect(qs('view-entities').hidden).toBe(true);
    expect(qs('view-documents').hidden).toBe(false);
    qs('nav-dashboard').click();
    expect(qs('view-dashboard').hidden).toBe(false);
  });

  it('renders the cafe logo with any configured module name', async () => {
    await bootWith({ moduleName: 'Warehouse Pro' });
    const logo = qs('logo-mark').querySelector('.cafe-logo');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('src')).toBe('cafeteria-logo.svg');
  });

  it('usa terminología de cafetería y explica los tres roles en el modo RR. HH.', async () => {
    await bootWith(RRHH_CONFIG);
    expect(qs('nav-entities-label').textContent).toBe('Personal');
    expect(qs('nav-documents-label').textContent).toBe('Evaluaciones de desempeño');
    expect([...document.querySelectorAll('label')].map(label => label.textContent)).toContain('Área de trabajo');
    qs('role-select').value = 'supervisor';
    qs('role-select').dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('nav-documents-label').textContent).toBe('Medición');
    expect(qs('role-controls').hidden).toBe(false);
    expect([...qs('role-select').options].map(option => option.value)).toEqual(['administrador', 'supervisor', 'barista']);
    const roleHelp = qs('role-select').nextElementSibling.textContent;
    expect(roleHelp).toContain('Administrador');
    expect(roleHelp).toContain('Jefe de Turno');
    expect(roleHelp).toContain('Barista');
    expect(roleHelp).toContain('demostrativo');
    expect(qs('data-warning').textContent).toContain('ficticios');
  });
});
