import { API_BASE, JSON_HEADERS, request } from './http.js';

const API_URL = `${API_BASE}/venue`;

export function getVenues() {
  return request(API_URL);
}

export function createVenue(venue) {
  return request(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(venue),
  });
}

export function updateVenue(id, venue) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(venue),
  });
}

export function deleteVenue(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}
