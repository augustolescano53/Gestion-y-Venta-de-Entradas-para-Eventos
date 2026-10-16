// --- Selección ---

// Cruza la selección guardada con los tipos de entrada actuales: el precio y
// la disponibilidad salen siempre del backend, no de lo guardado.
export function buildCheckoutItems(selection, options) {
  return selection.map((item) => {
    const option = options.find((o) => o.idTicketType === item.idTicketType);
    const price = option ? option.price : item.price;
    return {
      idTicketType: item.idTicketType,
      location: option?.location ?? item.location,
      quantity: item.quantity,
      price,
      available: option ? option.available : 0,
      subtotal: price * item.quantity,
    };
  });
}

export function hasUnavailableItems(items) {
  return items.some((item) => item.quantity > item.available);
}

export function itemsTotal(items) {
  return items.reduce((totals, item) => ({
    count: totals.count + item.quantity,
    amount: totals.amount + item.subtotal,
  }), { count: 0, amount: 0 });
}

// Body de POST /ticket/purchase con varios tipos de entrada.
export function buildPurchasePayload({ venue, idEvent, participantId, paymentMethodId, items }) {
  return {
    venue,
    event: idEvent,
    participant: participantId,
    paymentMethod: paymentMethodId,
    items: items.map((item) => ({ ticketType: item.idTicketType, quantity: item.quantity })),
  };
}

// Entradas vendidas agrupadas por tipo, para mostrar el resultado.
export function groupSoldTickets(tickets) {
  const groups = new Map();
  for (const ticket of tickets) {
    const location = ticket.ticketType?.location ?? 'Entrada';
    if (!groups.has(location)) groups.set(location, []);
    groups.get(location).push(ticket);
  }
  return [...groups.entries()].map(([location, groupTickets]) => ({ location, tickets: groupTickets }));
}

// --- Errores ---

export const AVAILABILITY_ERROR = 'Algunas de las entradas seleccionadas ya no están disponibles.';
export const PURCHASE_ERROR = 'No pudimos completar la compra. Intentá nuevamente.';

export function purchaseErrorMessage(error) {
  if (error.fieldErrors?.availability) return AVAILABILITY_ERROR;
  // Evento cancelado o finalizado: el backend ya manda un mensaje legible.
  if (error.status === 409) return error.message;
  return PURCHASE_ERROR;
}

// Participante inexistente (400), token vencido (401) o una sesión que no es
// la del participante de la compra (403).
export function isInvalidSessionError(error) {
  return error.status === 401 || error.status === 403 || (error.status === 400 && /participante/i.test(error.message));
}

// --- Temporizador ---

export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Amarillo desde los 5 minutos restantes y rojo en el último minuto.
export function timerLevel(ms) {
  if (ms <= 60 * 1000) return 'danger';
  if (ms <= 5 * 60 * 1000) return 'warning';
  return 'normal';
}

// --- Medio de pago y tarjeta ---

export function isCardMethod(paymentMethod) {
  return /tarjeta/i.test(paymentMethod?.type ?? '');
}

export const EMPTY_CARD_FORM = { holder: '', dni: '', number: '', month: '', year: '', cvv: '' };

export const CARD_MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

export function cardYears(now = new Date()) {
  return Array.from({ length: 11 }, (_, i) => String(now.getFullYear() + i));
}

const HOLDER_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]+$/;

const digitsOnly = (value) => value.replace(/\D/g, '');

// Agrupa el número de tarjeta de a 4 dígitos mientras se escribe.
export function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Formatos de las tarjetas emitidas en Argentina (Visa, Mastercard, Cabal,
// Naranja): 16 dígitos y CVV de 3. Los datos no se envían al backend.
export function getCardErrors(card, now = new Date()) {
  const errors = {};
  const holder = card.holder.trim();
  if (!holder) errors.holder = 'Ingresá el nombre del titular.';
  else if (!HOLDER_PATTERN.test(holder) || holder.length < 3) {
    errors.holder = 'Ingresá el nombre como figura en la tarjeta (solo letras).';
  }

  const dni = card.dni.replace(/\./g, '').trim();
  if (!dni) errors.dni = 'Ingresá el DNI del titular.';
  else if (!/^\d{7,8}$/.test(dni)) errors.dni = 'El DNI debe tener 7 u 8 números.';

  const number = digitsOnly(card.number);
  if (!number) errors.number = 'Ingresá el número de la tarjeta.';
  else if (number.length !== 16) errors.number = 'El número de tarjeta debe tener 16 dígitos.';

  if (!card.month || !card.year) {
    errors.expiry = 'Elegí el mes y el año de vencimiento.';
  } else {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const year = Number(card.year);
    const month = Number(card.month);
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiry = 'La tarjeta está vencida.';
    }
  }

  if (!card.cvv) errors.cvv = 'Ingresá el código de seguridad.';
  else if (!/^\d{3}$/.test(card.cvv)) errors.cvv = 'El código de seguridad debe tener 3 dígitos.';

  return errors;
}
