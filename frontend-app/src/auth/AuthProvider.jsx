import { useCallback, useEffect, useMemo, useState } from 'react';
import { createParticipant } from '../api/participants.js';
import { loginUser } from '../api/users.js';
import { ROLES, RUN_ID, SESSION_EXPIRED_EVENT, SESSION_KEY, isValidRole, readSession } from '../shared/currentUser.js';
import { buildUserPayload } from '../shared/user.helpers.js';
import { AuthContext } from './AuthContext.js';

// La sesión es el usuario que inició sesión (participante, organizador o
// admin), sin contraseña y con el token del backend: es la única fuente de
// identidad (shared/currentUser.js).
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
  const { id, firstName, lastName, email, token } = account;
  return { id, firstName, lastName, email, role, token, runId: RUN_ID };
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(initialSession);

  // Sin un id, un rol válido y el token no se guarda ninguna sesión.
  const startSession = useCallback((account, role) => {
    if (!Number.isInteger(account?.id) || !isValidRole(role) || !account.token) {
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

  // El backend rechazó el token (vencido o inválido): se cierra la sesión y
  // las guardas de cada página piden iniciarla de nuevo.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout);
  }, [logout]);

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
