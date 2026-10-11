import { useLocation, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { roleHomePath } from '../../components/auth/roleHome.js';
import { useAuth } from '../../auth/useAuth.js';

// Mismo formulario que el modal de compra. Vuelve a la página de origen
// (state.from, si una ruta protegida pidió iniciar sesión) o al inicio de su
// rol. Mientras no haya navbar, acá se cierra la sesión.
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
        <LoginForm
          onSuccess={(loggedUser) =>
            navigate(location.state?.from ?? roleHomePath(loggedUser), { replace: true })
          }
        />
      )}
    </section>
  );
}

export default LoginPage;
