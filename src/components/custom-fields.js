import { getConfig } from '../module-config.js';

function el(tag, attrs = {}, children = []){
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if(k === 'text') node.textContent = v;
    else if(k === 'class') node.className = v;
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(c));
  return node;
}

export function declaredFieldsFor(target){
  return getConfig().customFields.filter(f => f.target === target);
}

function dynamicOptionsFor(field, options){
  if(!options || !field.optionsSource) return null;
  if(typeof options === 'function') return options(field) || null;
  if(Array.isArray(options[field.optionsSource])) return options[field.optionsSource];
  if(Array.isArray(options[field.key])) return options[field.key];
  return null;
}

export function renderCustomFields(container, target, values = {}, options = null){
  container.innerHTML = '';
  const fields = declaredFieldsFor(target);
  if(fields.length === 0){
    container.hidden = true;
    return;
  }
  container.hidden = false;
  for(const f of fields){
    const inputId = `cf-${f.key}`;
    const wrap = el('div', { class: 'custom-field' });
    wrap.appendChild(el('label', { for: inputId, text: f.label + (f.required ? ' *' : '') }));
    const dynamic = dynamicOptionsFor(f, options);
    let input;
    if(f.type === 'select' || dynamic){
      input = el('select', { id: inputId, name: inputId });
      input.appendChild(el('option', { value: '', text: '--' }));
      const choices = dynamic || f.options || [];
      for(const opt of choices){
        const value = typeof opt === 'object' ? opt.value : opt;
        const text = typeof opt === 'object' ? opt.label : opt;
        input.appendChild(el('option', { value, text }));
      }
    } else {
      input = el('input', { id: inputId, name: inputId, type: f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text' });
      if(f.type === 'number'){ input.setAttribute('step', 'any'); }
    }
    input.value = values[f.key] !== undefined && values[f.key] !== null ? String(values[f.key]) : '';
    wrap.appendChild(input);
    wrap.appendChild(el('div', { class: 'error', id: `error-${inputId}`, 'aria-live': 'polite' }));
    container.appendChild(wrap);
  }
}

export function collectCustomFields(container, target){
  const values = {};
  for(const f of declaredFieldsFor(target)){
    const input = container.querySelector(`#cf-${f.key}`);
    if(!input) continue;
    const raw = input.value;
    if(raw === '' || raw === undefined || raw === null) continue;
    values[f.key] = f.type === 'number' ? Number(raw) : String(raw).trim();
  }
  return values;
}

export function showCustomFieldErrors(container, target, errors = {}){
  for(const f of declaredFieldsFor(target)){
    const errEl = container.querySelector(`#error-cf-${f.key}`);
    if(errEl) errEl.textContent = errors[f.key] || '';
  }
}

export function clearCustomFieldErrors(container){
  container.querySelectorAll('.error').forEach(e => { e.textContent = ''; });
}
