import { SESSION_EXPIRED_EVENT, getSessionToken } from '../shared/currentUser.js';

export const API_BASE = 'http://localhost:3000/api';

// Todas las requests llevan el token de la sesión (si hay): el backend decide
// con él qué puede hacer cada rol.
export async function request(url, options = {}) {
  const token = getSessionToken();
  const headers = token ? { ...options.headers, Authorization: `Bearer ${token}` } : options.headers;
  const response = await fetch(url, { ...options, headers });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Token vencido o inválido: se cierra la sesión (AuthProvider).
    if (response.status === 401 && token) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    const error = new Error(body.message || 'Ocurrió un error inesperado.');
    // Permite distinguir, por ejemplo, "no existe" (404) de un error del servidor.
    error.status = response.status;
    // Errores de validación por campo ({ campo: mensaje }), si el backend los envía.
    error.fieldErrors = body.errors ?? {};
    throw error;
  }

  return body.data;
}

export const JSON_HEADERS = { 'Content-Type': 'application/json' };
