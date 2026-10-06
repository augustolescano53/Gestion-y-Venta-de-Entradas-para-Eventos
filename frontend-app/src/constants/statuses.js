// Los códigos tienen que coincidir con backend/src/event/event.status.ts y
// backend/src/ticket/ticket.status.ts; la pantalla muestra las etiquetas.

export const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  SOLD_OUT: 'sold_out',
  FINISHED: 'finished',
  CANCELLED: 'cancelled',
};

export const EVENT_STATUS_LABELS = {
  [EVENT_STATUS.SCHEDULED]: 'Programado',
  [EVENT_STATUS.SOLD_OUT]: 'Agotado',
  [EVENT_STATUS.FINISHED]: 'Finalizado',
  [EVENT_STATUS.CANCELLED]: 'Cancelado',
};

export const TICKET_STATUS = {
  AVAILABLE: 'disponible',
  SOLD: 'vendida',
  SCANNED: 'escaneada',
  CANCELLED: 'cancelada',
};

export const TICKET_STATUS_LABELS = {
  [TICKET_STATUS.AVAILABLE]: 'Disponible',
  [TICKET_STATUS.SOLD]: 'Vendida',
  [TICKET_STATUS.SCANNED]: 'Escaneada',
  [TICKET_STATUS.CANCELLED]: 'Cancelada',
};

// Estados que se pueden elegir al editar una entrada: Cancelada solo se
// asigna anulando el evento.
export const EDITABLE_TICKET_STATUSES = [TICKET_STATUS.AVAILABLE, TICKET_STATUS.SOLD, TICKET_STATUS.SCANNED];

export const MAX_TICKETS_PER_PURCHASE = 5;

export function eventStatusLabel(status) {
  return EVENT_STATUS_LABELS[status] ?? status;
}

export function ticketStatusLabel(status) {
  return TICKET_STATUS_LABELS[status] ?? status;
}

const pad = (n) => String(n).padStart(2, '0');

// toISOString() daría la fecha en UTC, que a la noche ya es "mañana" en
// Argentina: se arma con la hora local.
export function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function localNowTime() {
  const now = new Date();
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
