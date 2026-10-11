import { useCallback, useMemo, useState } from 'react';
import { createParticipant } from '../api/participants.js';
import { loginUser } from '../api/users.js';
import { PARTICIPANT_ID_KEY, ROLES, SESSION_KEY, readSession } from '../shared/currentUser.js';
import { buildUserPayload } from '../shared/user.helpers.js';
import { AuthContext } from './AuthContext.js';

// La sesión es el usuario que inició sesión (participante u organizador), sin
// contraseña. No hay tokens: el backend todavía no los usa. 'pogo.participantId'
// es la clave que leen las pantallas del comprador (shared/currentUser.js).
function writeSession(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      if (user.role === ROLES.PARTICIPANT) localStorage.setItem(PARTICIPANT_ID_KEY, String(user.id));
      else localStorage.removeItem(PARTICIPANT_ID_KEY);
    } else {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PARTICIPANT_ID_KEY);
    }
  } catch {
    // Sin acceso a localStorage la sesión dura hasta recargar la página.
  }
}

function toSessionUser(account, role) {
  const { id, firstName, lastName, email } = account;
  return { id, firstName, lastName, email, role };
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const startSession = useCallback((account, role) => {
    const sessionUser = toSessionUser(account, role);
    writeSession(sessionUser);
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const account = await loginUser({ email: email.trim(), password });
      return startSession(account, account.role);
    },
    [startSession],
  );

  // El registro inicia sesión automáticamente con la cuenta creada.
  const register = useCallback(
    async (formData) => startSession(await createParticipant(buildUserPayload(formData)), ROLES.PARTICIPANT),
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
