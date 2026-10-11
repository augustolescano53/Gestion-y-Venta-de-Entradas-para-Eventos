import { isOrganizer } from '../../shared/currentUser.js';
import MisEventosPage from './misEventosPage/MisEventosPage.jsx';
import MisEventosOrganizadorPage from './misEventosOrganizadorPage/MisEventosOrganizadorPage.jsx';

// "Mis eventos" es una página distinta según el tipo de usuario: el
// participante ve los eventos de sus entradas; el organizador, los que creó.
function MisEventosRoute() {
  return isOrganizer() ? <MisEventosOrganizadorPage /> : <MisEventosPage />;
}

export default MisEventosRoute;
