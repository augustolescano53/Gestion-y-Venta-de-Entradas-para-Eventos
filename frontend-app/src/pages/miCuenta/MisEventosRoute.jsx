import { Navigate } from 'react-router-dom';
import { isOrganizer } from '../../shared/currentUser.js';
import { ORGANIZADOR_PATHS } from '../../shared/routes.js';
import MisEventosPage from './misEventosPage/MisEventosPage.jsx';

// "Mis eventos" de Mi cuenta es del participante (eventos de sus entradas).
// El organizador gestiona sus eventos desde su inicio.
function MisEventosRoute() {
  return isOrganizer() ? <Navigate to={ORGANIZADOR_PATHS.inicio} replace /> : <MisEventosPage />;
}

export default MisEventosRoute;
