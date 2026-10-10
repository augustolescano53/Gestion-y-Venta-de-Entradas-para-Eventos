import { useLocation, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { useAuth } from '../../auth/useAuth.js';
import { PUBLIC_PATHS } from '../../shared/routes.js';

// Mismo formulario que el modal de compra. Vuelve a la página de origen
// (state.from) o al inicio. Mientras no haya navbar, acá se cierra la sesión.
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <section className="auth-card">
      <h2>Iniciar sesión</h2>
      {user ? (
        <div className="auth-form">
          <p className="banner banner--success">
            Ya iniciaste sesión como <strong>{user.firstName} {user.lastName}</strong> ({user.email}).
          </p>
          <button type="button" className="btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      ) : (
        <LoginForm onSuccess={() => navigate(location.state?.from ?? PUBLIC_PATHS.home, { replace: true })} />
      )}
    </section>
  );
}

export default LoginPage;
