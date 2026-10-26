// Selección de entradas en curso, por evento ("venueId-idEvent"). Vive en
// sessionStorage: sobrevive al login/registro y a recargar el checkout, pero
// no es una compra guardada (se borra al confirmar o al vencer el tiempo).

export const PURCHASE_TIME_LIMIT_MS = 10 * 60 * 1000;

const storageKey = (eventKey) => `pogo.purchase.${eventKey}`;

function read(eventKey) {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(eventKey)));
  } catch {
    return null;
  }
}

function write(eventKey, value) {
  try {
    sessionStorage.setItem(storageKey(eventKey), JSON.stringify(value));
  } catch {
    // Sin sessionStorage la selección viaja solo en el state de la navegación.
  }
}

// selection: [{ idTicketType, location, price, quantity }]. Una selección
// nueva reinicia el tiempo límite.
export function savePurchaseSelection(eventKey, selection) {
  write(eventKey, { selection, expiresAt: null });
}

export function loadPurchaseSelection(eventKey) {
  const stored = read(eventKey);
  return Array.isArray(stored?.selection) && stored.selection.length > 0 ? stored : null;
}

// El tiempo empieza al entrar al checkout; recargar la página no lo reinicia.
export function startPurchaseTimer(eventKey, selection) {
  const stored = loadPurchaseSelection(eventKey);
  const expiresAt = stored?.expiresAt ?? Date.now() + PURCHASE_TIME_LIMIT_MS;
  write(eventKey, { selection, expiresAt });
  return expiresAt;
}

export function clearPurchaseSelection(eventKey) {
  try {
    sessionStorage.removeItem(storageKey(eventKey));
  } catch {
    // Nada que borrar.
  }
}
