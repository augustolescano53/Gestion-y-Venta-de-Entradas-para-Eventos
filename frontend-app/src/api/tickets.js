import { API_BASE, JSON_HEADERS, request } from './http.js';

const API_URL = `${API_BASE}/ticket`;

function withQuery(url, filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `${url}?${query}` : url;
}

// filters: { venue, event, status, page, pageSize }, todos opcionales.
// Devuelve { items, total, page, pageSize }.
export function getTickets(filters = {}) {
  return request(withQuery(API_URL, filters));
}

// filters: { venue, event }, opcionales.
export function getTicketSummary(filters = {}) {
  return request(withQuery(`${API_URL}/summary`, filters));
}

export function purchaseTickets(purchase) {
  return request(`${API_URL}/purchase`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(purchase),
  });
}

export function scanTicket(qr) {
  return request(`${API_URL}/scan`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ qr }),
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
