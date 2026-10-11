import { ROLES } from '../../shared/currentUser.js';
import { ORGANIZADOR_PATHS, PARTICIPANTE_PATHS } from '../../shared/routes.js';

// Inicio de cada rol. Sin sesión se usa el del participante, que es público.
export function roleHomePath(user) {
  return user?.role === ROLES.ORGANIZER ? ORGANIZADOR_PATHS.inicio : PARTICIPANTE_PATHS.inicio;
}
