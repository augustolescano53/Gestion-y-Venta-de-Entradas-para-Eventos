// Funciones para hablar con la API de Organizer (organizadores).

import { API_BASE, JSON_HEADERS, request } from './http.js';

const API_URL = `${API_BASE}/organizer`;

export function getOrganizers() {
  return request(API_URL);
}

export function createOrganizer(organizer) {
  return request(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(organizer),
  });
}

export function updateOrganizer(id, organizer) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(organizer),
  });
}

export function deleteOrganizer(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}
