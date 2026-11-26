import { renderCustomFields, collectCustomFields, showCustomFieldErrors, clearCustomFieldErrors } from './custom-fields.js';
import { loadDepartments, loadEntities } from '../storage.js';
import { isRRHHMode } from '../module-config.js';
import {
  PHONE_CODES, phoneCodeLabel, phoneCodeForDial, phoneDialForCode,
  defaultPhoneDial, splitPhone, formatPhone
} from '../phone-codes.js';

function qs(id){ return document.getElementById(id); }

const issuedEmployeeCodes = new Set();

function customFieldsContainer(){
  return isRRHHMode() ? qs('entity-laboral-custom-fields') : qs('entity-custom-fields');
}

export function rememberEmployeeCode(code){
  const normalized = String(code ?? '').trim();
  if(/^EMP-\d+$/.test(normalized)) issuedEmployeeCodes.add(normalized);
}

export function nextEmployeeCode(){
  const entities = loadEntities();
  const used = new Set([
    ...issuedEmployeeCodes,
    ...entities.map(entity => String(entity.code ?? '').trim())
  ]);
  const max = [...used].reduce((highest, code) => {
    const match = /^EMP-(\d+)$/.exec(code);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  let candidate = max + 1;
  while(used.has(`EMP-${String(candidate).padStart(3, '0')}`)) candidate += 1;
  return `EMP-${String(candidate).padStart(3, '0')}`;
}

function splitLegacyName(fullName){
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return { name: parts.shift() || '', surname: parts.join(' ') };
}

function populatePhonePrefixes(){
  const select = qs('phonePrefix');
  if(!select || select.options.length > 0) return;
  PHONE_CODES.forEach(entry => {
    const option = document.createElement('option');
    option.value = entry.code;
    option.textContent = phoneCodeLabel(entry);
    select.appendChild(option);
  });
}

function selectPhonePrefix(dial){
  populatePhonePrefixes();
  const select = qs('phonePrefix');
  if(select) select.value = phoneCodeForDial(dial);
}

export function refreshEntityCustomFields(values = {}){
  renderCustomFields(customFieldsContainer(), 'entity', values, {
    departments: loadDepartments().map(d => ({ value: d.id_departamento, label: d.nombre }))
  });
}

function renderEntityCustomFields(values = {}){
  refreshEntityCustomFields(values);
}

export function clearEntityForm(){
  qs('entity-id').value = '';
  qs('name').value = '';
  qs('surname').value = '';
  qs('code').value = isRRHHMode() ? nextEmployeeCode() : '';
  qs('taxId').value = '';
  qs('email').value = '';
  qs('phone').value = '';
  selectPhonePrefix(defaultPhoneDial());
  qs('address').value = '';
  qs('category').value = '';
  qs('description').value = '';
  qs('targetDate').value = '';
  qs('creditLimit').value = '';
  qs('paymentTerms').value = '';
  clearEntityErrors();
  renderEntityCustomFields(isRRHHMode() ? { estadoLaboral: 'Activo' } : {});
  qs('cancel-edit').hidden = true;
  qs('submit-button').textContent = 'Guardar';
}

export function clearEntityErrors(){
  ['name', 'surname', 'code', 'email', 'targetDate', 'creditLimit'].forEach(f => { qs(`error-${f}`).textContent = ''; });
  clearCustomFieldErrors(customFieldsContainer());
}

export function startEntityEdit(entity){
  renderEntityCustomFields(entity);
  const legacy = entity.surname === undefined || entity.surname === null;
  const names = legacy ? splitLegacyName(entity.name) : { name: entity.name, surname: entity.surname };
  qs('entity-id').value = entity.id;
  qs('name').value = names.name || '';
  qs('surname').value = names.surname || '';
  qs('code').value = entity.code || '';
  qs('taxId').value = entity.taxId || '';
  qs('email').value = entity.email || '';
  const phoneParts = splitPhone(entity.phone);
  selectPhonePrefix(phoneParts.dial);
  qs('phone').value = phoneParts.number;
  qs('address').value = entity.address || '';
  qs('category').value = entity.category || '';
  qs('description').value = entity.description || '';
  qs('targetDate').value = entity.targetDate || '';
  qs('creditLimit').value = entity.creditLimit === undefined ? '' : entity.creditLimit;
  qs('paymentTerms').value = entity.paymentTerms || '';
  clearEntityErrors();
  qs('cancel-edit').hidden = false;
  qs('submit-button').textContent = 'Actualizar';
}

export function collectEntityPayload(){
  return {
    name: qs('name').value,
    surname: qs('surname').value,
    code: qs('code').value,
    taxId: qs('taxId').value,
    email: qs('email').value,
    phone: formatPhone(phoneDialForCode(qs('phonePrefix')?.value), qs('phone').value),
    address: qs('address').value,
    category: qs('category').value,
    description: qs('description').value,
    targetDate: qs('targetDate').value,
    creditLimit: qs('creditLimit').value,
    paymentTerms: qs('paymentTerms').value,
    ...collectCustomFields(customFieldsContainer(), 'entity')
  };
}

export function showEntityErrors(errors){
  qs('error-name').textContent = errors.name || '';
  qs('error-surname').textContent = errors.surname || '';
  qs('error-code').textContent = errors.code || '';
  qs('error-email').textContent = errors.email || '';
  qs('error-targetDate').textContent = errors.targetDate || '';
  qs('error-creditLimit').textContent = errors.creditLimit || '';
  showCustomFieldErrors(customFieldsContainer(), 'entity', errors);
}
