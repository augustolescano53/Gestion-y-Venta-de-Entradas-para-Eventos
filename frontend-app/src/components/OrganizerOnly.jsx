import { useAuth } from '../auth/useAuth.js';
import { ROLES } from '../shared/currentUser.js';
import RequireAuth from './auth/RequireAuth.jsx';
import { ErrorState } from './miCuenta/AccountStates.jsx';

// Páginas exclusivas del organizador (inicio, crear y editar eventos). Sin
// sesión se pide iniciarla; con sesión de participante se muestra el aviso.
// PROVISORIO: el rol sale de la sesión del navegador; el backend igual
// verifica que el evento sea de ese organizador.
function OrganizerOnly({ children }) {
  const { user } = useAuth();
  if (!user) return <RequireAuth>{children}</RequireAuth>;
  if (user.role !== ROLES.ORGANIZER) return <ErrorState message="Esta sección es solo para organizadores." />;
  return children;
}

export default OrganizerOnly;
