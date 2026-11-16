import { ack, fetchIncidents } from './api.js';

const list = document.querySelector('[data-testid="incident-list"]');
const loader = document.querySelector('[data-testid="loader"]');
const empty = document.querySelector('[data-testid="empty"]');
const error = document.querySelector('.error');

const rows = new Map();
const acked = new Set();

const timeFormat = new Intl.DateTimeFormat(navigator.languages, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  return node;
}

function markAcked(row) {
  row.querySelector('[data-testid="ack"]')?.remove();
  if (!row.querySelector('[data-testid="acked"]')) {
    row.querySelector('.action').append(el('span', { 'data-testid': 'acked', class: 'acked' }, 'Acked'));
  }
  row.classList.add('is-acked');
}

async function onAck(id, row, button) {
  button.disabled = true;
  try {
    await ack(id);
    acked.add(id);
    markAcked(row);
  } catch (err) {
    button.disabled = false;
    showError(err);
  }
}

function createRow(i) {
  const row = el('li', { 'data-testid': 'incident-row', 'data-id': i.id, class: 'row' });
  row.append(
    el('span', { class: 'id' }, i.id),
    el('span', { class: 'sev' }),
    el('span', { class: 'what' }),
    el('time'),
    el('span', { class: 'action' }),
  );
  const button = el('button', { type: 'button', 'data-testid': 'ack' }, 'Ack');
  button.addEventListener('click', () => onAck(i.id, row, button));
  row.querySelector('.action').append(button);
  return row;
}

function updateRow(row, i) {
  row.className = `row ${i.severity}${acked.has(i.id) ? ' is-acked' : ''}`;
  row.querySelector('.sev').textContent = i.severity;
  row.querySelector('.what').textContent = `${i.service} · ${i.region} · ${i.summary}`;
  const time = row.querySelector('time');
  time.dateTime = i.openedAt;
  time.textContent = timeFormat.format(new Date(i.openedAt));
  time.title = i.openedAt;
}

function render(incidents) {
  const seen = new Set();
  let prev = null;
  for (const i of incidents) {
    seen.add(i.id);
    let row = rows.get(i.id);
    if (!row) {
      row = createRow(i);
      rows.set(i.id, row);
    }
    updateRow(row, i);
    const expected = prev ? prev.nextSibling : list.firstChild;
    if (expected !== row) list.insertBefore(row, expected);
    prev = row;
  }
  for (const [id, row] of rows) {
    if (!seen.has(id)) {
      row.remove();
      rows.delete(id);
    }
  }
  empty.hidden = incidents.length > 0;
}

function showError(err) {
  error.textContent = `Could not reach the incident API: ${err.message}`;
  error.hidden = false;
}

async function refresh() {
  try {
    const page = await fetchIncidents();
    render(page.incidents);
    loader.remove();
    error.hidden = true;
  } catch (err) {
    showError(err);
  } finally {
    setTimeout(refresh, 2000);
  }
}

refresh();
