// Funciones para hablar con la API de Ticket (entradas). A diferencia de
// TicketType/Event, Ticket SÍ tiene una URL propia (no anidada), pero
// depende de un Lugar/Evento/Tipo de entrada igual: esos ids van como
// campos planos en el body (venue, event, ticketType), y es el backend el
// que arma internamente las claves compuestas correspondientes.

import { API_BASE, JSON_HEADERS, request } from './http.js';

const API_URL = `${API_BASE}/ticket`;

export function getTickets() {
  return request(API_URL);
}

export function createTicket(ticket) {
  return request(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(ticket),
  });
}

export function updateTicket(id, ticket) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(ticket),
  });
}

export function deleteTicket(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}
