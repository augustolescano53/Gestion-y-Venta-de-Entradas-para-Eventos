// Usuario que inició sesión: id, rol y el token (JWT) que devuelve el login,
// guardados en localStorage por auth/AuthProvider.jsx. Sin sesión no hay
// usuario (null). El backend valida el token en cada request (api/http.js
// lo envía), así que el rol guardado acá solo decide qué se muestra.

export const ROLES = { PARTICIPANT: 'participant', ORGANIZER: 'organizer', ADMIN: 'admin' };

export const SESSION_KEY = 'pogo.session';

// Lo emite api/http.js cuando el backend rechaza el token (vencido o
// inválido); AuthProvider cierra la sesión.
export const SESSION_EXPIRED_EVENT = 'pogo:session-expired';

// Ejecución actual del frontend (vite.config.js). En producción cambia con
// cada build, así que un deploy nuevo también cierra las sesiones.
export const RUN_ID = import.meta.env.VITE_RUN_ID;

export function isValidRole(role) {
  return Object.values(ROLES).includes(role);
}

// Una sesión sin id válido, sin un rol conocido, sin token o iniciada en otra
// ejecución es inválida: se trata como si no hubiera sesión.
export function readSession() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!user || !Number.isInteger(user.id) || user.id <= 0 || !isValidRole(user.role)) return null;
    if (typeof user.token !== 'string' || !user.token) return null;
    if (user.runId !== RUN_ID) return null;
    return user;
  } catch {
    return null;
  }
}

// Al abrir la app (main.jsx, antes del router): una sesión guardada que ya no
// es válida (por ejemplo, de una ejecución anterior) se borra y se arranca en
// la página principal como visitante, aunque la pestaña estuviera en una
// página protegida (así no termina en el login).
export function discardStaleSession() {
  try {
    if (localStorage.getItem(SESSION_KEY) === null || readSession()) return;
    localStorage.removeItem(SESSION_KEY);
    if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
  } catch {
    // Sin acceso a localStorage no hay sesión guardada que descartar.
  }
}

// { id, role } o null sin sesión.
export function getCurrentUser() {
  const session = readSession();
  return session ? { id: session.id, role: session.role } : null;
}

export function getSessionToken() {
  return readSession()?.token ?? null;
}

// Id del participante logueado; null sin sesión o si es otro rol.
export function getCurrentParticipantId() {
  const user = getCurrentUser();
  return user?.role === ROLES.PARTICIPANT ? user.id : null;
}

export function isOrganizer() {
  return getCurrentUser()?.role === ROLES.ORGANIZER;
}
