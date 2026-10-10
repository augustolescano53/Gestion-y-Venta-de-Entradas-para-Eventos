export const API_BASE = 'http://localhost:3000/api';

export async function request(url, options) {
  const response = await fetch(url, options);

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
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
