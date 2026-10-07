import { API_BASE, JSON_HEADERS, request } from './http.js';

function baseUrl(venueId) {
  return `${API_BASE}/venue/${venueId}/event`;
}

export function getAllEvents() {
  return request(`${API_BASE}/event`);
}

// Incluye ticketTypeIds: los tipos de entrada que ya tienen entradas en el evento.
export function getEvent(venueId, idEvent) {
  return request(`${baseUrl(venueId)}/${idEvent}`);
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

export function cancelEvent(venueId, idEvent) {
  return request(`${baseUrl(venueId)}/${idEvent}/cancel`, { method: 'PATCH' });
}

export function deleteEvent(venueId, idEvent) {
  return request(`${baseUrl(venueId)}/${idEvent}`, { method: 'DELETE' });
}
