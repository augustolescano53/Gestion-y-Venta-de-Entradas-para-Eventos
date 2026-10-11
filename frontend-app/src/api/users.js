import { API_BASE, JSON_HEADERS, request } from './http.js';

// credentials: { email, password }. Sirve para participantes y organizadores.
// Devuelve { id, firstName, lastName, email, role }.
export function loginUser(credentials) {
  return request(`${API_BASE}/user/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(credentials),
  });
}
