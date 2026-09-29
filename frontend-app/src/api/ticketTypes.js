// Funciones para hablar con la API de TicketType (tipos de entrada).
// A diferencia de venues/organizers/participants/paymentMethods, esta
// entidad no tiene una URL propia: siempre depende de un Lugar (Venue),
// así que todas las rutas van anidadas bajo /api/venue/:venueId/tickettype.

import { API_BASE, JSON_HEADERS, request } from './http.js';

function baseUrl(venueId) {
  return `${API_BASE}/venue/${venueId}/tickettype`;
}

export function getTicketTypes(venueId) {
  return request(baseUrl(venueId));
}

export function createTicketType(venueId, ticketType) {
  return request(baseUrl(venueId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(ticketType),
  });
}

export function updateTicketType(venueId, idTicketType, ticketType) {
  return request(`${baseUrl(venueId)}/${idTicketType}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(ticketType),
  });
}

export function deleteTicketType(venueId, idTicketType) {
  return request(`${baseUrl(venueId)}/${idTicketType}`, { method: 'DELETE' });
}
