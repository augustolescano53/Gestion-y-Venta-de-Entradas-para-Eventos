import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth.js';
import { PUBLIC_PATHS } from '../../shared/routes.js';

// Páginas que necesitan una sesión (cualquier rol). Sin sesión se pide
// iniciarla y, después del login, se vuelve a la página pedida (state.from).
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to={PUBLIC_PATHS.login} replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return children;
}

export default RequireAuth;
