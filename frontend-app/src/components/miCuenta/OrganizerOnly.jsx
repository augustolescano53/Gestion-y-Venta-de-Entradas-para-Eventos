import { isOrganizer } from '../../shared/currentUser.js';
import { ErrorState } from './AccountStates.jsx';

// Páginas de "Mi cuenta" exclusivas del organizador (crear y editar eventos).
// PROVISORIO: el rol sale de la sesión del navegador; el backend igual
// verifica que el evento sea de ese organizador.
function OrganizerOnly({ children }) {
  if (!isOrganizer()) return <ErrorState message="Esta sección es solo para organizadores." />;
  return children;
}

export default OrganizerOnly;
