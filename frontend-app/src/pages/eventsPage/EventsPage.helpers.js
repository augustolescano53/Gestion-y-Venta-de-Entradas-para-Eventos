import { EVENT_STATUS } from '../../constants/statuses.js';
import { resolveId } from '../../shared/refs.helpers.js';

// Un evento se identifica por su id + el id de su lugar (clave compuesta).
export function eventKey(event) {
  return `${resolveId(event.venue)}-${event.idEvent}`;
}

export function isLocked(event) {
  return event.status === EVENT_STATUS.CANCELLED || event.status === EVENT_STATUS.FINISHED;
}

// Los tipos de entrada ya asociados se cargan aparte (ticketTypeIds del
// detalle); ticketTypes guarda solo los nuevos que se elijan.
export function eventToFormData(event) {
  return {
    name: event.name,
    description: event.description,
    coverImage: event.coverImage,
    date: event.date,
    startTime: event.startTime.slice(0, 5),
    endTime: event.endTime.slice(0, 5),
    organizer: String(resolveId(event.organizer) ?? ''),
    ticketTypes: [],
  };
}

export function buildEventPayload(formData) {
  return {
    name: formData.name.trim(),
    description: formData.description.trim(),
    coverImage: formData.coverImage.trim(),
    date: formData.date,
    startTime: formData.startTime,
    endTime: formData.endTime,
    organizer: Number(formData.organizer),
    ticketTypes: formData.ticketTypes,
  };
}

export function updatedEventMessage(updated) {
  return updated.addedTicketTypes > 0
    ? `Evento actualizado. Se agregaron ${updated.addedTicketTypes} tipo(s) de entrada con sus entradas disponibles.`
    : 'Evento actualizado correctamente.';
}

export function cancelConfirmMessage(event) {
  return `¿Seguro que querés anular el evento "${event.name}"? El evento y todas sus entradas pasarán a Cancelado/Cancelada. Se conservan los registros y los datos de compra, pero no se podrán vender más entradas ni registrar ingresos. Las devoluciones de dinero no se gestionan desde acá.`;
}

export function deleteConfirmMessage(event) {
  return `¿Seguro que querés eliminar el evento "${event.name}"? También se eliminarán sus entradas disponibles.`;
}
