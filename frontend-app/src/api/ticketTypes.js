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
