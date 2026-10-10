import { useCallback, useMemo, useState } from 'react';
import { createParticipant, loginParticipant } from '../api/participants.js';
import { buildUserPayload } from '../shared/user.helpers.js';
import { AuthContext } from './AuthContext.js';

// La sesión es el participante que inició sesión (sin contraseña). No hay
// tokens: el backend todavía no los usa. 'pogo.participantId' es la clave
// que lee "Mi cuenta" (shared/currentUser.js).
const SESSION_KEY = 'pogo.session';
const PARTICIPANT_ID_KEY = 'pogo.participantId';

function readSession() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY));
    return user && Number.isInteger(user.id) ? user : null;
  } catch {
    return null;
  }
}

function writeSession(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      localStorage.setItem(PARTICIPANT_ID_KEY, String(user.id));
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PARTICIPANT_ID_KEY);
    }
  } catch {
    // Sin acceso a localStorage la sesión dura hasta recargar la página.
  }
}

function toSessionUser(participant) {
  const { id, firstName, lastName, email } = participant;
  return { id, firstName, lastName, email };
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const startSession = useCallback((participant) => {
    const sessionUser = toSessionUser(participant);
    writeSession(sessionUser);
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const login = useCallback(
    async ({ email, password }) => startSession(await loginParticipant({ email: email.trim(), password })),
    [startSession],
  );

  // El registro inicia sesión automáticamente con la cuenta creada.
  const register = useCallback(
    async (formData) => startSession(await createParticipant(buildUserPayload(formData))),
    [startSession],
  );

  const logout = useCallback(() => {
    writeSession(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
