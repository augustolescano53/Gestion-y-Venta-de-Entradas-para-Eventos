import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth.js';
import { ROLES } from '../shared/currentUser.js';
import { ErrorState } from './miCuenta/AccountStates.jsx';

// Páginas exclusivas del participante (por ejemplo, la compra de entradas):
// equivalente a OrganizerOnly. Con sesión de organizador se muestra el
// mensaje (o se redirige si se pasa redirectTo); la sesión no se toca. Sin
// sesión, la página decide (la compra pide iniciar sesión).
function ParticipantOnly({ children, redirectTo }) {
  const { user } = useAuth();
  if (user?.role !== ROLES.ORGANIZER) return children;
  if (redirectTo) return <Navigate to={redirectTo} replace />;
  return <ErrorState message="Esta sección es solo para participantes." />;
}

export default ParticipantOnly;
