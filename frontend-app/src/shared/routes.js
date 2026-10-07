import { eventKey } from './refs.helpers.js';

// Rutas del área de compradores. Los eventos tienen clave compuesta, así que
// en la URL se identifican como "venueId-idEvent" (ver eventKey).

export const PUBLIC_PATHS = {
  home: '/',
  login: '/login',
  register: '/register',
};

export const MI_CUENTA_PATHS = {
  root: '/mi-cuenta',
  informacionPersonal: '/mi-cuenta/informacion-personal',
  contrasena: '/mi-cuenta/contrasena',
  misEventos: '/mi-cuenta/mis-eventos',
};

export function eventoPath(venueId, idEvent) {
  return `/eventos/${eventKey(venueId, idEvent)}`;
}

export function checkoutPath(venueId, idEvent) {
  return `${eventoPath(venueId, idEvent)}/comprar`;
}

export function misEventoPath(venueId, idEvent) {
  return `${MI_CUENTA_PATHS.misEventos}/${eventKey(venueId, idEvent)}`;
}
