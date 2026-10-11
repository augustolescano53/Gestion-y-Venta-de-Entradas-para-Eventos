import { EVENT_STATUS } from '../../constants/statuses.js';
import { eventKey, resolveId } from '../../shared/refs.helpers.js';
import { hasEventEnded } from '../miCuenta/miCuenta.helpers.js';

export const MAX_CAROUSEL_EVENTS = 5;

export function eventKeyOf(event) {
  return eventKey(resolveId(event.venue), event.idEvent);
}

function uniqueByKey(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = eventKeyOf(event);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Programado y todavía no terminado (el estado se actualiza cada minuto en el
// backend; la fecha se controla igual para no mostrar uno recién pasado).
function isUpcoming(event) {
  return event.status === EVENT_STATUS.SCHEDULED && !hasEventEnded(event);
}

// Carrusel: los últimos eventos creados (creationOrder, ver findAllEvents en
// el backend) que tengan banner. Sin repetir para completar.
export function carouselEvents(events) {
  return uniqueByKey(events.filter((event) => isUpcoming(event) && event.banner?.trim()))
    .sort((a, b) => (b.creationOrder ?? -Infinity) - (a.creationOrder ?? -Infinity))
    .slice(0, MAX_CAROUSEL_EVENTS);
}

// Grilla: todos los próximos, el más cercano primero.
export function upcomingEvents(events) {
  return uniqueByKey(events.filter(isUpcoming)).sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
  );
}
