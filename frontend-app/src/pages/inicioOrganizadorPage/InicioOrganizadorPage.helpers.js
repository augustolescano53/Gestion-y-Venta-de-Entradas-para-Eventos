import { EVENT_STATUS } from '../../constants/statuses.js';
import { formatEventDate, formatTime } from '../../shared/format.helpers.js';
import { isLocked } from '../eventsPage/EventsPage.helpers.js';
import { hasEventEnded } from '../miCuenta/miCuenta.helpers.js';

// Orden de la tabla: primero por estado y, dentro de cada estado, del más
// reciente al más antiguo.
const STATUS_ORDER = [EVENT_STATUS.SCHEDULED, EVENT_STATUS.SOLD_OUT, EVENT_STATUS.FINISHED, EVENT_STATUS.CANCELLED];

function statusRank(status) {
  const rank = STATUS_ORDER.indexOf(status);
  return rank === -1 ? STATUS_ORDER.length : rank;
}

// Filtro por estado del inicio del organizador. "Programados" son los que
// todavía no ocurrieron: programados y agotados.
export const STATUS_FILTERS = [
  { value: 'all', label: 'Todos', counter: 'Total de eventos', statuses: null },
  {
    value: 'scheduled',
    label: 'Programados',
    counter: 'Eventos programados',
    empty: 'No tenés eventos programados.',
    statuses: [EVENT_STATUS.SCHEDULED, EVENT_STATUS.SOLD_OUT],
  },
  {
    value: 'finished',
    label: 'Terminados',
    counter: 'Eventos terminados',
    empty: 'No tenés eventos terminados.',
    statuses: [EVENT_STATUS.FINISHED],
  },
  {
    value: 'cancelled',
    label: 'Cancelados',
    counter: 'Eventos cancelados',
    empty: 'No tenés eventos cancelados.',
    statuses: [EVENT_STATUS.CANCELLED],
  },
];

export function filterByStatus(events, filter) {
  return filter.statuses ? events.filter((event) => filter.statuses.includes(event.status)) : events;
}

export function sortOrganizerEvents(events) {
  return [...events].sort(
    (a, b) =>
      statusRank(a.status) - statusRank(b.status) ||
      `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`),
  );
}

// Mismas reglas que el backend: no se editan ni se anulan eventos cancelados
// o finalizados (tampoco los que ya terminaron y el sistema todavía no marcó
// como finalizados). Los agotados sí.
export function canModify(event) {
  return !isLocked(event) && !hasEventEnded(event);
}

// "Sáb. 21 Nov. 2026 · 20:00 h"
export function formatEventDateTime(event) {
  return `${formatEventDate(event.date)} ${event.date.slice(0, 4)} · ${formatTime(event.startTime)} h`;
}

export const CANCEL_EVENT_CONFIRM = {
  title: 'Cancelar evento',
  confirmLabel: 'Cancelar evento',
  cancelLabel: 'Volver',
};

// Filas del resumen de entradas (GET /ticket/summary) agrupadas por evento,
// con la misma clave "venueId-idEvent" que eventKey.
export function groupSummaryByEvent(rows) {
  const groups = {};
  for (const row of rows) {
    const key = `${row.venueId}-${row.idEvent}`;
    (groups[key] ??= []).push(row);
  }
  return groups;
}
