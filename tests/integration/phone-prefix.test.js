import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addEntity, loadEntities } from '../../src/storage.js';
import { PHONE_CODES } from '../../src/phone-codes.js';

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
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot();
});

afterEach(() => {
  dom.window.close();
});

function saveForm(){
  qs('entity-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

describe('Prefijo telefónico internacional', () => {
  it('muestra todos los prefijos con bandera, país y código, con Chile por defecto', () => {
    qs('nav-entities').click();
    const select = qs('phonePrefix');
    expect(select.options.length).toBe(PHONE_CODES.length);
    expect(select.value).toBe('CL');
    const chile = [...select.options].find(option => option.value === 'CL');
    expect(chile.textContent).toBe('🇨🇱 Chile +56');
    expect([...select.options].some(option => option.textContent === '🇦🇷 Argentina +54')).toBe(true);
  });

  it('guarda el número escrito junto al prefijo seleccionado', () => {
    qs('nav-entities').click();
    qs('name').value = 'Acme';
    qs('code').value = 'AC-001';
    qs('phonePrefix').value = 'AR';
    qs('phone').value = '11 1234 5678';
    saveForm();
    expect(loadEntities()[0].phone).toBe('+54 11 1234 5678');
  });

  it('separa el prefijo del número al editar un trabajador guardado', () => {
    addEntity({ name: 'Acme', code: 'AC-001', phone: '+54 11 1234 5678' });
    qs('nav-entities').click();
    const select = qs('edit-entity');
    select.value = select.options[1].value;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('phonePrefix').value).toBe('AR');
    expect(qs('phone').value).toBe('1112345678');

    qs('phone').value = '11 9876 5432';
    saveForm();
    expect(loadEntities()[0].phone).toBe('+54 11 9876 5432');
  });

  it('usa Chile como prefijo para números heredados sin prefijo', () => {
    addEntity({ name: 'Acme', code: 'AC-001', phone: '555-1234' });
    qs('nav-entities').click();
    const select = qs('edit-entity');
    select.value = select.options[1].value;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    expect(qs('phonePrefix').value).toBe('CL');
    expect(qs('phone').value).toBe('555-1234');
  });
});
