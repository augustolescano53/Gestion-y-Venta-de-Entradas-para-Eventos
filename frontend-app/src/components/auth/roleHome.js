import { ROLES } from '../../shared/currentUser.js';
import { ADMIN_PATHS, ORGANIZADOR_PATHS, PARTICIPANTE_PATHS } from '../../shared/routes.js';

// Inicio de cada rol. Sin sesión se usa el del participante, que es público.
export function roleHomePath(user) {
  if (user?.role === ROLES.ADMIN) return ADMIN_PATHS.inicio;
  return user?.role === ROLES.ORGANIZER ? ORGANIZADOR_PATHS.inicio : PARTICIPANTE_PATHS.inicio;
}
