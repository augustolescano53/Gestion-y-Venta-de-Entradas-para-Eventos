import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth.js';
import { PUBLIC_PATHS } from '../../shared/routes.js';

// Páginas que necesitan una sesión (cualquier rol). Sin sesión se pide
// iniciarla; después del login se va al inicio del rol.
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={PUBLIC_PATHS.login} replace />;
  return children;
}

export default RequireAuth;
