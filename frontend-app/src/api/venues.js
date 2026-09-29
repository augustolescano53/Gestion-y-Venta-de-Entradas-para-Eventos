// Funciones para hablar con la API de Venue (lugares) del backend.
// Cada una hace un fetch, se fija si la respuesta vino bien y devuelve
// solo el dato útil (o tira un Error con el mensaje del backend si algo
// salió mal). Así las pantallas no repiten la lógica de fetch/JSON, solo
// llaman a estas funciones con try/catch.

const API_URL = 'http://localhost:3000/api/venue';

async function request(url, options) {
  const response = await fetch(url, options);

  // El backend siempre responde JSON, incluso en los errores
  // ({ message: '...' }), así que lo parseamos antes de decidir qué hacer.
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'Ocurrió un error inesperado.');
  }

  return body.data;
}

export function getVenues() {
  return request(API_URL);
}

export function createVenue(venue) {
  return request(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venue),
  });
}

export function updateVenue(id, venue) {
  return request(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(venue),
  });
}

export function deleteVenue(id) {
  return request(`${API_URL}/${id}`, { method: 'DELETE' });
}
