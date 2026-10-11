// Usuario que inició sesión: id + rol, guardados en localStorage por
// auth/AuthProvider.jsx al hacer login. Sin sesión no hay usuario (null).
// PROVISORIO: no hay token; el backend confía en el id que manda el
// frontend. Cuando exista autenticación real, solo hay que reemplazar
// este archivo.

export const ROLES = { PARTICIPANT: 'participant', ORGANIZER: 'organizer' };

export const SESSION_KEY = 'pogo.session';

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

// Una sesión sin id válido o sin un rol conocido es inválida: se trata como
// si no hubiera sesión y hay que volver a iniciarla.
export function readSession() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!user || !Number.isInteger(user.id) || user.id <= 0 || !isValidRole(user.role)) return null;
    return user;
  } catch {
    return null;
  }
}

// { id, role } o null sin sesión.
export function getCurrentUser() {
  const session = readSession();
  return session ? { id: session.id, role: session.role } : null;
}

// Id del participante logueado; null sin sesión o si es un organizador.
export function getCurrentParticipantId() {
  const user = getCurrentUser();
  return user?.role === ROLES.PARTICIPANT ? user.id : null;
}

export function isOrganizer() {
  return getCurrentUser()?.role === ROLES.ORGANIZER;
}
