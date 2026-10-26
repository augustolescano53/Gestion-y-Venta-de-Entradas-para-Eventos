import { EVENT_STATUS, MAX_TICKETS_PER_PURCHASE } from '../../constants/statuses.js';

// Un tipo por cada tipo de entrada del evento, con su disponibilidad real
// (resumen de entradas del backend). Si un tipo no tiene fila en el resumen
// no le quedan entradas.
export function buildTicketOptions(ticketTypeIds, ticketTypes, summaryRows) {
  return ticketTypes
    .filter((ticketType) => ticketTypeIds.includes(ticketType.idTicketType))
    .map((ticketType) => {
      const row = summaryRows.find((r) => Number(r.idTicketType) === ticketType.idTicketType);
      return {
        idTicketType: ticketType.idTicketType,
        location: ticketType.location,
        isNumbered: ticketType.isNumbered,
        price: Number(ticketType.price ?? 0),
        available: row ? row.available : 0,
      };
    });
}

// Solo se venden entradas de eventos programados: cancelado, finalizado y
// agotado no admiten compras.
export function isEventPurchasable(event) {
  return event.status === EVENT_STATUS.SCHEDULED;
}

export function selectionTotals(options, quantities) {
  return options.reduce(
    (totals, option) => {
      const quantity = quantities[option.idTicketType] ?? 0;
      return { count: totals.count + quantity, amount: totals.amount + quantity * option.price };
    },
    { count: 0, amount: 0 },
  );
}

// El límite de entradas por compra es entre todos los tipos.
export function canIncrement(option, quantities, totalCount) {
  const quantity = quantities[option.idTicketType] ?? 0;
  return quantity < option.available && totalCount < MAX_TICKETS_PER_PURCHASE;
}

// Lo que se lleva al checkout: solo los tipos con cantidad.
export function buildSelection(options, quantities) {
  return options
    .filter((option) => (quantities[option.idTicketType] ?? 0) > 0)
    .map((option) => ({
      idTicketType: option.idTicketType,
      location: option.location,
      price: option.price,
      quantity: quantities[option.idTicketType],
    }));
}

// Cantidades guardadas, recortadas a la disponibilidad actual y al límite
// por compra.
export function restoreQuantities(options, selection) {
  const quantities = {};
  let total = 0;
  for (const item of selection) {
    const option = options.find((o) => o.idTicketType === item.idTicketType);
    if (!option) continue;
    const quantity = Math.min(item.quantity, option.available, MAX_TICKETS_PER_PURCHASE - total);
    if (quantity > 0) {
      quantities[option.idTicketType] = quantity;
      total += quantity;
    }
  }
  return quantities;
}

// Nunca se muestra el error técnico: solo "no existe" o un mensaje genérico.
export function eventLoadErrorMessage(error) {
  return error.status === 404 ? 'El evento no existe.' : 'No pudimos cargar el evento. Intentá nuevamente.';
}

export function venueAddress(venue) {
  const address = venue?.address;
  if (!address) return null;
  return `${address.street} ${address.streetNumber}, ${address.locality}, ${address.province}`;
}
