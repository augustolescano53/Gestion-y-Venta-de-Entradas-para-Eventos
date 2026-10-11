// Usuario de "Mi cuenta". PROVISORIO: la sesión es el usuario que inició
// sesión (id + rol) guardado en localStorage por auth/AuthProvider.jsx; no hay
// token. Cuando exista un login real, solo hay que reemplazar este archivo.
// Sin sesión se usa el participante de prueba, como hasta ahora; para probar
// con otro: localStorage.setItem('pogo.participantId', '3').

export const ROLES = { PARTICIPANT: 'participant', ORGANIZER: 'organizer' };

export const SESSION_KEY = 'pogo.session';
export const PARTICIPANT_ID_KEY = 'pogo.participantId';
const DEMO_PARTICIPANT_ID = 1;

// Las sesiones guardadas antes de que existiera el rol son de participantes.
export function readSession() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY));
    if (!user || !Number.isInteger(user.id)) return null;
    return { ...user, role: user.role ?? ROLES.PARTICIPANT };
  } catch {
    return null;
  }
}

export function getCurrentParticipantId() {
  try {
    const stored = Number(localStorage.getItem(PARTICIPANT_ID_KEY));
    if (Number.isInteger(stored) && stored > 0) return stored;
  } catch {
    // Sin acceso a localStorage se usa el participante de prueba.
  }
  return DEMO_PARTICIPANT_ID;
}

// { id, role }
export function getCurrentUser() {
  const session = readSession();
  if (session?.role === ROLES.ORGANIZER) return { id: session.id, role: ROLES.ORGANIZER };
  return { id: getCurrentParticipantId(), role: ROLES.PARTICIPANT };
}

export function isOrganizer() {
  return getCurrentUser().role === ROLES.ORGANIZER;
}
