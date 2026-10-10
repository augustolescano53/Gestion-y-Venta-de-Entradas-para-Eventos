import { getTickets } from '../../api/tickets.js';
import { localNowTime, localToday } from '../../constants/statuses.js';
import { eventKey, parseEventKey, resolveId } from '../../shared/refs.helpers.js';

// Máximo que acepta GET /api/ticket por página.
const TICKETS_PAGE_SIZE = 100;

// --- Datos ---

// Todas las entradas compradas por el participante (opcionalmente de un
// evento: { venue, event }), recorriendo todas las páginas.
export async function getAllParticipantTickets(participantId, filters = {}) {
  const tickets = [];
  let page = 1;
  for (;;) {
    const result = await getTickets({ ...filters, participant: participantId, page, pageSize: TICKETS_PAGE_SIZE });
    tickets.push(...result.items);
    if (result.items.length === 0 || tickets.length >= result.total) return tickets;
    page += 1;
  }
}

// Un evento aparece una sola vez aunque el participante tenga varias entradas.
export function eventsFromTickets(tickets) {
  const events = new Map();
  for (const ticket of tickets) {
    const key = eventKey(resolveId(ticket.event.venue), ticket.event.idEvent);
    const current = events.get(key);
    if (current) {
      current.ticketCount += 1;
    } else {
      events.set(key, { ...ticket.event, venueId: resolveId(ticket.event.venue), ticketCount: 1 });
    }
  }
  return [...events.values()];
}

function addOneDay(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

// Mismo criterio que hasEnded del backend: si la hora de fin es menor o
// igual a la de inicio, el evento termina al día siguiente.
export function hasEventEnded(event) {
  const start = event.startTime.slice(0, 5);
  const end = event.endTime.slice(0, 5);
  const endDate = end <= start ? addOneDay(event.date) : event.date;
  return `${endDate} ${end}` <= `${localToday()} ${localNowTime()}`;
}

export function sortByDate(events, descending = false) {
  return [...events].sort((a, b) => {
    const order = `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
    return descending ? -order : order;
  });
}

// No existe una entidad Venta ni un número de compra: el endpoint de compra
// asigna la misma fecha y hora (purchaseDate) y el mismo medio de pago a todas
// las entradas que vende juntas, así que se agrupan por esos dos datos.
export function groupPurchases(tickets) {
  const purchases = new Map();
  for (const ticket of tickets) {
    const paymentMethodId = resolveId(ticket.paymentMethod);
    const key = `${ticket.purchaseDate ?? ''}|${paymentMethodId ?? ''}`;
    if (!purchases.has(key)) {
      purchases.set(key, { key, purchaseDate: ticket.purchaseDate ?? null, paymentMethodId, tickets: [] });
    }
    purchases.get(key).tickets.push(ticket);
  }
  return [...purchases.values()]
    .sort((a, b) => String(a.purchaseDate).localeCompare(String(b.purchaseDate)))
    .map((purchase) => ({ ...purchase, ticketTypes: groupByTicketType(purchase.tickets) }));
}

function groupByTicketType(tickets) {
  const types = new Map();
  for (const ticket of tickets) {
    const id = ticket.ticketType.idTicketType;
    if (!types.has(id)) types.set(id, { id, name: ticket.ticketType.location, tickets: [] });
    types.get(id).tickets.push(ticket);
  }
  return [...types.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// --- URL ---

// :eventoId tiene la forma "venueId-idEvent" (ver shared/routes.js).
export function parseMisEventoId(param) {
  if (!/^\d+-\d+$/.test(param ?? '')) return null;
  const { venue, event } = parseEventKey(param);
  return venue > 0 && event > 0 ? { venue, event } : null;
}

// --- Formatos ---

// 'YYYY-MM-DD' se arma con la fecha local: new Date('YYYY-MM-DD') sería UTC
// y en Argentina mostraría el día anterior.
export function formatDate(date) {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(time) {
  return time ? time.slice(0, 5) : '';
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatAddress(venue) {
  const address = venue?.address;
  if (!address) return '';
  return `${address.street} ${address.streetNumber}, ${address.locality}, ${address.province}`;
}

// --- Errores ---

// El PUT de participante devuelve el mensaje crudo de MySQL cuando un dato
// único ya existe: se traduce a algo comprensible.
export function userUpdateErrorMessage(error) {
  const message = error?.message ?? '';
  // Se mira el nombre del índice ("for key 'user.user_email_unique'"), no el
  // SQL completo, que incluye todas las columnas actualizadas.
  const duplicateKey = /duplicate entry .* for key '([^']+)'/i.exec(message)?.[1] ?? '';
  if (duplicateKey.includes('email')) return 'Ese email ya está registrado.';
  if (duplicateKey.includes('identity_document')) return 'Ese documento ya está registrado.';
  if (error?.status === 400 && message) return message;
  return 'No se pudieron actualizar tus datos. Intentá nuevamente.';
}
