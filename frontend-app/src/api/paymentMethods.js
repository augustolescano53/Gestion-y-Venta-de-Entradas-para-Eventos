import { API_BASE, JSON_HEADERS, request } from './http.js';

const API_URL = `${API_BASE}/paymentmethod`;

export function getPaymentMethods() {
  return request(API_URL);
}

export function createPaymentMethod(paymentMethod) {
  return request(API_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(paymentMethod),
  });
}

export function updatePaymentMethod(id, paymentMethod) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(paymentMethod),
  });
}

export function deletePaymentMethod(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}
