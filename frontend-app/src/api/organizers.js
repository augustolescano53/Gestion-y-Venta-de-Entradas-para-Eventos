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

export function getOrganizer(id) {
  return request(`${API_URL}/${id}`);
}

// passwords: { currentPassword, newPassword }.
export function changeOrganizerPassword(id, passwords) {
  return request(`${API_URL}/${id}/password`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(passwords),
  });
}

// --- Eventos del organizador ("Mi cuenta"). El backend solo opera sobre los
// eventos de ese organizador y, al editar, solo acepta nombre, descripción,
// imágenes y tipos de entrada nuevos.

function organizerEventUrl(organizerId, venueId, idEvent) {
  const base = `${API_URL}/${organizerId}/venue/${venueId}/event`;
  return idEvent === undefined ? base : `${base}/${idEvent}`;
}

export function getOrganizerEvents(organizerId) {
  return request(`${API_URL}/${organizerId}/event`);
}

export function getOrganizerEvent(organizerId, venueId, idEvent) {
  return request(organizerEventUrl(organizerId, venueId, idEvent));
}

export function createOrganizerEvent(organizerId, venueId, event) {
  return request(organizerEventUrl(organizerId, venueId), {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(event),
  });
}

export function updateOrganizerEvent(organizerId, venueId, idEvent, event) {
  return request(organizerEventUrl(organizerId, venueId, idEvent), {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(event),
  });
}

export function cancelOrganizerEvent(organizerId, venueId, idEvent) {
  return request(`${organizerEventUrl(organizerId, venueId, idEvent)}/cancel`, { method: 'PATCH' });
}
