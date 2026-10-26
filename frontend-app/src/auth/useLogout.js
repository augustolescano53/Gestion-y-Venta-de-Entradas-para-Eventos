import { PUBLIC_PATHS } from '../shared/routes.js';
import { useAuth } from './useAuth.js';

// "Cerrar sesión" de cualquier rol: vuelve a la página principal como
// visitante (Header con "Iniciar sesión"), nunca al login.
// Es una navegación completa y no navigate(): en React Router la navegación
// es una transición de baja prioridad y la guarda de la página actual
// llegaba a ver la sesión ya borrada y mandaba al login. La recarga además
// descarta cualquier dato en memoria del usuario anterior.
export function useLogout() {
  const { logout } = useAuth();
  return () => {
    logout();
    window.location.replace(PUBLIC_PATHS.home);
  };
}
