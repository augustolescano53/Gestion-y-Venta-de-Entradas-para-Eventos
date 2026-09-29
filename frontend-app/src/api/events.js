// Funciones para hablar con la API de Event (eventos). Igual que
// TicketType, un evento siempre pertenece a un Lugar, así que las rutas
// van anidadas bajo /api/venue/:venueId/event.

import { API_BASE, JSON_HEADERS, request } from './http.js';

function baseUrl(venueId) {
  return `${API_BASE}/venue/${venueId}/event`;
}

export function getEvents(venueId) {
  return request(baseUrl(venueId));
}

export function createEvent(venueId, event) {
  return request(baseUrl(venueId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(event),
  });
}

export function updateEvent(venueId, idEvent, event) {
  return request(`${baseUrl(venueId)}/${idEvent}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(event),
  });
}

export function deleteEvent(venueId, idEvent) {
  return request(`${baseUrl(venueId)}/${idEvent}`, { method: 'DELETE' });
}
