import { API_BASE, JSON_HEADERS, request } from './http.js';

const API_URL = `${API_BASE}/admin`;

export function getAdmins() {
  return request(API_URL);
}

export function getAdmin(id) {
  return request(`${API_URL}/${id}`);
}

export function createAdmin(admin) {
  return request(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(admin),
  });
}

export function updateAdmin(id, admin) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(admin),
  });
}

export function deleteAdmin(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}

// passwords: { currentPassword, newPassword }.
export function changeAdminPassword(id, passwords) {
  return request(`${API_URL}/${id}/password`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(passwords),
  });
}
