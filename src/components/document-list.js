import { isRRHHMode } from '../module-config.js';
import { getDepartmentForDocument, getDocumentPeriod } from '../storage.js';

function escapeHtml(s){ return String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

export function folioLabel(doc){
  return `${doc.series ? `${doc.series}-` : ''}${doc.folio}`;
}

export function createDocumentItem(doc, entityName){
  const li = document.createElement('li');
  li.className = 'document-item';
  const info = document.createElement('span');
  if(isRRHHMode()){
    const department = getDepartmentForDocument(doc);
    info.innerHTML = `<strong>${escapeHtml(getDocumentPeriod(doc) || '')}</strong> &middot; ${escapeHtml(doc.indicador || '')}` +
      ` &middot; ${escapeHtml(String(doc.resultado ?? ''))} ${escapeHtml(doc.unidad || '')}` +
      `${department ? ` &middot; ${escapeHtml(department.nombre)}` : ''}` +
      `${entityName ? `<div class="muted">${escapeHtml(entityName)}</div>` : ''}`;
  } else {
    const amount = (doc.totalAmount !== undefined) ? ` &middot; ${escapeHtml(String(doc.currency || ''))}${escapeHtml(String(doc.totalAmount))}` : '';
    const status = doc.status ? ` <span class="status-badge">${escapeHtml(doc.status)}</span>` : '';
    info.innerHTML = `<strong>${escapeHtml(folioLabel(doc))}</strong> &middot; ${escapeHtml(doc.startDate)} &rarr; ${escapeHtml(doc.endDate)}` +
      `${doc.quantity ? ' &middot; ' + escapeHtml(String(doc.quantity)) + ' cant.' : ''}${amount}${status}` +
      `${entityName ? `<div class="muted">${escapeHtml(entityName)}</div>` : ''}`;
  }
  li.appendChild(info);
  return li;
}

export function renderDocumentList(listEl, documents, entityNameFor){
  listEl.innerHTML = '';
  if(!documents || documents.length === 0) return false;
  for(const d of documents){
    listEl.appendChild(createDocumentItem(d, entityNameFor ? entityNameFor(d) : undefined));
  }
  return true;
}
