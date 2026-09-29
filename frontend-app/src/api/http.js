// Helpers compartidos para hablar con la API. Antes cada archivo de
// src/api definía su propia función request() (ver venues.js); acá vive
// una sola vez para no repetirla en cada módulo nuevo.

export const API_BASE = 'http://localhost:3000/api';

export async function request(url, options) {
  const response = await fetch(url, options);

  // El backend siempre responde JSON, incluso en los errores
  // ({ message: '...' }), así que lo parseamos antes de decidir qué hacer.
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'Ocurrió un error inesperado.');
  }

  return body.data;
}

export const JSON_HEADERS = { 'Content-Type': 'application/json' };
