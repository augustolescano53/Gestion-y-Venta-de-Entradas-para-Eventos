import { useCallback, useMemo, useState } from 'react';
import { createParticipant } from '../api/participants.js';
import { loginUser } from '../api/users.js';
import { ROLES, SESSION_KEY, isValidRole, readSession } from '../shared/currentUser.js';
import { buildUserPayload } from '../shared/user.helpers.js';
import { AuthContext } from './AuthContext.js';

// La sesión es el usuario que inició sesión (participante u organizador), sin
// contraseña: es la única fuente de identidad (shared/currentUser.js). No hay
// tokens: el backend todavía no los usa.
function writeSession(user) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Sin acceso a localStorage la sesión dura hasta recargar la página.
  }
}

// Una sesión guardada inválida (sin rol válido, por ejemplo) se descarta.
function initialSession() {
  const session = readSession();
  if (!session) writeSession(null);
  return session;
}

function toSessionUser(account, role) {
  const { id, firstName, lastName, email } = account;
  return { id, firstName, lastName, email, role };
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(initialSession);

  // Sin un id y un rol válidos no se guarda ninguna sesión.
  const startSession = useCallback((account, role) => {
    if (!Number.isInteger(account?.id) || !isValidRole(role)) {
      throw new Error('La sesión recibida no es válida.');
    }
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
