export const TICKET_STATUS = {
  AVAILABLE: 'disponible',
  SOLD: 'vendida',
  SCANNED: 'escaneada',
  CANCELLED: 'cancelada',
} as const;

export const TICKET_STATUSES: string[] = Object.values(TICKET_STATUS);

export const SOLD_STATUSES: string[] = [TICKET_STATUS.SOLD, TICKET_STATUS.SCANNED];

// Escaneada -> Disponible no está: una entrada usada no vuelve a la venta en
// un solo paso. Cancelada no es destino ni origen: solo se llega anulando el
// evento y no se puede reactivar.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  [TICKET_STATUS.AVAILABLE]: [TICKET_STATUS.SOLD],
  [TICKET_STATUS.SOLD]: [TICKET_STATUS.AVAILABLE, TICKET_STATUS.SCANNED],
  [TICKET_STATUS.SCANNED]: [TICKET_STATUS.SOLD],
};

export function isAllowedTicketTransition(from: string, to: string) {
  return from === to || (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}
