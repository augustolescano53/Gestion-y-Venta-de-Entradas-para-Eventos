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

// Organizador. Su inicio tiene ruta propia hasta que "/" elija el inicio
// según el rol.
export const ORGANIZADOR_PATHS = {
  inicio: '/organizador/inicio',
  nuevoEvento: '/mis-eventos/nuevo',
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

export function editarMiEventoPath(venueId, idEvent) {
  return `/mis-eventos/${eventKey(venueId, idEvent)}/editar`;
}

// Panel de administración: sus datos y las CRUD (mismas URLs de siempre).
// Al iniciar sesión el admin entra a Lugares.
export const ADMIN_PATHS = {
  inicio: '/lugares',
  informacionPersonal: '/admin/informacion-personal',
  contrasena: '/admin/contrasena',
  lugares: '/lugares',
  mediosDePago: '/medios-de-pago',
  organizadores: '/organizadores',
  participantes: '/participantes',
  tiposDeEntrada: '/tipos-de-entrada',
  eventos: '/eventos',
  entradas: '/entradas',
  administradores: '/administradores',
};

// Inicio del participante. Provisorio en su propia ruta hasta que "/" elija
// el inicio según el rol.
export const PARTICIPANTE_PATHS = {
  inicio: '/participante/inicio',
};
