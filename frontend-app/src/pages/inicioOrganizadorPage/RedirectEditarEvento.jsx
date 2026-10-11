import { Navigate, useParams } from 'react-router-dom';
import { parseMisEventoId } from '../miCuenta/miCuenta.helpers.js';
import { ORGANIZADOR_PATHS, editarMiEventoPath } from '../../shared/routes.js';

// Ruta vieja /mi-cuenta/mis-eventos/:eventoId/editar -> /mis-eventos/:eventoId/editar.
function RedirectEditarEvento() {
  const key = parseMisEventoId(useParams().eventoId);
  return <Navigate to={key ? editarMiEventoPath(key.venue, key.event) : ORGANIZADOR_PATHS.inicio} replace />;
}

export default RedirectEditarEvento;
