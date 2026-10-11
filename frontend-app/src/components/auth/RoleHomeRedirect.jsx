import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth.js';
import { roleHomePath } from './roleHome.js';

// Ruta "/": lleva al inicio del rol de la sesión. La sesión se lee de forma
// sincrónica (AuthProvider), así que nunca se ve el inicio de otro rol.
function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={roleHomePath(user)} replace />;
}

export default RoleHomeRedirect;
