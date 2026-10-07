const API_URL = 'http://localhost:3000/api/venue';

async function request(url, options) {
  const response = await fetch(url, options);

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
