import { MAX_TICKETS_PER_PURCHASE, TICKET_STATUS } from '../../constants/statuses.js';

// En los <select> un evento se identifica como "venueId-idEvent" (clave compuesta).
export function eventKey(venueId, idEvent) {
  return `${venueId}-${idEvent}`;
}

export function parseEventKey(key) {
  const [venue, event] = key.split('-').map(Number);
  return { venue, event };
}

// purchaseDate llega en UTC; el <input type="date"> necesita el día local.
export function toLocalDateInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getVenueName(venues, venueId) {
  return venues.find((v) => v.id === venueId)?.name ?? `Lugar #${venueId}`;
}

export function getParticipantName(participants, participantId) {
  if (participantId == null) return 'Sin asignar';
  const participant = participants.find((p) => p.id === participantId);
  return participant ? `${participant.firstName} ${participant.lastName}` : `#${participantId}`;
}

export function getPaymentMethodName(paymentMethods, paymentMethodId) {
  if (paymentMethodId == null) return 'Sin asignar';
  return paymentMethods.find((pm) => pm.id === paymentMethodId)?.type ?? `#${paymentMethodId}`;
}

// --- Compra ---

// Devuelve todos los errores a la vez: { campo: mensaje }.
export function validatePurchase(purchaseData, selectedPurchaseType) {
  const errors = {};
  if (!purchaseData.event) errors.event = 'Elegí un evento.';
  if (!purchaseData.ticketType) errors.ticketType = 'Elegí un tipo de entrada.';
  const quantity = Number(purchaseData.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) {
    errors.quantity = 'La cantidad debe ser un número entero mayor a cero.';
  } else if (quantity > MAX_TICKETS_PER_PURCHASE) {
    errors.quantity = `Podés comprar como máximo ${MAX_TICKETS_PER_PURCHASE} entradas por compra.`;
  } else if (selectedPurchaseType && quantity > selectedPurchaseType.available) {
    errors.quantity = `Solo quedan ${selectedPurchaseType.available} entradas disponibles de ese tipo.`;
  }
  if (!purchaseData.participant) errors.participant = 'Elegí un participante.';
  if (!purchaseData.paymentMethod) errors.paymentMethod = 'Elegí un medio de pago.';
  return errors;
}

export function buildPurchasePayload(purchaseData) {
  const { venue, event } = parseEventKey(purchaseData.event);
  return {
    venue,
    event,
    ticketType: Number(purchaseData.ticketType),
    quantity: Number(purchaseData.quantity),
    participant: Number(purchaseData.participant),
    paymentMethod: Number(purchaseData.paymentMethod),
  };
}

export function purchaseSuccessMessage(soldCount) {
  return `Compra realizada: ${soldCount} ${soldCount === 1 ? 'entrada vendida' : 'entradas vendidas'}.`;
}

// --- Edición ---

export function ticketToEditData(ticket) {
  return {
    status: ticket.status,
    seatNumber: ticket.seatNumber != null ? String(ticket.seatNumber) : '',
    purchaseDate: toLocalDateInput(ticket.purchaseDate),
    participant: ticket.participant != null ? String(ticket.participant) : '',
    paymentMethod: ticket.paymentMethod != null ? String(ticket.paymentMethod) : '',
  };
}

export function validateTicketEdit(editData) {
  const isAvailable = editData.status === TICKET_STATUS.AVAILABLE;
  if (!isAvailable && (!editData.participant || !editData.paymentMethod)) {
    return 'Una entrada vendida o escaneada necesita participante y medio de pago.';
  }
  return null;
}

// Una entrada disponible no pertenece a ninguna compra: el backend le borra
// participante, medio de pago y fecha de compra.
export function buildTicketEditPayload(editData, originalTicket) {
  const isAvailable = editData.status === TICKET_STATUS.AVAILABLE;
  const originalDate = toLocalDateInput(originalTicket.purchaseDate);
  return {
    status: editData.status,
    seatNumber: editData.seatNumber ? Number(editData.seatNumber) : null,
    ...(isAvailable
      ? {}
      : {
          participant: Number(editData.participant),
          paymentMethod: Number(editData.paymentMethod),
          // Solo se manda si cambió, para no pisar la hora de compra.
          ...(editData.purchaseDate && editData.purchaseDate !== originalDate
            ? { purchaseDate: editData.purchaseDate }
            : {}),
        }),
  };
}

export function deleteConfirmMessage(ticket) {
  return `¿Seguro que querés eliminar la entrada #${ticket.id}? Se reduce el stock del evento y no se puede deshacer.`;
}
