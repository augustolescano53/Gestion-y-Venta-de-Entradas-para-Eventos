import { API_BASE, JSON_HEADERS, request } from './http.js';

const API_URL = `${API_BASE}/participant`;

export function getParticipants() {
  return request(API_URL);
}

export function getParticipant(id) {
  return request(`${API_URL}/${id}`);
}

export function createParticipant(participant) {
  return request(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(participant),
  });
}

export function updateParticipant(id, participant) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(participant),
  });
}

export function deleteParticipant(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}

// passwords: { currentPassword, newPassword }.
export function changeParticipantPassword(id, passwords) {
  return request(`${API_URL}/${id}/password`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(passwords),
  });
}
